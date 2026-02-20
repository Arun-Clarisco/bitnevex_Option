var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var walletSchema = new Schema({
	"userId" : { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users'},
	"currencyId": { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'CurrencySymbol'}, 
	"amountTradeFee": {type: Number, default: 0},
	// spot & main
	"amount": {type: Number, default: 0},
	"hold": {type: Number, default: 0},
	// usd-m / perpetual
	"perpetualAmount": { type: Number, default: 0 },
	"perpetualHold": { type: Number, default: 0 },
	// ico
	"icoAmount": {type: Number, default: 0},
	// staking
	"stakingAmount": {type: Number, default: 0},
	"stakingHold": {type: Number, default: 0},
	// p2p
	"p2pAmount": {type: Number, default: 0},
	"p2pHold": {type: Number, default: 0},
	// loan
	"cryptoLoanAmount": {type: Number, default: 0},
	"cryptoLoanHold": {type: Number, default: 0},
	//** Bear & Bull */
	"gamePredictionAmount": {type: Number, default: 0},
	"gamePredictionHold": {type: Number, default: 0},
	//** Simple-earning */
	"simpleEarnAmount": {type: Number, default: 0},
	"simpleEarnHold": {type: Number, default: 0},
	//**Options */
	"optionsGameAmount": {type: Number, default: 0},
	"optionsHold": {type: Number, default: 0},
});
module.exports = mongoose.model('UserWallet', walletSchema, 'UserWallet')