const Config = require("../config/config");

exports.afterDbConnected = () => {
    if (Config.sectionStatus.optionsGameCron !== "Disable") {
        require("./optionsGame.cron");
    }
};
