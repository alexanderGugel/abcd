var query = require('./query');

var read = function (userId, callback) {
  query('SELECT * FROM "endpoint" WHERE user_id = $1', [userId], function (error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, result.rows);
    }
  });
};

var requireEndpoint = function (req, res, next) {
  var endpoint = req.query.endpoint || req.body.endpoint;
  if (!endpoint) {
    return res.status(400).send({
      error: 'Missing endpoint'
    });
  }
  query('SELECT * FROM "endpoint" WHERE endpoint = $1', [endpoint], function (error, result) {
    if (error) {
      if (error.code === '22P02') {
        res.status(400).send({
          error: 'Invalid endpoint'
        });
      } else {
        res.status(500).send({
          error: 'Internal server error'
        })
      }
    } else {
      var rows = result.rows;
      if (rows.length === 0) {
        res.send(400, {
          error: 'Invalid endpoint'
        });
      } else {
        req.userId = result.rows[0]['user_id'];
        req.endpoint = result.rows[0];
        next();
      }
    }
  });
};

module.exports = exports = {
  read: read,
  requireEndpoint: requireEndpoint
};
