var express = require('express');
var query = require('../db/query');
var auth = require('./auth');
var json2csv = require('json-2-csv');
var redis = require('../redis')();

var isUUID = require('./util').isUUID;

var UAParser = require('ua-parser-js');
var uaParser = new UAParser();

var experiments = express.Router();

experiments.post('/', auth, function (req, res) {
  if (!req.body.name) {
    return res.status(400).send({
      error: 'Missing name'
    });
  }
  query('INSERT INTO "experiments" (name, user_id) VALUES ($1, $2) RETURNING id', [req.body.name, req.user.id], function (error, result) {
    if (error) throw error;

    res.send({
      id: result.rows[0].id
    });
  });
});

experiments.get('/', auth, function (req, res) {
  query(
    'SELECT * FROM experiments WHERE deleted = FALSE AND experiments.user_id = $1 OR id IN (SELECT experiment_id FROM collaborators WHERE user_id = $1) ORDER BY experiments.created_at DESC;', [req.user.id], function (error, result) {
    if (error) throw error;

    res.send(result.rows);
  });
});

experiments.put('/:id', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }
  query('UPDATE "experiments" SET name = $3, archived = $4, active = $5, description = $6 WHERE user_id = $1 AND id = $2', [req.user.id, req.params.id, req.body.name, !!req.body.archived, !!req.body.active, req.body.description], function (error) {
    if (error) throw error;
    res.status(204).send({});
  });
});

experiments.get('/:id', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }
  query('SELECT * FROM experiments WHERE (deleted = FALSE AND user_id = $1 OR id IN (SELECT experiment_id FROM collaborators WHERE user_id = $1)) AND id = $2', [req.user.id, req.params.id], function (error, result) {
    if (error) throw error;

    if (result.rows.length > 0) {
      res.send(result.rows[0]);
    } else {
      res.status(404).send({
        error: 'Experiment does not exist'
      });
    }
  });
});

experiments.delete('/:id', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }

  query('UPDATE experiments SET deleted = TRUE WHERE (user_id = $1 AND id = $2)', [req.user.id, req.params.id], function (error, result) {
    if (error) throw error;

    res.send({});
  });
});

experiments.get('/:id/actions', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }

  query('SELECT * FROM actions WHERE deleted = FALSE AND experiment_id = (SELECT id from experiments WHERE id = $2 AND user_id = $1)', [req.user.id, req.params.id], function (error, result) {
    if (error) throw error;

    res.send(result.rows);
  });
});

experiments.delete('/:id/actions', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }

  query('UPDATE actions SET deleted = TRUE WHERE (experiment_id IN (SELECT id FROM experiments WHERE id = $2 AND user_id = $1))', [req.user.id, req.params.id], function (error, result) {
    res.send({});
  });
});

experiments.delete('/:experimentId/actions/:actionId', auth, function (req, res) {
  if (!isUUID(req.params.experimentId) || !isUUID(req.params.actionId)) {
    return res.send(400, {
      error: 'Ids need to be UUIDs'
    });
  }

  query('UPDATE actions SET deleted = TRUE WHERE (experiment_id IN (SELECT id FROM experiments WHERE id = $2 AND user_id = $1)) AND id = $3', [req.user.id, req.params.experimentId, req.params.actionId], function (error, result) {
    res.send({});
  });
});

experiments.get('/:id/actions.csv', auth, function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.send(400, {
      error: 'Id needs to be UUID'
    });
  }

  query('SELECT * FROM actions WHERE deleted = FALSE AND experiment_id = (SELECT id from experiments WHERE id = $2 AND user_id = $1)', [req.user.id, req.params.id], function (error, result) {
    if (error) throw error;
    json2csv.json2csv(result.rows, function (error, csv) {
      if (error) throw error;

      res.attachment('actions_' + req.params.id + '_' + (new Date()).getTime() + '.csv');

      res.send(csv);
    });
  });
});

experiments.get('/:id/participate', function (req, res) {
  if (!isUUID(req.params.id)) {
    return res.status(400).jsonp({
      error: 'Id needs to be UUID'
    });
  }

  var userAgent = req.query.user_agent || req.headers['user-agent'];
  var userAgentParsed = uaParser.setUA(userAgent).getResult();
  var ip = req.query.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  query('INSERT INTO actions (variant, user_agent, experiment_id, user_agent_parsed, ip) VALUES ($1, $2, (SELECT id FROM experiments WHERE id = $3 AND active = TRUE), $4, $5) RETURNING id;', [req.query.variant || 'control', userAgent, req.params.id, userAgentParsed, ip], function (error, result) {
    if (error) {
      if (error.code === '23502') {
        return res.jsonp({
          error: 'Invalid experiment id'
        });
      }
      throw error;
    }
    redis.publish(req.params.id, result.rows[0].id);
    res.jsonp({
      actionId: result.rows[0].id
    });
  });
});

experiments.get('/:id/convert', function (req, res) {
  if (!req.query.action_id) {
    return res.status(400).jsonp({
      error: 'action_id required'
    });
  }

  if (!isUUID(req.params.id) || !isUUID(req.query.action_id)) {
    return res.status(400).jsonp({
      error: 'Ids need to be UUIDs'
    });
  }

  query('UPDATE "actions" SET completed_at = NOW() WHERE id = $1 AND experiment_id = (SELECT id FROM experiments WHERE id = $2 AND active = TRUE)', [req.query.action_id, req.params.id], function (error, result) {
    if (error) throw error;

    res.jsonp({
      actionId: req.query.action_id
    });
    redis.publish(req.params.id, req.query.action_id);
  });
});

module.exports = exports = experiments;
