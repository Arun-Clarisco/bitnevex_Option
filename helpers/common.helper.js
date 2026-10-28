const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const queryHelper = require("./query.helper");
const config = require("../config/config");
const { decryptRequestPayload } = require("./cryptoJs.helper");
const CryptoJS = require("crypto-js");
//** db collection imported */
const UserWallet = mongoose.model("UserWallet");
const Users = mongoose.model("Users");
const Notification = mongoose.model("Notification");
const OptionsGameBalance = mongoose.model("OptionsGameBalanceUpdation");
const Admin = mongoose.model("Admin");
const AccessToken = mongoose.model("AccessToken");

let jwtTokenAdmin = config.jwtTokenAdmin;
let siteDeploy = 0;
let jwtTokenCustomers = config.jwtTokenCustomers;
let usdtRate = { changePer: 0, usdtType: 0, changeValue: 0 };


exports.getSiteDeploy = () => {
  return siteDeploy;
};

exports.userNotification = async function (userId, content, content1) {
  return true;
  const userlogdata = { userId: userId, content: content, content1: content1 };
  userAppPushNotification(userId, content1);
  await queryHelper.insertData(Notification, userlogdata);
  return true;
};

exports.activity = function (req) {
  try {
    let ua = req?.headers?.["user-agent"] || "";
    ua = ua.toLowerCase();
    let browser = "";
    if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/chrome/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua)) browser = "Safari";
    else if (/msie/i.test(ua)) browser = "msie";
    else browser = "unknown";

    let ip = "";
    if (req != "") {
      ip =
        typeof req.headers["x-forwarded-for"] == "string"
          ? req.headers["x-forwarded-for"]
          : typeof req.headers["cf-connecting-ip"] == "string"
            ? req.headers["cf-connecting-ip"]
            : "";
    }
    return { ip: ip, browser: browser };
  } catch (error) {
    console.error("getbalance error:", error);
    throw error;
  }

};

exports.getbalance = async function (userId, currencyId) {
  try {
    let resdata1 = await queryHelper.findoneData(
      UserWallet,
      {
        userId: mongoose.mongo.ObjectId(userId),
        currencyId: mongoose.mongo.ObjectId(currencyId),
      },
      {}
    );
    if (resdata1.status) {
      return resdata1.msg;
    } else {
      const createWallet = {
        userId: mongoose.mongo.ObjectId(userId),
        currencyId: mongoose.mongo.ObjectId(currencyId),
        amount: 0,
        hold: 0,
        p2pAmount: 0,
        p2pHold: 0,
        perpetualAmount: 0,
        perpetualHold: 0,
      };
      await queryHelper.insertData(UserWallet, createWallet);
      return createWallet;
    }
  } catch (error) {
    console.error("getbalance error:", error);
    throw error;
  }

};

const generateHash = (payloadData) => {
  try {
    if (!payloadData || Object.keys(payloadData).length === 0) return "";
    const stringifiedPayload = JSON.stringify(payloadData);
    return CryptoJS.SHA512(stringifiedPayload).toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.log({ error })
    return null;
  }

};

exports.encMiddleWare = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return next();
    };
    if (req.body && Object.keys(req.body).length > 0) {
      const { keyId, hash, payload } = req.body;

      if (!payload || !hash || !keyId) {
        return res.status(400).json({ status: false, message: "Missing encryption fields in request body." });
      };

      const decrypted = await decryptRequestPayload(keyId, payload);
      if (!decrypted) {
        return res.status(400).json({ status: false, message: "Failed to decrypt the payload." });
      };

      const calculatedHash = generateHash(decrypted);
      if (calculatedHash !== hash) {
        return res.status(400).json({ status: false, message: "Hash mismatch. Data integrity check failed." });
      };

      req.body = decrypted;
      next();

    } else {
      return res.status(403).json({ status: false, message: "Decryption Failed!" });
    };
  } catch (error) {
    return res.status(403).json({ status: false, message: "Decryption Failed!" });
  };
};

exports.middlewareApi = async function (request, res, next) {
  try {
    var file = path.join(__dirname, "../public/settings/settings.json");
    fs.readFile(file, function (err, data) {
      if (err) {
        return res.json({ status: false, message: "Something went wrong" });
      }
      const datas = JSON.parse(data);
      if (datas && datas.app) {
        if (datas.app.api == "enable" && datas.deploy == "no") {
          next();
        } else if (datas.app.api == "disable" && datas.app.message != "") {
          return res.json({ status: false, message: datas.app.message });
        } else if (datas.deploy == "yes" && datas.message != "") {
          return res.json({ status: false, message: datas.message });
        } else {
          return res.json({ status: false, message: "Something went wrong" });
        }
      } else {
        return res.json({ status: false, message: "Something went wrong" });
      }
    });
  } catch (error) {
    console.error("middlewareApi error:", error);
    return res.json({ status: false, message: "Something went wrong" });
  }

};

