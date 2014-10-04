var query = require('./query');
var experiment = require('./experiment');
var variant = require('./variant');

var start = function (endpointId, experimentName, variantName, callback) {
  if (!experimentName) {
    return callback(new Error('Missing experiment'));
  }

  if (!variantName) {
    return callback(new Error('Missing variant'));
  }

  experiment.readOrCreate(endpointId, experimentName, function (error, experiment) {
    if (error) {
      return callback(error);
    }
    variant.readOrCreate(experiment.id, variantName, function (error, variant) {
      if (error) {
        return callback(error);
      }
      query('INSERT INTO "action" (variant_id, start_data) VALUES ($1, $2) RETURNING id', [variant.id, '{}'], function (error, result) {
        if (error) {
          return callback(error);
        }
        callback(null, {
          action: result.rows[0]
        });
      })
    });
  });
};

var complete = function (id, callback) {
  if (!id) {
    return callback(new Error('Missing id'));
  }

  query('UPDATE "action" SET complete_data = $1, completed_at = NOW() WHERE id = $2', ['{}', id], function (error, result) {
    callback(error);
  });
};

module.exports = exports = {
  start: start,
  complete: complete
};
