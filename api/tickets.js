var express = require('express');
var auth = require('./auth');
var query = require('../db/query');

var tickets = express.Router();

var api_key = process.env.MAILGUN_API_KEY;
var domain = process.env.MAILGUN_DOMAIN;

var mailgun = require('mailgun-js')({
  apiKey: api_key,
  domain: domain
});

tickets.post('/', auth, function (req, res) {
  var data = {
    from: 'abcd <' + req.user.email + '>',
    to: 'alexander.gugel@gmail.com',
    subject: 'Ticket',
    text: req.problem
  };

  mailgun.messages().send(data, function (error, body) {
  });

  res.send({});
});

module.exports = exports = tickets;
