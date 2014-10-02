var express = require('express');
var bodyParser = require('body-parser')
var user = require('./user');

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




var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
