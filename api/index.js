var express = require('express');
var bodyParser = require('body-parser');

var api = express.Router().use(bodyParser.json());

api.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
  next();
});

api.use('/tokens', require('./tokens'));
api.use('/users', require('./users'));
api.use('/experiments', require('./experiments'));

// api.use('/usage', require('./usage'));

api.all('*', function (req, res) {
  res.status(404).send({
    error: 'File not found'
  });
});

module.exports = exports = api;
