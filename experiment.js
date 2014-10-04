var query = require('./query');
var async = require('async');

// var getForUser = function (userId, callback) {
//   query('SELECT * FROM "experiment" WHERE user_id = $1', [userId], function (err, result) {
//     var rows = result.rows;
//     callback(null, rows);
//   });
// };
//
// var deleteForUser = function (userId, experimentName, callback) {
//   query('SELECT EXISTS(SELECT 1 FROM "experiment" WHERE user_id = $1 AND name = $2)', [userId, experimentName], function (err, result) {
//     var rows = result.rows;
//     if (rows.length === 0) {
//       return callback(new Error('Unknown experiment'));
//     }
//     callback();
//   });
// };
//
// var createForUser = function (userId, experimentName, callback) {
//   query('INSERT INTO "experiment" (user_id, name) VALUES ($1, $2) RETURNING id', [userId, experimentName], function (error, result) {
//     if (!error) {
//       var rows = result.rows;
//       callback(null, rows[0].id);
//     } else if (error.code === '23505') {
//       callback(new Error('Experiment already exists'));
//     }
//   });
// };
//
// var findOrCreateByNameForUser = function (userId, experimentName, callback) {
//   query('SELECT * FROM "experiment" WHERE user_id = $1 AND name = $2', [userId, experimentName], function (error, result) {
//     var rows = result.rows;
//     if (rows.length === 0) {
//       createForUser(userId, experimentName, function () {
//         findOrCreateByNameForUser(userId, experimentName, callback);
//       });
//     } else {
//       callback(null, rows[0]);
//     }
//   });
// };


///

var read = function (endpoint, callback) {
  query('SELECT * FROM "experiment" WHERE endpoint = $1', [endpoint], function (error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, result.rows);
    }
  });
};

var create = function (endpointId, experimentName, callback) {
  query('INSERT INTO "experiment" (endpoint_id, name) VALUES ($1, $2) RETURNING id, endpoint_id, name, running', [endpointId, experimentName], function (error, result) {
    if (!error) {
      var rows = result.rows;
      callback(null, rows[0]);
    } else if (error.code === '23505') {
      callback(new Error('Experiment already exists'));
    } else {
      callback(error);
    }
  });
};

var drop = function (endpoint, experimentName, callback) {
  // TODO
};

var readOrCreate = function (endpointId, experimentName, callback) {
  query('SELECT * FROM "experiment" WHERE endpoint_id = $1 AND name = $2', [endpointId, experimentName], function (error, result) {
    if (error) {
      callback(error);
    } else if (result.rows.length === 0) {
      create(endpointId, experimentName, callback);
    } else {
      callback(null, result.rows[0]);
    }
  });
};

var readForUser = function (userId, callback) {
  query('SELECT * FROM "endpoint" INNER JOIN "experiment" ON "experiment".endpoint_id = "endpoint".id AND "endpoint".user_id = $1', [userId], function (error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, result.rows);
    }
  });
};

module.exports = exports = {
  create: create,
  read: read,
  drop: drop,
  readOrCreate: readOrCreate,
  readForUser: readForUser
  // getForUser: getForUser,
  // deleteForUser: deleteForUser,
  // createForUser: createForUser,
  // findOrCreateByNameForUser: findOrCreateByNameForUser
};
