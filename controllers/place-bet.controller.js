//** package imported */
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const OptionsGameBalance = Mongoose.model("OptionsGameBalanceUpdation");
const UserWallet = Mongoose.model("UserWallet");
const CurrencySymbol = Mongoose.model("CurrencySymbol");
const Competion = Mongoose.model("Competion");
//** common & helper component imported */
const { successResponse, errorResponse } = require("../helpers/response");
const Currency = Mongoose.model('CurrencySymbol');
const Pairs = Mongoose.model('Pairs');
const queryHelper = require("../helpers/query.helper");
const TradingGameData = Mongoose.model('Trading Time Settings');
const socketHelper = require('../helpers/socket.helper');
const io = socketHelper.GetSocket();
                       



/**
 * @description create a new place bet 
 * @param {Object} placeBetBody
 * @returns {Promise<OptionsGameDetails>}
 */
const addNewPlacebit = async (req, res) => {
  try {
    const pdata = req.body;
    const userWalletGameAmt = await UserWallet.findOne({ userId: ObjectId(pdata.userLoginId), currencyId: ObjectId(pdata.currencyId) }, { optionsGameAmount: 1, optionsHold:1 });

    if (!userWalletGameAmt) {
      res.send({
        status: false,
        message: "Please check your USDT balance in options wallet!",
      });
      return;
    }

    let betAmountWithFee = Number(pdata.actualWager) + Number(pdata.betFeeAmt);
    let previousWalletGameAmt = userWalletGameAmt.optionsGameAmount;
    let previousHoldAmt = userWalletGameAmt.optionsHold;
    if (previousWalletGameAmt >= betAmountWithFee) {
      let placeBet_new = new OptionsGame({
        userId: pdata.userLoginId,
        currencyId: pdata.currencyId,
        predictionAmt: pdata.wager,
        actualpredictionAmt: pdata.actualWager,
        multiplier: pdata.multiplier,
        marketprice: pdata.marketPrice,
        bustprice: pdata.bustprice,
        direction: pdata.direction,
        feeAmount: pdata.betFeeAmt,
        competionId: pdata.competionId,
        pairName: pdata.pair
      });
      await placeBet_new.save().then(async (result) => {
        let updatedWalletGameAmt = previousWalletGameAmt - betAmountWithFee;
        let addUpdateHoldAmt = previousHoldAmt + Number(pdata.wager);
        let updatedHoldAmt = parseFloat(addUpdateHoldAmt).toFixed(2);
        if (previousWalletGameAmt >= betAmountWithFee) {
          await UserWallet.findOneAndUpdate({ userId: result.userId, currencyId: pdata.currencyId }, {
            $set: {
              optionsGameAmount: updatedWalletGameAmt,
              optionsHold : updatedHoldAmt
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
    // console.log("userLoginId===",userLoginId);
    
    if(userLoginId){
      const userPredictionData = await OptionsGame.find({ userId: userLoginId }).sort({ _id: -1 });
      // console.log("userPredictionData--",userPredictionData);
  
      if (userPredictionData) {
        return({ status: true, data: userPredictionData });
      } else {
        return({ status: false, data: [] });
      }
  
    }else{
      return({ status: false, data: [] });
    }
    
  } catch (error) {
    console.log("getUserBasedPrediction error: ", error);
    return({ status: false, message: "Something went wrong! Please try again someother time" });
  }
};

const closedBetFromUser = async (req, res) => {
  const session = await Mongoose.startSession();
  try {
    const pdata = req.body;        
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

    if (parseFloat(pdata.profitAndLoss) > 0) {      
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
      let updateCurrentHoldAmt = parseFloat(updateHoldAmt).toFixed(2);
      
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
      let updateCurrentHoldAmt = parseFloat(updateHoldAmt).toFixed(2);

      const profitLoss = parseFloat(pdata.profitAndLoss);
      const absoluteProfitLoss = Math.abs(profitLoss);

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
    // console.log("pdata--",pdata);
    if(pdata.userLoginId){
      let userWalletBalance = await UserWallet.findOne({ userId: ObjectId(pdata.userLoginId), currencyId: ObjectId(pdata.currencyId) }, { optionsGameAmount: 1, userId : 1 });
    // console.log("userWalletBalance---",userWalletBalance);
      
      if (userWalletBalance) {
        return ({ status: true, data: userWalletBalance });
      } else {
        return ({ status: false, data: [] });
      }
    }else{
      return ({ status: false, data: [] });
    }
    
  } catch (error) {
    console.log("getUserGameWalletBalance error: ", error);
    return({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}


const getCurrencySymbol = async (req, res) => {
  try {
    const getSymbol = await CurrencySymbol.findOne({ currencySymbol: "USDT" });
    // console.log("getSymbol---",getSymbol);
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
    // console.log("pdata--",pdata);
    const getCurrency = await Pairs.find({ toCurrencyId: ObjectId(pdata.currencyId), optionsStatus : 1 });
    const PairsData = getCurrency.map(item => item.pair);
    // console.log("PairsData--",PairsData);

    const AggregatePairData = await Pairs.aggregate([
      {
        $match: { toCurrencyId: ObjectId(pdata.currencyId), optionsStatus :1 }
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

    if (getCurrency) {
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
    // console.log("CurrencyId==",CurrencyId);

    if (CurrencyId) {

      activePairList = await queryHelper.findData(Pairs, { toCurrencyId: ObjectId(CurrencyId),optionsStatus : 1 }, { pair: 1, marketPrice: 1 }, {});

      if (activePairList) {
        return({ status: true, activePairList: activePairList })
      } else {
        return({ status: false, activePairList: [] })
      }
    } else {
      return({ status: false, activePairList: [] })
    }
  } catch (error) {
    console.log("error: ", error);
    return({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

const getSelectedPairs = async (data) => {
  try {
    const pair = data;
    const getSelectedPair = await Pairs.find({ pair: pair, optionsStatus : 1 });
    // console.log("getSelectedPair--",getSelectedPair.length);

    if (getSelectedPair.length > 0) {
      return({ status: true, data: getSelectedPair });
    } else {
      return({ status: false, data: [] });
    }
  } catch (error) {
    console.log("error: ", error);
    return({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

const getTradeingData = async(req,res)=>{
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