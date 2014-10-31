var express = require('express');
var http = require('http');

var api = require('./api');
var io = require('./api/io');

var app = express();

app.use('/api', api);

app.use(express.static(__dirname + '/static'));

app.get('*', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

var server = http.createServer(app);

io(server);

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Server listening on port ' + port);
});
