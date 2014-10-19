var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var participate = express.Router();

participate.get('/', function (req, res, next) {
  if (!req.query.endpoint) {
    return res.status(400).jsonp({
      error: 'Missing endpoint'
    });
  }
  if (!req.query.experiment) {
    return res.status(400).jsonp({
      error: 'Missing experiment'
    });
  }
  if (!req.query.variant) {
    return res.status(400).jsonp({
      error: 'Missing variant'
    });
  }
  next();
}, function (req, res, next) {
  query(
    'INSERT INTO "actions" (variant, experiment, endpoint_id) VALUES ($1, $2, $3) RETURNING id;',
    [req.query.variant, req.query.experiment, req.query.endpoint],
    function (error, result) {
      if (error) {
        res.status(500).jsonp({
          error: 'Internal server error'
        });
        throw error;
      }
      res.jsonp({
        action: {
          id: result.rows[0].id
        }
      });
    }
  );
});

module.exports = exports = participate;
