var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var emailTemplateSchema = new Schema({
  "subject": {type: String,default:""},
  "content": {type: String,default:""},
  "hint": {type: String, index: true, unique: true, default:""},
  "status" : {type: Number, default: 1},
  "createdOn": { type: Date, default: Date.now }
});
module.exports = mongoose.model('EmailTemplate', emailTemplateSchema, 'EmailTemplate');