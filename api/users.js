var express = require('express');
var auth = require('./auth');
var query = require('../db/query');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');

var users = express.Router();

users._validateUsernamePassword = function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  if (!email) {
    return res.status(400).send({
      error: 'Missing email'
    });
  }
  if (!password) {
    return res.status(400).send({
      error: 'Missing password'
    });
  }
  if (email.length < 3) {
    return res.status(400).send({
      error: 'Email too short'
    });
  }
  if (password.length < 6) {
    return res.status(400).send({
      error: 'Password too short'
    });
  }
  email = email.toLowerCase();
  req.email = email;
  req.password = password;
  next();
};

users.post('/', users._validateUsernamePassword, function (req, res) {
  var email = req.email;
  var password = req.password;
  bcrypt.hash(password, null, null, function (error, password) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    query('INSERT INTO "users" (email, password) VALUES ($1, $2) RETURNING id', [email, password], function (error, result) {
      if (!error) {
        var rows = result.rows;
        // query('INSERT INTO "endpoints" (user_id) VALUES ($1)', [rows[0].id]);
        query('INSERT INTO "tokens" (user_id) VALUES ($1) RETURNING token', [rows[0].id], function (error, result) {
          if (error) {
            res.status(500).send({
              error: 'Internal server error'
            });
            throw error;
          }
          res.send({
            token: result.rows[0].token
          });
        });
      } else if (error.code === '23505') {
        res.status(400).send({
          error: 'User account already exists'
        });
      } else {
        res.status(500).send({
          error: 'Internal server error'
        });
        throw error;
      }
    });
  });
});

users.get('/me', auth, function (req, res) {
  res.send({
    user: req.user
  });
});

users.put('/me', auth, function (req, res, next) {
  var email = req.body.email;

  if (email) {
    if (email.length < 6) {
      return res.status(400).send({
        error: 'Email too short'
      });
    }
    query('UPDATE "users" SET email = $1 WHERE id = $2', [email, req.user.id], function (error, result) {
      if (error) {
        if (error.code === '23505') {
          res.status(400).send({
            error: 'Email used by another account'
          });
        } else {
          res.send({
            error: 'Internal server error'
          });
          throw error;
        }
      } else {
        next();
      }
    });
  } else {
    next();
  }
}, function (req, res, next) {
  var password = req.body.password;

  if (password) {
    if (password.length < 6) {
      return res.status(400).send({
        error: 'Password too short'
      });
    }
    bcrypt.hash(password, null, null, function(error, hash) {
      if (error) {
        res.send({
          error: 'Internal server error'
        });
        throw error;
      }
      query('UPDATE "users" SET password = $1 WHERE id = $2', [hash, req.user.id], function (error, result) {
        if (error) {
          res.send({
            error: 'Internal server error'
          });
          throw error;
        } else {
          next();
        }
      });
    });
  } else {
    next();
  }
}, function (req, res) {
  res.status(204).send({});
});

module.exports = exports = users;
