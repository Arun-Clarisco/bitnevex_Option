const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const config = require("./config/config");

require("./model/db"); //** mongo-db connection imported */

const webapiRouter = require('./routes/base/webapiRouter');
const apiRouter = require("./routes/base/apiRouter");
const appapiRouter = require("./routes/base/appapiRouter");
const admapiRouter = require("./routes/base/admapiRouter");
const commonHelper = require('./helpers/common.helper');
const optionsService = require('./services/options-game.services');
const placeBetController = require('./controllers/place-bet.controller');

const app = express();
const port = config.port;

app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const allowedOrigins = new Set([
  "https://nvxo.io",
  "https://www.nvxo.io",
  "https://7lxqmpsow7obo7evycdsp.nvxo.io",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://api-test-console.vercel.app/"
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    const localOrigin = origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (!origin || localOrigin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "x-web-client-module", "X-Security-Header", "secure-header-value", "X-Client-IP"],
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', port);

app.use('/api', commonHelper.middlewareApi, apiRouter);
app.use('/webapi', commonHelper.middlewareWebapi, webapiRouter);
app.use('/appapi', commonHelper.middlewareAppApi, appapiRouter);
app.use('/admapi', commonHelper.middlewareAdmapi, admapiRouter);

const server = require('http').createServer(app);
server.listen(port, () => console.log('Express started'));

const io = require("socket.io")(server, {
  serveClient: false,
  pingTimeout: 6000000,
  pingInterval: 30000,
  cookie: false,
});
optionsService.SocketInit(io);

// Each request is answered to the asking socket only. User data is always the logged-in
// user of that socket (cookie or token); a userLoginId sent by the client is never trusted.
const onSocket = (socket, event, handler) => {
  socket.on(event, async (data = {}) => {
    try {
      await handler(data || {});
    } catch (error) {
      console.log(`${event} socket error`, error.message);
    }
  });
};

io.on('connection', function (socket) {
  onSocket(socket, 'getTotalPairs', async () => {
    socket.emit('getTotalPairsResp', await placeBetController.getTotalPairs());
  });

  onSocket(socket, 'getSelectedPair', async (pair) => {
    socket.emit('getSelectedPairResp', await placeBetController.getSelectedPair(pair));
  });

  onSocket(socket, 'getUserBalance', async (data) => {
    const userId = await commonHelper.resolveSocketUser(socket, data);
    if (!userId) return;
    socket.emit('getUserBalanceResp', await placeBetController.getUserWalletBalance(userId, data.currencyId));
  });

  onSocket(socket, 'getActiveBets', async (data) => {
    const userId = await commonHelper.resolveSocketUser(socket, data);
    if (!userId) return;
    const bets = await placeBetController.getUserPredictions(userId);
    socket.emit('getActiveBetsResp', bets);
    socket.emit('getActiveBetsRespMobile', bets);
  });
});

app.use(function (req, res, next) {
  res.json({ status: false, message: 'Not found' });
});

// error handler (no view engine is configured, so answer with JSON)
app.use(function (err, req, res, next) {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({ status: false, message: "Something went wrong" });
});
module.exports = app;
