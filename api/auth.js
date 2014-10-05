var query = require('./query');

var auth = function (req, res, next) {
  var token = req.query.token || req.body.token;
  if (!token) {
    return res.send(400, {
      error: 'Missing token'
    });
  }
  query('SELECT * FROM "user" INNER JOIN "token" ON "token".token = $1 AND "token".user_id = "user".id', [token], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    var rows = result.rows;
    if (rows.length === 0) {
      return res.send(400, {
        error: 'Invalid token'
      });
    }
    req.user = result.rows[0];
    next();
  });
};

module.exports = exports = auth;
