const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;

const OptionsGame = Mongoose.model("OptionsGame");
const OptionsGameBalance = Mongoose.model("OptionsGameBalanceUpdation");
const UserWallet = Mongoose.model("UserWallet");
const Pairs = Mongoose.model("Pairs");
const CurrencySymbol = Mongoose.model("CurrencySymbol");
const TradingGameData = Mongoose.model("Trading Time Settings");

const STATUS = Object.freeze({ OPEN: 0, CLOSED: 1, PROCESSING: 2 });
const MULTIPLIERS = Object.freeze([500, 750, 1000]);
const DIRECTIONS = Object.freeze(["Calls", "Puts"]);
const PAIR_PATTERN = /^[A-Z0-9]{1,20}_[A-Z0-9]{1,20}$/;

let socket = null;
const SocketInit = (socketIO) => { socket = socketIO; };

const round = (value, decimals = 8) => Number(Number(value).toFixed(decimals));

/** Cuts extra decimals off without rounding: truncate(2248.41416, 2) -> 2248.41 */
const truncate = (value, decimals = 8) => {
  const [int, frac = ""] = Number(value).toFixed(Math.max(decimals, 12)).split(".");
  return Number(decimals > 0 ? `${int}.${frac.slice(0, decimals)}` : int);
};

//** ---------- reference data ---------- */

/** _id of the USDT currency every options pair is quoted in */
const getUsdtCurrencyId = async () => {
  const usdt = await CurrencySymbol.findOne({ currencySymbol: "USDT" }, { _id: 1 }).lean();
  return usdt ? usdt._id : null;
};

const PAIR_FIELDS = { pair: 1, marketPrice: 1, priceDecimal: 1, high: 1, low: 1, volume_fromCur: 1, fromCurrency: 1 };

/** Options-enabled pairs quoted in the given currency */
const getActivePairs = (currencyId, projection = PAIR_FIELDS) =>
  Pairs.find({ toCurrencyId: ObjectId(currencyId), optionsStatus: 1 }, projection).sort({ _id: 1 }).lean();

/** One options-enabled pair with its live server price (cut to the pair's price decimals) */
const getActivePair = async (pairName, currencyId) => {
  if (typeof pairName !== "string" || !PAIR_PATTERN.test(pairName)) return null;
  const filter = { pair: pairName, optionsStatus: 1, exchangeType: "SPOT" };
  if (currencyId) filter.toCurrencyId = ObjectId(currencyId);
  const pair = await Pairs.findOne(filter, PAIR_FIELDS).sort({ _id: 1 }).lean();
  if (!pair || !(Number(pair.marketPrice) > 0)) return null;
  return { ...pair, priceDecimal: pair.priceDecimal || 0, marketPrice: truncate(pair.marketPrice, pair.priceDecimal || 0) };
};

const getTradingConfig = async () => {
  const settings = await TradingGameData.findOne({}).lean();
  if (!settings) return null;
  const config = {
    flatFee: Number(settings.optionsFlatFee),
    minimumAmount: Number(settings.optionsMinimumAmount),
    timingMinutes: Number(settings.optionsTiming),
  };
  return Object.values(config).every(Number.isFinite) ? config : null;
};

//** ---------- calculations ---------- */

/** Fee is a flat % of the leveraged position (wager x multiplier) */
const calcFee = (wager, multiplier, flatFee) => round((wager * multiplier * flatFee) / 100);

/** Liquidation price: where the loss equals the staked amount (cut to the pair's price decimals) */
const calcBustPrice = (entryPrice, multiplier, direction, priceDecimal = 0) => {
  const move = entryPrice / multiplier;
  return truncate(direction === "Calls" ? entryPrice - move : entryPrice + move, priceDecimal);
};

/** Actual P&L, stored without rounding (the frontend cuts it to the pair's price decimals for display) */
const calcProfitAndLoss = (bet, exitPrice) => {
  const size = (bet.actualpredictionAmt * bet.multiplier) / bet.marketprice;
  const priceMove = bet.direction === "Calls" ? exitPrice - bet.marketprice : bet.marketprice - exitPrice;
  return size * priceMove;
};

