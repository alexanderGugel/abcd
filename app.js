var express = require('express');
var api = require('./api');

var server = express();

server.use('/api', api);

server.use(express.static(__dirname + '/static'));

server.get('*', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
