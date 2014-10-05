var express = require('express');
var bodyParser = require('body-parser');

var users = require('./users');
var tokens = require('./tokens');
var actions = require('./actions');
var experiments = require('./experiments');
var endpoints = require('./endpoints');


var api = express.Router().use(bodyParser.json());

api.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// api.use('/actions', actions);
api.use('/tokens', tokens);
api.use('/users', users);
api.use('/experiments', experiments);
api.use('/endpoints', endpoints);
// api.use('/variants', variants);

module.exports = exports = api;
