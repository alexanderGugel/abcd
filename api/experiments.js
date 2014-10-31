var express = require('express');
var query = require('../db/query');
var auth = require('./auth');
var json2csv = require('json2csv');

var experiments = express.Router();

experiments.post('/', auth, function (req, res) {
  if (!req.body.name) {
    return res.status(400).send({
      error: 'Missing name'
    });
  }
  query('INSERT INTO "experiments" (name, user_id) VALUES ($1, $2) RETURNING id', [req.body.name, req.user.id], function (error, result) {
    if (error) {
      throw error;
    }
    res.send({
      id: result.rows[0].id
    });
  });
});

experiments.get('/', auth, function (req, res) {
  query(
    'SELECT * FROM experiments WHERE experiments.user_id = $1 OR id IN (SELECT experiment_id FROM collaborators WHERE user_id = $1) ORDER BY experiments.created_at DESC;', [req.user.id], function (error, result) {
    if (error) {
      throw error;
    }
    res.send(result.rows);
  });
});

experiments.put('/:id', auth, function (req, res) {
  query('UPDATE "experiments" SET name = $3, archived = $4, active = $5, description = $6 WHERE (user_id = $1 OR id IN (SELECT experiment_id FROM collaborators WHERE user_id = $1)) AND id = $2', [req.user.id, req.params.id, req.body.name, req.body.archived, req.body.active, req.body.description], function (error) {
    if (error) {
      res.status(400).send({
        error: 'Invalid experiment'
      });
      throw error;
    }
    res.status(204).send({});
  });
});

experiments.get('/:id', auth, function (req, res) {
  query('SELECT * FROM experiments WHERE (user_id = $1 OR id IN (SELECT experiment_id FROM collaborators WHERE user_id = $1)) AND id = $2', [req.user.id, req.params.id], function (error, result) {
    res.send(result.rows[0]);
  });
});

experiments.get('/:id/actions', auth, function (req, res) {
  query('SELECT id, started_at, completed_at, variant FROM actions WHERE deleted = FALSE AND experiment_id = (SELECT id from experiments WHERE id = $2 AND user_id = $1)', [req.user.id, req.params.id], function (error, result) {
    res.send(result.rows);
  });
});


experiments.delete('/:id/actions', auth, function (req, res) {
  query('UPDATE actions SET deleted = TRUE WHERE (experiment_id IN (SELECT id FROM experiments WHERE id = $2 AND user_id = $1))', [req.user.id, req.params.id], function (error, result) {
    res.send({});
  });
});

experiments.get('/:id/actions.csv', auth, function (req, res) {
  query('SELECT id, started_at, completed_at, variant FROM actions WHERE deleted = FALSE AND experiment_id = (SELECT id from experiments WHERE id = $2 AND user_id = $1)', [req.user.id, req.params.id], function (error, result) {
    json2csv({
      data: result.rows,
      fields: ['id', 'started_at', 'completed_at', 'variant']
    }, function (err, csv) {
      res.send(csv);
    });
  });
});

experiments.get('/:id/participate', function (req, res) {
  query('INSERT INTO actions (variant, experiment_id) VALUES ($1, (SELECT id FROM experiments WHERE id = $2 AND active = TRUE)) RETURNING id;', [req.query.variant || 'control', req.params.id], function (error, result) {
    if (error) {
      if (error.code === '23502') {
        return res.jsonp({
          error: 'Invalid experiment id'
        });
      }
      throw error;
    }
    res.jsonp(result.rows[0]);
  });
});

experiments.get('/:id/convert', function (req, res) {
  if (!req.query.action_id) {
    return res.status(500).jsonp({
      error: 'Action id required'
    });
  }
  query('UPDATE "actions" SET completed_at = NOW() WHERE id = $1 AND experiment_id = (SELECT id FROM experiments WHERE id = $2 AND active = TRUE)', [req.query.action_id, req.params.id], function (error, result) {
    res.jsonp({});
  });
});

module.exports = exports = experiments;
