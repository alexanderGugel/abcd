var express = require('express');
var query = require('../db/query');

var actions = express.Router();

// Start action
actions.post('/', function (req, res, next) {
  if (!req.body.endpoint) {
    return res.status(400).send({
      error: 'Missing endpoint'
    });
  }
  if (!req.body.experiment) {
    return res.status(400).send({
      error: 'Missing experiment'
    });
  }
  if (!req.body.variant) {
    return res.status(400).send({
      error: 'Missing variant'
    });
  }
  next();
}, function (req, res, next) {
  query('SELECT id FROM "endpoints" WHERE "endpoints".endpoint = $1', [req.body.endpoint], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    if (result.rows.length === 0) {
      return res.status(400).send({
        error: 'Invalid endpoint'
      });
    }
    req.endpoint = {
      endpoint: req.body.endpoint,
      id: result.rows[0].id
    };
    next();
  });
}, function (req, res) {
  var endpoint = req.endpoint;
  var experiment = req.body.experiment;
  var variant = req.body.variant;

  query(
    'INSERT INTO "experiments" (name, endpoint_id) VALUES ($1, $2) WHERE NOT EXISTS (' +
      'SELECT 1 FROM "experiments" WHERE endpoint_id = $2 AND name = $1' +
    ');' +
    'INSERT INTO "variants" (name, experiment_id) VALUES ($3, $4) WHERE NOT EXISTS (' +
      'SELECT 1 FROM "variants" WHERE experiment_id = $4 AND name = $3' +
    ');' +
  )

  // endpoint
  // experiment
  // variant
});

// Complete action
actions.post('/:id', function (req, res) {
  // TODO
});

module.exports = exports = actions;
