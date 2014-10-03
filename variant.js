var query = require('./query');
var experiment = require('./experiment');

var findOrCreate = function (userId, experimentName, variantName) {
  experiment.findOrCreateForUser(userId, experimentName, function (err, experiment) {
  })
};

var complete = function (id, data) {
};

module.exports = exports = {
  start: start,
  complete: complete
};
