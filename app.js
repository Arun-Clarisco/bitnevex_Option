const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const config = require("./config/config");

require("./model/db"); //** mongo-db connection imported */

// const appapiRouter = require('./routes/base/appapiRouter');
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('port', port);

// app.use('/appapi', middlewareHelper.middlewareAppApi, appapiRouter);
// app.use('/webapi', middlewareHelper.middlewareWebapi, webapiRouter);

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
    // console.log("getUserBalance--",UserBalance);
    if (UserBalance) {
      io.sockets.emit('getUserBalanceResp', UserBalance);
    }
  })

  socket.on('getTotalPairs', async function () {
    const TotalPairsData = await placeBetController.getTotalPairs();
    // console.log("getTotalPairs--",TotalPairsData);
    if (TotalPairsData) {
      io.sockets.emit('getTotalPairsResp', TotalPairsData);
    }
  });

  socket.on('getSelectedPair', async function (data) {
    // console.log("getSelectedPair==", data);

    const pairdata = await placeBetController.getSelectedPairs(data);
    // console.log("getSelectedPair--",pairdata);
    if (pairdata) {
      io.sockets.to(socket.id).emit('getSelectedPairResp', pairdata);
    }
  })

  socket.on('getActiveBets', async function (data) {
    const ActiveBets = await placeBetController.getUserBasedPrediction(data);
    // console.log("getActiveBets--",ActiveBets);
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
  // next(createError(404));
  res.json({ status: false, message: 'Not found' });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;