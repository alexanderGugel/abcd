 var redis = require("redis");


var port = process.env.REDIS_PORT;
var host = process.env.REDIS_HOST;
var options = process.env.REDIS_OPTIONS;

if (options) {
  options = JSON.parse(options);
}

 module.exports = exports = redis.createClient(port, host, options);
