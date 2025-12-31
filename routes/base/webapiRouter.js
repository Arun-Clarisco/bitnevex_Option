const express = require('express');
const router = express.Router();
const optionsGamingRoute = require("../v1/options-game.route");
const defaultRoutes = [
    {
        path: '/v1/options_game',
        route: optionsGamingRoute
    },
]
defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
module.exports = router;
