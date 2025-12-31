var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userActivitySchema = new Schema({
	"userId"   	: {type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users'},
	"ip"   		: {type:String},
	"browser"   : {type:String},
	"type"      : {type:String},
	"comment"   : {type:String},
	"ipDetails" : {type:String, default: ""},
	"dateTime"  : {type: Date, default: Date.now},
});
module.exports = mongoose.model('UserActivity', userActivitySchema, 'UserActivity')