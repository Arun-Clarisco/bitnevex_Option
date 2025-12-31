var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TransactionsSchema = new Schema({
  "userId"               : { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users' },
  "currencyId"           : { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Currency' },
  "walletCurrencyId"     : { type: mongoose.Schema.Types.ObjectId, ref: 'CurrencySymbol' },
  "paymentId"            : { type: mongoose.Schema.Types.ObjectId, ref: 'P2PAllPayments' },
  "address"              : { type:String, default: "" },
  "type"                 : { type:String, default: "" },
  "tag"                  : { type:String, default: "" },
  "txnId"                : { type:String, default: "" },
  "attachment"           : { type:String, default: "" },
  "amount"               : { type: Number, default: 0 },
  "usdAmount"            : { type: Number, default: 0 },
  "fees"                 : { type: Number, default: 0 },
  "receiveAmount"        : { type: Number, default: 0 },
  "status"               : { type: Number, index: true, default: 3 }, //{0-pending, 1-completed, 2-cancelled, 3-user side pending },
  "rejectReason"         : { type:String, default: "" },
  "moveCur"              : { type:String, default: "" },
  "createdDate"          : { type: Date, default: Date.now },
  "adminMove"            : { type:String, default: '' },
  "adminVerify"          : { type:String, default: '' },   //new key
  "autoWithdraw"         : { type: Number, default: 0 },
  "fundsMove"            : { type:String, default: '' },
  "depositType"          : { type:String, default: 'Wallet Balance' },
	"bonusData"            : {type: Object, default: { status: 0, tradeQty: 0, bonusGiven: 0, bonusValue: 0, bonusCurrency: 'INR' }},
  "referenceId"          : { type:String, lowercase: true, required: true, index: true, unique: true }
});
TransactionsSchema.pre('validate', function (next) {
	const txn = this;
  let curDate = new Date();
  let txnRef = curDate.getFullYear()+'/'+(curDate.getMonth()+1)+'/'+curDate.getDate()+' '+curDate.getHours()+':'+curDate.getMinutes();
  let number = curDate.getSeconds();
  let checkNumber = number/5;
  checkNumber = checkNumber.toString().split('.');
  if(checkNumber.length > 1) {
    number = number - (('0.'+checkNumber[1])* 5);
  }
  txnRef = txnRef + ':' + number;
  txnRef = txnRef + '-' + txn.userId.toString();
  if(txn.txnId) {
    txnRef = txnRef + '-' + txn.txnId.toString();
  }
	txn.referenceId = txnRef;
	next();
});
module.exports = mongoose.model('Transactions', TransactionsSchema, 'Transactions')