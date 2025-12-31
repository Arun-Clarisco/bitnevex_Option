const express = require('express');
const router = express.Router();
const { PlaceBetController, customerWalletController } = require("../../controllers");
const commonHelper = require("../../helpers/common.helper");
router.route("/optionsGame").post(commonHelper.encMiddleWare, commonHelper.tokenMiddlewareCustomers, PlaceBetController.addNewPlacebit);
router.route("/userOptionsGame").post(commonHelper.tokenMiddlewareCustomers, PlaceBetController.getUserBasedPrediction);
router.route("/userClosedBet").post(commonHelper.encMiddleWare,commonHelper.tokenMiddlewareCustomers, PlaceBetController.closedBetFromUser);
router.route("/userOptionsGameWalletBalance").post(commonHelper.tokenMiddlewareCustomers, PlaceBetController.getUserGameWalletBalance);
router.route("/getCurrencySymbol").get( PlaceBetController.getCurrencySymbol);
router.route("/getCompetion").get(commonHelper.tokenMiddlewareCustomers, PlaceBetController.getCompetion);
router.route("/getAllPairs").post(commonHelper.encMiddleWare, PlaceBetController.getAllPairs);
router.route("/getSelectedPairs/:pair").get( PlaceBetController.getSelectedPairs);
router.route("/getTotalPairs").get(PlaceBetController.getTotalPairs);
router.route("/getTradeingData").get(PlaceBetController.getTradeingData);



module.exports = router;