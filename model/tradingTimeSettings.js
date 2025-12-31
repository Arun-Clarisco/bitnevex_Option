var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tradingTimeSchema = new Schema({
    "predictionTiming": { type: Number },
    "optionsTiming": { type: Number },
    "predictionFlatFee": { type: Number },
    "optionsFlatFee": { type: Number },
    "predictionMinimumAmount": { type: Number },
    "optionsMinimumAmount": { type: Number },
})

module.exports = mongoose.model('Trading Time Settings', tradingTimeSchema, 'Trading Time Settings')