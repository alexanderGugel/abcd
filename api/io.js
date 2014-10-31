var makeRedis = require('../redis');
var query = require('../db/query');

var io = function (server) {
  var io = require('socket.io')(server);

  io.on('connection', function (socket) {
    var redis = makeRedis();

    socket.on('debug', function (debug) {

      if (!debug || !debug.experimentId || !debug.token) {
        socket.emit('error', {
          error: 'experimentId and token are required'
        });
        return;
      }

      query(
        'SELECT 1 FROM experiments WHERE id = $1 AND user_id = (SELECT user_id FROM tokens WHERE id = $2)',
        [debug.experimentId, debug.token],
        function (error, result) {
          if (!result.rows) {
            socket.emit('error', {
              error: 'Access denied'
            });
            return
          }

          redis.subscribe(debug.experimentId);

          redis.on('message', function (channel, actionId) {
            query(
              'SELECT * FROM actions WHERE id = $1',
              [actionId],
              function (error, result) {
                socket.emit('action', result.rows[0]);
              }
            )
          });

        }
      )
    });

    socket.on('disconnect', function () {
      redis.end();
    });
  });
};

module.exports = exports = io;
