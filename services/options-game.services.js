//** package imported */
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const OptionsGameBalance = Mongoose.model("OptionsGameBalanceUpdation");
const UserWallet = Mongoose.model("UserWallet");
//** common & helper component imported */
const { successResponse, errorResponse } = require("../helpers/response");
const queryHelper = require("../helpers/query.helper");
const messageUtils = require("../helpers/messageUtils.helper");
const commonHelper = require("../helpers/common.helper");
const socketHelper = require('../helpers/socket.helper');
const io = socketHelper.GetSocket();

/**
 * @description close-bet services  
 * @param {Object} closeBetBody
 * @returns {Promise<OptionsGameDetails>}
 */


const calcProfitAndLoss = async (closeBetBody, currentMarketPrice) => {
    const { _id, userId, currencyId, bustprice, actualpredictionAmt, multiplier, marketprice, direction } = closeBetBody;

    const newBustPrice = actualpredictionAmt * multiplier;
    const profitAmt = newBustPrice / marketprice;
    const priceDifference = direction === 'Calls' 
        ? currentMarketPrice - marketprice 
        : marketprice - currentMarketPrice;

    const calcProfitPrice = profitAmt * priceDifference;
    const calProfitPrc = Number(calcProfitPrice.toFixed(2));

    // Construct the result data
    const resultData = {
        predictionId: _id,
        userDetail: userId,
        profitLoss: calProfitPrc,
        gameStatus: "autoClose",
        directionDetail: direction,
        currencyDetail: currencyId,
        exitMrkPrice: currentMarketPrice
    };

    // Determine game type based on market price
    if (bustprice === currentMarketPrice) {
        return { status: true, data: resultData };
    } 
    if (marketprice === currentMarketPrice) {
        return { status: true, data: resultData, type: "equaltoclose" };
    }

    return { status: true, data: resultData };
};


// const calcProfitAndLoss = async (closeBetBody, currentMarketPrice) => {

//     const { _id, userId, currencyId, bustprice, actualpredictionAmt, multiplier, marketprice, direction } = closeBetBody;
//     let newBustPrice = null, profitAmt = null, calcProfitPrice = null, gameMarketPrice = marketprice, calProfitPrc = null;
//     newBustPrice = actualpredictionAmt * multiplier;
//     profitAmt = newBustPrice / gameMarketPrice; //userPrediction market price calc
//     if (direction == 'Calls') {
//         calcProfitPrice = profitAmt * (currentMarketPrice - gameMarketPrice);
//         calProfitPrc = Number(calcProfitPrice.toFixed(2));
//         if (bustprice == currentMarketPrice) {
//             var buyData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: buyData }
//         } if (marketprice == currentMarketPrice) {
//             var buyData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: buyData, type: "equaltoclose" }
//         }
//         else {
//             var buyData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: buyData }
//         }
//     } else if (direction == 'Puts') {
//         calcProfitPrice = profitAmt * (gameMarketPrice - currentMarketPrice);
//         calProfitPrc = Number(calcProfitPrice.toFixed(2));
//         if (bustprice == currentMarketPrice) {
//             var sellData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: sellData }
//         } if (marketprice == currentMarketPrice) {
//             var sellData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: sellData, type: "equaltoclose" }
//         }
//         else {
//             var sellData = {
//                 predictionId: _id,
//                 userDetail: userId,
//                 profitLoss: calProfitPrc,
//                 gameStatus: "autoClose",
//                 directionDetail: direction,
//                 currencyDetail: currencyId,
//                 exitMrkPrice: currentMarketPrice
//             }
//             return { status: true, data: sellData }
//         }
//     } else throw new Error(messageUtils.SOMETHING_WRONG);
// };

const winOrLossPriceUpdated = async (profitData, gameStatusStr, previousWalletGameAmt, previousHoldAmount) => {

    const { predictionId, userDetail, profitLoss, gameStatus, directionDetail, currencyDetail, exitMrkPrice } = profitData;
    const gameData = await queryHelper.findoneData(OptionsGame, { _id: predictionId }, {});
    if (gameData.status) {
        let predictionAmt = gameData.msg.predictionAmt;
        let oldAmount = previousWalletGameAmt;
        let addedAmount = 0;
        let type = "";
        let holdAmount = gameData.msg.actualpredictionAmt;
        if (gameStatusStr == 'Win') {
            gameData.msg['winAmt'] = profitLoss;
        } else if (gameStatusStr == 'Loss' || gameStatusStr == 'Closed') {
            gameData.msg['lossAmt'] = profitLoss;
        }
        gameData.msg['predictionStatus'] = 1;
        gameData.msg['exitMarketPrice'] = exitMrkPrice;
        await gameData.msg.save();

        if (gameStatusStr == 'Win') {
            addedAmount = holdAmount + profitLoss;
            type = "Game won";
        } else if (gameStatusStr == 'Loss') {
            type = "Game loss";
        } else if (gameStatusStr == 'Closed') {
            holdAmount = holdAmount;
            type = "Game Closed";
        }

        let newAmount = oldAmount + addedAmount;
        let difference = newAmount - oldAmount;

        const returnData = await commonHelper.OptionsGameBalanceUpdation(userDetail, currencyDetail, newAmount, addedAmount, oldAmount, difference, predictionId, holdAmount, type, gameStatusStr, previousHoldAmount, predictionAmt);

        return returnData;

    }
};
const closeBetService = async (closeBetBody, currentMarketPrice, type) => {

    try {
        const { userId, currencyId } = closeBetBody;

        if (closeBetBody) {

            const userWalletAmt = await queryHelper.findoneData(UserWallet,{userId: ObjectId(userId),currencyId: ObjectId(currencyId)},{ optionsGameAmount: 1, optionsHold: 1 });
            let previousWalletGameAmt = null
            let previousHoldAmt = null

            if (userWalletAmt.status) {
                previousWalletGameAmt = userWalletAmt.msg.optionsGameAmount;
                previousHoldAmt = userWalletAmt.msg.optionsHold;
            }
            const getProfitData = await calcProfitAndLoss(closeBetBody, currentMarketPrice);

            if (getProfitData.status == true && getProfitData.data) {

                const { profitLoss } = getProfitData.data;
                const result = { status: true, userId: getProfitData.data.userDetail, message: 'Your position has automatically closed' }
                if (parseFloat(profitLoss) > 0) {
                    const resData = await winOrLossPriceUpdated(getProfitData.data, gameStatusStr = 'Win', previousWalletGameAmt, previousHoldAmt);
                    if (resData && resData.userId) {
                        io.sockets.emit('betClosed', result);
                    }
                } else if (getProfitData.type == "equaltoclose") {
                    const resData = await winOrLossPriceUpdated(getProfitData.data, gameStatusStr = 'Closed', previousWalletGameAmt, previousHoldAmt);
                    if (resData && resData.userId) {
                        io.sockets.emit('betClosed', result);
                    }
                }
                else {
                    const resData = await winOrLossPriceUpdated(getProfitData.data, gameStatusStr = 'Loss', previousWalletGameAmt, previousHoldAmt);
                    if (resData && resData.userId) {
                        io.sockets.emit('betClosed', result)
                    }
                }
            }


        }
    } catch (error) {
        console.log("closeBet-services err: ", error);
    }
};
module.exports = {
    closeBetService: closeBetService,
}
