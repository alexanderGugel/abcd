var query = require('./query');
var experiment = require('./experiment');
var variant = require('./variant');


var start = function (userId, experimentName, variantName, callback) {
  if (!experimentName) {
    return callback(new Error('Missing experiment'));
  }

  if (!variantName) {
    return callback(new Error('Missing variant'));
  }

  experiment.findOrCreateByNameForUser(userId, experimentName, function (error, experiment) {
    variant.findOrCreate(experiment.id, variantName, function (error, variant) {
      query('INSERT INTO "action" (variant_id, start_data) VALUES ($1, $2) RETURNING id', [variant.id, '{}'], function (error, result) {
        var rows = result.rows;
        callback(null, {
          experiment: experiment,
          variant: variant,
          action: rows[0]
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
    console.log(error);
    callback(null);
  });
};

module.exports = exports = {
  start: start,
  complete: complete
};
