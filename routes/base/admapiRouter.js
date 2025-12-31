const express = require('express');
const router = express.Router();
const optionsGamingAdminRoute = require("../v1/option-admin-route");

const defaultRoutes = [
    {
        path: '/v1/options_game',
        route: optionsGamingAdminRoute
    }
]
defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})
module.exports = router;