exports.middlewareAppApi = async function (request, res, next) {
  try {
    var file = path.join(__dirname, "../public/settings/settings.json");
    fs.readFile(file, function (err, data) {
      if (err) {
        return res.json({ status: false, message: "Something went wrong" });
      }
      const datas = JSON.parse(data);
      if (datas && datas.app) {
        if (datas.app.api == "enable" && datas.deploy == "no") {
          next();
        } else if (datas.app.api == "disable" && datas.app.message != "") {
          return res.json({ status: false, message: datas.app.message });
        } else if (datas.deploy == "yes" && datas.message != "") {
          return res.json({ status: false, message: datas.message });
        } else {
          return res.json({ status: false, message: "Something went wrong" });
        }
      } else {
        return res.json({ status: false, message: "Something went wrong" });
      }
    });
  } catch (error) {
    console.error("middlewareApi error:", error);
    return res.json({ status: false, message: "Something went wrong" });
  }

};

exports.middlewareAdmapi = async function (request, res, next) {
  try {
    var file = path.join(__dirname, "../public/settings/settings.json");
    fs.readFile(file, function (err, data) {
      if (err) {
        return res.json({ status: false, message: "Something went wrong" });
      }
      const datas = JSON.parse(data);
      if (datas && datas.adm) {
        if (datas.adm.api == "enable" && datas.deploy == "no") {
          next();
        } else if (datas.adm.api == "disable" && datas.adm.message != "") {
          return res.json({ status: false, message: datas.adm.message });
        } else if (datas.deploy == "yes" && datas.message != "") {
          return res.json({ status: false, message: datas.message });
        } else {
          return res.json({ status: false, message: "Something went wrong" });
        }
      } else {
        return res.json({ status: false, message: "Something went wrong" });
      }
    });
  } catch (error) {
    console.error("middlewareApi error:", error);
    return res.json({ status: false, message: "Something went wrong" });
  }

};

exports.middlewareWebapi = async function (request, res, next) {
  try {
    var file = path.join(__dirname, "../public/settings/settings.json");
    fs.readFile(file, function (err, data) {
      if (err) {
        return res.json({ status: false, message: "Something went wrong" });
      }
      const datas = JSON.parse(data);
      if (datas && datas.web) {
        if (datas.web.api == "enable" && datas.deploy == "no") {
          next();
        } else if (datas.web.api == "disable" && datas.web.message != "") {
          return res.json({ status: false, message: datas.web.message });
        } else if (datas.deploy == "yes" && datas.message != "") {
          return res.json({ status: false, message: datas.message });
        } else {
          return res.json({ status: false, message: "Something went wrong" });
        }
      } else {
        return res.json({ status: false, message: "Something went wrong" });
      }
    });
  } catch (error) {
    console.error("middlewareApi error:", error);
    return res.json({ status: false, message: "Something went wrong" });
  }

};


exports.tokenMiddlewareAdmin = async function (request, res, next) {
  try {
    if (!request.headers.authorization) {
      return res.status(401).send("unauthorized");
    }
    let token = request.headers.authorization.split(" ")[1];
    if (token === "null") {
      return res.status(401).send("unauthorized");
    } else {
      let payload = jwt.verify(token, jwtTokenAdmin);
      if (!payload) {
        return res.status(401).send("unauthorized");
      }
      const userData = await queryHelper.findoneData(
        Admin,
        { _id: mongoose.Types.ObjectId(payload.subject), status: 1 },
        {}
      );
      if (userData.status) {
        request.userId = payload.subject;
        next();
      } else {
        return res.status(401).send("unauthorized");
      }
    }
  } catch (e) {
    console.log("tokenMiddlewareAdmin", e, request.headers.authorization);
    return res.status(401).json({ status: false, message: "unauthorized" });
  }

};

