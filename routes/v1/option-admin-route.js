const express = require('express');
const router = express.Router();
const { AdminController } = require("../../controllers");
const commonHelper = require("../../helpers/common.helper");

router.route("/getOptionsHistory").post(commonHelper.tokenMiddlewareAdmin,AdminController.getOptionsHistory);
router.route("/getPairs").get(commonHelper.tokenMiddlewareAdmin,AdminController.getPairs);

module.exports = router;