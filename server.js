var express = require('express');
var bodyParser = require('body-parser')
var user = require('./user');
var endpoint = require('./endpoint');
var experiment = require('./experiment');
var action = require('./action');
var variant = require('./variant');

var server = express();
server.use(bodyParser.json());
server.use(express.static(__dirname + '/static'));

server.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
  next();
});

server.get('/', function(req, res){
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/login', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/signup', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/logout', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/settings', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/dashboard', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

server.get('/docs', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

// Create a new user account (Sign Up)
server.post('/api/user', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  user.register(email, password, function (error, token) {
    if (error) {
      res.status(400).send({
        error: error.message
      });
    } else {
      res.status(200).send({
        token: token
      });
    }
  });
});

// Create a new token (Login)
server.post('/api/token', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  user.login(email, password, function (error, token) {
    if (error) {
      res.status(400).send({
        error: error.message
      });
    } else {
      res.status(200).send({
        token: token
      });
    }
  });
});

server.get('/api/user/me', user.requireToken, user.readMiddleware, function (req, res) {
  res.send({
    user: req.user
  });
});

server.put('/api/user/me', user.requireToken, function (req, res) {
  user.update(req.userId, req.body.newEmail, req.body.newPassword, function (error) {
    if (error) {
      res.status(400).send({
        error: error.message
      });
    } else {
      res.status(204).send({});
    }
  })
});

// Get all endpoints for a specific user
server.get('/api/endpoint', user.requireToken, function (req, res) {
  endpoint.read(req.userId, function (error, endpoints) {
    res.send({
      endpoints: endpoints
    });
  });
});

server.post('/api/endpoint', user.requireToken, function (req, res) {
  endpoint.create(req.userId, function (error) {
    res.send({});
  });
});

server.delete('/api/endpoint', user.requireToken, function (req, res) {
  if (!req.body.endpoint) {
    return res.status(400).send({
      error: 'Missing endpoint'
    });
  }
  endpoint.drop(req.userId, req.body.endpoint, function (error) {
    if (error) {
      if (error.code === '22P02') {
        return res.status(400).send({
          error: 'Invalid endpoint'
        });
      }
      return res.status(500).send({
        error: 'Internal server error'
      });
    }
    res.status(204).send({});
  });
});

server.get('/api/experiment', user.requireToken, function (req, res) {
  experiment.readForUser(req.userId, function (error, experiments) {
    res.send({
      experiments: experiments
    });
  });
});

// Get all info about a specific experiment
server.get('/api/experiment/:id', function (req, res) {
  // Detailed info about experiment (actions etc)
  // TODO
});

// Delete a specific experiment
// server.delete('/api/experiment/:id', user.requireToken, function (req, res) {
//   experiment.deleteForUser(req.userId, req.body.experimentName, function (error) {
//     if (error) {
//       return res.send({
//         error: error.message
//       });
//     }
//     res.status(204).send({});
//   });
// });

// Start an action
server.post('/api/action', endpoint.requireEndpoint, function (req, res) {
  action.start(req.endpoint.id, req.body.experiment, req.body.variant, function (error, result) {
    if (error) {
      return res.status(400).send({
        error: error.message
      });
    }
    res.status(200).send(result);
  });
});

// Complete an action
server.post('/api/action/:id', endpoint.requireEndpoint, function (req, res) {
  action.complete(req.params.id, function (error, result) {
    if (error) {
      return res.status(400).send({
        error: error.message
      });
    }
    res.status(200).send(result || {});
  });
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
