const mongoose = require("mongoose");
const fs = require("fs");
const config = require("../config/config");

if (config.caPath != '') {
    const certFileBuf = fs.readFileSync(__dirname + config.caPath);
    mongoose
        .connect(config.dbconnection, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
            sslCA: certFileBuf
        })
        .then(() => console.log(config.dbName + " Mongo DB Connected"))
        .catch((err) => console.error(err));
} else {
    mongoose
        .connect(config.dbconnection, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
        .then(() => console.log(config.dbName + " Mongo DB Connected"))
        .catch((err) => console.error(err));
};

mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open');
    require('../cronSocket/initialLoad').afterDbConnected();
});
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});


require("./Users");
require("./OptionsGame");
require("./OptionsGameBalanceUpdation");
require("./UserWallet");
require("./Currency");
require("./Transactions");
require("./Notification");
require("./UserActivity");
require("./EmailTemplate");
require("./SiteSettings");
require("./Pairs");
require("./CurrencySymbol");
require("./Competion");
require('./GamePredictionPairs');
require('./Admin');
require('./tradingTimeSettings');


