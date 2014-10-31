var io = function (server) {
  var io = require('socket.io')(server);

  io.on('connection', function (socket) {
    console.log(socket + ' connected');

    socket.on('disconnect', function(){
      console.log(socket + ' disconnected');
    });
  });
};

module.exports = exports = io;
