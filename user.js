var query = require('./query');
var bcrypt = require('bcrypt-nodejs');

var register = function (email, password, callback) {
  email = email.toLowerCase();
  bcrypt.hash(password, null, null, function (err, password) {
    query('INSERT INTO "user" (email, password) VALUES ($1, $2)', [email, password], function (error) {
      if (!error) {
        return callback();
      }
      if (error.code === 23505) {
        return callback(new Error('User account already exists'));
      }
      return callback(new Error('Something went wrong'));
    });
  });
};

var login = function (email, password, callback) {
  email = email.toLowerCase();
  query('SELECT id, password FROM "user" WHERE email = $1', [email], function (err, result) {
    rows = result.rows;
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

var changePassword = function (email, oldPassword, newPassword) {

};

// register('alexander.gugel@gmail.com', 'test', function () {
//   console.log(arguments);
// });
login('alexander.gugel@gmail.com', 'test', function () {
  console.log(arguments);
});
