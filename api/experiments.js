var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var experiments = express.Router();

experiments.get('/', auth, function (req, res) {
  query('SELECT * FROM "experiments" INNER JOIN "endpoints" ON "experiments".endpoint_id = "endpoints".id AND "endpoints".user_id = $1 AND "experiments".is_deleted = FALSE AND "endpoints".is_deleted = FALSE', [req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }

    res.send({
      experiments: result.rows
    });
  });
});

module.exports = exports = experiments;
