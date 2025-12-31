var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var currencySymbolSchema = new Schema({
  "currencySymbol": {type: String, index: true, unique: true}
});

module.exports = mongoose.model('CurrencySymbol', currencySymbolSchema, 'CurrencySymbol')