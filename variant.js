var query = require('./query');

var create = function (experimentId, variantName, callback) {
  query('INSERT INTO "variant" (name, experiment_id) VALUES ($1, $2) RETURNING id, name, experiment_id', [variantName, experimentId], function (error, result) {
    if (!error) {
      var rows = result.rows;
      callback(null, rows[0]);
    } else if (error.code === '23505') {
      callback(new Error('Variant already exists'));
    } else {
      callback(error);
    }
  });
};

var readOrCreate = function (experimentId, variantName, callback) {
  query('SELECT * FROM "variant" WHERE experiment_id = $1 AND name = $2', [experimentId, variantName], function (error, result) {
    if (error) {
      callback(error);
    } else if (result.rows.length === 0) {
      create(experimentId, variantName, callback);
    } else {
      callback(null, result.rows[0]);
    }
  });
};

module.exports = exports = {
  create: create,
  readOrCreate: readOrCreate
};
