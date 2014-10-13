var express = require('express');
var query = require('../db/query');
var auth = require('./auth');

var experiments = express.Router();
//
// experiments.get('/', auth, function (req, res) {
//   query('SELECT * FROM experiments WHERE "experiments".is_deleted = FALSE AND "endpoints".is_deleted = FALSE', [req.user.id], function (error, result) {
//     if (error) {
//       res.status(500).send({
//         error: 'Internal server error'
//       });
//       throw error;
//     }
//
//     res.send({
//       experiments: result.rows
//     });
//   });
// });
//
// experiments.delete('/:id', auth, function (req, res) {
//   query('UPDATE "experiments" SET is_deleted = TRUE WHERE user_id = $1 AND endpoint = $2', [req.user.id, req.params.id], function (error) {
//     if (error) {
//       if (error.code === '22P02') {
//         return res.status(400).send({
//           error: 'Invalid experiment'
//         });
//       }
//       res.status(500).send({
//         error: 'Internal server error'
//       });
//       throw error;
//     }
//     res.status(204).send({});
//   });
// });

module.exports = exports = experiments;
