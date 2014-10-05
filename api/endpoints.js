var express = require('express');
var query = require('./query');
var auth = require('./auth');

var endpoints = express.Router();

endpoints.post('/', auth, function (req, res) {
  query('INSERT INTO "endpoint" (user_id) VALUES ($1) RETURNING endpoint', [req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.send({
      endpoint: {
        endpoint: result.rows[0].endpoint
      }
    });
  });
});

endpoints.get('/', auth, function (req, res) {
  query('SELECT endpoint FROM "endpoint" WHERE user_id = $1 AND is_deleted = FALSE', [req.user.id], function (error, result) {
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

endpoints.delete('/:endpoint', auth, function (req, res) {
  query('UPDATE "endpoint" SET is_deleted = TRUE WHERE user_id = $1 AND endpoint = $2', [req.user.id, req.params.endpoint], function (error) {
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
