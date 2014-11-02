var express = require('express');
var auth = require('./auth');
var query = require('../db/query');
var users = require('./users');
var bcrypt = require('bcrypt-nodejs');

var tokens = express.Router();

var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;

var mailgun = require('mailgun-js')({
  apiKey: api_key,
  domain: domain
});

tokens.put('/', function (req, res) {
  var email = req.body.email;
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
  query('SELECT id, password FROM "users" WHERE email = $1', [req.email], function (error, result) {
    if (error) throw error;

    if (!result.rows) {
      return res.status(400).send({
        error: 'Account does not exist'
      });
    }

    bcrypt.compare(req.password, result.rows[0].password, function (error, correct) {
      if (error) throw error;

      if (!correct) {
        return res.status(400).send({
          error: 'Invalid password'
        });
      }

      query('INSERT INTO "tokens" (user_id) VALUES ($1) RETURNING id', [result.rows[0].id], function (error, result) {
        if (error) throw error;

        res.send({
          token: result.rows[0].id
        });
      });
    });
  });
});

module.exports = exports = tokens;
