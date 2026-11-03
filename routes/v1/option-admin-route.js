const express = require("express");
const router = express.Router();
const { AdminController } = require("../../controllers");
const { encMiddleWare, tokenMiddlewareAdmin } = require("../../helpers/common.helper");
const { validate, validateObject } = require("../../helpers/validator.helper");
const { DIRECTIONS, PAIR_PATTERN } = require("../../services/options-game.services");

const historyFilters = {
    username: { type: "string", maxLength: 100, label: "Username" },
    callputs: { type: "string", enum: DIRECTIONS, label: "Calls / Puts" },
    pairs: { type: "string", pattern: PAIR_PATTERN, label: "Pair" },
    fromdate: { type: "date", label: "From date" },
    todate: { type: "date", label: "To date" },
};

const historySchema = {
    limit: { type: "integer", min: 1, max: 500, default: 10, label: "Limit" },
    offset: { type: "integer", min: 0, default: 0, label: "Offset" },
    formvalue: { type: "object", required: true, label: "Form data" },
};

// formvalue is a nested object of optional filters
const validateHistoryFilters = (req, res, next) => {
    const { error, value } = validateObject(historyFilters, req.body.formvalue);
    if (error) return res.status(400).json({ status: false, message: error });
    req.body.formvalue = value;
    next();
};

router.post("/getOptionsHistory", encMiddleWare, tokenMiddlewareAdmin, validate(historySchema), validateHistoryFilters, AdminController.getOptionsHistory);
router.get("/getPairs", tokenMiddlewareAdmin, AdminController.getPairs);

module.exports = router;
