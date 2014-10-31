var makeRedis = require('../redis');
var query = require('../db/query');

var io = function (server) {
  var io = require('socket.io')(server);

  io.on('connection', function (socket) {
    var redis = makeRedis();

    socket.on('debug', function (experimentId) {
      // TODO experimentId = *
      redis.subscribe(experimentId);

      redis.on('message', function (channel, actionId) {
        query(
          'SELECT * FROM actions WHERE id = $1',
          [actionId],
          function (error, result) {
            socket.emit('action', result.rows[0]);
          }
        )
      });
    });

    socket.on('disconnect', function () {
      redis.end();
      console.log(socket + ' disconnected');
    });
  });
};

module.exports = exports = io;
