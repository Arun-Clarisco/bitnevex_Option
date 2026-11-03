const Mongoose = require("mongoose");

const OptionsGame = Mongoose.model("OptionsGame");
const game = require("../services/options-game.services");

const GENERIC_ERROR = "Something went wrong! Please try again someother time";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const contains = (text) => ({ $regex: escapeRegex(text), $options: "i" });

/**
 * POST /getOptionsHistory
 * Body (validated by the route): { limit, offset, formvalue: { username, callputs, pairs, fromdate, todate } }
 * Closed positions with the user, newest first.
 */
const getOptionsHistory = async (req, res) => {
  try {
    const { limit, offset, formvalue: filters } = req.body;

    const match = { predictionStatus: game.STATUS.CLOSED };
    if (filters.fromdate && filters.todate) {
      // Dates arrive as IST calendar days; the whole "to" day is included
      match.dateTime = {
        $gte: new Date(filters.fromdate.getTime() + IST_OFFSET_MS),
        $lt: new Date(filters.todate.getTime() + IST_OFFSET_MS + DAY_MS),
      };
    }
    if (filters.callputs) match.direction = filters.callputs;
    if (filters.pairs) match.pairName = filters.pairs;

    const userMatch = filters.username
      ? { $or: [{ username: contains(filters.username) }, { uid: contains(filters.username) }] }
      : {};

    const [result] = await OptionsGame.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "Users",
          let: { userId: "$userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$userId"] }, ...userMatch } },
            { $project: { username: 1, uid: 1, email: 1 } },
          ],
          as: "result",
        },
      },
      { $unwind: "$result" },
      { $sort: { _id: -1 } },
      {
        $facet: {
          data: [{ $skip: offset }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ]);

    return res.send({ status: true, data: result.data, total: result.total.length ? result.total[0].count : 0 });
  } catch (error) {
    console.log("getOptionsHistory error: ", error);
    return res.send({ status: false, message: GENERIC_ERROR });
  }
};

/** GET /getPairs - options pairs quoted in USDT (for the history filter) */
const getPairs = async (req, res) => {
  try {
    const currencyId = await game.getUsdtCurrencyId();
    const data = currencyId ? await game.getActivePairs(currencyId, { pair: 1 }) : [];
    return res.send({ status: data.length > 0, data });
  } catch (error) {
    console.log("getPairs error: ", error);
    return res.send({ status: false, message: GENERIC_ERROR });
  }
};

module.exports = {
  getOptionsHistory,
  getPairs,
};
