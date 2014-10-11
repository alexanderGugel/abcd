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
  query('SELECT * FROM "endpoints" WHERE "endpoints".endpoint = $1', [req.body.endpoint], function (error, result) {
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
    req.endpoint = result.rows[0];
    next();
  });
}, function (req, res, next) {
  query(
    'INSERT INTO "experiments" (name, endpoint_id) VALUES ($1, $2);',
    [req.body.experiment, req.endpoint.id],
    function (error, result) {
      if (error && error.code !== '23505') {
        res.status(500).send({
          error: 'Internal server error'
        });
        throw error;
      }
      next();
    }
  );
}, function (req, res, next) {
  query(
    'INSERT INTO "variants" (name, experiment_id) VALUES ($1, (SELECT id FROM experiments WHERE name = $2 AND endpoint_id = $3));',
    [req.body.variant, req.body.experiment, req.endpoint.id],
    function (error, result) {
      if (error && error.code !== '23505') {
        res.status(500).send({
          error: 'Internal server error'
        });
        throw error;
      }
      next();
    }
  );
}, function (req, res) {
  var endpoint = req.endpoint;
  var experiment = req.body.experiment;
  var variant = req.body.variant;

  query(
    'INSERT INTO "actions" (variant_id) VALUES ((SELECT id FROM variants WHERE name = $1 AND experiment_id = (SELECT id FROM experiments WHERE name = $2 AND endpoint_id = $3))) RETURNING id;',
    [req.body.variant, req.body.experiment, req.endpoint.id],
    function (error, result) {
      if (error) {
        res.status(500).send({
          error: 'Internal server error'
        });
        throw error;
      }
      res.send({
        id: result.rows[0].id
      });
    }
  );
});

// Complete action
actions.post('/:id', function (req, res) {
  // TODO
});

module.exports = exports = actions;
