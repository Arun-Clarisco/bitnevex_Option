var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var optionsGameSchema = new Schema({
  "userId" : { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users' },
  "currencyId"  : { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Currency'},
  "predictionStatus": { type: Number, default: 0 },
  "feeAmount" : { type: Number, default: 0 },
  "winAmt": { type: Number, default: 0 },
  "lossAmt": { type: Number, default: 0 },
  "predictionAmt": { type: Number },
  "direction":{ type: String },
  "multiplier": { type: Number },
  "marketprice": { type: Number },
  "exitMarketPrice" : { type: Number },
  "bustprice": { type: Number },
  "pairName" : {type : String },
  "actualpredictionAmt" : {type : Number},
  "competionId":{type:mongoose.Schema.Types.ObjectId,ref:"Competion"},
  "dateTime"   : {type: Date, default: Date.now},
  "isProcessing": { type: Boolean, default: false },
});

module.exports = mongoose.model('OptionsGame', optionsGameSchema, 'OptionsGame')