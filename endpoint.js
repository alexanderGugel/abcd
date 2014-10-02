var query = require('./query');

var getForUser = function (userId, callback) {
  query('SELECT endpoint FROM "endpoint" WHERE user_id = $1', [userId], function (err, result) {
    var rows = result.rows;
    callback(null, rows);
  });
};

module.exports = exports = {
  getForUser: getForUser
};
