var socket = 0;
exports.SocketInit = function (socketIO) {
  socket = socketIO;
};
exports.GetSocket = function () {
  return socket;
};