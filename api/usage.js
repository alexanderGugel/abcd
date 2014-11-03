var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var usage = express.Router();

usage.get('/', auth, function (req, res) {

  query(
    'WITH filled_dates AS ( ' +
      'SELECT day, 0 AS blank_count FROM ' +
      'generate_series(date_trunc(\'month\', current_date)::timestamptz, current_date::timestamptz, \'1 day\') ' +
      'AS day ' +
    '), ' +

    'action_counts AS ( ' +
      'SELECT date_trunc(\'day\', started_at) AS day, count(*) AS count ' +
      'FROM actions ' +
      'WHERE actions.experiment_id IN (SELECT id FROM experiments WHERE user_id = $1)' +
      'GROUP BY date_trunc(\'day\', started_at)' +
    ') ' +

    'SELECT filled_dates.day, ' +
    'coalesce(action_counts.count, filled_dates.blank_count) AS actions ' +
    'FROM filled_dates ' +
    'LEFT OUTER JOIN action_counts ON action_counts.day = filled_dates.day '
  , [req.user.id], function (error, result) {
    res.send(result.rows);
  });
});

module.exports = exports = usage;

//
// SELECT date_trunc('hour', started_at) AS interval,
// COUNT(started_at) AS requests
// FROM actions GROUP BY endpoint, interval
