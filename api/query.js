var pg = require('pg');

var connectionString = process.env.POSTGRESQL_CONNECTION_STRING || 'postgres://alexander@localhost/alexander';

var query = function (query, parameters, callback) {
  if (typeof parameters === 'function') {
      callback = parameters;
      parameters = [];
  }
  if (typeof callback !== 'function') {
      callback = function () {};
  }

  pg.connect(connectionString, function (error, client, done) {
    if (error) {
      console.error(error);
      return callback(error);
    }

    client.query(query, parameters, function (error, result) {
      if (error) {
        console.error(error);
      }
      done(); // Release the database handle
      callback(error, result);
    });
  });
};

module.exports = exports = query;
