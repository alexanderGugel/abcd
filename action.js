var query = require('./query');
var experiment = require('./experiment');
var variant = require('./variant');


var start = function (userId, experimentName, variantName, callback) {
  if (!experimentName) {
    callback(new Error('Missing experiment'));
  }

  if (!variantName) {
    callback(new Error('Missing variant'));
  }

  experiment.findOrCreateByNameForUser(userId, experimentName, function (error, experiment) {
    variant.findOrCreate(experiment.id, variantName, function (error, variant) {
      query('INSERT INTO "action" (variant_id, start_data) VALUES ($1, $2) RETURNING id', [variant.id, '{}'], function (error, result) {
        console.log(error);
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

var complete = function (id, data, callback) {
};

module.exports = exports = {
  start: start,
  complete: complete
};