exports.tokenMiddlewareCustomers = async (request, res, next) => {
  try {
    if (!request.headers.authorization) {
      return res.status(401).json({ status: false, message: "unauthorized" });
    }
    let token = request.headers.authorization.split(" ")[1];
    if (token === "null") {
      return res.status(401).json({ status: false, message: "unauthorized" });
    } else {
      let payload = jwt.verify(token, jwtTokenCustomers);
      if (!payload) {
        return res.status(401).json({ status: false, message: "unauthorized" });
      }
      const userData = await queryHelper.findoneData(
        Users,
        {
          _id: mongoose.Types.ObjectId(payload.subject),
          status: 1,
          securityKey: payload.securityKey,
        },
        {}
      );
      if (userData.status) {
        if (userData.msg.status === 0) {
          return res
            .status(401)
            .json({
              status: false,
              message: "Your account is disabled by admin",
            });
        }
        request.reqUserData = userData.msg;
        request.userId = payload.subject;
        request.securityKey = payload.securityKey;
        next();
      } else {
        return res.status(401).json({ status: false, message: "unauthorized" });
      }
    }
  } catch (e) {
    console.log("tokenMiddlewareCustomers", e, request.headers.authorization);
    return res.status(401).json({ status: false, message: "unauthorized" });
  }
};

exports.updateUserBalance = async function (
  userId,
  currencyId,
  amount,
  lastId,
  type,
  extdata = {}
) {
  try {
    const userWalletFindData = {
      userId: mongoose.mongo.ObjectId(userId),
      currencyId: mongoose.mongo.ObjectId(currencyId),
    }
    const wallet_data = await queryHelper.findoneData(
      UserWallet,
      userWalletFindData,
      {}
    );
    let balance = 0;
    if (wallet_data.status && wallet_data.msg) {
      if (type == 'p2pWallet') {
        balance = wallet_data.msg.p2pAmount;
      } else if (type == 'usdmWallet') {
        balance = wallet_data.msg.perpetualAmount;
      } else {
        balance = wallet_data.msg.amount;
      }
    } else {
      let createwallet = {
        userId: mongoose.mongo.ObjectId(userId),
        currencyId: mongoose.mongo.ObjectId(currencyId),
        p2pAmount: 0,
        p2pHold: 0,
        perpetualAmount: 0,
        perpetualHold: 0,
        amount: 0,
        hold: 0,
      };
      await queryHelper.insertData(UserWallet, createwallet);
      balance = 0;
    }

    const updations = {
      userId: mongoose.mongo.ObjectId(userId),
      currencyId: mongoose.mongo.ObjectId(currencyId),
      amount: roundValues(amount, 8),
      difference: roundValues(amount - balance, 8),
      oldBalance: roundValues(balance, 8),
      lastId: lastId,
      type: type,
      notes: extdata.notes ? JSON.stringify(extdata.notes) : "",
    };
    let balanceId;
    let balanceUpdColl;

    if (type == 'p2pWallet') {
      balanceUpdColl = P2PBalanceUpdation;
    } else if (type == 'usdmWallet') {
      balanceUpdColl = USDMBalanceUpdation;
    } else {
      balanceUpdColl = BalanceUpdation;
    }

    balanceId = await queryHelper.insertData(balanceUpdColl, updations);

    let updBalData = {}
    if (type == 'p2pWallet') {
      updBalData = { p2pAmount: +roundValues(+amount, 8) };
    } else if (type == 'usdmWallet') {
      updBalData = { perpetualAmount: +roundValues(+amount, 8) };
    }
    else {
      updBalData = { amount: +roundValues(+amount, 8) };
    }

    await queryHelper.updateData(
      UserWallet,
      "one",
      userWalletFindData,
      updBalData
    );

    if (balanceId && balanceId.msg && balanceId.msg._id) {
      return balanceId.msg._id;
    }
    else {
      return false;
    }
  } catch (error) {
    console.error("updateUserBalance error:", error);
    throw error;
  }

};
//============Game Wallet Updation====================//
exports.updateOptionsgameWalletAmount = async function (
  userId,
  currencyId,
  amount,
  lastId,
  type
) {
  try {
    const wallet_data = await queryHelper.findoneData(
      UserWallet,
      {
        userId: mongoose.mongo.ObjectId(userId),
        currencyId: mongoose.mongo.ObjectId(currencyId),
      },
      {}
    );
    let balance = 0;
    if (wallet_data.status) {
      balance = wallet_data.msg.optionsGameAmount;
    }
    const updations = {
      userId: mongoose.mongo.ObjectId(userId),
      currencyId: mongoose.mongo.ObjectId(currencyId),
      amount: roundValues(amount, 8),
      difference: roundValues(amount - balance, 8),
      oldBalance: roundValues(balance, 8),
      lastId: lastId,
      type: type,
    };
    await queryHelper.insertData(OptionsGameBalance, updations);
    await queryHelper.updateData(
      UserWallet,
      "one",
      {
        userId: mongoose.mongo.ObjectId(userId),
        currencyId: mongoose.mongo.ObjectId(currencyId),
      },
      { optionsGameAmount: +roundValues(+amount, 8) }
    );
  } catch (error) {
    console.error("updateOptionsgameWalletAmount error:", error);
    throw error;
  }

};

