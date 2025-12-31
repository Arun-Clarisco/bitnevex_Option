var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var competionSchema = new Schema({
    "currency"   : {type:String,default: ""},
    "prizepool" : {type:Number},
    "prizetoken" : {type:String},
    "tokensymbol" : {type:String},
    "tokenstartdate":{type:String},
    "tokenenddate": {type:String},
    "tokendescription":{type:String},
    "totalwinners":{type:Number},
    "winnerslist":[{
        rank: Number,
        prizepool: Number
    }],
    "currencyId":{type:String},
    "competitionimage":{type:String},
    "tradingdashimage":{type:String},
    "winnerstatus" :{type:String},
    "dateTime"   : {type: Date, default: Date.now},
});

module.exports = mongoose.model('Competion', competionSchema, 'Competion');