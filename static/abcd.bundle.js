(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/alexander/abcd/node_modules/store/store.js":[function(require,module,exports){
;(function(win){
	var store = {},
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.set = function(key, value) {}
	store.get = function(key) {}
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		var val = store.get(key)
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (typeof val == 'undefined') { val = defaultVal || {} }
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key) { return store.deserialize(storage.getItem(key)) }
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		function withIEStorage(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		function ieKeyFix(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			return store.deserialize(storage.getAttribute(key))
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=0, attr; attr=attributes[i]; i++) {
				storage.removeAttribute(attr.name)
			}
			storage.save(localStorageName)
		})
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled

	if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = store }
	else if (typeof define === 'function' && define.amd) { define(store) }
	else { win.store = store }

})(Function('return this')());

},{}],"/Users/alexander/abcd/static/abcd.js":[function(require,module,exports){
var store = require('store');

/**
 * JSONP sets up and allows you to execute a JSONP request
 * @param {String} url  The URL you are requesting with the JSON data
 * @param {Object} data The Data object you want to generate the URL params from
 * @param {String} method  The method name for the callback function. Defaults to callback (for example, flickr's is "jsoncallback")
 * @param {Function} callback  The callback you want to execute as an anonymous function. The first parameter of the anonymous callback function is the JSON
 *
 * @example
 * JSONP('http://twitter.com/users/oscargodson.json',function(json){
 *  document.getElementById('avatar').innerHTML = '<p>Twitter Pic:</p><img src="'+json.profile_image_url+'">';
 * });
 *
 * @example
 * JSONP('http://api.flickr.com/services/feeds/photos_public.gne',{'id':'12389944@N03','format':'json'},'jsoncallback',function(json){
 *  document.getElementById('flickrPic').innerHTML = '<p>Flickr Pic:</p><img src="'+json.items[0].media.m+'">';
 * });
 *
 * @example
 * JSONP('http://graph.facebook.com/FacebookDevelopers', 'callback', function(json){
 *  document.getElementById('facebook').innerHTML = json.about;
 * });
 */
(function( window, undefined) {
  var JSONP = function(url,data,method,callback){
    //Set the defaults
    url = url || '';
    data = data || {};
    method = method || '';
    callback = callback || function(){};

    //Gets all the keys that belong
    //to an object
    var getKeys = function(obj){
      var keys = [];
      for(var key in obj){
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }

      }
      return keys;
    }

    //Turn the data object into a query string.
    //Add check to see if the second parameter is indeed
    //a data object. If not, keep the default behaviour
    if(typeof data == 'object'){
      var queryString = '';
      var keys = getKeys(data);
      for(var i = 0; i < keys.length; i++){
        queryString += encodeURIComponent(keys[i]) + '=' + encodeURIComponent(data[keys[i]])
        if(i != keys.length - 1){
          queryString += '&';
        }
      }
      url += '?' + queryString;
    } else if(typeof data == 'function'){
      method = data;
      callback = method;
    }

    //If no method was set and they used the callback param in place of
    //the method param instead, we say method is callback and set a
    //default method of "callback"
    if(typeof method == 'function'){
      callback = method;
      method = 'callback';
    }

    //Check to see if we have Date.now available, if not shim it for older browsers
    if(!Date.now){
      Date.now = function() { return new Date().getTime(); };
    }

    //Use timestamp + a random factor to account for a lot of requests in a short time
    //e.g. jsonp1394571775161
    var timestamp = Date.now();
    var generatedFunction = 'jsonp'+Math.round(timestamp+Math.random()*1000001)

    //Generate the temp JSONP function using the name above
    //First, call the function the user defined in the callback param [callback(json)]
    //Then delete the generated function from the window [delete window[generatedFunction]]
    window[generatedFunction] = function(json){
      callback(json);
      delete window[generatedFunction];
    };

    //Check if the user set their own params, and if not add a ? to start a list of params
    //If in fact they did we add a & to add onto the params
    //example1: url = http://url.com THEN http://url.com?callback=X
    //example2: url = http://url.com?example=param THEN http://url.com?example=param&callback=X
    if(url.indexOf('?') === -1){ url = url+'?'; }
    else{ url = url+'&'; }

    //This generates the <script> tag
    var jsonpScript = document.createElement('script');
    jsonpScript.setAttribute("src", url+method+'='+generatedFunction);
    document.getElementsByTagName("head")[0].appendChild(jsonpScript)
  }
  window.JSONP = JSONP;
})(window);

///
//
// window.abcd = {};

// abcd.host = 'http://localhost:3000/api/';
// abcd.endpoint = null;

// abcd.participate = function (experiment) {
//   return new Experiment(experiment);
// };
//
// abcd.reset = function (experiment) {
//   return new Experiment(experiment).reset();
// };
//
// var Experiment = function (experiment) {
//   this.experiment = experiment;
//   this.variants = {};
// };
//
// Experiment.prototype.variant = function (variant, callback) {
//   this.variants[variant] = callback || function () {};
//   return this;
// };
//
// Experiment.prototype.start = function (callback) {
//   var action = store.get('abcd:' + this.experiment);
//   if (!action || !action.id) {
//     action = {
//       variant: Object.keys(this.variants)[Math.floor(Math.random()*Object.keys(this.variants).length)]
//     };
//     JSONP(abcd.host + 'actions/start', {
//       variant: action.variant,
//       experiment: this.experiment,
//       endpoint: abcd.endpoint
//     }, function (data) {
//       if (data.error) {
//         var error = data.error;
//         if (callback) {
//           callback(error)
//         } else {
//           throw error;
//         }
//       } else {
//         action.id = data.action.id;
//         store.set('abcd:' + this.experiment, action);
//         callback && callback(null, action);
//       }
//     }.bind(this));
//   }
//   this.variants[action.variant]();
//   return this;
// };
//
// Experiment.prototype.reset = function () {
//   store.remove('abcd:' + this.experiment);
//   return this;
// };
//
// abcd.complete = function (experiment) {
//   var action = store.get('abcd:' + experiment);
//   var go = function () {
//     if (!action.id) {
//       return;
//       setTimeout(go, 1);
//     }
//     JSONP(abcd.host + 'actions/complete', {
//       id: action.id,
//       endpoint: abcd.endpoint
//     }, function (data) {
//       action.completed = true;
//       store.set('abcd:' + experiment, action);
//       console.log(data);
//     });
//   };
//
//   action && !action.completed && go();
// };

var host = 'http://localhost:3000/api/';

var participate = function (options, callback) {
  if (!options.variant || !options.experiment || !options.endpoint) {
    throw new Error('Missing variant/ experiment/ endpoint');
  }
  JSONP(abcd.host + 'participate', {
    variant: options.variant,
    experiment: options.experiment,
    endpoint: options.endpoint
  }, function (data) {
    if (data.error) {
      var error = data.error;
      (callback && callback(data.error)) || (function () {
        throw new Error(data.error);
      })();
    } else {
      callback && callback(null, data.action.id);
    }
  });
};

var convert = function (options, callback) {
  if (!options.action || !options.endpoint) {
    throw new Error('Missing action/ endpoint');
  }
  JSONP(abcd.host + 'convert', {
    action: options.action,
    endpoint: options.endpoint
  }, function (data) {
    if (data.error) {
      var error = data.error;
      (callback && callback(data.error)) || (function () {
        throw new Error(data.error);
      })();
    } else {
      callback && callback(null);
    }
  });
};

window.abcd = {
  host: host,
  participate: participate,
  convert: convert
};

},{"store":"/Users/alexander/abcd/node_modules/store/store.js"}]},{},["/Users/alexander/abcd/static/abcd.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9zdGF0aWMvYWJjZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7KGZ1bmN0aW9uKHdpbil7XG5cdHZhciBzdG9yZSA9IHt9LFxuXHRcdGRvYyA9IHdpbi5kb2N1bWVudCxcblx0XHRsb2NhbFN0b3JhZ2VOYW1lID0gJ2xvY2FsU3RvcmFnZScsXG5cdFx0c2NyaXB0VGFnID0gJ3NjcmlwdCcsXG5cdFx0c3RvcmFnZVxuXG5cdHN0b3JlLmRpc2FibGVkID0gZmFsc2Vcblx0c3RvcmUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge31cblx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7fVxuXHRzdG9yZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHt9XG5cdHN0b3JlLmNsZWFyID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS50cmFuc2FjdCA9IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCwgdHJhbnNhY3Rpb25Gbikge1xuXHRcdHZhciB2YWwgPSBzdG9yZS5nZXQoa2V5KVxuXHRcdGlmICh0cmFuc2FjdGlvbkZuID09IG51bGwpIHtcblx0XHRcdHRyYW5zYWN0aW9uRm4gPSBkZWZhdWx0VmFsXG5cdFx0XHRkZWZhdWx0VmFsID0gbnVsbFxuXHRcdH1cblx0XHRpZiAodHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJykgeyB2YWwgPSBkZWZhdWx0VmFsIHx8IHt9IH1cblx0XHR0cmFuc2FjdGlvbkZuKHZhbClcblx0XHRzdG9yZS5zZXQoa2V5LCB2YWwpXG5cdH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oKSB7fVxuXG5cdHN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXHR9XG5cdHN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxuXHRcdHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XG5cdFx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cblx0fVxuXG5cdC8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcblx0Ly8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3VlcyNpc3N1ZS8xM1xuXHRmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdFx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0XHRjYXRjaChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cblx0fVxuXG5cdGlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRcdHN0b3JhZ2UgPSB3aW5bbG9jYWxTdG9yYWdlTmFtZV1cblx0XHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9XG5cdFx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7IHJldHVybiBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEl0ZW0oa2V5KSkgfVxuXHRcdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkgeyBzdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KSB9XG5cdFx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHsgc3RvcmFnZS5jbGVhcigpIH1cblx0XHRzdG9yZS5nZXRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciByZXQgPSB7fVxuXHRcdFx0c3RvcmUuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0XHRyZXRba2V5XSA9IHZhbFxuXHRcdFx0fSlcblx0XHRcdHJldHVybiByZXRcblx0XHR9XG5cdFx0c3RvcmUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8c3RvcmFnZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIga2V5ID0gc3RvcmFnZS5rZXkoaSlcblx0XHRcdFx0Y2FsbGJhY2soa2V5LCBzdG9yZS5nZXQoa2V5KSlcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHRcdHZhciBzdG9yYWdlT3duZXIsXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdFx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdFx0Ly8gc29tZWhvdyBsaW5rIG91ciBkYXRhIHRvIGEgc3BlY2lmaWMgcGF0aC4gIFdlIGNob29zZSAvZmF2aWNvbi5pY29cblx0XHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0XHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0XHQvLyBpZnJhbWUgcG9pbnRpbmcgdG8gdGhlIGZhdmljb24gaW4gYW4gQWN0aXZlWE9iamVjdChodG1sZmlsZSkgb2JqZWN0XG5cdFx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdFx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdFx0Ly8gbWFuaXB1bGF0aW9uIG9mIHRoZSBkb2N1bWVudCBlbGVtZW50LCBldmVuIGZvciBhIDQwNCBwYWdlLiAgVGhpc1xuXHRcdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0XHR0cnkge1xuXHRcdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci53cml0ZSgnPCcrc2NyaXB0VGFnKyc+ZG9jdW1lbnQudz13aW5kb3c8Lycrc2NyaXB0VGFnKyc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0XHRzdG9yYWdlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHRcdH1cblx0XHRmdW5jdGlvbiB3aXRoSUVTdG9yYWdlKHN0b3JlRnVuY3Rpb24pIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRcdGFyZ3MudW5zaGlmdChzdG9yYWdlKVxuXHRcdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcblx0XHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHJldHVybiByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXG5cdFx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRcdGZ1bmN0aW9uIGllS2V5Rml4KGtleSkge1xuXHRcdFx0cmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdFx0fVxuXHRcdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXkpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHJldHVybiBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdH0pXG5cdFx0c3RvcmUucmVtb3ZlID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXkpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGtleSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuY2xlYXIgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UpIHtcblx0XHRcdHZhciBhdHRyaWJ1dGVzID0gc3RvcmFnZS5YTUxEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXR0cmlidXRlc1xuXHRcdFx0c3RvcmFnZS5sb2FkKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgaSsrKSB7XG5cdFx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSlcblx0XHRcdH1cblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHRyeSB7XG5cdFx0dmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXG5cdFx0c3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXG5cdFx0aWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XG5cdFx0c3RvcmUucmVtb3ZlKHRlc3RLZXkpXG5cdH0gY2F0Y2goZSkge1xuXHRcdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxuXHR9XG5cdHN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyAmJiB0aGlzLm1vZHVsZSAhPT0gbW9kdWxlKSB7IG1vZHVsZS5leHBvcnRzID0gc3RvcmUgfVxuXHRlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHsgZGVmaW5lKHN0b3JlKSB9XG5cdGVsc2UgeyB3aW4uc3RvcmUgPSBzdG9yZSB9XG5cbn0pKEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCkpO1xuIiwidmFyIHN0b3JlID0gcmVxdWlyZSgnc3RvcmUnKTtcblxuLyoqXG4gKiBKU09OUCBzZXRzIHVwIGFuZCBhbGxvd3MgeW91IHRvIGV4ZWN1dGUgYSBKU09OUCByZXF1ZXN0XG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsICBUaGUgVVJMIHlvdSBhcmUgcmVxdWVzdGluZyB3aXRoIHRoZSBKU09OIGRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIFRoZSBEYXRhIG9iamVjdCB5b3Ugd2FudCB0byBnZW5lcmF0ZSB0aGUgVVJMIHBhcmFtcyBmcm9tXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kICBUaGUgbWV0aG9kIG5hbWUgZm9yIHRoZSBjYWxsYmFjayBmdW5jdGlvbi4gRGVmYXVsdHMgdG8gY2FsbGJhY2sgKGZvciBleGFtcGxlLCBmbGlja3IncyBpcyBcImpzb25jYWxsYmFja1wiKVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgIFRoZSBjYWxsYmFjayB5b3Ugd2FudCB0byBleGVjdXRlIGFzIGFuIGFub255bW91cyBmdW5jdGlvbi4gVGhlIGZpcnN0IHBhcmFtZXRlciBvZiB0aGUgYW5vbnltb3VzIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIHRoZSBKU09OXG4gKlxuICogQGV4YW1wbGVcbiAqIEpTT05QKCdodHRwOi8vdHdpdHRlci5jb20vdXNlcnMvb3NjYXJnb2Rzb24uanNvbicsZnVuY3Rpb24oanNvbil7XG4gKiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F2YXRhcicpLmlubmVySFRNTCA9ICc8cD5Ud2l0dGVyIFBpYzo8L3A+PGltZyBzcmM9XCInK2pzb24ucHJvZmlsZV9pbWFnZV91cmwrJ1wiPic7XG4gKiB9KTtcbiAqXG4gKiBAZXhhbXBsZVxuICogSlNPTlAoJ2h0dHA6Ly9hcGkuZmxpY2tyLmNvbS9zZXJ2aWNlcy9mZWVkcy9waG90b3NfcHVibGljLmduZScseydpZCc6JzEyMzg5OTQ0QE4wMycsJ2Zvcm1hdCc6J2pzb24nfSwnanNvbmNhbGxiYWNrJyxmdW5jdGlvbihqc29uKXtcbiAqICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmxpY2tyUGljJykuaW5uZXJIVE1MID0gJzxwPkZsaWNrciBQaWM6PC9wPjxpbWcgc3JjPVwiJytqc29uLml0ZW1zWzBdLm1lZGlhLm0rJ1wiPic7XG4gKiB9KTtcbiAqXG4gKiBAZXhhbXBsZVxuICogSlNPTlAoJ2h0dHA6Ly9ncmFwaC5mYWNlYm9vay5jb20vRmFjZWJvb2tEZXZlbG9wZXJzJywgJ2NhbGxiYWNrJywgZnVuY3Rpb24oanNvbil7XG4gKiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZhY2Vib29rJykuaW5uZXJIVE1MID0ganNvbi5hYm91dDtcbiAqIH0pO1xuICovXG4oZnVuY3Rpb24oIHdpbmRvdywgdW5kZWZpbmVkKSB7XG4gIHZhciBKU09OUCA9IGZ1bmN0aW9uKHVybCxkYXRhLG1ldGhvZCxjYWxsYmFjayl7XG4gICAgLy9TZXQgdGhlIGRlZmF1bHRzXG4gICAgdXJsID0gdXJsIHx8ICcnO1xuICAgIGRhdGEgPSBkYXRhIHx8IHt9O1xuICAgIG1ldGhvZCA9IG1ldGhvZCB8fCAnJztcbiAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uKCl7fTtcblxuICAgIC8vR2V0cyBhbGwgdGhlIGtleXMgdGhhdCBiZWxvbmdcbiAgICAvL3RvIGFuIG9iamVjdFxuICAgIHZhciBnZXRLZXlzID0gZnVuY3Rpb24ob2JqKXtcbiAgICAgIHZhciBrZXlzID0gW107XG4gICAgICBmb3IodmFyIGtleSBpbiBvYmope1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgICByZXR1cm4ga2V5cztcbiAgICB9XG5cbiAgICAvL1R1cm4gdGhlIGRhdGEgb2JqZWN0IGludG8gYSBxdWVyeSBzdHJpbmcuXG4gICAgLy9BZGQgY2hlY2sgdG8gc2VlIGlmIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGluZGVlZFxuICAgIC8vYSBkYXRhIG9iamVjdC4gSWYgbm90LCBrZWVwIHRoZSBkZWZhdWx0IGJlaGF2aW91clxuICAgIGlmKHR5cGVvZiBkYXRhID09ICdvYmplY3QnKXtcbiAgICAgIHZhciBxdWVyeVN0cmluZyA9ICcnO1xuICAgICAgdmFyIGtleXMgPSBnZXRLZXlzKGRhdGEpO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspe1xuICAgICAgICBxdWVyeVN0cmluZyArPSBlbmNvZGVVUklDb21wb25lbnQoa2V5c1tpXSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoZGF0YVtrZXlzW2ldXSlcbiAgICAgICAgaWYoaSAhPSBrZXlzLmxlbmd0aCAtIDEpe1xuICAgICAgICAgIHF1ZXJ5U3RyaW5nICs9ICcmJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdXJsICs9ICc/JyArIHF1ZXJ5U3RyaW5nO1xuICAgIH0gZWxzZSBpZih0eXBlb2YgZGF0YSA9PSAnZnVuY3Rpb24nKXtcbiAgICAgIG1ldGhvZCA9IGRhdGE7XG4gICAgICBjYWxsYmFjayA9IG1ldGhvZDtcbiAgICB9XG5cbiAgICAvL0lmIG5vIG1ldGhvZCB3YXMgc2V0IGFuZCB0aGV5IHVzZWQgdGhlIGNhbGxiYWNrIHBhcmFtIGluIHBsYWNlIG9mXG4gICAgLy90aGUgbWV0aG9kIHBhcmFtIGluc3RlYWQsIHdlIHNheSBtZXRob2QgaXMgY2FsbGJhY2sgYW5kIHNldCBhXG4gICAgLy9kZWZhdWx0IG1ldGhvZCBvZiBcImNhbGxiYWNrXCJcbiAgICBpZih0eXBlb2YgbWV0aG9kID09ICdmdW5jdGlvbicpe1xuICAgICAgY2FsbGJhY2sgPSBtZXRob2Q7XG4gICAgICBtZXRob2QgPSAnY2FsbGJhY2snO1xuICAgIH1cblxuICAgIC8vQ2hlY2sgdG8gc2VlIGlmIHdlIGhhdmUgRGF0ZS5ub3cgYXZhaWxhYmxlLCBpZiBub3Qgc2hpbSBpdCBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICBpZighRGF0ZS5ub3cpe1xuICAgICAgRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuICAgIH1cblxuICAgIC8vVXNlIHRpbWVzdGFtcCArIGEgcmFuZG9tIGZhY3RvciB0byBhY2NvdW50IGZvciBhIGxvdCBvZiByZXF1ZXN0cyBpbiBhIHNob3J0IHRpbWVcbiAgICAvL2UuZy4ganNvbnAxMzk0NTcxNzc1MTYxXG4gICAgdmFyIHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgdmFyIGdlbmVyYXRlZEZ1bmN0aW9uID0gJ2pzb25wJytNYXRoLnJvdW5kKHRpbWVzdGFtcCtNYXRoLnJhbmRvbSgpKjEwMDAwMDEpXG5cbiAgICAvL0dlbmVyYXRlIHRoZSB0ZW1wIEpTT05QIGZ1bmN0aW9uIHVzaW5nIHRoZSBuYW1lIGFib3ZlXG4gICAgLy9GaXJzdCwgY2FsbCB0aGUgZnVuY3Rpb24gdGhlIHVzZXIgZGVmaW5lZCBpbiB0aGUgY2FsbGJhY2sgcGFyYW0gW2NhbGxiYWNrKGpzb24pXVxuICAgIC8vVGhlbiBkZWxldGUgdGhlIGdlbmVyYXRlZCBmdW5jdGlvbiBmcm9tIHRoZSB3aW5kb3cgW2RlbGV0ZSB3aW5kb3dbZ2VuZXJhdGVkRnVuY3Rpb25dXVxuICAgIHdpbmRvd1tnZW5lcmF0ZWRGdW5jdGlvbl0gPSBmdW5jdGlvbihqc29uKXtcbiAgICAgIGNhbGxiYWNrKGpzb24pO1xuICAgICAgZGVsZXRlIHdpbmRvd1tnZW5lcmF0ZWRGdW5jdGlvbl07XG4gICAgfTtcblxuICAgIC8vQ2hlY2sgaWYgdGhlIHVzZXIgc2V0IHRoZWlyIG93biBwYXJhbXMsIGFuZCBpZiBub3QgYWRkIGEgPyB0byBzdGFydCBhIGxpc3Qgb2YgcGFyYW1zXG4gICAgLy9JZiBpbiBmYWN0IHRoZXkgZGlkIHdlIGFkZCBhICYgdG8gYWRkIG9udG8gdGhlIHBhcmFtc1xuICAgIC8vZXhhbXBsZTE6IHVybCA9IGh0dHA6Ly91cmwuY29tIFRIRU4gaHR0cDovL3VybC5jb20/Y2FsbGJhY2s9WFxuICAgIC8vZXhhbXBsZTI6IHVybCA9IGh0dHA6Ly91cmwuY29tP2V4YW1wbGU9cGFyYW0gVEhFTiBodHRwOi8vdXJsLmNvbT9leGFtcGxlPXBhcmFtJmNhbGxiYWNrPVhcbiAgICBpZih1cmwuaW5kZXhPZignPycpID09PSAtMSl7IHVybCA9IHVybCsnPyc7IH1cbiAgICBlbHNleyB1cmwgPSB1cmwrJyYnOyB9XG5cbiAgICAvL1RoaXMgZ2VuZXJhdGVzIHRoZSA8c2NyaXB0PiB0YWdcbiAgICB2YXIganNvbnBTY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBqc29ucFNjcmlwdC5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdXJsK21ldGhvZCsnPScrZ2VuZXJhdGVkRnVuY3Rpb24pO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChqc29ucFNjcmlwdClcbiAgfVxuICB3aW5kb3cuSlNPTlAgPSBKU09OUDtcbn0pKHdpbmRvdyk7XG5cbi8vL1xuLy9cbi8vIHdpbmRvdy5hYmNkID0ge307XG5cbi8vIGFiY2QuaG9zdCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpLyc7XG4vLyBhYmNkLmVuZHBvaW50ID0gbnVsbDtcblxuLy8gYWJjZC5wYXJ0aWNpcGF0ZSA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4vLyAgIHJldHVybiBuZXcgRXhwZXJpbWVudChleHBlcmltZW50KTtcbi8vIH07XG4vL1xuLy8gYWJjZC5yZXNldCA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4vLyAgIHJldHVybiBuZXcgRXhwZXJpbWVudChleHBlcmltZW50KS5yZXNldCgpO1xuLy8gfTtcbi8vXG4vLyB2YXIgRXhwZXJpbWVudCA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4vLyAgIHRoaXMuZXhwZXJpbWVudCA9IGV4cGVyaW1lbnQ7XG4vLyAgIHRoaXMudmFyaWFudHMgPSB7fTtcbi8vIH07XG4vL1xuLy8gRXhwZXJpbWVudC5wcm90b3R5cGUudmFyaWFudCA9IGZ1bmN0aW9uICh2YXJpYW50LCBjYWxsYmFjaykge1xuLy8gICB0aGlzLnZhcmlhbnRzW3ZhcmlhbnRdID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG4vLyAgIHJldHVybiB0aGlzO1xuLy8gfTtcbi8vXG4vLyBFeHBlcmltZW50LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuLy8gICB2YXIgYWN0aW9uID0gc3RvcmUuZ2V0KCdhYmNkOicgKyB0aGlzLmV4cGVyaW1lbnQpO1xuLy8gICBpZiAoIWFjdGlvbiB8fCAhYWN0aW9uLmlkKSB7XG4vLyAgICAgYWN0aW9uID0ge1xuLy8gICAgICAgdmFyaWFudDogT2JqZWN0LmtleXModGhpcy52YXJpYW50cylbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk9iamVjdC5rZXlzKHRoaXMudmFyaWFudHMpLmxlbmd0aCldXG4vLyAgICAgfTtcbi8vICAgICBKU09OUChhYmNkLmhvc3QgKyAnYWN0aW9ucy9zdGFydCcsIHtcbi8vICAgICAgIHZhcmlhbnQ6IGFjdGlvbi52YXJpYW50LFxuLy8gICAgICAgZXhwZXJpbWVudDogdGhpcy5leHBlcmltZW50LFxuLy8gICAgICAgZW5kcG9pbnQ6IGFiY2QuZW5kcG9pbnRcbi8vICAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuLy8gICAgICAgaWYgKGRhdGEuZXJyb3IpIHtcbi8vICAgICAgICAgdmFyIGVycm9yID0gZGF0YS5lcnJvcjtcbi8vICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4vLyAgICAgICAgICAgY2FsbGJhY2soZXJyb3IpXG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIGFjdGlvbi5pZCA9IGRhdGEuYWN0aW9uLmlkO1xuLy8gICAgICAgICBzdG9yZS5zZXQoJ2FiY2Q6JyArIHRoaXMuZXhwZXJpbWVudCwgYWN0aW9uKTtcbi8vICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgYWN0aW9uKTtcbi8vICAgICAgIH1cbi8vICAgICB9LmJpbmQodGhpcykpO1xuLy8gICB9XG4vLyAgIHRoaXMudmFyaWFudHNbYWN0aW9uLnZhcmlhbnRdKCk7XG4vLyAgIHJldHVybiB0aGlzO1xuLy8gfTtcbi8vXG4vLyBFeHBlcmltZW50LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgc3RvcmUucmVtb3ZlKCdhYmNkOicgKyB0aGlzLmV4cGVyaW1lbnQpO1xuLy8gICByZXR1cm4gdGhpcztcbi8vIH07XG4vL1xuLy8gYWJjZC5jb21wbGV0ZSA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4vLyAgIHZhciBhY3Rpb24gPSBzdG9yZS5nZXQoJ2FiY2Q6JyArIGV4cGVyaW1lbnQpO1xuLy8gICB2YXIgZ28gPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgaWYgKCFhY3Rpb24uaWQpIHtcbi8vICAgICAgIHJldHVybjtcbi8vICAgICAgIHNldFRpbWVvdXQoZ28sIDEpO1xuLy8gICAgIH1cbi8vICAgICBKU09OUChhYmNkLmhvc3QgKyAnYWN0aW9ucy9jb21wbGV0ZScsIHtcbi8vICAgICAgIGlkOiBhY3Rpb24uaWQsXG4vLyAgICAgICBlbmRwb2ludDogYWJjZC5lbmRwb2ludFxuLy8gICAgIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4vLyAgICAgICBhY3Rpb24uY29tcGxldGVkID0gdHJ1ZTtcbi8vICAgICAgIHN0b3JlLnNldCgnYWJjZDonICsgZXhwZXJpbWVudCwgYWN0aW9uKTtcbi8vICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuLy8gICAgIH0pO1xuLy8gICB9O1xuLy9cbi8vICAgYWN0aW9uICYmICFhY3Rpb24uY29tcGxldGVkICYmIGdvKCk7XG4vLyB9O1xuXG52YXIgaG9zdCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvYXBpLyc7XG5cbnZhciBwYXJ0aWNpcGF0ZSA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoIW9wdGlvbnMudmFyaWFudCB8fCAhb3B0aW9ucy5leHBlcmltZW50IHx8ICFvcHRpb25zLmVuZHBvaW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHZhcmlhbnQvIGV4cGVyaW1lbnQvIGVuZHBvaW50Jyk7XG4gIH1cbiAgSlNPTlAoYWJjZC5ob3N0ICsgJ3BhcnRpY2lwYXRlJywge1xuICAgIHZhcmlhbnQ6IG9wdGlvbnMudmFyaWFudCxcbiAgICBleHBlcmltZW50OiBvcHRpb25zLmV4cGVyaW1lbnQsXG4gICAgZW5kcG9pbnQ6IG9wdGlvbnMuZW5kcG9pbnRcbiAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZiAoZGF0YS5lcnJvcikge1xuICAgICAgdmFyIGVycm9yID0gZGF0YS5lcnJvcjtcbiAgICAgIChjYWxsYmFjayAmJiBjYWxsYmFjayhkYXRhLmVycm9yKSkgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEuZXJyb3IpO1xuICAgICAgfSkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgZGF0YS5hY3Rpb24uaWQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG52YXIgY29udmVydCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoIW9wdGlvbnMuYWN0aW9uIHx8ICFvcHRpb25zLmVuZHBvaW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGFjdGlvbi8gZW5kcG9pbnQnKTtcbiAgfVxuICBKU09OUChhYmNkLmhvc3QgKyAnY29udmVydCcsIHtcbiAgICBhY3Rpb246IG9wdGlvbnMuYWN0aW9uLFxuICAgIGVuZHBvaW50OiBvcHRpb25zLmVuZHBvaW50XG4gIH0sIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYgKGRhdGEuZXJyb3IpIHtcbiAgICAgIHZhciBlcnJvciA9IGRhdGEuZXJyb3I7XG4gICAgICAoY2FsbGJhY2sgJiYgY2FsbGJhY2soZGF0YS5lcnJvcikpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLmVycm9yKTtcbiAgICAgIH0pKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwpO1xuICAgIH1cbiAgfSk7XG59O1xuXG53aW5kb3cuYWJjZCA9IHtcbiAgaG9zdDogaG9zdCxcbiAgcGFydGljaXBhdGU6IHBhcnRpY2lwYXRlLFxuICBjb252ZXJ0OiBjb252ZXJ0XG59O1xuIl19
