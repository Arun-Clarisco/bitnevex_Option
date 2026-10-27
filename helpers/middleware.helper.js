const fs = require('fs');
const path = require('path');
let jwt = require("jsonwebtoken");
var config = require("../config/config");
const mongoose = require("mongoose");
const Users = mongoose.model("Users");
let queryHelper = require("./query.helper");
let jwtTokenCustomers = config.jwtTokenCustomers;

exports.cronCheck = async function (data = {}, callback) {
  try {
    var file = path.join(__dirname, "../public/settings/settings.json");
    return fs.readFile(file, function (err, data) {
      if (err) {
        callback({ status: false });
      }
      const datas = JSON.parse(data);
      if (datas && datas.cron) {
        if (datas.cron == "enable") {
          callback({ status: true });
        } else {
          callback({ status: false });
        }
      } else {
        callback({ status: false });
      }
    });
  } catch (error) {
    console.error("cronCheck error:", error);
    return callback({ status: false });
  }
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
    console.log("tokenMiddlewareCustomers", e, request.headers.authorization);
    return res.status(401).json({ status: false, message: "unauthorized" });
  }

};