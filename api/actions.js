var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var actions = express.Router();

actions.use(function (req, res, next) {
  if (!req.query.endpoint) {
    return res.status(400).jsonp({
      error: 'Missing endpoint'
    });
  }
  next();
});

actions.get('/', auth, function (req, res, next) {
}, function (req, res) {

});

// Start action
actions.get('/start', function (req, res, next) {
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

// Complete action
actions.get('/complete', function (req, res, next) {
  if (!req.query.id) {
    return res.status(400).jsonp({
      error: 'Missing action id'
    });
  }
  next();
}, function (req, res) {
  query(
    'UPDATE "actions" SET completed_at = NOW() WHERE id = $1 AND endpoint_id = $2',
    [req.query.id, req.query.endpoint],
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

module.exports = exports = actions;
