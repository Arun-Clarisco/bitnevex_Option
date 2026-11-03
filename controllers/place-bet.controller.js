const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;

const OptionsGame = Mongoose.model("OptionsGame");
const OptionsGameBalance = Mongoose.model("OptionsGameBalanceUpdation");
const UserWallet = Mongoose.model("UserWallet");
const CurrencySymbol = Mongoose.model("CurrencySymbol");
const Competion = Mongoose.model("Competion");
const TradingGameData = Mongoose.model("Trading Time Settings");

const game = require("../services/options-game.services");

const GENERIC_ERROR = "Something went wrong! Please try again someother time";

const fail = (res, message, code = 200) => res.status(code).send({ status: false, message });

/**
 * POST /optionsGame
 * Body (validated by the route): { wager, direction, multiplier, currencyId, pair, competionId? }
 *
 * Entry price, liquidation price, fee and stake are all computed on the server from the live
 * market price and the admin settings; any such values sent by the client are ignored.
 */
const addNewPlacebit = async (req, res) => {
  try {
    const { wager, direction, multiplier, currencyId, pair: pairName, competionId } = req.body;
    const userId = ObjectId(req.userId);

    const [pair, settings, competition] = await Promise.all([
      game.getActivePair(pairName, currencyId),
      game.getTradingConfig(),
      competionId ? Competion.exists({ _id: ObjectId(competionId) }) : null,
    ]);

    if (!pair) return fail(res, `Invalid or disabled options pair: ${pairName}`);
    if (!settings) return fail(res, "Options trading configuration not found");
    if (wager < settings.minimumAmount) {
      return fail(res, `Minimum options wager amount is ${settings.minimumAmount}`);
    }

    const fee = game.calcFee(wager, multiplier, settings.flatFee);
    const stake = game.round(wager - fee);
    if (stake <= 0) return fail(res, "Wager is too small to cover the options fee");

    const entryPrice = pair.marketPrice;
    const bustPrice = game.calcBustPrice(entryPrice, multiplier, direction, pair.priceDecimal);
    if (!(bustPrice > 0)) return fail(res, "Invalid liquidation price for the current market");

    // Debit atomically: only succeeds while the balance still covers the wager
    const walletFilter = { userId, currencyId: ObjectId(currencyId) };
    const before = await UserWallet.findOneAndUpdate(
      { ...walletFilter, optionsGameAmount: { $gte: wager } },
      { $inc: { optionsGameAmount: -wager, optionsHold: wager } },
      { new: false, projection: { optionsGameAmount: 1 } }
    ).lean();
    if (!before) return fail(res, "Please check your USDT balance in options wallet!");

    let bet;
    try {
      bet = await OptionsGame.create({
        userId,
        currencyId: walletFilter.currencyId,
        predictionAmt: wager,
        actualpredictionAmt: stake,
        feeAmount: fee,
        multiplier,
        marketprice: entryPrice,
        bustprice: bustPrice,
        direction,
        pairName: pair.pair,
        ...(competition && { competionId: ObjectId(competionId) }),
      });
    } catch (error) {
      // Give the funds back if the position could not be stored
      await UserWallet.updateOne(walletFilter, { $inc: { optionsGameAmount: wager, optionsHold: -wager } });
      throw error;
    }

    const oldBalance = Number(before.optionsGameAmount) || 0;
    const newBalance = game.round(oldBalance - wager);
    await OptionsGameBalance.create({
      userId: String(userId),
      currencyId: walletFilter.currencyId,
      amount: newBalance,
      difference: wager,
      oldBalance,
      lastId: String(bet._id),
      type: "Options Game",
    });

    return res.send({
      status: true,
      message: `Options position added successfully... Your Options wallet balance ${Math.trunc(newBalance * 100) / 100}`,
      data: bet,
    });
  } catch (error) {
    console.log("addNewPlacebit error", error);
    return fail(res, GENERIC_ERROR);
  }
};

/**
 * POST /userClosedBet
 * Body (validated by the route): { predictionId }
 * Closes the caller's own open position at the current server price of its pair.
 */
const closedBetFromUser = async (req, res) => {
  try {
    const filter = { _id: ObjectId(req.body.predictionId), userId: ObjectId(req.userId) };
    const bet = await OptionsGame.findOne({ ...filter, predictionStatus: game.STATUS.OPEN }, { pairName: 1 }).lean();
    if (!bet) return fail(res, "Position not found or already closed.");

    const pair = await game.getActivePair(bet.pairName);
    if (!pair) return fail(res, "Market price is not available right now. Please try again shortly");

    const closed = await game.closeBet(filter, pair.marketPrice, "user");
    if (!closed) return fail(res, "Position not found or already closed.");

    return res.send({ status: true, data: closed, message: "Successfully closed position" });
  } catch (error) {
    console.error("closedBetFromUser error:", error);
    return fail(res, "Something went wrong!", 500);
  }
};

