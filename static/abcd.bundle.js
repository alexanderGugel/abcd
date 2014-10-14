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

window.abcd = {};
abcd.host = 'http://localhost:3000/api/';
abcd.endpoint = null;

abcd.participate = function (experiment) {
  return new Experiment(experiment);
};

var Experiment = function (experiment) {
  this.experiment = experiment;
  this.variants = {};
};

Experiment.prototype.variant = function (variant, callback) {
  this.variants[variant] = callback;
  return this;
};

Experiment.prototype.start = function () {
  var action = store.get('abcd:' + this.experiment);
  if (!action || !action.id) {
    action = {
      variant: Object.keys(this.variants)[Math.floor(Math.random()*Object.keys(this.variants).length)]
    };
    JSONP(abcd.host + 'actions/start', {
      variant: action.variant,
      experiment: this.experiment,
      endpoint: abcd.endpoint
    }, function (data) {
      action.id = data.action.id;
      store.set('abcd:' + this.experiment, action);
    }.bind(this));
  }
  this.variants[action.variant]();
};

abcd.complete = function (experiment) {
  var action = store.get('abcd:' + experiment);
  var go = function () {
    if (!action.id) {
      return;
      setTimeout(go, 1);
    }
    JSONP(abcd.host + 'actions/complete', {
      id: action.id,
      endpoint: abcd.endpoint
    }, function (data) {
      action.completed = true;
      store.set('abcd:' + experiment, action);
      console.log(data);
    });
  };

  !action.completed && go();
};

},{"store":"/Users/alexander/abcd/node_modules/store/store.js"}]},{},["/Users/alexander/abcd/static/abcd.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9zdGF0aWMvYWJjZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjsoZnVuY3Rpb24od2luKXtcblx0dmFyIHN0b3JlID0ge30sXG5cdFx0ZG9jID0gd2luLmRvY3VtZW50LFxuXHRcdGxvY2FsU3RvcmFnZU5hbWUgPSAnbG9jYWxTdG9yYWdlJyxcblx0XHRzY3JpcHRUYWcgPSAnc2NyaXB0Jyxcblx0XHRzdG9yYWdlXG5cblx0c3RvcmUuZGlzYWJsZWQgPSBmYWxzZVxuXHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbHVlKSB7fVxuXHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXkpIHt9XG5cdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkge31cblx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHt9XG5cdHN0b3JlLnRyYW5zYWN0ID0gZnVuY3Rpb24oa2V5LCBkZWZhdWx0VmFsLCB0cmFuc2FjdGlvbkZuKSB7XG5cdFx0dmFyIHZhbCA9IHN0b3JlLmdldChrZXkpXG5cdFx0aWYgKHRyYW5zYWN0aW9uRm4gPT0gbnVsbCkge1xuXHRcdFx0dHJhbnNhY3Rpb25GbiA9IGRlZmF1bHRWYWxcblx0XHRcdGRlZmF1bHRWYWwgPSBudWxsXG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnKSB7IHZhbCA9IGRlZmF1bHRWYWwgfHwge30gfVxuXHRcdHRyYW5zYWN0aW9uRm4odmFsKVxuXHRcdHN0b3JlLnNldChrZXksIHZhbClcblx0fVxuXHRzdG9yZS5nZXRBbGwgPSBmdW5jdGlvbigpIHt9XG5cdHN0b3JlLmZvckVhY2ggPSBmdW5jdGlvbigpIHt9XG5cblx0c3RvcmUuc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cdH1cblx0c3RvcmUuZGVzZXJpYWxpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHsgcmV0dXJuIHVuZGVmaW5lZCB9XG5cdFx0dHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UodmFsdWUpIH1cblx0XHRjYXRjaChlKSB7IHJldHVybiB2YWx1ZSB8fCB1bmRlZmluZWQgfVxuXHR9XG5cblx0Ly8gRnVuY3Rpb25zIHRvIGVuY2Fwc3VsYXRlIHF1ZXN0aW9uYWJsZSBGaXJlRm94IDMuNi4xMyBiZWhhdmlvclxuXHQvLyB3aGVuIGFib3V0LmNvbmZpZzo6ZG9tLnN0b3JhZ2UuZW5hYmxlZCA9PT0gZmFsc2Vcblx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzI2lzc3VlLzEzXG5cdGZ1bmN0aW9uIGlzTG9jYWxTdG9yYWdlTmFtZVN1cHBvcnRlZCgpIHtcblx0XHR0cnkgeyByZXR1cm4gKGxvY2FsU3RvcmFnZU5hbWUgaW4gd2luICYmIHdpbltsb2NhbFN0b3JhZ2VOYW1lXSkgfVxuXHRcdGNhdGNoKGVycikgeyByZXR1cm4gZmFsc2UgfVxuXHR9XG5cblx0aWYgKGlzTG9jYWxTdG9yYWdlTmFtZVN1cHBvcnRlZCgpKSB7XG5cdFx0c3RvcmFnZSA9IHdpbltsb2NhbFN0b3JhZ2VOYW1lXVxuXHRcdHN0b3JlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRpZiAodmFsID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHN0b3JlLnJlbW92ZShrZXkpIH1cblx0XHRcdHN0b3JhZ2Uuc2V0SXRlbShrZXksIHN0b3JlLnNlcmlhbGl6ZSh2YWwpKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH1cblx0XHRzdG9yZS5nZXQgPSBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHN0b3JlLmRlc2VyaWFsaXplKHN0b3JhZ2UuZ2V0SXRlbShrZXkpKSB9XG5cdFx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7IHN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpIH1cblx0XHRzdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkgeyBzdG9yYWdlLmNsZWFyKCkgfVxuXHRcdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdGZvciAodmFyIGk9MDsgaTxzdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHZhciBrZXkgPSBzdG9yYWdlLmtleShpKVxuXHRcdFx0XHRjYWxsYmFjayhrZXksIHN0b3JlLmdldChrZXkpKVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChkb2MuZG9jdW1lbnRFbGVtZW50LmFkZEJlaGF2aW9yKSB7XG5cdFx0dmFyIHN0b3JhZ2VPd25lcixcblx0XHRcdHN0b3JhZ2VDb250YWluZXJcblx0XHQvLyBTaW5jZSAjdXNlckRhdGEgc3RvcmFnZSBhcHBsaWVzIG9ubHkgdG8gc3BlY2lmaWMgcGF0aHMsIHdlIG5lZWQgdG9cblx0XHQvLyBzb21laG93IGxpbmsgb3VyIGRhdGEgdG8gYSBzcGVjaWZpYyBwYXRoLiAgV2UgY2hvb3NlIC9mYXZpY29uLmljb1xuXHRcdC8vIGFzIGEgcHJldHR5IHNhZmUgb3B0aW9uLCBzaW5jZSBhbGwgYnJvd3NlcnMgYWxyZWFkeSBtYWtlIGEgcmVxdWVzdCB0b1xuXHRcdC8vIHRoaXMgVVJMIGFueXdheSBhbmQgYmVpbmcgYSA0MDQgd2lsbCBub3QgaHVydCB1cyBoZXJlLiAgV2Ugd3JhcCBhblxuXHRcdC8vIGlmcmFtZSBwb2ludGluZyB0byB0aGUgZmF2aWNvbiBpbiBhbiBBY3RpdmVYT2JqZWN0KGh0bWxmaWxlKSBvYmplY3Rcblx0XHQvLyAoc2VlOiBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvYWE3NTI1NzQodj1WUy44NSkuYXNweClcblx0XHQvLyBzaW5jZSB0aGUgaWZyYW1lIGFjY2VzcyBydWxlcyBhcHBlYXIgdG8gYWxsb3cgZGlyZWN0IGFjY2VzcyBhbmRcblx0XHQvLyBtYW5pcHVsYXRpb24gb2YgdGhlIGRvY3VtZW50IGVsZW1lbnQsIGV2ZW4gZm9yIGEgNDA0IHBhZ2UuICBUaGlzXG5cdFx0Ly8gZG9jdW1lbnQgY2FuIGJlIHVzZWQgaW5zdGVhZCBvZiB0aGUgY3VycmVudCBkb2N1bWVudCAod2hpY2ggd291bGRcblx0XHQvLyBoYXZlIGJlZW4gbGltaXRlZCB0byB0aGUgY3VycmVudCBwYXRoKSB0byBwZXJmb3JtICN1c2VyRGF0YSBzdG9yYWdlLlxuXHRcdHRyeSB7XG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyID0gbmV3IEFjdGl2ZVhPYmplY3QoJ2h0bWxmaWxlJylcblx0XHRcdHN0b3JhZ2VDb250YWluZXIub3BlbigpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLndyaXRlKCc8JytzY3JpcHRUYWcrJz5kb2N1bWVudC53PXdpbmRvdzwvJytzY3JpcHRUYWcrJz48aWZyYW1lIHNyYz1cIi9mYXZpY29uLmljb1wiPjwvaWZyYW1lPicpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLmNsb3NlKClcblx0XHRcdHN0b3JhZ2VPd25lciA9IHN0b3JhZ2VDb250YWluZXIudy5mcmFtZXNbMF0uZG9jdW1lbnRcblx0XHRcdHN0b3JhZ2UgPSBzdG9yYWdlT3duZXIuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdC8vIHNvbWVob3cgQWN0aXZlWE9iamVjdCBpbnN0YW50aWF0aW9uIGZhaWxlZCAocGVyaGFwcyBzb21lIHNwZWNpYWxcblx0XHRcdC8vIHNlY3VyaXR5IHNldHRpbmdzIG9yIG90aGVyd3NlKSwgZmFsbCBiYWNrIHRvIHBlci1wYXRoIHN0b3JhZ2Vcblx0XHRcdHN0b3JhZ2UgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jylcblx0XHRcdHN0b3JhZ2VPd25lciA9IGRvYy5ib2R5XG5cdFx0fVxuXHRcdGZ1bmN0aW9uIHdpdGhJRVN0b3JhZ2Uoc3RvcmVGdW5jdGlvbikge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcblx0XHRcdFx0YXJncy51bnNoaWZ0KHN0b3JhZ2UpXG5cdFx0XHRcdC8vIFNlZSBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzEwODEodj1WUy44NSkuYXNweFxuXHRcdFx0XHQvLyBhbmQgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxNDI0KHY9VlMuODUpLmFzcHhcblx0XHRcdFx0c3RvcmFnZU93bmVyLmFwcGVuZENoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHN0b3JhZ2UuYWRkQmVoYXZpb3IoJyNkZWZhdWx0I3VzZXJEYXRhJylcblx0XHRcdFx0c3RvcmFnZS5sb2FkKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0XHRcdHZhciByZXN1bHQgPSBzdG9yZUZ1bmN0aW9uLmFwcGx5KHN0b3JlLCBhcmdzKVxuXHRcdFx0XHRzdG9yYWdlT3duZXIucmVtb3ZlQ2hpbGQoc3RvcmFnZSlcblx0XHRcdFx0cmV0dXJuIHJlc3VsdFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEluIElFNywga2V5cyBjYW5ub3Qgc3RhcnQgd2l0aCBhIGRpZ2l0IG9yIGNvbnRhaW4gY2VydGFpbiBjaGFycy5cblx0XHQvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMvNDBcblx0XHQvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMvODNcblx0XHR2YXIgZm9yYmlkZGVuQ2hhcnNSZWdleCA9IG5ldyBSZWdFeHAoXCJbIVxcXCIjJCUmJygpKissL1xcXFxcXFxcOjs8PT4/QFtcXFxcXV5ge3x9fl1cIiwgXCJnXCIpXG5cdFx0ZnVuY3Rpb24gaWVLZXlGaXgoa2V5KSB7XG5cdFx0XHRyZXR1cm4ga2V5LnJlcGxhY2UoL15kLywgJ19fXyQmJykucmVwbGFjZShmb3JiaWRkZW5DaGFyc1JlZ2V4LCAnX19fJylcblx0XHR9XG5cdFx0c3RvcmUuc2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXksIHZhbCkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEF0dHJpYnV0ZShrZXksIHN0b3JlLnNlcmlhbGl6ZSh2YWwpKVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0XHRyZXR1cm4gdmFsXG5cdFx0fSlcblx0XHRzdG9yZS5nZXQgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0cmV0dXJuIHN0b3JlLmRlc2VyaWFsaXplKHN0b3JhZ2UuZ2V0QXR0cmlidXRlKGtleSkpXG5cdFx0fSlcblx0XHRzdG9yZS5yZW1vdmUgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSkge1xuXHRcdFx0a2V5ID0gaWVLZXlGaXgoa2V5KVxuXHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0fSlcblx0XHRzdG9yZS5jbGVhciA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdGZvciAodmFyIGk9MCwgYXR0cjsgYXR0cj1hdHRyaWJ1dGVzW2ldOyBpKyspIHtcblx0XHRcdFx0c3RvcmFnZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ci5uYW1lKVxuXHRcdFx0fVxuXHRcdFx0c3RvcmFnZS5zYXZlKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0fSlcblx0XHRzdG9yZS5nZXRBbGwgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG5cdFx0XHR2YXIgcmV0ID0ge31cblx0XHRcdHN0b3JlLmZvckVhY2goZnVuY3Rpb24oa2V5LCB2YWwpIHtcblx0XHRcdFx0cmV0W2tleV0gPSB2YWxcblx0XHRcdH0pXG5cdFx0XHRyZXR1cm4gcmV0XG5cdFx0fVxuXHRcdHN0b3JlLmZvckVhY2ggPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgYXR0cmlidXRlcyA9IHN0b3JhZ2UuWE1MRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmF0dHJpYnV0ZXNcblx0XHRcdGZvciAodmFyIGk9MCwgYXR0cjsgYXR0cj1hdHRyaWJ1dGVzW2ldOyArK2kpIHtcblx0XHRcdFx0Y2FsbGJhY2soYXR0ci5uYW1lLCBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShhdHRyLm5hbWUpKSlcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0dHJ5IHtcblx0XHR2YXIgdGVzdEtleSA9ICdfX3N0b3JlanNfXydcblx0XHRzdG9yZS5zZXQodGVzdEtleSwgdGVzdEtleSlcblx0XHRpZiAoc3RvcmUuZ2V0KHRlc3RLZXkpICE9IHRlc3RLZXkpIHsgc3RvcmUuZGlzYWJsZWQgPSB0cnVlIH1cblx0XHRzdG9yZS5yZW1vdmUodGVzdEtleSlcblx0fSBjYXRjaChlKSB7XG5cdFx0c3RvcmUuZGlzYWJsZWQgPSB0cnVlXG5cdH1cblx0c3RvcmUuZW5hYmxlZCA9ICFzdG9yZS5kaXNhYmxlZFxuXG5cdGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzICYmIHRoaXMubW9kdWxlICE9PSBtb2R1bGUpIHsgbW9kdWxlLmV4cG9ydHMgPSBzdG9yZSB9XG5cdGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgeyBkZWZpbmUoc3RvcmUpIH1cblx0ZWxzZSB7IHdpbi5zdG9yZSA9IHN0b3JlIH1cblxufSkoRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKSk7XG4iLCJ2YXIgc3RvcmUgPSByZXF1aXJlKCdzdG9yZScpO1xuXG4vKipcbiAqIEpTT05QIHNldHMgdXAgYW5kIGFsbG93cyB5b3UgdG8gZXhlY3V0ZSBhIEpTT05QIHJlcXVlc3RcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgIFRoZSBVUkwgeW91IGFyZSByZXF1ZXN0aW5nIHdpdGggdGhlIEpTT04gZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IGRhdGEgVGhlIERhdGEgb2JqZWN0IHlvdSB3YW50IHRvIGdlbmVyYXRlIHRoZSBVUkwgcGFyYW1zIGZyb21cbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2QgIFRoZSBtZXRob2QgbmFtZSBmb3IgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLiBEZWZhdWx0cyB0byBjYWxsYmFjayAoZm9yIGV4YW1wbGUsIGZsaWNrcidzIGlzIFwianNvbmNhbGxiYWNrXCIpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAgVGhlIGNhbGxiYWNrIHlvdSB3YW50IHRvIGV4ZWN1dGUgYXMgYW4gYW5vbnltb3VzIGZ1bmN0aW9uLiBUaGUgZmlyc3QgcGFyYW1ldGVyIG9mIHRoZSBhbm9ueW1vdXMgY2FsbGJhY2sgZnVuY3Rpb24gaXMgdGhlIEpTT05cbiAqXG4gKiBAZXhhbXBsZVxuICogSlNPTlAoJ2h0dHA6Ly90d2l0dGVyLmNvbS91c2Vycy9vc2NhcmdvZHNvbi5qc29uJyxmdW5jdGlvbihqc29uKXtcbiAqICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXZhdGFyJykuaW5uZXJIVE1MID0gJzxwPlR3aXR0ZXIgUGljOjwvcD48aW1nIHNyYz1cIicranNvbi5wcm9maWxlX2ltYWdlX3VybCsnXCI+JztcbiAqIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiBKU09OUCgnaHR0cDovL2FwaS5mbGlja3IuY29tL3NlcnZpY2VzL2ZlZWRzL3Bob3Rvc19wdWJsaWMuZ25lJyx7J2lkJzonMTIzODk5NDRATjAzJywnZm9ybWF0JzonanNvbid9LCdqc29uY2FsbGJhY2snLGZ1bmN0aW9uKGpzb24pe1xuICogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmbGlja3JQaWMnKS5pbm5lckhUTUwgPSAnPHA+RmxpY2tyIFBpYzo8L3A+PGltZyBzcmM9XCInK2pzb24uaXRlbXNbMF0ubWVkaWEubSsnXCI+JztcbiAqIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKiBKU09OUCgnaHR0cDovL2dyYXBoLmZhY2Vib29rLmNvbS9GYWNlYm9va0RldmVsb3BlcnMnLCAnY2FsbGJhY2snLCBmdW5jdGlvbihqc29uKXtcbiAqICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmFjZWJvb2snKS5pbm5lckhUTUwgPSBqc29uLmFib3V0O1xuICogfSk7XG4gKi9cbihmdW5jdGlvbiggd2luZG93LCB1bmRlZmluZWQpIHtcbiAgdmFyIEpTT05QID0gZnVuY3Rpb24odXJsLGRhdGEsbWV0aG9kLGNhbGxiYWNrKXtcbiAgICAvL1NldCB0aGUgZGVmYXVsdHNcbiAgICB1cmwgPSB1cmwgfHwgJyc7XG4gICAgZGF0YSA9IGRhdGEgfHwge307XG4gICAgbWV0aG9kID0gbWV0aG9kIHx8ICcnO1xuICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24oKXt9O1xuXG4gICAgLy9HZXRzIGFsbCB0aGUga2V5cyB0aGF0IGJlbG9uZ1xuICAgIC8vdG8gYW4gb2JqZWN0XG4gICAgdmFyIGdldEtleXMgPSBmdW5jdGlvbihvYmope1xuICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgIGZvcih2YXIga2V5IGluIG9iail7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXlzO1xuICAgIH1cblxuICAgIC8vVHVybiB0aGUgZGF0YSBvYmplY3QgaW50byBhIHF1ZXJ5IHN0cmluZy5cbiAgICAvL0FkZCBjaGVjayB0byBzZWUgaWYgdGhlIHNlY29uZCBwYXJhbWV0ZXIgaXMgaW5kZWVkXG4gICAgLy9hIGRhdGEgb2JqZWN0LiBJZiBub3QsIGtlZXAgdGhlIGRlZmF1bHQgYmVoYXZpb3VyXG4gICAgaWYodHlwZW9mIGRhdGEgPT0gJ29iamVjdCcpe1xuICAgICAgdmFyIHF1ZXJ5U3RyaW5nID0gJyc7XG4gICAgICB2YXIga2V5cyA9IGdldEtleXMoZGF0YSk7XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHF1ZXJ5U3RyaW5nICs9IGVuY29kZVVSSUNvbXBvbmVudChrZXlzW2ldKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChkYXRhW2tleXNbaV1dKVxuICAgICAgICBpZihpICE9IGtleXMubGVuZ3RoIC0gMSl7XG4gICAgICAgICAgcXVlcnlTdHJpbmcgKz0gJyYnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB1cmwgKz0gJz8nICsgcXVlcnlTdHJpbmc7XG4gICAgfSBlbHNlIGlmKHR5cGVvZiBkYXRhID09ICdmdW5jdGlvbicpe1xuICAgICAgbWV0aG9kID0gZGF0YTtcbiAgICAgIGNhbGxiYWNrID0gbWV0aG9kO1xuICAgIH1cblxuICAgIC8vSWYgbm8gbWV0aG9kIHdhcyBzZXQgYW5kIHRoZXkgdXNlZCB0aGUgY2FsbGJhY2sgcGFyYW0gaW4gcGxhY2Ugb2ZcbiAgICAvL3RoZSBtZXRob2QgcGFyYW0gaW5zdGVhZCwgd2Ugc2F5IG1ldGhvZCBpcyBjYWxsYmFjayBhbmQgc2V0IGFcbiAgICAvL2RlZmF1bHQgbWV0aG9kIG9mIFwiY2FsbGJhY2tcIlxuICAgIGlmKHR5cGVvZiBtZXRob2QgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBjYWxsYmFjayA9IG1ldGhvZDtcbiAgICAgIG1ldGhvZCA9ICdjYWxsYmFjayc7XG4gICAgfVxuXG4gICAgLy9DaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBEYXRlLm5vdyBhdmFpbGFibGUsIGlmIG5vdCBzaGltIGl0IGZvciBvbGRlciBicm93c2Vyc1xuICAgIGlmKCFEYXRlLm5vdyl7XG4gICAgICBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG4gICAgfVxuXG4gICAgLy9Vc2UgdGltZXN0YW1wICsgYSByYW5kb20gZmFjdG9yIHRvIGFjY291bnQgZm9yIGEgbG90IG9mIHJlcXVlc3RzIGluIGEgc2hvcnQgdGltZVxuICAgIC8vZS5nLiBqc29ucDEzOTQ1NzE3NzUxNjFcbiAgICB2YXIgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZ2VuZXJhdGVkRnVuY3Rpb24gPSAnanNvbnAnK01hdGgucm91bmQodGltZXN0YW1wK01hdGgucmFuZG9tKCkqMTAwMDAwMSlcblxuICAgIC8vR2VuZXJhdGUgdGhlIHRlbXAgSlNPTlAgZnVuY3Rpb24gdXNpbmcgdGhlIG5hbWUgYWJvdmVcbiAgICAvL0ZpcnN0LCBjYWxsIHRoZSBmdW5jdGlvbiB0aGUgdXNlciBkZWZpbmVkIGluIHRoZSBjYWxsYmFjayBwYXJhbSBbY2FsbGJhY2soanNvbildXG4gICAgLy9UaGVuIGRlbGV0ZSB0aGUgZ2VuZXJhdGVkIGZ1bmN0aW9uIGZyb20gdGhlIHdpbmRvdyBbZGVsZXRlIHdpbmRvd1tnZW5lcmF0ZWRGdW5jdGlvbl1dXG4gICAgd2luZG93W2dlbmVyYXRlZEZ1bmN0aW9uXSA9IGZ1bmN0aW9uKGpzb24pe1xuICAgICAgY2FsbGJhY2soanNvbik7XG4gICAgICBkZWxldGUgd2luZG93W2dlbmVyYXRlZEZ1bmN0aW9uXTtcbiAgICB9O1xuXG4gICAgLy9DaGVjayBpZiB0aGUgdXNlciBzZXQgdGhlaXIgb3duIHBhcmFtcywgYW5kIGlmIG5vdCBhZGQgYSA/IHRvIHN0YXJ0IGEgbGlzdCBvZiBwYXJhbXNcbiAgICAvL0lmIGluIGZhY3QgdGhleSBkaWQgd2UgYWRkIGEgJiB0byBhZGQgb250byB0aGUgcGFyYW1zXG4gICAgLy9leGFtcGxlMTogdXJsID0gaHR0cDovL3VybC5jb20gVEhFTiBodHRwOi8vdXJsLmNvbT9jYWxsYmFjaz1YXG4gICAgLy9leGFtcGxlMjogdXJsID0gaHR0cDovL3VybC5jb20/ZXhhbXBsZT1wYXJhbSBUSEVOIGh0dHA6Ly91cmwuY29tP2V4YW1wbGU9cGFyYW0mY2FsbGJhY2s9WFxuICAgIGlmKHVybC5pbmRleE9mKCc/JykgPT09IC0xKXsgdXJsID0gdXJsKyc/JzsgfVxuICAgIGVsc2V7IHVybCA9IHVybCsnJic7IH1cblxuICAgIC8vVGhpcyBnZW5lcmF0ZXMgdGhlIDxzY3JpcHQ+IHRhZ1xuICAgIHZhciBqc29ucFNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIGpzb25wU2NyaXB0LnNldEF0dHJpYnV0ZShcInNyY1wiLCB1cmwrbWV0aG9kKyc9JytnZW5lcmF0ZWRGdW5jdGlvbik7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLmFwcGVuZENoaWxkKGpzb25wU2NyaXB0KVxuICB9XG4gIHdpbmRvdy5KU09OUCA9IEpTT05QO1xufSkod2luZG93KTtcblxuLy8vXG5cbndpbmRvdy5hYmNkID0ge307XG5hYmNkLmhvc3QgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2FwaS8nO1xuYWJjZC5lbmRwb2ludCA9IG51bGw7XG5cbmFiY2QucGFydGljaXBhdGUgPSBmdW5jdGlvbiAoZXhwZXJpbWVudCkge1xuICByZXR1cm4gbmV3IEV4cGVyaW1lbnQoZXhwZXJpbWVudCk7XG59O1xuXG52YXIgRXhwZXJpbWVudCA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4gIHRoaXMuZXhwZXJpbWVudCA9IGV4cGVyaW1lbnQ7XG4gIHRoaXMudmFyaWFudHMgPSB7fTtcbn07XG5cbkV4cGVyaW1lbnQucHJvdG90eXBlLnZhcmlhbnQgPSBmdW5jdGlvbiAodmFyaWFudCwgY2FsbGJhY2spIHtcbiAgdGhpcy52YXJpYW50c1t2YXJpYW50XSA9IGNhbGxiYWNrO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV4cGVyaW1lbnQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYWN0aW9uID0gc3RvcmUuZ2V0KCdhYmNkOicgKyB0aGlzLmV4cGVyaW1lbnQpO1xuICBpZiAoIWFjdGlvbiB8fCAhYWN0aW9uLmlkKSB7XG4gICAgYWN0aW9uID0ge1xuICAgICAgdmFyaWFudDogT2JqZWN0LmtleXModGhpcy52YXJpYW50cylbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKk9iamVjdC5rZXlzKHRoaXMudmFyaWFudHMpLmxlbmd0aCldXG4gICAgfTtcbiAgICBKU09OUChhYmNkLmhvc3QgKyAnYWN0aW9ucy9zdGFydCcsIHtcbiAgICAgIHZhcmlhbnQ6IGFjdGlvbi52YXJpYW50LFxuICAgICAgZXhwZXJpbWVudDogdGhpcy5leHBlcmltZW50LFxuICAgICAgZW5kcG9pbnQ6IGFiY2QuZW5kcG9pbnRcbiAgICB9LCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgYWN0aW9uLmlkID0gZGF0YS5hY3Rpb24uaWQ7XG4gICAgICBzdG9yZS5zZXQoJ2FiY2Q6JyArIHRoaXMuZXhwZXJpbWVudCwgYWN0aW9uKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG4gIHRoaXMudmFyaWFudHNbYWN0aW9uLnZhcmlhbnRdKCk7XG59O1xuXG5hYmNkLmNvbXBsZXRlID0gZnVuY3Rpb24gKGV4cGVyaW1lbnQpIHtcbiAgdmFyIGFjdGlvbiA9IHN0b3JlLmdldCgnYWJjZDonICsgZXhwZXJpbWVudCk7XG4gIHZhciBnbyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWFjdGlvbi5pZCkge1xuICAgICAgcmV0dXJuO1xuICAgICAgc2V0VGltZW91dChnbywgMSk7XG4gICAgfVxuICAgIEpTT05QKGFiY2QuaG9zdCArICdhY3Rpb25zL2NvbXBsZXRlJywge1xuICAgICAgaWQ6IGFjdGlvbi5pZCxcbiAgICAgIGVuZHBvaW50OiBhYmNkLmVuZHBvaW50XG4gICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGFjdGlvbi5jb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgc3RvcmUuc2V0KCdhYmNkOicgKyBleHBlcmltZW50LCBhY3Rpb24pO1xuICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfSk7XG4gIH07XG5cbiAgIWFjdGlvbi5jb21wbGV0ZWQgJiYgZ28oKTtcbn07XG4iXX0=
