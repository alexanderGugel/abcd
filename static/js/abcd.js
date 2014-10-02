var extend, getCookie, host, request, setCookie,
  __slice = [].slice;

host = function(url) {
  var parent, parser;
  parent = document.createElement('div');
  parent.innerHTML = "<a href=\"" + url + "\">x</a>";
  parser = parent.firstChild;
  return "" + parser.host;
};

request = function(url, params, callback) {
  var image, k, v;
  if (params == null) {
    params = {};
  }
  params.i = new Date().getTime();
  params = ((function() {
    var _results;
    _results = [];
    for (k in params) {
      v = params[k];
      _results.push("" + k + "=" + (encodeURIComponent(v)));
    }
    return _results;
  })()).join('&');
  image = new Image;
  if (callback) {
    image.onload = callback;
  }
  image.src = "" + url + "?" + params;
  return true;
};

setCookie = function(name, value, options) {
  var cookie, expires;
  if (options == null) {
    options = {};
  }
  if (options.expires === true) {
    options.expires = -1;
  }
  if (typeof options.expires === 'number') {
    expires = new Date;
    expires.setTime(expires.getTime() + options.expires * 24 * 60 * 60 * 1000);
    options.expires = expires;
  }
  value = (value + '').replace(/[^!#-+\--:<-\[\]-~]/g, encodeURIComponent);
  cookie = encodeURIComponent(name) + '=' + value;
  if (options.expires) {
    cookie += ';expires=' + options.expires.toGMTString();
  }
  if (options.path) {
    cookie += ';path=' + options.path;
  }
  if (options.domain) {
    cookie += ';domain=' + options.domain;
  }
  return document.cookie = cookie;
};

getCookie = function(name) {
  var cookie, cookies, index, key, value, _i, _len;
  cookies = document.cookie.split('; ');
  for (_i = 0, _len = cookies.length; _i < _len; _i++) {
    cookie = cookies[_i];
    index = cookie.indexOf('=');
    key = decodeURIComponent(cookie.substr(0, index));
    value = decodeURIComponent(cookie.substr(index + 1));
    if (key === name) {
      return value;
    }
  }
  return null;
};

extend = function() {
  var args, key, source, target, value, _i, _len;
  target = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (_i = 0, _len = args.length; _i < _len; _i++) {
    source = args[_i];
    for (key in source) {
      value = source[key];
      if (value != null) {
        target[key] = value;
      }
    }
  }
  return target;
};

this.Abba = (function() {
  Abba.prototype.endpoint = 'http://localhost:4567';

  Abba.prototype.defaults = {
    path: '/',
    expires: 600
  };

  function Abba(name, options) {
    if (options == null) {
      options = {};
    }
    if (!name) {
      throw new Error('Experiment name required');
    }
    if (!(this instanceof Abba)) {
      return new Abba(name, options);
    }
    this.name = name;
    this.options = options;
    this.variants = [];
    this.endpoint = this.options.endpoint || this.constructor.endpoint;
  }

  Abba.prototype.variant = function(name, options, callback) {
    if (typeof name !== 'string') {
      throw new Error('Variant name required');
    }
    if (typeof options !== 'object') {
      callback = options;
      options = {};
    }
    options.name = name;
    options.callback = callback;
    if (options.weight == null) {
      options.weight = 1;
    }
    this.variants.push(options);
    return this;
  };

  Abba.prototype.control = function(name, options, callback) {
    if (name == null) {
      name = 'Control';
    }
    if (typeof options !== 'object') {
      callback = options;
      options = {};
    }
    options.control = true;
    return this.variant(name, options, callback);
  };

  Abba.prototype["continue"] = function() {
    var variant;
    if (variant = this.getPreviousVariant()) {
      this.useVariant(variant);
    }
    return this;
  };

  Abba.prototype.start = function(name, options) {
    var randomWeight, totalWeight, v, variant, variantWeight, _i, _j, _len, _len1, _ref, _ref1;
    if (options == null) {
      options = {};
    }
    if (variant = this.getPreviousVariant()) {
      this.useVariant(variant);
      return this;
    }
    if (name != null) {
      variant = this.getVariantForName(name);
      variant || (variant = {
        name: name,
        control: options.control
      });
    } else {
      totalWeight = 0;
      _ref = this.variants;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        totalWeight += v.weight;
      }
      randomWeight = Math.random() * totalWeight;
      variantWeight = 0;
      _ref1 = this.variants;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        variant = _ref1[_j];
        variantWeight += variant.weight;
        if (variantWeight >= randomWeight) {
          break;
        }
      }
    }
    if (!variant) {
      throw new Error('No variants added');
    }
    this.recordStart(variant);
    this.useVariant(variant);
    return this;
  };

  Abba.prototype.complete = function(name) {
    name || (name = this.getVariantCookie());
    if (!name) {
      return this;
    }
    if (this.hasPersistCompleteCookie()) {
      return this;
    }
    if (this.options.persist) {
      this.setPersistCompleteCookie();
    } else {
      this.reset();
    }
    this.recordComplete(name);
    return this;
  };

  Abba.prototype.reset = function() {
    this.removeVariantCookie();
    this.removePersistCompleteCookie();
    this.result = null;
    return this;
  };

  Abba.prototype.getVariantForName = function(name) {
    var v;
    return ((function() {
      var _i, _len, _ref, _results;
      _ref = this.variants;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (v.name === name) {
          _results.push(v);
        }
      }
      return _results;
    }).call(this))[0];
  };

  Abba.prototype.useVariant = function(variant) {
    if (variant != null) {
      if (typeof variant.callback === "function") {
        variant.callback();
      }
    }
    return this.chosen = variant;
  };

  Abba.prototype.recordStart = function(variant) {
    request("" + this.endpoint + "/start", {
      experiment: this.name,
      variant: variant.name,
      control: variant.control || false
    });
    return this.setVariantCookie(variant.name);
  };

  Abba.prototype.recordComplete = function(name) {
    return request("" + this.endpoint + "/complete", {
      experiment: this.name,
      variant: name
    });
  };

  Abba.prototype.getPreviousVariant = function() {
    var name;
    if (name = this.getVariantCookie()) {
      return this.getVariantForName(name);
    }
  };

  Abba.prototype.getVariantCookie = function() {
    return this.getCookie("abbaVariant_" + this.name);
  };

  Abba.prototype.setVariantCookie = function(value) {
    return this.setCookie("abbaVariant_" + this.name, value, {
      expires: this.options.expires
    });
  };

  Abba.prototype.removeVariantCookie = function() {
    return this.setCookie("abbaVariant_" + this.name, '', {
      expires: true
    });
  };

  Abba.prototype.setPersistCompleteCookie = function() {
    return this.setCookie("abbaPersistComplete_" + this.name, '1', {
      expires: this.options.expires
    });
  };

  Abba.prototype.hasPersistCompleteCookie = function() {
    return !!this.getCookie("abbaPersistComplete_" + this.name);
  };

  Abba.prototype.removePersistCompleteCookie = function() {
    return this.setCookie("abbaPersistComplete_" + this.name, '', {
      expires: true
    });
  };

  Abba.prototype.setCookie = function(name, value, options) {
    if (options == null) {
      options = {};
    }
    return setCookie(name, value, extend({}, this.defaults, options));
  };

  Abba.prototype.getCookie = function(name, options) {
    if (options == null) {
      options = {};
    }
    return getCookie(name, extend({}, this.defaults, options));
  };

  return Abba;

})();

(function() {
  var script, scripts;
  scripts = document.getElementsByTagName('script');
  scripts = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      script = scripts[_i];
      if (/\/abba\.js$/.test(script.src)) {
        _results.push(script.src);
      }
    }
    return _results;
  })();
  if (scripts[0]) {
    return Abba.endpoint = "//" + (host(scripts[0]));
  }
})();
