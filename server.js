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

server.use('/admin', adminRouter);

server.get('/login', function () {

});

server.post('/register', function (req, res) {
  user.register(req.email, req.password, function (error, token) {
    if (error) {
      res.send({
        error: error.message
      });
    } else {
      res.send({
        token: token
      });
    }
  });
});

server.post('/login', function (req, res) {
  user.login(req.email, req.password, function (error, token) {
    if (error) {
      res.send({
        error: error.message
      });
    } else {
      res.send({
        token: token
      });
    }
  });
});



var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
