var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const BALANCE_FACTOR = 10000000000;

/* ---------- getter ---------- */
function balanceGetter(value) {
	if (typeof value !== "number") return value;
	return value / BALANCE_FACTOR;
}


var walletSchema = new Schema({
	"userId": { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users' },
	"currencyId": { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'CurrencySymbol' },
	"amountTradeFee": { type: Number, default: 0 },
	// spot & main
	"amount": { type: Number, default: 0, get: balanceGetter },
	"hold": { type: Number, default: 0, get: balanceGetter },
	// usd-m / perpetual
	"perpetualAmount": { type: Number, default: 0, get: balanceGetter },
	"perpetualHold": { type: Number, default: 0, get: balanceGetter },
	// ico
	"icoAmount": { type: Number, default: 0, get: balanceGetter },
	// staking
	"stakingAmount": { type: Number, default: 0, get: balanceGetter },
	"stakingHold": { type: Number, default: 0, get: balanceGetter },
	// p2p
	"p2pAmount": { type: Number, default: 0, get: balanceGetter },
	"p2pHold": { type: Number, default: 0, get: balanceGetter },
	// loan
	"cryptoLoanAmount": { type: Number, default: 0, get: balanceGetter },
	"cryptoLoanHold": { type: Number, default: 0, get: balanceGetter },
	//** Bear & Bull */
	"gamePredictionAmount": { type: Number, default: 0, get: balanceGetter },
	"gamePredictionHold": { type: Number, default: 0, get: balanceGetter },
	//** Simple-earning */
	"simpleEarnAmount": { type: Number, default: 0, get: balanceGetter },
	"simpleEarnHold": { type: Number, default: 0, get: balanceGetter },
	//**Options */
	"optionsGameAmount": { type: Number, default: 0, get: balanceGetter },
	"optionsHold": { type: Number, default: 0, get: balanceGetter },

	//**Alpha Bot */
	"alphaBotAmount": { type: Number, default: 0, get: balanceGetter },
	"alphaBotHold": { type: Number, default: 0, get: balanceGetter }
});

const amounts = ["amount", "hold",
	"perpetualAmount", "perpetualHold",
	"icoAmount", "stakingAmount",
	"stakingHold", "p2pAmount", "p2pHold",
	"cryptoLoanAmount", "cryptoLoanHold",
	"gamePredictionAmount", "gamePredictionHold",
	"simpleEarnAmount", "simpleEarnHold",
	"optionsGameAmount", "optionsHold",
	"alphaBotAmount", "alphaBotHold"
]
walletSchema.pre("save", function (next) {
	if (this.isModified("amount")) {
		this.amount = Math.round(this.amount * BALANCE_FACTOR);
		console.log(this.amount);
	}
	next();
});

function scaleInc(next) {
	const update = this.getUpdate();

	if (update?.$set) {
		for (const key in update.$set) {
			if (amounts.includes(key)) {
				update.$set[key] = Math.round(update.$set[key] * BALANCE_FACTOR);
			}
		}
	}

	if (update?.$inc) {
		for (const key in update.$inc) {
			update.$inc[key] = Math.round(update.$inc[key] * BALANCE_FACTOR);
		}
	}

	this.setUpdate(update);
	next();
}

walletSchema.pre("findOneAndUpdate", scaleInc);
walletSchema.pre("updateOne", scaleInc);
walletSchema.pre("updateMany", scaleInc);


walletSchema.set("toJSON", { getters: true });
walletSchema.set("toObject", { getters: true });


module.exports = mongoose.model('UserWallet', walletSchema, 'UserWallet');