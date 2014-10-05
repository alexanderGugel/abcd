var express = require('express');
var query = require('./query');
var auth = require('./auth');

var experiments = express.Router();

experiments.get('/', auth, function (req, res) {
  query('SELECT * FROM "experiment" INNER JOIN "endpoint" ON "experiment".endpoint_id = "endpoint".id AND "endpoint".user_id = $1 AND "experiment".is_deleted = FALSE AND "endpoint".is_deleted = FALSE', [req.user.id], function (error, result) {
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
