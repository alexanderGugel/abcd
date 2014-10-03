var query = require('./query');

var getForUser = function (userId, callback) {
  query('SELECT endpoint FROM "endpoint" WHERE user_id = $1', [userId], function (error, result) {
    var rows = result.rows;
    callback(null, rows);
  });
};

var requireEndpoint = function (req, res, next) {
  var endpoint = req.query.endpoint || req.body.endpoint;
  if (!endpoint) {
    return res.send(400, {
      error: 'Missing endpoint'
    });
  }
  query('SELECT user_id FROM "endpoint" WHERE endpoint = $1', [endpoint], function (error, result) {
    if (error && error.code === '22P02') {
      return res.send(400, {
        error: 'Invalid endpoint'
      });
    }
    var rows = result.rows;
    if (rows.length === 0) {
      return res.send(400, {
        error: 'Invalid endpoint'
      });
    }
    req.userId = result.rows[0]['user_id'];
    next();
  });
};

module.exports = exports = {
  getForUser: getForUser,
  requireEndpoint: requireEndpoint
};
