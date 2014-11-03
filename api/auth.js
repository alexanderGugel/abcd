var query = require('../db/query');
var crypto = require('crypto');

var isUUID = require('./util').isUUID;

var getGravatarImage = function (email) {
  return ('//www.gravatar.com/avatar/' + md5(email)).trim();
};

var md5 = function (str) {
  var hash = crypto.createHash('md5');
  hash.update(str.toLowerCase().trim());
  return hash.digest('hex');
};

var auth = function (req, res, next) {
  var token = req.query.token || req.body.token;
  if (!token) {
    return res.send(400, {
      error: 'Missing token'
    });
  }
  if (!isUUID(token)) {
    return res.send(400, {
      error: 'Token needs to be UUID'
    });
  }
  query('SELECT * FROM "users" WHERE id = (SELECT user_id FROM tokens WHERE id = $1)', [token], function (error, result) {
    if (error) throw error;
    if (result.rows.length === 0) {
      return res.send(400, {
        error: 'Invalid token'
      });
    }
    req.user = result.rows[0];
    req.user.gravatar = getGravatarImage(req.user.email);
    req.user.password = null;
    next();
  });
};

module.exports = exports = auth;
