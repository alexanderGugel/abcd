(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], function (exports) {
      root.Abcd = factory(root, exports);
    });
  } else if (typeof exports !== 'undefined') {
    factory(root, exports);
  } else {
    root.Abcd = factory(root, {});
  }
}(this, function (root, Abcd) {
  // options.persists
  // options.endpoint
  var Experiment = function (name, options) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('No name specified for event');
    }
    this.name = name;
    this.options = options || {};
    this.variants = [];
  };

  var _Variant = function (name, options, callback) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('No name specified for variant');
    }
    this.name = name;
    this.options = options || {};
    this.callback = callback || function () {};
    this.options.weight = this.options.weight || 1;
  };

  Experiment.prototype.addVariant = function (name, options, callback) {
    this.variants.push(new _Variant(name, options, callback));
    return this;
  };

  // Experiment.prototype.continue = function () {
  // };

  Experiment.prototype.start = function (name) {
    if (name) {
      request = new XMLHttpRequest();
      request.open('GET', '/my/url', true);

      request.onload = function() {
        if (request.status >= 200 && request.status < 400){
          // Success!
          resp = request.responseText;
        } else {
          // We reached our target server, but it returned an error

        }
      };

      request.onerror = function() {
        // There was a connection error of some sort
      };

      request.send();
    } else {
      var absoluteWeight = 0;
      for (var i = 0; i < this.variant.length; i++) {
        absoluteWeight
      }

    }
  };

  Experiment.prototype.complete = function () {

  };

  Experiment.prototype.reset = function () {

  };

  Experiment.prototype.continue = function () {

  };
});
