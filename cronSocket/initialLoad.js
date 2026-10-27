const Config = require("../config/config");

exports.afterDbConnected = async () => {
    if(Config && Config.sectionStatus && Config.sectionStatus.optionsGameCron !== "Disable"){
        require("./optionsGame.cron");
    }
}