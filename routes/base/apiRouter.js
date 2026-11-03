const express = require("express");
const router = express.Router();

router.use("/v1/options_game", require("../v1/options-game.route"));

module.exports = router;
