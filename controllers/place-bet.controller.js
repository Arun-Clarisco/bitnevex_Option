//** package imported */
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const OptionsGameBalance = Mongoose.model("OptionsGameBalanceUpdation");
const UserWallet = Mongoose.model("UserWallet");
const CurrencySymbol = Mongoose.model("CurrencySymbol");
const Competion = Mongoose.model("Competion");
const Currency = Mongoose.model('CurrencySymbol');
const Pairs = Mongoose.model('Pairs');
const queryHelper = require("../helpers/query.helper");
const TradingGameData = Mongoose.model('Trading Time Settings');
const Users = Mongoose.model("Users");




/**
 * @description create a new place bet 
 * @param {Object} placeBetBody
 * @returns {Promise<OptionsGameDetails>}
 */
const addNewPlacebit = async (req, res) => {
  try {

    const pdata = req.body;

    const requiredFields = [
      "wager",
      "actualWager",
      "direction",
      "userLoginId",
      "currencyId",
      "multiplier",
      "bustprice",
      "marketPrice",
      "betFeeAmt",
      "pair"
    ];

    for (const field of requiredFields) {
      if (
        pdata[field] === undefined ||
        pdata[field] === null ||
        pdata[field] === ""
      ) {
        return res.send({
          status: false,
          message: `${field} is required`
        });
      }
    }

    if (!ObjectId(pdata.userLoginId)) {
      return res.send({
        status: false,
        message: "Invalid user ID"
      });
    }

    if (!ObjectId(pdata.currencyId)) {
      return res.send({
        status: false,
        message: "Invalid currency ID"
      });
    }

    const findUser = await Users.findOne({ _id: ObjectId(pdata.userLoginId) });

    if (!findUser) {
      return res.send({
        status: false,
        message: "Not a valid User"
      });
    }

    const getCurrency = await Pairs.find({
      toCurrencyId: ObjectId(pdata.currencyId),
      optionsStatus: 1
    });

    if (!getCurrency || getCurrency.length === 0) {
      return res.send({
        status: false,
        message: "No options pair available for this currency"
      });
    }

    const pairsData = getCurrency.map(item => item.pair);

    if (!pairsData.includes(pdata.pair)) {
      return res.send({
        status: false,
        message: `Invalid or disabled options pair: ${pdata.pair}`
      });
    }

    // =========================
    // 3. Numeric conversion
    // =========================
    const wager = Number(pdata.wager);
    const actualWager = Number(pdata.actualWager);
    const betFeeAmt = Number(pdata.betFeeAmt);
    const multiplier = Number(pdata.multiplier);
    const marketPrice = Number(pdata.marketPrice);
    const bustprice = Number(pdata.bustprice);

    // =========================
    // 4. Number validation
    // =========================
    if (
      !Number.isFinite(wager) ||
      !Number.isFinite(actualWager) ||
      !Number.isFinite(betFeeAmt) ||
      !Number.isFinite(multiplier) ||
      !Number.isFinite(marketPrice) ||
      !Number.isFinite(bustprice)
    ) {
      return res.send({
        status: false,
        message: "Invalid numeric values"
      });
    }

    // =========================
    // 5. Positive value validation
    // =========================
    if (wager <= 0) {
      return res.send({
        status: false,
        message: "Wager must be greater than 0"
      });
    }

    if (actualWager <= 0) {
      return res.send({
        status: false,
        message: "Actual wager must be greater than 0"
      });
    }

    if (betFeeAmt < 0) {
      return res.send({
        status: false,
        message: "Invalid bet fee"
      });
    }

    const allowedMultipliers = [500, 750, 1000];

    if (!allowedMultipliers.includes(multiplier)) {
      return res.send({
        status: false,
        message: "Invalid multiplier. Allowed values are 500, 750, or 1000"
      });
    }

    if (marketPrice <= 0) {
      return res.send({
        status: false,
        message: "Invalid market price"
      });
    }

    if (bustprice <= 0) {
      return res.send({
        status: false,
        message: "Invalid bust price"
      });
    }

    // =========================
    // 6. Direction validation
    // =========================
    if (!["Calls", "Puts"].includes(pdata.direction)) {
      return res.send({
        status: false,
        message: "Invalid direction. Allowed values are Calls or Puts"
      });
    }

    // =========================
    // 8. Bust price validation
    // Calls -> bust price should be below market price
    // Puts  -> bust price should be above market price
    // =========================
    if (pdata.direction === "Calls" && bustprice >= marketPrice) {
      return res.send({
        status: false,
        message: "Invalid bust price for Calls"
      });
    }

    if (pdata.direction === "Puts" && bustprice <= marketPrice) {
      return res.send({
        status: false,
        message: "Invalid bust price for Puts"
      });
    }

    const getData = await TradingGameData.find({});

    if (!getData || getData.length === 0) {
      return res.send({
        status: false,
        message: "Options trading configuration not found"
      });
    }

    const optionsConfig = getData[0];

    const optionsFlatFee = Number(optionsConfig.optionsFlatFee);
    const optionsMinimumAmount = Number(optionsConfig.optionsMinimumAmount);

    if (
      !Number.isFinite(optionsFlatFee) ||
      !Number.isFinite(optionsMinimumAmount)
    ) {
      return res.send({
        status: false,
        message: "Invalid options trading configuration"
      });
    }

    if (wager < optionsMinimumAmount) {
      return res.send({
        status: false,
        message: `Minimum options wager amount is ${optionsMinimumAmount}`
      });
    }

    // =========================
    // Options flat fee validation
    // =========================
    const newBustPrice = wager * multiplier;
    const calculatedFee = Number(((newBustPrice * optionsFlatFee) / 100).toFixed(8));

    if (Math.abs(betFeeAmt - calculatedFee) > 0.00000001) {
      return res.send({
        status: false,
        message: `Invalid options fee. The options fee should be ${optionsFlatFee}`
      });
    }

    const expectedActualWager = Number((wager - calculatedFee).toFixed(8));

    if (expectedActualWager <= 0) {
      return res.send({
        status: false,
        message: "Invalid actual wager amount"
      });
    }

    // =========================================================
    // 13. Validate frontend actual wager
    // =========================================================
    if (Math.abs(actualWager - expectedActualWager) > 0.00000001) {
      return res.send({
        status: false,
        message: "Invalid actual wager amount"
      });
    }

    // =========================================================
    // 14. Final wager consistency check
    // =========================================================
    const calculatedWager = Number((actualWager + betFeeAmt).toFixed(8));

    if (Math.abs(calculatedWager - wager) > 0.00000001) {
      return res.send({
        status: false,
        message: "Invalid wager amount or fee amount"
      });
    }


    const userWalletGameAmt = await UserWallet.findOne({ userId: ObjectId(pdata.userLoginId), currencyId: ObjectId(pdata.currencyId) }, { optionsGameAmount: 1, optionsHold: 1 });

    if (!userWalletGameAmt) {
      res.send({
        status: false,
        message: "Please check your USDT balance in options wallet!",
      });
      return;
    }

    let betAmountWithFee = actualWager + betFeeAmt;
    let previousWalletGameAmt = userWalletGameAmt.optionsGameAmount;
    let previousHoldAmt = userWalletGameAmt.optionsHold;
    if (previousWalletGameAmt >= betAmountWithFee) {
      let placeBet_new = new OptionsGame({
        userId: pdata.userLoginId,
        currencyId: pdata.currencyId,
        predictionAmt: wager,
        actualpredictionAmt: actualWager,
        multiplier: multiplier,
        marketprice: marketPrice,
        bustprice: bustprice,
        direction: pdata.direction,
        feeAmount: betFeeAmt,
        competionId: pdata.competionId,
        pairName: pdata.pair
      });
      await placeBet_new.save().then(async (result) => {
        let updatedWalletGameAmt = previousWalletGameAmt - betAmountWithFee;
        let addUpdateHoldAmt = previousHoldAmt + wager;
        let updatedHoldAmt = parseFloat(addUpdateHoldAmt);
        if (previousWalletGameAmt >= betAmountWithFee) {
          await UserWallet.findOneAndUpdate({ userId: result.userId, currencyId: pdata.currencyId }, {
            $set: {
              optionsGameAmount: updatedWalletGameAmt,
              optionsHold: updatedHoldAmt
            }
          }).then(async (comp) => {
            //=========History updation in gamePredictionBalanceAmt Collection======//
            let updatedAmt = comp.optionsGameAmount - betAmountWithFee;
            let truncatedAmt = Math.trunc(updatedAmt * 100) / 100;
            const updations = new OptionsGameBalance({
              userId: pdata.userLoginId,
              currencyId: pdata.currencyId,
              amount: updatedAmt,
              difference: betAmountWithFee,
              oldBalance: comp.optionsGameAmount,
              type: 'Options Game',
            });
            await updations.save();
            res.send({ status: true, message: `Options position added successfully... Your Options wallet balance ${truncatedAmt}` });
          })
        }
      })
    } else {
      res.send({ status: false, message: "Please check your USDT balance in options wallet!" });
    }
  } catch (error) {
    console.log("addNewPlacebit error", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
};
/**
* @description Get all prediction details by userId
* @param {ObjectId<string>} userId
* @returns {Promise<OptionsGame>}
*/
const getUserBasedPrediction = async (data) => {

  try {
    const { userLoginId } = data;

    if (!userLoginId) {
      return {
        status: false,
        message: "User ID is required"
      };
    }

    const findUser = await Users.findOne({ _id: ObjectId(userLoginId) });

    if (!findUser) {
      return res.send({
        status: false,
        message: "Not a valid User"
      });
    }

    const userPredictionData = await OptionsGame.find({ userId: userLoginId }).sort({ _id: -1 });

    if (userPredictionData) {
      return ({ status: true, data: userPredictionData });
    } else {
      return ({ status: false, data: [] });
    }

  } catch (error) {
    console.log("getUserBasedPrediction error: ", error);
    return ({ status: false, message: "Something went wrong! Please try again someother time" });
  }
};

const closedBetFromUser = async (req, res) => {
  const session = await Mongoose.startSession();
  try {
    const pdata = req.body;

    const requiredFields = [
      "predictionId",
      "profitAndLoss",
      "exitPrice",
      "userLoginId",
      "currencyId"
    ];

    for (const field of requiredFields) {
      if (
        pdata[field] === undefined ||
        pdata[field] === null ||
        String(pdata[field]).trim() === ""
      ) {
        return res.send({
          status: false,
          message: `${field} is required`
        });
      }
    }

    // ObjectId validation
    if (!ObjectId.isValid(pdata.predictionId)) {
      return res.send({
        status: false,
        message: "Invalid prediction ID"
      });
    }

    if (!ObjectId.isValid(pdata.userLoginId)) {
      return res.send({
        status: false,
        message: "Invalid user ID"
      });
    }

    if (!ObjectId.isValid(pdata.currencyId)) {
      return res.send({
        status: false,
        message: "Invalid currency ID"
      });
    }

    const profitLoss = Number(pdata.profitAndLoss);
    const exitPrice = Number(pdata.exitPrice);

    if (!Number.isFinite(profitLoss)) {
      return res.send({
        status: false,
        message: "Invalid profit and loss"
      });
    }

    if (!Number.isFinite(exitPrice)) {
      return res.send({
        status: false,
        message: "Invalid exit price"
      });
    }


    const findUser = await Users.findOne({ _id: ObjectId(pdata.userLoginId) });

    if (!findUser) {
      return res.send({
        status: false,
        message: "Not a valid User"
      });
    }
    session.startTransaction(); // Start transaction

    // Check and lock the prediction to prevent concurrent updates
    const findCloseBetData = await OptionsGame.findOneAndUpdate(
      { _id: pdata.predictionId, isProcessing: { $ne: true } },
      { $set: { isProcessing: true } },
      { new: true, session }
    );

    if (!findCloseBetData) {
      await session.abortTransaction();
      return res.send({ status: false, message: "Prediction is already being processed." });
    }

    const userWalletGameAmt = await UserWallet.findOne(
      { userId: ObjectId(pdata.userLoginId), currencyId: pdata.currencyId },
      { optionsGameAmount: 1, optionsHold: 1 }
    ).session(session);

    if (!userWalletGameAmt) {
      await session.abortTransaction();
      return res.send({ status: false, message: "User wallet not found." });
    }

    let previousWalletGameAmt = userWalletGameAmt.optionsGameAmount;
    let previousHoldGameAmt = userWalletGameAmt.optionsHold;
    let originalWager = findCloseBetData.predictionAmt;

    if (profitLoss > 0) {
      // Handle win case
      const updatedPrediction = await OptionsGame.findByIdAndUpdate(
        pdata.predictionId,
        {
          $set: {
            winAmt: pdata.profitAndLoss,
            predictionStatus: 1,
            exitMarketPrice: pdata.exitPrice,
          },
        },
        { session, new: true }
      );

      const updatedWalletBalance = parseFloat(findCloseBetData.actualpredictionAmt) + parseFloat(pdata.profitAndLoss);

      const currentBalance = previousWalletGameAmt + updatedWalletBalance;
      let updateHoldAmt = previousHoldGameAmt > 0 ? previousHoldGameAmt - originalWager : previousHoldGameAmt;
      let updateCurrentHoldAmt = parseFloat(updateHoldAmt);

      const balanceEntry = new OptionsGameBalance({
        userId: ObjectId(pdata.userLoginId),
        currencyId: pdata.currencyId,
        amount: currentBalance,
        difference: updatedWalletBalance,
        oldBalance: previousWalletGameAmt,
        holdAmount: findCloseBetData.actualpredictionAmt,
        addedAmount: updatedWalletBalance,
        type: "Game won",
      });

      await balanceEntry.save({ session });

      const updateHoldData = await UserWallet.findOneAndUpdate(
        { userId: ObjectId(pdata.userLoginId), currencyId: pdata.currencyId },
        { $set: { optionsGameAmount: currentBalance, optionsHold: updateCurrentHoldAmt } },
        { session }
      );

      await session.commitTransaction();
      res.send({ status: true, data: updatedPrediction, message: "Successfully closed position" });
    } else if (profitLoss === 0) {
      const wagerAmt = parseFloat(findCloseBetData.predictionAmt);
      const feeAmt = parseFloat(findCloseBetData.feeAmount || 0);
      const refundAmount = wagerAmt - feeAmt;
      const newBalance = previousWalletGameAmt + refundAmount;


      let updatedPrediction = await GamePrediction.findByIdAndUpdate(pdata.predictionId,
        {
          $set: {
            lossAmt: pdata.profitAndLoss,
            predictionStatus: 1,
            exitMarketPrice: pdata.exitPrice
          }
        },
        { session, new: true }
      );
      let updateHoldAmt = previousHoldGameAmt > 0 ? previousHoldGameAmt - originalWager : previousHoldGameAmt;
      let updateCurrentHoldAmt = parseFloat(updateHoldAmt);

      const balanceEntry = new GamePreditionBalance({
        userId: ObjectId(pdata.userLoginId),
        currencyId: pdata.currencyId,
        amount: newBalance,
        difference: refundAmount,
        oldBalance: previousWalletGameAmt,
        holdAmount: findCloseBetData.actualpredictionAmt,
        addedAmount: refundAmount,
        type: 'Game lose',
      });

      await balanceEntry.save({ session });

      await UserWallet.findOneAndUpdate({ userId: ObjectId(pdata.userLoginId), currencyId: pdata.currencyId },
        {
          $set:
          {
            gamePredictionAmount: newBalance,
            gamePredictionHold: updateCurrentHoldAmt
          }
        }, { session });

      await session.commitTransaction();
      res.send({ status: true, data: updatedPrediction, message: "Successfully closed prediction" });
    } else {
      // Handle loss case
      const updatedPrediction = await OptionsGame.findByIdAndUpdate(
        pdata.predictionId,
        {
          $set: {
            lossAmt: pdata.profitAndLoss,
            predictionStatus: 1,
            exitMarketPrice: pdata.exitPrice,
          },
        },
        { session, new: true }
      );

      let updateHoldAmt = previousHoldGameAmt > 0 ? previousHoldGameAmt - originalWager : previousHoldGameAmt;
      let updateCurrentHoldAmt = parseFloat(updateHoldAmt);



      let newAmount = 0;
      if (updatedPrediction.marketprice === pdata.exitPrice) {
        newAmount = findCloseBetData.actualpredictionAmt;
      }

      const newBalance = previousWalletGameAmt + newAmount;

      const balanceEntry = new OptionsGameBalance({
        userId: ObjectId(pdata.userLoginId),
        currencyId: pdata.currencyId,
        amount: newBalance,
        difference: newBalance - previousWalletGameAmt,
        oldBalance: previousWalletGameAmt,
        holdAmount: findCloseBetData.actualpredictionAmt,
        addedAmount: newAmount,
        type: "Game lose",
      });

      await balanceEntry.save({ session });

      const updateHoldData = await UserWallet.findOneAndUpdate(
        { userId: ObjectId(pdata.userLoginId), currencyId: pdata.currencyId },
        { $set: { optionsGameAmount: newBalance, optionsHold: updateCurrentHoldAmt } },
        { session }
      );

      await session.commitTransaction();
      res.send({ status: true, data: updatedPrediction, message: "Successfully closed position" });
    }
  } catch (error) {
    console.error("Error in closedBetFromUser:", error);
    await session.abortTransaction();
    res.status(500).send({ status: false, message: "Something went wrong!" });
  } finally {
    session.endSession();
  }
};

const getUserGameWalletBalance = async (data) => {
  try {
    let pdata = data;

    if (!ObjectId.isValid(pdata.userLoginId)) {
      return res.send({
        status: false,
        message: "Invalid user ID"
      });
    }

    const findUser = await Users.findOne({ _id: ObjectId(pdata.userLoginId) });

    if (!findUser) {
      return res.send({
        status: false,
        message: "Not a valid User"
      });
    }

    let userWalletBalance = await UserWallet.findOne({ userId: ObjectId(pdata.userLoginId), currencyId: ObjectId(pdata.currencyId) }, { optionsGameAmount: 1, userId: 1 });

    if (userWalletBalance) {
      return ({ status: true, data: userWalletBalance });
    } else {
      return ({ status: false, data: [] });
    }

  } catch (error) {
    console.log("getUserGameWalletBalance error: ", error);
    return ({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}


const getCurrencySymbol = async (req, res) => {
  try {
    const getSymbol = await CurrencySymbol.findOne({ currencySymbol: "USDT" });
    if (getSymbol) {
      res.send({ status: true, message: `Coin Symbol${getSymbol}`, data: getSymbol });
    } else {
      res.send({ status: false, message: `Coin Symbol${getSymbol}`, data: getSymbol });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: "Somethging Went Wroung" })
  }
}

const getCompetion = async (req, res) => {
  try {
    const userCompetion = await Competion.find({}).sort({ _id: -1 }).limit(1);
    if (userCompetion) {
      res.send({ status: true, data: userCompetion });
    } else {
      res.send({ status: false, data: [] });
    }
  } catch (error) {
    console.log("userCompetion error: ", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
};

const getAllPairs = async (req, res) => {
  try {
    let pdata = req.body;

    if (!ObjectId.isValid(pdata.currencyId)) {
      return res.send({
        status: false,
        message: "Invalid Currency ID"
      });
    }

    const getCurrency = await Pairs.find({ toCurrencyId: ObjectId(pdata.currencyId), optionsStatus: 1 });
    const PairsData = getCurrency.map(item => item.pair);

    const AggregatePairData = await Pairs.aggregate([
      {
        $match: { toCurrencyId: ObjectId(pdata.currencyId), optionsStatus: 1 }
      },
      {
        $lookup: {
          from: "Currency",
          localField: "fromCurrency",
          foreignField: "_id",
          as: "result"
        }
      },
      { $unwind: "$result" },
      {
        $project: {
          "result.image": 1,
        }
      }
    ]);

    if (getCurrency.length > 0) {
      res.send({ status: true, data: PairsData, AggregatePairData: AggregatePairData })
    } else {
      res.send({ status: false, data: [], AggregatePairData: [] })
    }
  } catch (error) {
    console.log("error: ", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}


const getTotalPairs = async (req, res) => {
  let activePairList = [];
  try {
    const CurrencySymbols = await queryHelper.findoneData(Currency, { currencySymbol: "USDT" });
    const CurrencyId = CurrencySymbols.msg._id;

    if (CurrencyId) {

      activePairList = await queryHelper.findData(Pairs, { toCurrencyId: ObjectId(CurrencyId), optionsStatus: 1 }, { pair: 1, marketPrice: 1 }, {});

      if (activePairList) {
        return ({ status: true, activePairList: activePairList })
      } else {
        return ({ status: false, activePairList: [] })
      }
    } else {
      return ({ status: false, activePairList: [] })
    }
  } catch (error) {
    console.log("error: ", error);
    return ({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

const getSelectedPairs = async (data) => {
  try {
    const pair = data;
    const getSelectedPair = await Pairs.find({ pair: pair, optionsStatus: 1 });

    if (getSelectedPair.length > 0) {
      return ({ status: true, data: getSelectedPair });
    } else {
      return ({ status: false, data: [] });
    }
  } catch (error) {
    console.log("error: ", error);
    return ({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

const getTradeingData = async (req, res) => {
  try {
    const getData = await TradingGameData.find({});
    if (getData) {
      res.send({ status: true, data: getData })
    } else {
      res.send({ status: false, data: [] })
    }

  } catch (error) {
    console.log("error: ", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

module.exports = {
  addNewPlacebit,
  getUserBasedPrediction,
  closedBetFromUser,
  getUserGameWalletBalance,
  getCurrencySymbol,
  getCompetion,
  getAllPairs,
  getSelectedPairs,
  getTotalPairs,
  getTradeingData
}