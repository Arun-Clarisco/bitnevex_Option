const Mongoose = require("mongoose");
const cron = require("node-cron");

const OptionsGame = Mongoose.model("OptionsGame");
const game = require("../services/options-game.services");

//** ---------- every second: close expired or liquidated positions ---------- */

let closingRun = false;

cron.schedule("*/1 * * * * *", async () => {
  if (closingRun) return; // previous run still settling
  closingRun = true;
  try {
    const openBets = await OptionsGame.find(
      { predictionStatus: game.STATUS.OPEN },
      { userId: 1, dateTime: 1, direction: 1, bustprice: 1, pairName: 1 }
    ).lean();
    if (!openBets.length) return;

    const settings = await game.getTradingConfig();
    if (!settings) return;

    // One price lookup per pair that has open positions
    const pairNames = [...new Set(openBets.map((bet) => bet.pairName))];
    const pairs = await Promise.all(pairNames.map((name) => game.getActivePair(name)));
    const priceByPair = new Map(pairNames.map((name, i) => [name, pairs[i] && pairs[i].marketPrice]));

    const expiryMs = settings.timingMinutes * 60 * 1000;
    const now = Date.now();

    for (const bet of openBets) {
      const price = priceByPair.get(bet.pairName);
      if (!price) continue; // pair disabled or no price: leave the position open
      const expired = now - new Date(bet.dateTime).getTime() >= expiryMs;
      if (!expired && !game.isBusted(bet, price)) continue;
      try {
        await game.autoCloseBet(bet, price);
      } catch (error) {
        console.error("autoCloseBet error:", bet._id, error.message);
      }
    }
  } catch (error) {
    console.error("options close cron error:", error);
  } finally {
    closingRun = false;
  }
});
