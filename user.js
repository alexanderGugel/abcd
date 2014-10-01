var db = require('./db');
var bcrypt = require('bcrypt-nodejs');

var register = function (email, password, callback) {
  db.prepare('SELECT COUNT(1) FROM user WHERE useremail = ?').run(email).finalize(function () {
    console.log(arguments);
  });
};

var login = function (email, password, callback) {
};

var changePassword = function (email, oldPassword, newPassword) {

};

register('alexander.gugel@gmail.com', 'test');
