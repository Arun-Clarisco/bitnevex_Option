var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccessToken = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    token: {
        type: String,
    },
    dateTime: {
        type: Date,
        default: Date.now
    },
});
module.exports = mongoose.model('AccessToken', AccessToken, 'AccessToken')