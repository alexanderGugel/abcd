var query = require('./query');
var async = require('async');

var getForUser = function (userId, callback) {
  query('SELECT * FROM "experiment" WHERE user_id = $1', [userId], function (err, result) {
    var rows = result.rows;
    callback(null, rows);
  });
};

var deleteForUser = function (userId, experimentName, callback) {
  query('SELECT EXISTS(SELECT 1 FROM "experiment" WHERE user_id = $1 AND name = $2)', [userId, experimentName], function (err, result) {
    var rows = result.rows;
    if (rows.length === 0) {
      return callback(new Error('Unknown experiment'));
    }
    callback();
  });
};

var createForUser = function (userId, experimentName, callback) {
  query('INSERT INTO "experiment" (user_id, name) VALUES ($1, $2) RETURNING id', [userId, experimentName], function (error, result) {
    if (!error) {
      var rows = result.rows;
      callback(null, rows[0].id);
    } else if (error.code === '23505') {
      callback(new Error('Experiment already exists'));
    }
  });
};

var findOrCreateByNameForUser = function (userId, experimentName, callback) {
  query('SELECT * FROM "experiment" WHERE user_id = $1 AND name = $2', [userId, experimentName], function (error, result) {
    var rows = result.rows;
    if (rows.length === 0) {
      createForUser(userId, experimentName, function () {
        findOrCreateByNameForUser(userId, experimentName, callback);
      });
    } else {
      callback(null, rows[0]);
    }
  });
};

module.exports = exports = {
  getForUser: getForUser,
  deleteForUser: deleteForUser,
  createForUser: createForUser,
  findOrCreateByNameForUser: findOrCreateByNameForUser
};
