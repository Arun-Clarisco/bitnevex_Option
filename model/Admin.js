var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var adminSchema = new Schema({
	"email": { type: String, lowercase: true, required: true, index: true, unique: true },
	"name": { type: String },
	"password": { type: String },
	"profile": { type: String, default: '' },
	"role": { type: Number, default: 1 },
	"roles": { type: Object, default: {} },
	"otp": { type: Number, default: 0 },
	"OTPTime": { type: Date, default: Date.now },
	"forgotId": { type: String, default: 0 },
	"status": { type: Number, default: 1 },
	"forgotDate": { type: Date, default: Date.now },
	"dateTime": { type: Date, default: Date.now },
	"attempt": { type: Number, default: 0 },
	"attemptTime": { type: Date, default: null }
});
module.exports = mongoose.model('Admin', adminSchema, 'Admin');