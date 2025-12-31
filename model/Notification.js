var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var notificationSchema = new Schema({
	"title": { type: String , default: ''},
	"message": { type: String, default: '' },
	"status": { type: Number, default: 0 },
	"userId": { type: mongoose.Schema.Types.ObjectId, index: true, ref: 'Users' },
	"activity": {type:Object, default:{}},
	"detail": {type:Object, default:{}},
	"type": { type: String },
	"notificationType": { type: String },
	"link": { type: String },
	"userList": [{ usersId: { type: mongoose.Schema.Types.ObjectId, unique:true },"status": { type: Number, default: '1' } }],
	"createdDate": { type: Date, default: Date.now }
});
module.exports = mongoose.model('Notification', notificationSchema, 'Notification')