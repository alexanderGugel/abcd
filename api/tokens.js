var express = require('express');
var auth = require('./auth');
var query = require('../db/query');
var users = require('./users');
var bcrypt = require('bcrypt-nodejs');

var tokens = express.Router();

var api_key = 'key-e9c635d45d97b8b4c349eb6f642edce7';
var domain = 'sandbox878f038f5b9746ba9d2915ae3bd840be.mailgun.org';

var mailgun = require('mailgun-js')({
  apiKey: api_key,
  domain: domain
});

tokens.put('/', function (req, res) {
  var email = req.body.email;
  console.log(email)
  query('INSERT INTO "tokens" (user_id) SELECT id FROM users WHERE email = $1 RETURNING id', [email], function (error, result) {
    if (error) {
      if (error.code === '42601') {
        return res.status(400).send({
          error: 'Account does not exist'
        });
      } else {
        throw error;
      }
    }

    var data = {
      from: 'Alexander Gugel <alexander.gugel@gmail.com>',
      to: req.body.email,
      subject: 'Forgot your password?',
      text: 'http://localhost:3000/#/experiments?token=' + result.rows[0].id
    };

    mailgun.messages().send(data, function (error, body) {
    });

    res.send({});
  });
});

tokens.post('/', users._validateUsernamePassword, function (req, res) {
  var email = req.email;
  query('SELECT id, password FROM "users" WHERE email = $1', [email], function (error, result) {
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
      query('INSERT INTO "tokens" (user_id) VALUES ($1) RETURNING id', [rows[0].id], function (error, result) {
        if (error) {
          res.status(500).send({
            error: 'Internal server error'
          });
          throw error;
        }
        res.send({
          token: result.rows[0].id
        });
      });
    });
  });
});

module.exports = exports = tokens;
