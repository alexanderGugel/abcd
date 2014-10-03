var query = require('./query');
var experiment = require('./experiment');

var start = function (experimentName, variantName, data, ip, callback) {
  // Convert endpoint to user_id

  // Check if experiment already exists
    // -> get experiment_id
  // Check if variant already exists
    // -> get variant_id



  // query('SELECT id FROM "experiment" WHERE user_id = $1 AND name = $2', [userId, experimentName], function (error, result) {
  //   var rows = result.rows;
  //   if (rows.length === 0) {
  //     // Create experiment
  //     experiment.createForUser(userId, experimentName, function (error, experimentId) {
  //
  //     });
  //   } else {
  //     // Experiment already exists
  //     rows[0].id
  //   }
  // });
  
};

var start = function (variant_id, data) {
};

var complete = function (id, data) {
};

module.exports = exports = {
  start: start,
  complete: complete
};
