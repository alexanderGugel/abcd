var express = require('express');
var bodyParser = require('body-parser')
var user = require('./user');
var endpoint = require('./endpoint');
var experiment = require('./experiment');


var server = express();
server.use(bodyParser.json());
server.use(express.static(__dirname + '/static'));

server.get('/', function(req, res){
  // var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  res.send('hello world');
});

server.get('/login', function (req, res) {
  res.sendFile(__dirname + '/static/login.html');
});

server.get('/signup', function (req, res) {
  res.sendFile(__dirname + '/static/signup.html');
});

server.get('/logout', function (req, res) {
  res.sendFile(__dirname + '/static/logout.html');
});

server.get('/experiments', function (req, res) {
  res.sendFile(__dirname + '/static/experiments.html');
});

server.post('/api/user', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  user.register(email, password, function (error, token) {
    if (error) {
      res.send(400, {
        error: error.message
      });
    } else {
      res.send(200, {
        token: token
      });
    }
  });
});

server.post('/api/token', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  user.login(email, password, function (error, token) {
    if (error) {
      res.send(400, {
        error: error.message
      });
    } else {
      res.send(200, {
        token: token
      });
    }
  });
});

server.get('/api/endpoint', user.requireToken, function (req, res) {
  endpoint.getForUser(req.userId, function (error, endpoints) {
    res.send({
      endpoints: endpoints
    });
  });
});

// Start action
server.post('/api/action', function (req, res) {
  var endpoint = req.body.endpoint;
  var experiment = req.body.experiment;
  var variant = req.body.variant;
});

// Complete action
server.put('/api/action', function (req, res) {
});

server.get('/api/experiment', user.requireToken, function (req, res) {
  experiment.getForUser(req.userId, function (error, experiments) {
    res.send({
      experiments: experiments
    });
  });
});

server.get('/api/experiment/:id', function (req, res) {
});

server.delete('/api/experiment/:id', user.requireToken, function (req, res) {
  experiment.deleteForUser(req.userId, req.body.experimentName, function (error) {
    if (error) {
      return res.send({
        error: error.message
      });
    }
    res.send(204, {});
  });
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
