'use strict';

var pg = require('pg');

var connectionString = process.env.PG_CONNECTION_STRING || 'postgres://alexander:password@localhost/alexander';

// pg.defaults.ssl = true;

var query = exports.query = function (query, parameters, callback) {
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
      done(); // Release the database handle
      callback(error, result);
    });
  });
};

module.exports = exports = query;
