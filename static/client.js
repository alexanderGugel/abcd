var store = require('store');
var jsonp = require('jsonp');

var storePrefix = 'abcd';
var host = 'http://localhost:3000/api/';

var Experiment = function (id) {
  this.id = id;
};

Experiment.prototype.participate = function (variant, callback) {
  var self = this;

  if (!callback) {
    throw new Error('No callback function specified');
  }

  if (Array.isArray(variant)) {
    variant = variant[Math.floor(Math.random()*variant.length)];
  }

  var variant = store.get(storePrefix + ':' + this.id + ':' + 'variant') || variant;
  store.set(storePrefix + ':' + this.id + ':' + 'variant', variant);

  var actionId = store.get(storePrefix + ':' + this.id + ':' + 'actionId');

  if (actionId) {
    return callback(null, {
      actionId: actionId,
      variant: variant
    });
  }

  jsonp(
    encodeURI(host + 'experiments/' + this.id + '/participate?variant=' + variant),
    function (error, data) {
      if (error) {
        return callback(error);
      }

      if (data.error) {
        return callback(new Error(data.error));
      }

      var actionId = data.actionId;

      store.set(storePrefix + ':' + self.id + ':' + 'actionId', actionId);

      callback(null, {
        actionId: actionId,
        variant: variant
      });
    }
  );
};

var makeErrorHandler = function (callback) {
  return function (error) {
    if (callback) {
      callback(error);
    } else {
      throw error;
    }
  };
};

Experiment.prototype.convert = function (callback) {
  var errorHandler = makeErrorHandler(callback);

  var actionId = store.get(storePrefix + ':' + this.id + ':' + 'actionId');

  jsonp(
    encodeURI(host + 'experiments/' + this.id + '/convert?action_id=' + actionId),
    function (error, data) {
      if (error) {
        return errorHandler(error);
      }

      if (data.error) {
        return errorHandler(new Error(data.error));
      }

      callback && callback(null, {
        actionId: actionId
      });
    }
  );
};

Experiment.prototype.reset = function () {
  store.remove(storePrefix + ':' + this.id + ':' + 'variant');
  store.remove(storePrefix + ':' + this.id + ':' + 'actionId');
};

window.abcd = {
  Experiment: Experiment
};