//** ---------- data used by both the socket events and the REST routes ---------- */

const getUserPredictions = async (userId) => {
  const data = await OptionsGame.find({ userId: ObjectId(userId) }, { __v: 0 }).sort({ _id: -1 }).lean();
  return { status: true, data };
};

const getUserWalletBalance = async (userId, currencyId) => {
  if (!ObjectId.isValid(currencyId)) return { status: false, message: "Invalid currency ID" };
  const data = await UserWallet.findOne(
    { userId: ObjectId(userId), currencyId: ObjectId(currencyId) },
    { optionsGameAmount: 1, userId: 1 }
  ).lean();
  return data ? { status: true, data } : { status: false, data: [] };
};

/** Live price of every options pair quoted in USDT */
const getTotalPairs = async () => {
  const currencyId = await game.getUsdtCurrencyId();
  if (!currencyId) return { status: false, data: [] };
  const data = await game.getActivePairs(currencyId, { pair: 1, marketPrice: 1, priceDecimal: 1 });
  // activePairList.msg keeps the old response shape for the mobile apps
  return { status: true, data, activePairList: { status: true, msg: data } };
};

/** Ticker of one options pair */
const getSelectedPair = async (pairName) => {
  if (typeof pairName !== "string" || !game.PAIR_PATTERN.test(pairName)) return { status: false, data: [] };
  const pair = await game.getActivePair(pairName);
  return pair ? { status: true, data: [pair] } : { status: false, data: [] };
};

const getUserBasedPrediction = async (req, res) => {
  try {
    return res.send(await getUserPredictions(req.userId));
  } catch (error) {
    console.log("getUserBasedPrediction error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

const getUserGameWalletBalance = async (req, res) => {
  try {
    return res.send(await getUserWalletBalance(req.userId, req.body.currencyId));
  } catch (error) {
    console.log("getUserGameWalletBalance error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

//** ---------- public reference data ---------- */

const getCurrencySymbol = async (req, res) => {
  try {
    const symbol = await CurrencySymbol.findOne({ currencySymbol: "USDT" }).lean();
    return res.send({ status: !!symbol, message: symbol ? "Coin symbol" : "Coin symbol not found", data: symbol });
  } catch (error) {
    console.log("getCurrencySymbol error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

const getCompetion = async (req, res) => {
  try {
    const data = await Competion.find({}).sort({ _id: -1 }).limit(1).lean();
    return res.send({ status: true, data });
  } catch (error) {
    console.log("getCompetion error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

/**
 * POST /getAllPairs  { currencyId }
 * data: pair names, AggregatePairData: matching base-currency images (same order)
 */
const getAllPairs = async (req, res) => {
  try {
    const pairs = await game.getActivePairs(req.body.currencyId, { pair: 1, fromCurrency: 1 });
    if (!pairs.length) return res.send({ status: false, data: [], AggregatePairData: [] });

    const images = await Mongoose.connection.collection("Currency")
      .find({ _id: { $in: pairs.map((p) => p.fromCurrency).filter(Boolean) } }, { projection: { image: 1 } })
      .toArray();
    const imageById = new Map(images.map((c) => [String(c._id), c.image]));

    // Pairs without a base currency are skipped so names and images stay aligned
    const withCurrency = pairs.filter((p) => imageById.has(String(p.fromCurrency)));
    return res.send({
      status: true,
      data: withCurrency.map((p) => p.pair),
      AggregatePairData: withCurrency.map((p) => ({ _id: p._id, result: { image: imageById.get(String(p.fromCurrency)) } })),
    });
  } catch (error) {
    console.log("getAllPairs error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

const getTradeingData = async (req, res) => {
  try {
    const data = await TradingGameData.find({}).lean();
    return res.send({ status: true, data });
  } catch (error) {
    console.log("getTradeingData error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

const sendResult = (loader) => async (req, res) => {
  try {
    return res.send(await loader(req));
  } catch (error) {
    console.log("options data error: ", error);
    return fail(res, GENERIC_ERROR);
  }
};

module.exports = {
  addNewPlacebit,
  closedBetFromUser,
  getUserBasedPrediction,
  getUserGameWalletBalance,
  getUserPredictions,
  getUserWalletBalance,
  getTotalPairs,
  getSelectedPair,
  getCurrencySymbol,
  getCompetion,
  getAllPairs,
  getTradeingData,
  getTotalPairsRoute: sendResult(() => getTotalPairs()),
  getSelectedPairRoute: sendResult((req) => getSelectedPair(req.params.pair)),
};