const isBusted = (bet, price) =>
  bet.direction === "Calls" ? price <= bet.bustprice : price >= bet.bustprice;

//** ---------- settlement ---------- */

// Balance-history labels kept as they were for each close path
const HISTORY_TYPES = {
  user: { win: "Game won", even: "Game lose", loss: "Game lose" },
  auto: { win: "Game won", even: "GameAutoclosed", loss: "Game loss" },
};

/**
 * Settles a position that the caller has already locked (predictionStatus = PROCESSING).
 * win  -> stake + profit back to the options wallet
 * even -> stake back (fee is kept)
 * loss -> nothing back (loss is capped at the stake)
 */
const settleBet = async (bet, exitPrice, source = "auto") => {
  const profitLoss = calcProfitAndLoss(bet, exitPrice);
  const outcome = profitLoss > 0 ? "win" : profitLoss === 0 ? "even" : "loss";
  const stake = Number(bet.actualpredictionAmt);
  const credit = outcome === "win" ? stake + profitLoss : outcome === "even" ? stake : 0;

  const walletFilter = { userId: ObjectId(bet.userId), currencyId: ObjectId(bet.currencyId) };
  const before = await UserWallet.findOneAndUpdate(
    walletFilter,
    { $inc: { optionsGameAmount: credit, optionsHold: -Number(bet.predictionAmt) } },
    { new: false, projection: { optionsGameAmount: 1 } }
  ).lean();
  if (!before) throw new Error("User wallet not found");

  // Hold can never go below zero
  await UserWallet.updateOne({ ...walletFilter, optionsHold: { $lt: 0 } }, { $set: { optionsHold: 0 } });

  const oldBalance = Number(before.optionsGameAmount) || 0;
  await OptionsGameBalance.create({
    userId: String(bet.userId),
    currencyId: walletFilter.currencyId,
    amount: oldBalance + credit,
    difference: credit,
    oldBalance,
    holdAmount: stake,
    addedAmount: credit,
    lastId: String(bet._id),
    type: HISTORY_TYPES[source][outcome],
  });

  const result = outcome === "win" ? { winAmt: profitLoss } : { lossAmt: profitLoss };
  return OptionsGame.findByIdAndUpdate(
    bet._id,
    { $set: { ...result, predictionStatus: STATUS.CLOSED, exitMarketPrice: exitPrice, isProcessing: false } },
    { new: true }
  ).lean();
};

/**
 * Atomically moves an OPEN position to PROCESSING so that the cron and a manual close
 * can never settle the same position twice. Returns the locked position or null.
 */
const lockOpenBet = (filter) =>
  OptionsGame.findOneAndUpdate(
    { ...filter, predictionStatus: STATUS.OPEN },
    { $set: { predictionStatus: STATUS.PROCESSING, isProcessing: true } },
    { new: true }
  ).lean();

const unlockBet = (betId) =>
  OptionsGame.updateOne(
    { _id: betId, predictionStatus: STATUS.PROCESSING },
    { $set: { predictionStatus: STATUS.OPEN, isProcessing: false } }
  );

/** Lock + settle, rolling the lock back if settlement fails */
const closeBet = async (filter, exitPrice, source) => {
  const bet = await lockOpenBet(filter);
  if (!bet) return null;
  try {
    return await settleBet(bet, exitPrice, source);
  } catch (error) {
    await unlockBet(bet._id);
    throw error;
  }
};

/** Used by the cron: close on expiry or when the liquidation price is reached */
const autoCloseBet = async (bet, exitPrice) => {
  const closed = await closeBet({ _id: bet._id }, exitPrice, "auto");
  if (closed && socket) {
    socket.sockets.emit("betClosed", {
      status: true,
      userId: String(closed.userId),
      message: "Your position has automatically closed",
    });
  }
  return closed;
};

module.exports = {
  STATUS,
  MULTIPLIERS,
  DIRECTIONS,
  PAIR_PATTERN,
  SocketInit,
  round,
  truncate,
  getUsdtCurrencyId,
  getActivePairs,
  getActivePair,
  getTradingConfig,
  calcFee,
  calcBustPrice,
  isBusted,
  closeBet,
  autoCloseBet,
};
