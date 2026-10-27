// import package
const WebSocket = require('ws');
//** package imported */
const Mongoose = require('mongoose');
const { ObjectId } = Mongoose.Types;
const axios = require('axios');
const optionsGameServices = require("../services/options-game.services");
var query_helper = require('./query.helper');

//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const UserWallet = Mongoose.model("UserWallet")
let siteSettings = Mongoose.model('SiteSettings');
var Config = require('../config/config');
var async = require('async');

let siteSettingData = {};


async function updateSiteSettings() {
    let settings = await query_helper.findoneData(siteSettings, {}, {})
    siteSettingData = settings.msg;
}
updateSiteSettings();
let oArray = [];

var mapTrade = function () { };
let _tradeMap = new mapTrade();
var socket = 0;
// here socket connect 
exports.SocketInit = function (socketIO) {
    socket = socketIO;
}
exports.settingsUpdate = function (result) {
    siteSettingData = result;
    socket.sockets.emit('settingsUpdate', result);
}
mapTrade.prototype._intervalFunc = (orderwith) => {
    var index = oArray.indexOf(orderwith);
    if (index > -1) {
        oArray.splice(index, 1);
    }
}

mapTrade.prototype._createResponseOptionsGame = async function (response, channelName = 'createResponsePredictionGame') {
    if (response.message && respMessage_helper && respMessage_helper[response.message]) {
        response['message'] = respMessage_helper[response.message];
    }
    response['msg'] = "Order Executed Successfully";
    socket.sockets.emit(channelName, response);
};

exports.userEmit = function (userQuery, values, placeType, res) {
    var userId = values.userId,
        pairId = values.pairId,
        currencyId = values.currencyId,
        betType = values.betType
    _tradeMap._userEmit(userQuery, userId, pairId, currencyId, betType, placeType, res);
};
mapTrade.prototype._userEmit = async function (userQuery, userId, pairId, currencyId, betType, placeType, res) {
    try {
        const { sort, limit, offset } = userQuery;
        var userResponse = {};
        userResponse.userId = userId;
        
        async.parallel({
            activeBets: async function () {
                let query = { userId: ObjectId(userId), currencyId: ObjectId(currencyId), predictionStatus: 0 };
                if (betType['pagination'] == true) {
                    if (betType['betType'] == "activeBets") {
                        const resData = await OptionsGame.aggregate([
                            { $match: query },
                            { '$sort': sort },
                            { '$limit': offset + limit },
                            { '$skip': offset },
                            { $project: { __v: 0, createdAt: 0, updatedAt: 0 } }
                        ]);
                        return resData;
                    }
                } else if (betType['pagination'] == false) {
                    const resData = await OptionsGame.aggregate([
                        { $match: query },
                        { '$sort': sort },
                        { '$limit': offset + limit },
                        // { '$skip': offset },
                        { $project: { __v: 0, createdAt: 0, updatedAt: 0 } }
                    ]);
                    return resData;
                }
            },
            closeBets: async function () {
                let query = { userId: ObjectId(userId), currencyId: ObjectId(currencyId), predictionStatus: 1 };
                if (betType['pagination'] == true) {
                    if (betType['betType'] == "closeBets") {
                        const resData = await OptionsGame.aggregate([
                            { $match: query },
                            { '$sort': sort },
                            { '$limit': offset + limit },
                            { '$skip': offset },
                            { $project: { __v: 0, createdAt: 0, updatedAt: 0 } }
                        ]);
                        return resData;
                    }
                } else if (betType['pagination'] == false) {
                    const resData = await OptionsGame.aggregate([
                        { $match: query },
                        { '$sort': sort },
                        { '$limit': offset + limit },
                        { $project: { __v: 0, createdAt: 0, updatedAt: 0 } }
                    ]);
                    return resData;
                }
            },
            activeBetsCount: async function (cb) {
                const count = await OptionsGame.countDocuments({
                    "$and": [
                        { 'userId': userId },
                        { 'predictionStatus': 0 }
                    ]
                })
                return count;
            },
            closeBetsCount: async function (cb) {
                const count = await OptionsGame.countDocuments({
                    "$and": [
                        { 'userId': userId },
                        { 'predictionStatus': 1 }
                    ]
                })
                return count;
            },
            gameWalletBalance: async function (cb) {
                let where = { userId: ObjectId(userId), currencyId: ObjectId(currencyId) };
                let get = { optionsGameAmount: 1, _id: 0 }
                const GameWalletBlnc = await UserWallet.findOne(where, get)
                return GameWalletBlnc;
            },
        }, function (err, result) {
            userResponse.activeBets = result.activeBets;
            userResponse.closeBets = result.closeBets;
            userResponse.activeBetsCount = result.activeBetsCount;
            userResponse.closeBetsCount = result.closeBetsCount;
            userResponse.gameWalletBalance = result.gameWalletBalance ? result.gameWalletBalance.optionsGameAmount : 0;
            if (placeType == "api") return res.send({ status: true, data: userResponse });
            else socket.sockets.emit("optionsGameResponse", userResponse);
        });

    } catch (error) {
        console.log("_userEmit response err :", error);
    }
};

exports.closePredictionBets = async function (reqBody) {
    try {
        if (Config.sectionStatus && Config.sectionStatus.optionsGameCron != "Enable") {
            _tradeMap._createResponseOptionsGame({
                "status": false,
                "message": "Trade disabled. Kindly contact admin!",
                "userId": reqBody.userId
            });
        } else {
            return optionsGameServices.userCloseBetServices(reqBody);
        }
    } catch (error) {
        console.log('err : usd-m createOrder ', err)
        _tradeMap._createResponseOptionsGame({
            "status": false,
            "message": "Something went wrong! Please try again someother time",
            "userId": reqBody.userId
        });
    }
};