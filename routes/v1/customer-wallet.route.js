const express = require('express');
const router = express.Router();
const rateLimit = require("express-rate-limit");
const commonHelper = require("../../helpers/common.helper");
const { UsdtPerpetualController, customerWalletController } = require("../../controllers");
const limiter6 = rateLimit({
    windowMs: 5 * 1000,
    max: 1,
    message: { status: false, message: "Too many requests created from this IP, please try again after an 5 seconds"},
    statusCode: 200
});

// router.route('/submitTransfer').post();
router.post('/submitTransfer', limiter6, commonHelper.tokenMiddlewareCustomers, customerWalletController.submitTransfer);    
module.exports = router;