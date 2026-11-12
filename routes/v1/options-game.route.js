const express = require("express");
const router = express.Router();
const { PlaceBetController } = require("../../controllers");
const { tokenMiddlewareCustomers } = require("../../helpers/common.helper");
const { validate } = require("../../helpers/validator.helper");
const { userCooldown } = require("../../helpers/cooldown.helper");
const { MULTIPLIERS, DIRECTIONS, PAIR_PATTERN } = require("../../services/options-game.services");

// One place/close request per second per user, to stop double submits
const betLimiter = userCooldown(1000);

const schemas = {
    placeBet: {
        wager: { type: "number", required: true, gt: 0, maxDecimals: 8, max: 1e9, label: "Wager" },
        direction: { type: "string", required: true, enum: DIRECTIONS, label: "Direction" },
        multiplier: { type: "number", required: true, enum: MULTIPLIERS, label: "Multiplier" },
        currencyId: { type: "objectId", required: true, label: "Currency ID" },
        pair: { type: "string", required: true, pattern: PAIR_PATTERN, label: "Pair" },
        competionId: { type: "objectId", label: "Competition ID" },
    },
    closeBet: {
        predictionId: { type: "objectId", required: true, label: "Position ID" },
    },
    currency: {
        currencyId: { type: "objectId", required: true, label: "Currency ID" },
    },
    pairParam: {
        pair: { type: "string", required: true, pattern: PAIR_PATTERN, label: "Pair" },
    },
};

router.post("/optionsGame", tokenMiddlewareCustomers, betLimiter, validate(schemas.placeBet), PlaceBetController.addNewPlacebit);
router.post("/userClosedBet", tokenMiddlewareCustomers, betLimiter, validate(schemas.closeBet), PlaceBetController.closedBetFromUser);
router.post("/userOptionsGame", tokenMiddlewareCustomers, PlaceBetController.getUserBasedPrediction);
router.post("/userOptionsGameWalletBalance", tokenMiddlewareCustomers, validate(schemas.currency), PlaceBetController.getUserGameWalletBalance);
router.post("/getAllPairs", validate(schemas.currency), PlaceBetController.getAllPairs);
router.get("/getCurrencySymbol", PlaceBetController.getCurrencySymbol);
router.get("/getCompetion", tokenMiddlewareCustomers, PlaceBetController.getCompetion);
router.get("/getSelectedPairs/:pair", validate(schemas.pairParam, "params"), PlaceBetController.getSelectedPairRoute);
router.get("/getTotalPairs", PlaceBetController.getTotalPairsRoute);
router.get("/getTradeingData", PlaceBetController.getTradeingData);

module.exports = router;
