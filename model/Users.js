var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
   "userIdOld": {type: String, default: "New"},
   "userId": {type: String, default: 0},
   "securityKey": {type: Number, default: 0},
   "username"   : {type:String, default: ''},
   // index: true
   // required: true,
   "otpDisable"    : {type:Number, default: 0},
   "email"    : {type:String, lowercase: true },
   "email_confirmed": {type: String, default: "0"},
   "phoneno": {type:String, default: ""},
   // unique: true
   // index: true,
   "password"   : { type: String },
   "address"    : { type: String, default: '' },
   "city"       : { type: String, default: '' },
   "zipcode"    : { type: String, default: '' },
   "state"      : { type: String, default: '' },
   "country"    : { type: String, default: '' },
   "registerOn" : {type: Date, default: Date.now},
   "updatedOn" : {type: Date, default: Date.now},
   "status"     : {type: Number, default: 0},
   "level"     : {type: Number, default: 1},
   "profileimage": { type: String, default: '' },
   "resetlink"  : {type: Number, default: 0},
   "tfaStatus": {type: Number, default: 0 },
   "tfaenablekey": {type: String, default: ''},
   "registerBonusStatus": { type: Number, default: 0 },
   "tradeDisable": { type: Number, default: 0 },
   "spotfeeDiscount": { type: Number, default: 0 },
   "withdrawDisable": { type: Number, default: 0 },
   "kycMode":{ type: String, default: "Offline"}, 
   "kycOnlineAPI": {
      aadhaarClientId: { type: String, default: 0 }
   },
   "kycV1": {
      status: { type: Number, default: 0 },
      details: { type: Object, default: {} }
   },
   "kycstatus": { type: Number, default: 3 },
   "kycStatusDetail": { 
      pan: {
         status: { type: Number, default: 3 },
         mode: { type: String, default: "Offline" },
      },
      aadhaar: {
         status: { type: Number, default: 3 },
         mode: { type: String, default: "Offline" },
      },
      selfie: {
         status: { type: Number, default: 3 },
         mode: { type: String, default: "Offline" },
      },
   },
   "kycOnline": {
      pan: {
         status: { type: Number, default: 3 },
         details: { type: Object, default: {} },
         number: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      },
      aadhaar: {
         status: { type: Number, default: 3 },
         details: { type: Object, default: {} },
         number: { type: String, default: "" },
         image: { type: String, default: "" },
         image_local: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      },
      selfie: {
         status: { type: Number, default: 3 },
         details: { type: Object, default: {} },
         image: { type: String, default: "" },
         image_local: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      },
   },
   "kycOffline": {
      pan: {
         status: { type: Number, default: 3 },
         details: { type: Object, default: {} },
         number: { type: String, default: "" },
         image: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      },      
      aadhaar: {
         status: { type: Number, default: 3 },
         details: { type: Object, default: {} },
         number: { type: String, default: 0 },
         image: { type: String, default: "" },
         image_back: { type: String, default: "" },
         image_local: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      },
      selfie: {
         status: { type: Number, default: 3 },
         image: { type: String, default: "" },
         reject_reason: { type: String, default: "" },
      }
   },

   // "kyc":{ type: Object, default: {}},
   // "firstname": {type:String, default: ''},
   // "lastname": {type:String, default: ''},

   "bankdetails": {type:Object, default:{}},
   "bankstatus": {type: Number, default: 3},
   "userBankAccount": {type:String, default:''},
   "bankApiRes": {type:Object, default: {}},
   "bankSuspendDate": {type:Date, default: Date.now},
   "bankSuspend": { type: String, default: 'active' },
   "bankSuspendReason": { type: String, default: '' },

   "forgotId"   : {type:String, default: ''},
   "forgotDate"   : {type: Date, default: Date.now},

   "otp":{ type: Number, default: 0 },
   "otpTime":{ type: Date },

   // "withdraw_otp": {type:Number,default:0},
   // "withdraw_otpTime": {type:Date },

   "userOTP": {
      oldEmail: { type: Number, default: 0 },
      oldEmailTime: { type: Date },
      oldPhone: { type: Number, default: 0 },
      oldPhoneTime: { type: Date },
      newEmail: { type: Number, default: 0 },
      newEmailTime: { type: Date },
      newPhone: { type: Number, default: 0 },
      newPhoneTime: { type: Date },
   },

   "dateTime"   : {type: Date, default: Date.now},
   "userType": {type:String, default: 'user'},
   "referUser": {type:String, default: ''},
   "referPromoter": {type:String, default: ''},
   "referCode": {type:String, default: ''},
   "referCommission": {type:Number, default: 0},
   "testUser": {type: Number, default: 0},
   "advancedTrader": {type: Number, default: 0},
   "passPortApiData": {type:Object, default: {}},
   "tradeFees":{type:Number,default:0},
   "tradeFanTknFees": {type: Number, default: 0},
   "oneSignalId": {type:String, default:''},
   "blockStatus": {type:String, default:''},
   // p2p
   "p2pblockStatus": {type:String, default:''},
   "p2pDisabled": { type: Number, default: 0 },
   // usdm
   "usdmDisabled": { type: Number, default: 1 },
   "usdmBlockReason": {type:String, default: ''},
   // lastLogin
   "lastLoginTime": {type:Date, default: Date.now},
   "lastLoginBy": {
      "from": { type: String, default: '' },
      "val": { type: String, default: '' }
   }
});

// 0- Waiting for approval
// 1- Verified
// 2- Rejected
// 3- Not verified
module.exports = mongoose.model('Users', usersSchema, 'Users')