let roundValues = (exports.roundValues = (numIn, precision = 2) => {
  numIn += "";                                            // To cater to numric entries
  var sign = "";                                           // To remember the number sign
  numIn.charAt(0) == "-" && (numIn = numIn.substring(1), sign = "-"); // remove - sign & remember it
  var str = numIn.split(/[eE]/g);                        // Split numberic string at e or E
  if (str.length < 2) return sign + numIn;                   // Not an Exponent Number? Exit with orginal Num back
  var power = str[1];                                    // Get Exponent (Power) (could be + or -)

  var deciSp = 1.1.toLocaleString().substring(1, 2);  // Get Deciaml Separator
  str = str[0].split(deciSp);                        // Split the Base Number into LH and RH at the decimal point
  var baseRH = str[1] || "",                         // RH Base part. Make sure we have a RH fraction else ""
    baseLH = str[0];                               // LH base part.

  if (power >= 0) {   // ------- Positive Exponents (Process the RH Base Part)
    if (power > baseRH.length) baseRH += "0".repeat(power - baseRH.length); // Pad with "0" at RH
    baseRH = baseRH.slice(0, power) + deciSp + baseRH.slice(power);      // Insert decSep at the correct place into RH base
    if (baseRH.charAt(baseRH.length - 1) == deciSp) baseRH = baseRH.slice(0, -1); // If decSep at RH end? => remove it

  } else {         // ------- Negative exponents (Process the LH Base Part)
    num = Math.abs(power) - baseLH.length;                               // Delta necessary 0's
    if (num > 0) baseLH = "0".repeat(num) + baseLH;                       // Pad with "0" at LH
    baseLH = baseLH.slice(0, power) + deciSp + baseLH.slice(power);     // Insert "." at the correct place into LH base
    if (baseLH.charAt(0) == deciSp) baseLH = "0" + baseLH;                // If decSep at LH most? => add "0"

  }
  // Rremove leading and trailing 0's and Return the long number (with sign)
  return parseFloat(sign + (baseLH + baseRH).replace(/^0*(\d+|\d+\.\d+?)\.?0*$/, "$1")).toFixed(precision);
})

exports.cronCheck = async function (data = {}, callback) {
  try {
    var file = path.join(__dirname, '../public/settings/settings.json');
    return fs.readFile(file, function (err, data) {
      if (err) {
        callback({ status: false });
      }
      const datas = JSON.parse(data);
      if (datas && datas.cron) {
        if (datas.cron == "enable") {
          callback({ status: true });
        }
        else {
          callback({ status: false });
        }
      }
      else {
        callback({ status: false });
      }
    });
  } catch (error) {
    console.error("cronCheck error:", error);
    return callback({ status: false });
  }

};

exports.OptionsGameBalanceUpdation = async (
  userId,
  currencyId,
  amount,
  addedAmt,
  balance,
  differ,
  lastId,
  holdAmount,
  type,
  gameStatusStr,
  previousHoldAmount,
  predictionAmt,
) => {
  try {
    let balanceUpdation;
    //** Game-prediction-balance-updation db will be created here */
    balanceUpdation = {
      userId: mongoose.mongo.ObjectId(userId),
      currencyId: mongoose.mongo.ObjectId(currencyId),
      amount: roundValues(amount, 2),
      difference: roundValues(differ, 2),
      oldBalance: roundValues(balance, 2),
      // holdAmount: roundValues(holdAmount, 2),
      holdAmount: holdAmount,
      addedAmount: roundValues(addedAmt, 2),
      lastId: lastId,
      type: type,
    };

    //** Game prediction updation create */
    const balanceUpdate = await OptionsGameBalance.create(balanceUpdation);
    if (balanceUpdate) {
      if (previousHoldAmount > 0) {
        let updateHoldAmt = previousHoldAmount - predictionAmt
        let updateCurrentHoldAmt = parseFloat(updateHoldAmt);

        if (gameStatusStr === 'Win') {
          await UserWallet.findOneAndUpdate({ userId: mongoose.mongo.ObjectId(userId), currencyId: mongoose.mongo.ObjectId(currencyId) }, { $set: { optionsGameAmount: amount, optionsHold: updateCurrentHoldAmt } })
        } else {
          await UserWallet.findOneAndUpdate({ userId: mongoose.mongo.ObjectId(userId), currencyId: mongoose.mongo.ObjectId(currencyId) }, { $set: { optionsGameAmount: amount, optionsHold: updateCurrentHoldAmt } })
        }
      }
    }
    return balanceUpdate;
  } catch (error) {
    console.log("OptionsGameBalanceUpdation err: ", error);
  }
};