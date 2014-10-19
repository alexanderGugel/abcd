var express = require('express');
var query = require('../db/query');
var auth = require('./auth');
var _ = require('async');

var usage = express.Router();

usage.get('/', auth, function (req, res) {
  query('SELECT date_trunc(\'hour\', started_at) AS interval, COUNT(started_at) AS requests, endpoint_id AS endpoint FROM actions WHERE endpoint_id IN (SELECT id AS user_id FROM endpoints WHERE user_id = $1) GROUP BY endpoint, interval',
  [req.user.id], function (error, result) {
    if (error) {
      res.status(500).send({
        error: 'Internal server error'
      });
      throw error;
    }
    res.send({
      usage: _.map(result.rows, function (row) {
        return row;
      })
    });
  });
});

module.exports = exports = usage;
