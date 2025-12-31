//** package imported */
const Mongoose = require("mongoose");
const { ObjectId } = Mongoose.Types;
//** db collection imported */
const OptionsGame = Mongoose.model("OptionsGame");
const Pairs = Mongoose.model("Pairs");
const Currency = Mongoose.model("CurrencySymbol");
const queryHelper = require("../helpers/query.helper");
const { successResponse, errorResponse } = require("../helpers/response");

const getOptionsHistory = async (req, res) => {

  try {
    let getdata = req.body.formvalue;
    // console.log("getdata--",getdata);
    
    let matchQ = [{ $ne: '' }, { $regex: '', $options: 'i' }, { $regex: '', $options: 'i' }, { $regex: '', $options: 'i' }, { $regex: '', $options: 'i' }];
    matchQ.predictionStatus = 1;
    if (getdata.fromdate != '' && getdata.todate != '') {
      var fromDate = new Date(req.body.formvalue.fromdate);
      var toDate = new Date(req.body.formvalue.todate);
      var dateFilter = new Date(fromDate.setTime(fromDate.getTime() + 5.5 * 60 * 60 * 1000));
      var nextDateFilter = new Date(toDate.setTime(toDate.getTime() + 29.49 * 60 * 60 * 1000));
      matchQ[0] = {
        "$gte": dateFilter,
        "$lt": nextDateFilter
      }
    }

    if (getdata.username != '') {
      matchQ[1] = { $regex: getdata.username, $options: 'i' };
    }

    if (getdata.callputs != '') {
      matchQ[2] = { $regex: getdata.callputs, $options: 'i' };
    }

    if (getdata.pairs != '') {
      matchQ[3] = { $regex: getdata.pairs, $options: 'i' };
    }
    let limit = req.body.limit ? parseInt(req.body.limit) : 10;
    let offset = req.body.offset ? parseInt(req.body.offset) : 0

    const getHistoryData = await OptionsGame.aggregate([
      {
        $match: {
          dateTime: matchQ[0],
          direction: matchQ[2],
          pairName: matchQ[3]
        }
      },
      {
        $lookup: {
          from: "Users",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
                $or: [
                  { username: matchQ[1] },
                  { uid: matchQ[1] }
                ]
              }
            }
          ],
          as: 'result'
        }
      },
      { $unwind: "$result" },
      { $sort: { _id: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]);

    // console.log("getHistoryData==",getHistoryData);
    

    const getHistoryDataLength = await OptionsGame.aggregate([
      {
        $match: {
          dateTime: matchQ[0],
          direction: matchQ[2],
          pairName: matchQ[3]
        }
      },
      {
        $lookup: {
          from: "Users",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userId'] },
                $or: [
                  { username: matchQ[1] },
                  { uid: matchQ[1] }
                ]
              }
            }
          ],
          as: 'result'
        }
      },
      { $unwind: "$result" },
    ]);

    if (getHistoryData) {
      res.send({ status: true, data: getHistoryData , total : getHistoryDataLength.length})
    } else {
      res.send({ status: false, data: [], total : 0 })
    }
  } catch (error) {
    console.log("error: ", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

const getPairs = async (req, res) => {
  
  try {
    const CurrencySymbols = await queryHelper.findoneData(Currency, { currencySymbol: "USDT" });
    
    const CurrencyId = CurrencySymbols.msg._id;

    const activePairList = await queryHelper.findData(Pairs, { toCurrencyId: ObjectId(CurrencyId), optionsStatus:1 }, {pair: 1 }, {});
    
    if (activePairList && activePairList.msg) {
      const activePairs = activePairList && activePairList.msg;
      res.send({ status: true, data: activePairs });
    } else {
      res.send({ status: false, data: [] });
    }
  } catch (error) {
    console.log("error: ", error);
    res.send({ status: false, message: "Something went wrong! Please try again someother time" });
  }
}

module.exports = {
  getOptionsHistory,
  getPairs
}