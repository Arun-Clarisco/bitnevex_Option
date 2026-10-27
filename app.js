const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const config = require("./config/config");

require("./model/db"); //** mongo-db connection imported */

const webapiRouter = require('./routes/base/webapiRouter');
const apiRouter = require("./routes/base/apiRouter");
const appapiRouter = require("./routes/base/appapiRouter");
const admapiRouter = require("./routes/base/admapiRouter");
const middlewareHelper = require('./helpers/middleware.helper');
const socketHelper = require('./helpers/socket.helper');
const placeBetController = require('./controllers/place-bet.controller');

const app = express();
let port = config.port;

// view engine setup
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const allowedOrigins = new Set([
  "https://nvxo.io",
  "https://www.nvxo.io",
  "https://7lxqmpsow7obo7evycdsp.nvxo.io",
  "http://localhost:3000",
  "http://localhost:3001",
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

app.use('/api', middlewareHelper.middlewareApi, apiRouter);
app.use('/webapi', middlewareHelper.middlewareWebapi, webapiRouter);
app.use('/appapi', middlewareHelper.middlewareAppApi, appapiRouter);
app.use('/admapi', middlewareHelper.middlewareAdmapi, admapiRouter);

let server;
if (config.serverType == 'http') {
  let http = require('http');
  server = http.createServer(app);
} else {
  let https = require('https');
  server = https.createServer(config.options, app);
}
server.listen(port, () => console.log('Express started'));

const io = require("socket.io")(server, {
  serveClient: false,
  pingTimeout: 6000000,
  pingInterval: 30000,
  cookie: false,
});
socketHelper.SocketInit(io);
// catch 404 and forward to error handler;

io.on('connection', function (socket) {
  console.log("A User connected");

  socket.on('getUserBalance', async function (data) {
    const UserBalance = await placeBetController.getUserGameWalletBalance(data);
    if (UserBalance) {
      io.sockets.emit('getUserBalanceResp', UserBalance);
    }
  })

  socket.on('getTotalPairs', async function () {
    const TotalPairsData = await placeBetController.getTotalPairs();
    if (TotalPairsData) {
      io.sockets.emit('getTotalPairsResp', TotalPairsData);
    }
  });

  socket.on('getSelectedPair', async function (data) {
    const pairdata = await placeBetController.getSelectedPairs(data);
    if (pairdata) {
      io.sockets.to(socket.id).emit('getSelectedPairResp', pairdata);
    }
  })

  socket.on('getActiveBets', async function (data) {
    const ActiveBets = await placeBetController.getUserBasedPrediction(data);
    if (ActiveBets) {
      io.sockets.to(socket.id).emit('getActiveBetsResp', ActiveBets);
      io.sockets.emit("getActiveBetsRespMobile", ActiveBets)
    }
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });

});

app.use(function (req, res, next) {
  res.json({ status: false, message: 'Not found' });
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;