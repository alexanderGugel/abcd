var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var endpoints = express.Router();

endpoints.post('/', auth, function (req, res) {
  query('INSERT INTO "endpoints" (user_id) VALUES ($1) RETURNING id', [req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.send({
      endpoint: {
        id: result.rows[0].id
      }
    });
  });
});

endpoints.get('/', auth, function (req, res) {
  query(
    'SELECT endpoints.is_active, endpoints.id, (COUNT(endpoints.id) - 1) AS action_count FROM endpoints LEFT JOIN actions ON actions.endpoint_id = endpoints.id WHERE endpoints.user_id = $1 GROUP BY endpoints.id;'
  , [req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.send({
      endpoints: result.rows
    });
  });
});

endpoints.get('/:id/actions', function (req, res) {
  query('SELECT * FROM actions WHERE endpoint_id = (SELECT id FROM endpoints WHERE id = $1 AND user_id = $2)', [req.params.id, req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    var actions = result.rows;
    res.send({
      actions: actions
    });
  });
});

endpoints.delete('/:id', auth, function (req, res) {
  query('UPDATE "endpoints" SET is_active = FALSE WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id], function (error) {
    if (error) {
      if (error.code === '22P02') {
        return res.status(400).send({
          error: 'Invalid endpoint'
        });
      }
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.status(204).send({});
  });
});

endpoints.patch('/:id', auth, function (req, res) {
  query('UPDATE "endpoints" SET is_active = TRUE WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id], function (error) {
    if (error) {
      if (error.code === '22P02') {
        return res.status(400).send({
          error: 'Invalid endpoint'
        });
      }
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.status(204).send({});
  });
});


module.exports = exports = endpoints;
