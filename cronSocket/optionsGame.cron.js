//** package imported */
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
const cron = require("node-cron");
//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const Pairs = Mongoose.model("Pairs");
//** common & helper component imported */
const queryHelper = require("../helpers/query.helper");
const optionsGameServices = require("../services/options-game.services");
const socketHelper = require('../helpers/socket.helper');
const Currency = Mongoose.model("CurrencySymbol");
const TradingGameData = Mongoose.model('Trading Time Settings');

const getMarketPriceSpot = async (coinQuery) => {
    const { pair, exchangeType } = coinQuery;
    let where = pair != '' ? { exchangeType, pair, optionsStatus: 1 } : { exchangeType, optionsStatus: 1 };
    let pairData = await Pairs.findOne(where).sort({ _id: 1 }).populate("fromCurrency").populate("toCurrency");
    return pairData;
};
/** 
 * @description at every mins schedule for prediction gaming closed bet checked and updating
 * @param {Object}
 * @returns {}
 */
let liquidityCloseBet = false;

cron.schedule("*/1 * * * * *", async () => {

    if (liquidityCloseBet) return true;
    liquidityCloseBet = true;
    try {
        const GamePredict = await queryHelper.findData(OptionsGame, { predictionStatus: 0 }, {}, {});
        const CurrencySymbols = await queryHelper.findoneData(Currency, { currencySymbol: "USDT" });
        const CurrencyId = CurrencySymbols.msg._id;
        const activePairList = await queryHelper.findData(Pairs, { toCurrencyId: ObjectId(CurrencyId), optionsStatus : 1 }, { pair: 1 }, {});
        const activePairs = activePairList && activePairList.msg;
        const GameData = GamePredict && GamePredict.msg;
        const GameTiming = await queryHelper.findData(TradingGameData, {}, {}, {});
        let setTime = null;
        if (GameTiming?.msg?.length > 0) {
            setTime = GameTiming.msg[0].predictionTiming;
        }
        // const setTime = GameTiming && GameTiming.msg[0].optionsTiming;
        let milliseconds = setTime * 60 * 1000;

        if (GameData && GameData.length > 0 && activePairs && activePairs.length > 0) {
            for (let activePair of activePairs) {
                let coinQuery = {
                    pair: activePair.pair,
                    exchangeType: 'SPOT'
                }

                const pairData = await getMarketPriceSpot(coinQuery);
                // console.log("pairData---",pairData);
                
                var currentMarketPrice = pairData && pairData.marketPrice.toFixed(pairData.priceDecimal);
                if (currentMarketPrice && GameData && GameData.length > 0) {
                    for (let gameValue of GameData) {
                        if (gameValue.predictionStatus == 0 && gameValue.pairName === activePair.pair) {

                            let bustprice = gameValue && gameValue.bustprice
                            let entryPrice = gameValue && gameValue.marketprice
                            const placeBetTimeUTC = new Date(gameValue.dateTime).getTime();
                            const currentTimeUTC = new Date().getTime();
                            const timeDifference = currentTimeUTC - placeBetTimeUTC;
                            const MinutesPassed = timeDifference >= milliseconds;

                            if (MinutesPassed || currentMarketPrice == bustprice) {
                                await optionsGameServices.closeBetService(gameValue, currentMarketPrice,"");
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log("err : cr1 : liquidityPredictionCloseBet : ", error);
    }
    liquidityCloseBet = false;
})




