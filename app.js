var express = require('express');
var api = require('./api');

var server = express();

server.use('/api', api);

var port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Test server listening on port ' + port);
});
