const Mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");
const { decryptRequestPayload } = require("./cryptoJs.helper");
const config = require("../config/config");

const Users = Mongoose.model("Users");
const Admin = Mongoose.model("Admin");

const { jwtTokenAdmin, jwtTokenCustomers } = config;
const { ObjectId } = Mongoose.Types;

//** ---------- customer token ---------- */

const readCookieTokens = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("userToken="))
    .map((part) => {
      try { return decodeURIComponent(part.slice("userToken=".length)); } catch (e) { return ""; }
    })
    .filter(Boolean);

/**
 * Customer token from the auth cookie (web) or the Authorization header (apps).
 * A browser can hold two userToken cookies (a stale host-only one next to the shared-domain one),
 * so when several are sent the newest valid one wins.
 */
const getCustomerToken = (headers = {}, cookies = {}) => {
  const cookieTokens = readCookieTokens(headers.cookie);
  if (cookieTokens.length > 1) {
    let newest = null;
    let newestIat = -1;
    for (const candidate of cookieTokens) {
      try {
        const { iat = 0 } = jwt.verify(candidate, jwtTokenCustomers);
        if (iat > newestIat) { newest = candidate; newestIat = iat; }
      } catch (e) { /* invalid cookie token, ignore */ }
    }
    if (newest) return newest;
  }
  if (cookieTokens.length === 1) return cookieTokens[0];
  if (cookies && cookies.userToken) return cookies.userToken;
  const auth = headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    return token && token !== "null" ? token : null;
  }
  return null;
};

/**
 * Verifies a customer token the same way the main API does: a valid JWT whose
 * securityKey still matches the user (the key changes on logout / new login).
 * Returns { user, securityKey } or null.
 */
const resolveCustomer = async (token) => {
  if (!token || token === "null") return null;
  let payload;
  try {
    payload = jwt.verify(token, jwtTokenCustomers);
  } catch (e) {
    return null;
  }
  if (!payload || !payload.subject || !payload.securityKey || !ObjectId.isValid(payload.subject)) return null;
  try {
    const user = await Users.findOne({ _id: ObjectId(payload.subject), status: 1, securityKey: payload.securityKey }).lean();
    return user ? { user, securityKey: payload.securityKey } : null;
  } catch (e) {
    return null; // malformed claims (e.g. securityKey of the wrong type)
  }
};

exports.tokenMiddlewareCustomers = async (req, res, next) => {
  try {
    const resolved = await resolveCustomer(getCustomerToken(req.headers, req.cookies));
    if (!resolved) return res.status(401).json({ status: false, message: "unauthorized" });
    req.reqUserData = resolved.user;
    req.userId = String(resolved.user._id);
    req.securityKey = resolved.securityKey;
    next();
  } catch (e) {
    console.log("tokenMiddlewareCustomers", e.message);
    return res.status(401).json({ status: false, message: "unauthorized" });
  }
};

/**
 * Socket auth: token from the handshake cookie, handshake query or the event payload.
 * Returns the user id string, or null when the socket is not logged in.
 */
exports.resolveSocketUser = async (socket, data = {}) => {
  const handshake = socket.handshake || {};
  const token = getCustomerToken(handshake.headers || {}, {})
    || (handshake.query && handshake.query.token)
    || (data && typeof data.token === "string" ? data.token : null);
  const resolved = await resolveCustomer(token);
  return resolved ? String(resolved.user._id) : null;
};

//** ---------- admin token ---------- */

exports.tokenMiddlewareAdmin = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    const token = auth && auth.split(" ")[1];
    if (!token || token === "null") return res.status(401).send("unauthorized");
    const payload = jwt.verify(token, jwtTokenAdmin);
    if (!payload || !ObjectId.isValid(payload.subject)) return res.status(401).send("unauthorized");
    const admin = await Admin.exists({ _id: ObjectId(payload.subject), status: 1 });
    if (!admin) return res.status(401).send("unauthorized");
    req.userId = payload.subject;
    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: "unauthorized" });
  }
};

//** ---------- encrypted payload ---------- */

const generateHash = (payloadData) => {
  if (!payloadData || Object.keys(payloadData).length === 0) return "";
  return CryptoJS.SHA512(JSON.stringify(payloadData)).toString(CryptoJS.enc.Hex);
};

exports.encMiddleWare = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) return next();

    const { keyId, hash, payload } = req.body;
    if (!payload || !hash || !keyId) {
      return res.status(400).json({ status: false, message: "Missing encryption fields in request body." });
    }
    const decrypted = decryptRequestPayload(keyId, payload);
    if (!decrypted) {
      return res.status(400).json({ status: false, message: "Failed to decrypt the payload." });
    }
    if (generateHash(decrypted) !== hash) {
      return res.status(400).json({ status: false, message: "Hash mismatch. Data integrity check failed." });
    }
    req.body = decrypted;
    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: "Decryption Failed!" });
  }
};

//** ---------- maintenance settings ---------- */

const SETTINGS_FILE = path.join(__dirname, "../public/settings/settings.json");
let settingsCache = { mtimeMs: 0, data: null };

// Re-read settings.json only when the file changes, instead of on every request
const readSettings = async () => {
  const { mtimeMs } = await fs.promises.stat(SETTINGS_FILE);
  if (!settingsCache.data || mtimeMs !== settingsCache.mtimeMs) {
    settingsCache = { mtimeMs, data: JSON.parse(await fs.promises.readFile(SETTINGS_FILE, "utf8")) };
  }
  return settingsCache.data;
};

const maintenanceMiddleware = (section) => async (req, res, next) => {
  try {
    const settings = await readSettings();
    const sectionSettings = settings && settings[section];
    if (!sectionSettings) return res.json({ status: false, message: "Something went wrong" });
    if (sectionSettings.api == "enable" && settings.deploy == "no") return next();
    if (sectionSettings.api == "disable" && sectionSettings.message != "") {
      return res.json({ status: false, message: sectionSettings.message });
    }
    if (settings.deploy == "yes" && settings.message != "") {
      return res.json({ status: false, message: settings.message });
    }
    return res.json({ status: false, message: "Something went wrong" });
  } catch (error) {
    console.error(`maintenance middleware (${section}) error:`, error.message);
    return res.json({ status: false, message: "Something went wrong" });
  }
};

exports.middlewareWebapi = maintenanceMiddleware("web");
exports.middlewareAppApi = maintenanceMiddleware("app");
exports.middlewareApi = maintenanceMiddleware("app");
exports.middlewareAdmapi = maintenanceMiddleware("adm");
