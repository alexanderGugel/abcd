var query = require('./query');

var create = function (variantName, experimentId, callback) {
  query('INSERT INTO "variant" (name, experiment_id) VALUES ($1, $2) RETURNING id', [variantName, experimentId], function (error, result) {
    if (!error) {
      var rows = result.rows;
      callback(null, rows[0].id);
    } else if (error.code === '23505') {
      callback(new Error('Variant already exists'));
    }
  });
};

var findOrCreate = function (experimentId, variantName, callback) {
  query('SELECT * FROM "variant" WHERE experiment_id = $1 AND name = $2', [experimentId, variantName], function (error, result) {
    var rows = result.rows;
    if (rows.length === 0) {
      create(variantName, experimentId, function () {
        findOrCreate(experimentId, variantName, callback);
      });
    } else {
      callback(null, rows[0]);
    }
  });
};

module.exports = exports = {
  create: create,
  findOrCreate: findOrCreate
};
