var db = require('./db');
var bcrypt = require('bcrypt-nodejs');

var register = function (email, password, callback) {
  db.SISMEMBER('emails', email.toLowerCase(), function (err, alreadyRegistered) {
    if (alreadyRegistered) {
      return callback(new Error('Already a user'));
    }
    db.SADD('emails', email);
    db.INCR('user_ids', function (error, id) {
      db.SET('user_email_to_id:')
      bcrypt.hash(password, null, null, function (error, passwordHash) {
        db.HMSET('user/' + id, {
          email: email,
          password: passwordHash
        }, function () {
          callback();
        });
      });
    });
  });
};

var login = function (email, password, callback) {
  db.hget
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
};

var changePassword = function (email, oldPassword, newPassword) {

};
