var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pairsSchema = new Schema({
    "marketPrice"        : { type: Number, default: 1 },
    "changePercentage"   : { type: Number, default: 0 },
    "marketStatus"       : { type: Number, default: 1 },
    "enableBuySell"      : { type: Number, default: 1 },
    "enableTradeHistory" : { type: Number, default: 1 },
    "enableVolumeStatus" : { type: Number, default: 1 },
    "lastVolume"         : { type: Number, default: 0 },
    "decimalValue"       : { type: Number, default: 8 },
    "amountDecimal"      : { type: Number, default: 0 },
    "priceDecimal"       : { type: Number, default: 0 },
    "totalDecimal"       : { type: Number, default: 4 },
    "fromCurrency"       : { type: mongoose.Schema.Types.ObjectId, ref: 'Currency'},
    "toCurrency"         : { type: mongoose.Schema.Types.ObjectId, ref: 'Currency'},
    "pair"               : { type: String, required: true},
    // index: true, unique: true
    "status"             : { type: Number, default: 1 },
    "tradeEnable"        : { type: Number, default: 1 },
    "created"            : { type: Date, default: Date.now },
    "minTrade"           : { type: Number, default: 0.01 },
    "price"              : { type: Number, default: 0 },
    "lastPrice"          : { type: Number, default: 0 },
    "usdPrice"           : { type: Number, default: 0 },
    "change"             : { type: Number, default: 0 },
    "changeValue"        : { type: Number, default: 0 },
    "volume"             : { type: Number, default: 0 },
    "volume_fromCur"     : { type: Number, default: 0 },
    "high"               : { type: Number, default: 0 },
    "low"                : { type: Number, default: 0 },
    "makerFee"           : { type: Number, default: 0 },
    "takerFee"           : { type: Number, default: 0 },
    "makerFeeWithKYC"    : { type: Number, default: 0 },
    "takerFeeWithKYC"    : { type: Number, default: 0 },
    "orderDataMin"       : { type: Number, default: 0 },
    "orderDataMax"       : { type: Number, default: 0 },
    "ohlcUpdated"        : { type: Number, default: 0 },
    "autoOrderExecute"   : { type: Number, default: 0 },
    "getOldPrice"        : { type: Number, default: 0 },
    "exchangeType"       : {
        type: String,
        default: "SPOT"
    },
    "popularPair":  { type: Number, default: 0 },
    "maxLiquidityQuantity": { type: Number, default: 0 },
    "quantityLiquidityCorrection": { type: Number, default: 0 },
    "tfhrVolLiquidityCorrection": { type: Number, default: 0 },
    "optionsStatus": { type: Number, default: 1 }
});

module.exports = mongoose.model('Pairs', pairsSchema, 'Pairs')