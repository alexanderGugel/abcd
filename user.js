var query = require('./query');
var bcrypt = require('bcrypt-nodejs');

var register = function (email, password, callback) {
  if (!email) {
    return callback(new Error('Missing email'));
  }
  if (!password) {
    return callback(new Error('Missing password'));
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return callback(new Error('Email and password need to be strings'));
  }
  if (email.length < 3) {
    return callback(new Error('Email too short'));
  }
  if (password.length < 6) {
    return callback(new Error('Password too short (min 6 characters)'));
  }
  email = email.toLowerCase();
  bcrypt.hash(password, null, null, function (err, password) {
    query('INSERT INTO "user" (email, password) VALUES ($1, $2) RETURNING id', [email, password], function (error, result) {
      if (!error) {
        var rows = result.rows;
        query('INSERT INTO "token" (user_id) VALUES ($1) RETURNING token', [rows[0].id], function (err, result) {
          callback(null, result.rows[0].token);
        });
      } else if (error.code === '23505') {
        callback(new Error('User account already exists'));
      } else {
        callback(new Error('Something went wrong'));
      }
    });
  });
};

var login = function (email, password, callback) {
  email = email.toLowerCase();
  query('SELECT id, password FROM "user" WHERE email = $1', [email], function (err, result) {
    var rows = result.rows;
    if (rows.length === 0) {
      return callback(new Error('Account does not exist'));
    }
    bcrypt.compare(password, rows[0].password, function (err, correct) {
      if (!correct) {
        return callback(new Error('Invalid password'));
      }
      query('INSERT INTO "token" (user_id) VALUES ($1) RETURNING token', [rows[0].id], function (err, result) {
        callback(null, result.rows[0].token);
      });
    });
  });
};


// register('alexander.gugel@gmail.com', 'test', function () {
//   console.log(arguments);
// });
// login('alexander.gugel@gmail.com', 'test', function () {
//   console.log(arguments);
// });

module.exports = exports = {
  register: register,
  login: login
};
