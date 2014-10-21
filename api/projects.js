var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var projects = express.Router();

projects.post('/', auth, function (req, res) {
  if (!req.body.name) {
    return res.status(400).send({
      error: 'Missing name'
    });
  }
  query('INSERT INTO "projects" (name, user_id) VALUES ($1) RETURNING id', [req.body.name, req.user.id], function (error, result) {
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

projects.get('/', auth, function (req, res) {
  query(
    'SELECT * FROM projects WHERE projects.user_id = $1 ORDER BY projects.created_at DESC;', [req.user.id], function (error, result) {
    if (error) {
      throw error;
    }
    res.send({
      projects: result.rows
    });
  });
});

projects.delete('/:id', auth, function (req, res) {
  query('UPDATE "projects" SET is_deleted = TRUE WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id], function (error) {
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

projects.patch('/:id', auth, function (req, res) {
  if (!req.body.name) {
    return res.status(400).send({
      error: 'Missing name'
    });
  }
  query('UPDATE "projects" SET name = $3 WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id, req.body.name], function (error) {
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

projects.get('/:id/actions', function (req, res) {
  query('SELECT * FROM actions WHERE user_id = $1 AND experiment_id = $2', [req.user.id, req.params.id], function (error, result) {
    res.send({
      actions: result.rows
    });
  });
});

module.exports = exports = projects;
