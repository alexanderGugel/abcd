var express = require('express');
var auth = require('./auth');
var query = require('./query');
var users = require('./users');
var bcrypt = require('bcrypt-nodejs');

var tokens = express.Router();

tokens.post('/', users._validateUsernamePassword, function (req, res) {
  var email = req.email;
  query('SELECT id, password FROM "user" WHERE email = $1', [email], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    var rows = result.rows;
    if (rows.length === 0) {
      return res.status(400).send({
        error: 'Account does not exist'
      });
    }
    bcrypt.compare(req.password, rows[0].password, function (error, correct) {
      if (error) {
        res.status(500).send({
          error: 'Internal server error'
        });
        throw error;
      }
      if (!correct) {
        return res.status(400).send({
          error: 'Invalid password'
        });
      }
      query('INSERT INTO "token" (user_id) VALUES ($1) RETURNING token', [rows[0].id], function (error, result) {
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
    });
  });
});

module.exports = exports = tokens;
