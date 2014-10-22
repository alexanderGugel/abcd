var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

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
      project: {
        id: result.rows[0].id
      }
    });
  });
});

experiments.get('/', auth, function (req, res) {
  query(
    'SELECT * FROM experiments WHERE experiments.user_id = $1 ORDER BY experiments.created_at DESC;', [req.user.id], function (error, result) {
    if (error) {
      throw error;
    }
    res.send({
      experiments: result.rows
    });
  });
});

experiments.delete('/:id', auth, function (req, res) {
  query('UPDATE "experiments" SET is_deleted = TRUE WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id], function (error) {
    if (error) {
      if (error.code === '22P02') {
        return res.status(400).send({
          error: 'Invalid project'
        });
      }
      throw error;
    }
    res.status(204).send({});
  });
});

experiments.put('/:id', auth, function (req, res) {
  query('UPDATE "experiments" SET name = $3, is_deleted = $4, is_active = $5 WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id, req.body.name, req.body.is_deleted, req.body.is_active], function (error) {
    if (error) {
      // if (error.code === '22P02') {
      //   return res.status(400).send({
      //     error: 'Invalid project'
      //   });
      // }
      res.status(400).send({
        error: 'Invalid experiment'
      });
      throw error;
    }
    res.status(204).send({});
  });
});

experiments.get('/:id/actions', auth, function (req, res) {
  query('SELECT * FROM actions WHERE user_id = $1 AND experiment_id = $2', [req.user.id, req.params.id], function (error, result) {
    res.send({
      actions: result.rows
    });
  });
});

module.exports = exports = experiments;
