var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var convert = express.Router();

convert.get('/', function (req, res, next) {
  if (!req.query.endpoint) {
    return res.status(400).jsonp({
      error: 'Missing endpoint'
    });
  }
  if (!req.query.action) {
    return res.status(400).jsonp({
      error: 'Missing action'
    });
  }
  next();
}, function (req, res, next) {
  query(
    'UPDATE "actions" SET completed_at = NOW() WHERE id = $1 AND endpoint_id = $2',
    [req.query.action, req.query.endpoint],
    function (error, result) {
      if (error) {
        res.status(500).jsonp({
          error: 'Internal server error'
        });
        throw error;
      }
      res.jsonp({});
    }
  );
});

module.exports = exports = convert;
