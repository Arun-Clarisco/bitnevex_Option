const Mongoose = require('mongoose');
const schema = Mongoose.Schema;
const model = Mongoose.model;
const ObjectId = Mongoose.Schema.Types.ObjectId;

const optionsGameBalanceUpdation = new schema({
    userId: {
        type: String,
        index: true,
        default: '',
        ref: 'Users'
    },
    currencyId: {
        type: ObjectId,
        ref: 'Currency'
    },
    difference: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    oldBalance: {
        type: Number,
        default: 0
    },
    holdAmount: {
        type: Number,
        default: 0,
    },
    addedAmount: {
        type: Number,
        default: 0,
    },
    lastId: {
        type: String,
        default: ''
    },
    type: {
        type: String
    },
    dateTime: {
        type: Date,
        default: Date.now
    }
});

module.exports = Mongoose.model('OptionsGameBalanceUpdation', optionsGameBalanceUpdation, 'OptionsGameBalanceUpdation')