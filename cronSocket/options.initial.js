const socketHelper = require('../helpers/socket.helper');
const OptionsGameHelper = require('../helpers/options.helper');
const OptionsGameSocket = require("./options.socket");

exports.initialCall = async function () {
  const io = socketHelper.GetSocket();
  OptionsGameHelper.SocketInit(io);
  OptionsGameSocket.SocketInit(io);
  OptionsGameSocket.initialCall();
}