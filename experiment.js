var query = require('./query');

var getForUser = function (userId, callback) {
  query('SELECT * FROM "experiment" WHERE user_id = $1', [userId], function (err, result) {
    var rows = result.rows;
    callback(null, rows);
  });
};

var deleteForUser = function (userId, experimentName, callback) {
  query('SELECT EXISTS(SELECT 1 FROM "experiment" WHERE user_id = $1 AND name = $2)', [userId, experimentName], function (err, result) {
    var rows = result.rows;
    console.log(rows);
    if (rows.length === 0) {
      return callback(new Error('Unknown experiment'));
    }
  });
};

module.exports = exports = {
  getForUser: getForUser
};
