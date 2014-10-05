var query = require('./query');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');

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
        query('INSERT INTO "endpoint" (user_id) VALUES ($1)', [rows[0].id]);
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

var requireToken = function (req, res, next) {
  var token = req.query.token || req.body.token;
  if (!token) {
    return res.send(400, {
      error: 'Missing token'
    });
  }
  query('SELECT user_id FROM "token" WHERE token = $1', [token], function (err, result) {
    var rows = result.rows;
    if (rows.length === 0) {
      return res.send(400, {
        error: 'Invalid token'
      });
    }
    req.token = token;
    req.userId = result.rows[0]['user_id'];
    next();
  });
};

var readMiddleware = function (req, res, next) {
  query('SELECT * FROM "user" WHERE id = $1', [req.userId], function (error, result) {
    if (error) {
      res.status(500).send({
        error: error.message
      });
    } else {
      req.user = result.rows[0];
      next();
    }
  });
};

var updatePassword = function (id, newPassword, callback) {
  if (newPassword && newPassword.length < 6) {
    return callback(new Error('Password too short (min 6 characters)'));
  }
  bcrypt.hash(newPassword, null, null, function (err, newPassword) {
    query('UPDATE "user" SET password = $1 WHERE id = $2', [newPassword, id], function (error, result) {
      callback();
    });
  });
};

var updateEmail = function (id, newEmail, callback) {
  if (newEmail && newEmail.length < 3) {
    return callback(new Error('Email too short'));
  }
  query('UPDATE "user" SET email = $1 WHERE id = $2', [newEmail, id], function (error, result) {
    if (error && error.code === '23505') {
      callback(new Error('Email used by another account'));
    } else {
      callback();
    }
  });
};

var update = function (id, newEmail, newPassword, callback) {
  if (newPassword && newEmail) {
    async.series([
      function (callback) {
        updateEmail(id, newEmail, callback);
      },
      function (callback) {
        updatePassword(id, newPassword, callback);
      }
    ], callback);
  } else if (newPassword) {
    updatePassword(id, newPassword, callback);
  } else if (newEmail) {
    updateEmail(id, newEmail, callback);
  } else {
    callback();
  }
};

module.exports = exports = {
  register: register,
  login: login,
  requireToken: requireToken,
  readMiddleware: readMiddleware,
  updatePassword: updatePassword,
  updateEmail: updateEmail,
  update: update
};
