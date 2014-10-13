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
  // debugger
  JSONP(abcd.host + 'actions/complete', {
    id: action.id,
    endpoint: abcd.endpoint
  });
};

window.s = store;

},{"store":"/Users/alexander/abcd/node_modules/store/store.js"}]},{},["/Users/alexander/abcd/static/abcd.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9zdGF0aWMvYWJjZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiOyhmdW5jdGlvbih3aW4pe1xuXHR2YXIgc3RvcmUgPSB7fSxcblx0XHRkb2MgPSB3aW4uZG9jdW1lbnQsXG5cdFx0bG9jYWxTdG9yYWdlTmFtZSA9ICdsb2NhbFN0b3JhZ2UnLFxuXHRcdHNjcmlwdFRhZyA9ICdzY3JpcHQnLFxuXHRcdHN0b3JhZ2VcblxuXHRzdG9yZS5kaXNhYmxlZCA9IGZhbHNlXG5cdHN0b3JlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHt9XG5cdHN0b3JlLmdldCA9IGZ1bmN0aW9uKGtleSkge31cblx0c3RvcmUucmVtb3ZlID0gZnVuY3Rpb24oa2V5KSB7fVxuXHRzdG9yZS5jbGVhciA9IGZ1bmN0aW9uKCkge31cblx0c3RvcmUudHJhbnNhY3QgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWwsIHRyYW5zYWN0aW9uRm4pIHtcblx0XHR2YXIgdmFsID0gc3RvcmUuZ2V0KGtleSlcblx0XHRpZiAodHJhbnNhY3Rpb25GbiA9PSBudWxsKSB7XG5cdFx0XHR0cmFuc2FjdGlvbkZuID0gZGVmYXVsdFZhbFxuXHRcdFx0ZGVmYXVsdFZhbCA9IG51bGxcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCcpIHsgdmFsID0gZGVmYXVsdFZhbCB8fCB7fSB9XG5cdFx0dHJhbnNhY3Rpb25Gbih2YWwpXG5cdFx0c3RvcmUuc2V0KGtleSwgdmFsKVxuXHR9XG5cdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKCkge31cblx0c3RvcmUuZm9yRWFjaCA9IGZ1bmN0aW9uKCkge31cblxuXHRzdG9yZS5zZXJpYWxpemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblx0fVxuXHRzdG9yZS5kZXNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgeyByZXR1cm4gdW5kZWZpbmVkIH1cblx0XHR0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSkgfVxuXHRcdGNhdGNoKGUpIHsgcmV0dXJuIHZhbHVlIHx8IHVuZGVmaW5lZCB9XG5cdH1cblxuXHQvLyBGdW5jdGlvbnMgdG8gZW5jYXBzdWxhdGUgcXVlc3Rpb25hYmxlIEZpcmVGb3ggMy42LjEzIGJlaGF2aW9yXG5cdC8vIHdoZW4gYWJvdXQuY29uZmlnOjpkb20uc3RvcmFnZS5lbmFibGVkID09PSBmYWxzZVxuXHQvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21hcmN1c3dlc3Rpbi9zdG9yZS5qcy9pc3N1ZXMjaXNzdWUvMTNcblx0ZnVuY3Rpb24gaXNMb2NhbFN0b3JhZ2VOYW1lU3VwcG9ydGVkKCkge1xuXHRcdHRyeSB7IHJldHVybiAobG9jYWxTdG9yYWdlTmFtZSBpbiB3aW4gJiYgd2luW2xvY2FsU3RvcmFnZU5hbWVdKSB9XG5cdFx0Y2F0Y2goZXJyKSB7IHJldHVybiBmYWxzZSB9XG5cdH1cblxuXHRpZiAoaXNMb2NhbFN0b3JhZ2VOYW1lU3VwcG9ydGVkKCkpIHtcblx0XHRzdG9yYWdlID0gd2luW2xvY2FsU3RvcmFnZU5hbWVdXG5cdFx0c3RvcmUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRJdGVtKGtleSwgc3RvcmUuc2VyaWFsaXplKHZhbCkpXG5cdFx0XHRyZXR1cm4gdmFsXG5cdFx0fVxuXHRcdHN0b3JlLmdldCA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRJdGVtKGtleSkpIH1cblx0XHRzdG9yZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHsgc3RvcmFnZS5yZW1vdmVJdGVtKGtleSkgfVxuXHRcdHN0b3JlLmNsZWFyID0gZnVuY3Rpb24oKSB7IHN0b3JhZ2UuY2xlYXIoKSB9XG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcmV0ID0ge31cblx0XHRcdHN0b3JlLmZvckVhY2goZnVuY3Rpb24oa2V5LCB2YWwpIHtcblx0XHRcdFx0cmV0W2tleV0gPSB2YWxcblx0XHRcdH0pXG5cdFx0XHRyZXR1cm4gcmV0XG5cdFx0fVxuXHRcdHN0b3JlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPHN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGtleSA9IHN0b3JhZ2Uua2V5KGkpXG5cdFx0XHRcdGNhbGxiYWNrKGtleSwgc3RvcmUuZ2V0KGtleSkpXG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGRvYy5kb2N1bWVudEVsZW1lbnQuYWRkQmVoYXZpb3IpIHtcblx0XHR2YXIgc3RvcmFnZU93bmVyLFxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lclxuXHRcdC8vIFNpbmNlICN1c2VyRGF0YSBzdG9yYWdlIGFwcGxpZXMgb25seSB0byBzcGVjaWZpYyBwYXRocywgd2UgbmVlZCB0b1xuXHRcdC8vIHNvbWVob3cgbGluayBvdXIgZGF0YSB0byBhIHNwZWNpZmljIHBhdGguICBXZSBjaG9vc2UgL2Zhdmljb24uaWNvXG5cdFx0Ly8gYXMgYSBwcmV0dHkgc2FmZSBvcHRpb24sIHNpbmNlIGFsbCBicm93c2VycyBhbHJlYWR5IG1ha2UgYSByZXF1ZXN0IHRvXG5cdFx0Ly8gdGhpcyBVUkwgYW55d2F5IGFuZCBiZWluZyBhIDQwNCB3aWxsIG5vdCBodXJ0IHVzIGhlcmUuICBXZSB3cmFwIGFuXG5cdFx0Ly8gaWZyYW1lIHBvaW50aW5nIHRvIHRoZSBmYXZpY29uIGluIGFuIEFjdGl2ZVhPYmplY3QoaHRtbGZpbGUpIG9iamVjdFxuXHRcdC8vIChzZWU6IGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9hYTc1MjU3NCh2PVZTLjg1KS5hc3B4KVxuXHRcdC8vIHNpbmNlIHRoZSBpZnJhbWUgYWNjZXNzIHJ1bGVzIGFwcGVhciB0byBhbGxvdyBkaXJlY3QgYWNjZXNzIGFuZFxuXHRcdC8vIG1hbmlwdWxhdGlvbiBvZiB0aGUgZG9jdW1lbnQgZWxlbWVudCwgZXZlbiBmb3IgYSA0MDQgcGFnZS4gIFRoaXNcblx0XHQvLyBkb2N1bWVudCBjYW4gYmUgdXNlZCBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IGRvY3VtZW50ICh3aGljaCB3b3VsZFxuXHRcdC8vIGhhdmUgYmVlbiBsaW1pdGVkIHRvIHRoZSBjdXJyZW50IHBhdGgpIHRvIHBlcmZvcm0gI3VzZXJEYXRhIHN0b3JhZ2UuXG5cdFx0dHJ5IHtcblx0XHRcdHN0b3JhZ2VDb250YWluZXIgPSBuZXcgQWN0aXZlWE9iamVjdCgnaHRtbGZpbGUnKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5vcGVuKClcblx0XHRcdHN0b3JhZ2VDb250YWluZXIud3JpdGUoJzwnK3NjcmlwdFRhZysnPmRvY3VtZW50Lnc9d2luZG93PC8nK3NjcmlwdFRhZysnPjxpZnJhbWUgc3JjPVwiL2Zhdmljb24uaWNvXCI+PC9pZnJhbWU+Jylcblx0XHRcdHN0b3JhZ2VDb250YWluZXIuY2xvc2UoKVxuXHRcdFx0c3RvcmFnZU93bmVyID0gc3RvcmFnZUNvbnRhaW5lci53LmZyYW1lc1swXS5kb2N1bWVudFxuXHRcdFx0c3RvcmFnZSA9IHN0b3JhZ2VPd25lci5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0Ly8gc29tZWhvdyBBY3RpdmVYT2JqZWN0IGluc3RhbnRpYXRpb24gZmFpbGVkIChwZXJoYXBzIHNvbWUgc3BlY2lhbFxuXHRcdFx0Ly8gc2VjdXJpdHkgc2V0dGluZ3Mgb3Igb3RoZXJ3c2UpLCBmYWxsIGJhY2sgdG8gcGVyLXBhdGggc3RvcmFnZVxuXHRcdFx0c3RvcmFnZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXHRcdFx0c3RvcmFnZU93bmVyID0gZG9jLmJvZHlcblx0XHR9XG5cdFx0ZnVuY3Rpb24gd2l0aElFU3RvcmFnZShzdG9yZUZ1bmN0aW9uKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuXHRcdFx0XHRhcmdzLnVuc2hpZnQoc3RvcmFnZSlcblx0XHRcdFx0Ly8gU2VlIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTA4MSh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdC8vIGFuZCBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzE0MjQodj1WUy44NSkuYXNweFxuXHRcdFx0XHRzdG9yYWdlT3duZXIuYXBwZW5kQ2hpbGQoc3RvcmFnZSlcblx0XHRcdFx0c3RvcmFnZS5hZGRCZWhhdmlvcignI2RlZmF1bHQjdXNlckRhdGEnKVxuXHRcdFx0XHRzdG9yYWdlLmxvYWQobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdFx0dmFyIHJlc3VsdCA9IHN0b3JlRnVuY3Rpb24uYXBwbHkoc3RvcmUsIGFyZ3MpXG5cdFx0XHRcdHN0b3JhZ2VPd25lci5yZW1vdmVDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRyZXR1cm4gcmVzdWx0XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSW4gSUU3LCBrZXlzIGNhbm5vdCBzdGFydCB3aXRoIGEgZGlnaXQgb3IgY29udGFpbiBjZXJ0YWluIGNoYXJzLlxuXHRcdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3Vlcy80MFxuXHRcdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3Vlcy84M1xuXHRcdHZhciBmb3JiaWRkZW5DaGFyc1JlZ2V4ID0gbmV3IFJlZ0V4cChcIlshXFxcIiMkJSYnKCkqKywvXFxcXFxcXFw6Ozw9Pj9AW1xcXFxdXmB7fH1+XVwiLCBcImdcIilcblx0XHRmdW5jdGlvbiBpZUtleUZpeChrZXkpIHtcblx0XHRcdHJldHVybiBrZXkucmVwbGFjZSgvXmQvLCAnX19fJCYnKS5yZXBsYWNlKGZvcmJpZGRlbkNoYXJzUmVnZXgsICdfX18nKVxuXHRcdH1cblx0XHRzdG9yZS5zZXQgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UsIGtleSwgdmFsKSB7XG5cdFx0XHRrZXkgPSBpZUtleUZpeChrZXkpXG5cdFx0XHRpZiAodmFsID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHN0b3JlLnJlbW92ZShrZXkpIH1cblx0XHRcdHN0b3JhZ2Uuc2V0QXR0cmlidXRlKGtleSwgc3RvcmUuc2VyaWFsaXplKHZhbCkpXG5cdFx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9KVxuXHRcdHN0b3JlLmdldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5KSB7XG5cdFx0XHRrZXkgPSBpZUtleUZpeChrZXkpXG5cdFx0XHRyZXR1cm4gc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoa2V5KSlcblx0XHR9KVxuXHRcdHN0b3JlLnJlbW92ZSA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5KSB7XG5cdFx0XHRrZXkgPSBpZUtleUZpeChrZXkpXG5cdFx0XHRzdG9yYWdlLnJlbW92ZUF0dHJpYnV0ZShrZXkpXG5cdFx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0XHR9KVxuXHRcdHN0b3JlLmNsZWFyID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlKSB7XG5cdFx0XHR2YXIgYXR0cmlidXRlcyA9IHN0b3JhZ2UuWE1MRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmF0dHJpYnV0ZXNcblx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0Zm9yICh2YXIgaT0wLCBhdHRyOyBhdHRyPWF0dHJpYnV0ZXNbaV07IGkrKykge1xuXHRcdFx0XHRzdG9yYWdlLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpXG5cdFx0XHR9XG5cdFx0XHRzdG9yYWdlLnNhdmUobG9jYWxTdG9yYWdlTmFtZSlcblx0XHR9KVxuXHRcdHN0b3JlLmdldEFsbCA9IGZ1bmN0aW9uKHN0b3JhZ2UpIHtcblx0XHRcdHZhciByZXQgPSB7fVxuXHRcdFx0c3RvcmUuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0XHRyZXRba2V5XSA9IHZhbFxuXHRcdFx0fSlcblx0XHRcdHJldHVybiByZXRcblx0XHR9XG5cdFx0c3RvcmUuZm9yRWFjaCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwgY2FsbGJhY2spIHtcblx0XHRcdHZhciBhdHRyaWJ1dGVzID0gc3RvcmFnZS5YTUxEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXR0cmlidXRlc1xuXHRcdFx0Zm9yICh2YXIgaT0wLCBhdHRyOyBhdHRyPWF0dHJpYnV0ZXNbaV07ICsraSkge1xuXHRcdFx0XHRjYWxsYmFjayhhdHRyLm5hbWUsIHN0b3JlLmRlc2VyaWFsaXplKHN0b3JhZ2UuZ2V0QXR0cmlidXRlKGF0dHIubmFtZSkpKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHR0cnkge1xuXHRcdHZhciB0ZXN0S2V5ID0gJ19fc3RvcmVqc19fJ1xuXHRcdHN0b3JlLnNldCh0ZXN0S2V5LCB0ZXN0S2V5KVxuXHRcdGlmIChzdG9yZS5nZXQodGVzdEtleSkgIT0gdGVzdEtleSkgeyBzdG9yZS5kaXNhYmxlZCA9IHRydWUgfVxuXHRcdHN0b3JlLnJlbW92ZSh0ZXN0S2V5KVxuXHR9IGNhdGNoKGUpIHtcblx0XHRzdG9yZS5kaXNhYmxlZCA9IHRydWVcblx0fVxuXHRzdG9yZS5lbmFibGVkID0gIXN0b3JlLmRpc2FibGVkXG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgJiYgdGhpcy5tb2R1bGUgIT09IG1vZHVsZSkgeyBtb2R1bGUuZXhwb3J0cyA9IHN0b3JlIH1cblx0ZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7IGRlZmluZShzdG9yZSkgfVxuXHRlbHNlIHsgd2luLnN0b3JlID0gc3RvcmUgfVxuXG59KShGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpKTtcbiIsInZhciBzdG9yZSA9IHJlcXVpcmUoJ3N0b3JlJyk7XG5cbi8qKlxuICogSlNPTlAgc2V0cyB1cCBhbmQgYWxsb3dzIHlvdSB0byBleGVjdXRlIGEgSlNPTlAgcmVxdWVzdFxuICogQHBhcmFtIHtTdHJpbmd9IHVybCAgVGhlIFVSTCB5b3UgYXJlIHJlcXVlc3Rpbmcgd2l0aCB0aGUgSlNPTiBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBUaGUgRGF0YSBvYmplY3QgeW91IHdhbnQgdG8gZ2VuZXJhdGUgdGhlIFVSTCBwYXJhbXMgZnJvbVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCAgVGhlIG1ldGhvZCBuYW1lIGZvciB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uIERlZmF1bHRzIHRvIGNhbGxiYWNrIChmb3IgZXhhbXBsZSwgZmxpY2tyJ3MgaXMgXCJqc29uY2FsbGJhY2tcIilcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrICBUaGUgY2FsbGJhY2sgeW91IHdhbnQgdG8gZXhlY3V0ZSBhcyBhbiBhbm9ueW1vdXMgZnVuY3Rpb24uIFRoZSBmaXJzdCBwYXJhbWV0ZXIgb2YgdGhlIGFub255bW91cyBjYWxsYmFjayBmdW5jdGlvbiBpcyB0aGUgSlNPTlxuICpcbiAqIEBleGFtcGxlXG4gKiBKU09OUCgnaHR0cDovL3R3aXR0ZXIuY29tL3VzZXJzL29zY2FyZ29kc29uLmpzb24nLGZ1bmN0aW9uKGpzb24pe1xuICogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdmF0YXInKS5pbm5lckhUTUwgPSAnPHA+VHdpdHRlciBQaWM6PC9wPjxpbWcgc3JjPVwiJytqc29uLnByb2ZpbGVfaW1hZ2VfdXJsKydcIj4nO1xuICogfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqIEpTT05QKCdodHRwOi8vYXBpLmZsaWNrci5jb20vc2VydmljZXMvZmVlZHMvcGhvdG9zX3B1YmxpYy5nbmUnLHsnaWQnOicxMjM4OTk0NEBOMDMnLCdmb3JtYXQnOidqc29uJ30sJ2pzb25jYWxsYmFjaycsZnVuY3Rpb24oanNvbil7XG4gKiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZsaWNrclBpYycpLmlubmVySFRNTCA9ICc8cD5GbGlja3IgUGljOjwvcD48aW1nIHNyYz1cIicranNvbi5pdGVtc1swXS5tZWRpYS5tKydcIj4nO1xuICogfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqIEpTT05QKCdodHRwOi8vZ3JhcGguZmFjZWJvb2suY29tL0ZhY2Vib29rRGV2ZWxvcGVycycsICdjYWxsYmFjaycsIGZ1bmN0aW9uKGpzb24pe1xuICogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYWNlYm9vaycpLmlubmVySFRNTCA9IGpzb24uYWJvdXQ7XG4gKiB9KTtcbiAqL1xuKGZ1bmN0aW9uKCB3aW5kb3csIHVuZGVmaW5lZCkge1xuICB2YXIgSlNPTlAgPSBmdW5jdGlvbih1cmwsZGF0YSxtZXRob2QsY2FsbGJhY2spe1xuICAgIC8vU2V0IHRoZSBkZWZhdWx0c1xuICAgIHVybCA9IHVybCB8fCAnJztcbiAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICBtZXRob2QgPSBtZXRob2QgfHwgJyc7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpe307XG5cbiAgICAvL0dldHMgYWxsIHRoZSBrZXlzIHRoYXQgYmVsb25nXG4gICAgLy90byBhbiBvYmplY3RcbiAgICB2YXIgZ2V0S2V5cyA9IGZ1bmN0aW9uKG9iail7XG4gICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgZm9yKHZhciBrZXkgaW4gb2JqKXtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICAgcmV0dXJuIGtleXM7XG4gICAgfVxuXG4gICAgLy9UdXJuIHRoZSBkYXRhIG9iamVjdCBpbnRvIGEgcXVlcnkgc3RyaW5nLlxuICAgIC8vQWRkIGNoZWNrIHRvIHNlZSBpZiB0aGUgc2Vjb25kIHBhcmFtZXRlciBpcyBpbmRlZWRcbiAgICAvL2EgZGF0YSBvYmplY3QuIElmIG5vdCwga2VlcCB0aGUgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBpZih0eXBlb2YgZGF0YSA9PSAnb2JqZWN0Jyl7XG4gICAgICB2YXIgcXVlcnlTdHJpbmcgPSAnJztcbiAgICAgIHZhciBrZXlzID0gZ2V0S2V5cyhkYXRhKTtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgcXVlcnlTdHJpbmcgKz0gZW5jb2RlVVJJQ29tcG9uZW50KGtleXNbaV0pICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFba2V5c1tpXV0pXG4gICAgICAgIGlmKGkgIT0ga2V5cy5sZW5ndGggLSAxKXtcbiAgICAgICAgICBxdWVyeVN0cmluZyArPSAnJic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHVybCArPSAnPycgKyBxdWVyeVN0cmluZztcbiAgICB9IGVsc2UgaWYodHlwZW9mIGRhdGEgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBtZXRob2QgPSBkYXRhO1xuICAgICAgY2FsbGJhY2sgPSBtZXRob2Q7XG4gICAgfVxuXG4gICAgLy9JZiBubyBtZXRob2Qgd2FzIHNldCBhbmQgdGhleSB1c2VkIHRoZSBjYWxsYmFjayBwYXJhbSBpbiBwbGFjZSBvZlxuICAgIC8vdGhlIG1ldGhvZCBwYXJhbSBpbnN0ZWFkLCB3ZSBzYXkgbWV0aG9kIGlzIGNhbGxiYWNrIGFuZCBzZXQgYVxuICAgIC8vZGVmYXVsdCBtZXRob2Qgb2YgXCJjYWxsYmFja1wiXG4gICAgaWYodHlwZW9mIG1ldGhvZCA9PSAnZnVuY3Rpb24nKXtcbiAgICAgIGNhbGxiYWNrID0gbWV0aG9kO1xuICAgICAgbWV0aG9kID0gJ2NhbGxiYWNrJztcbiAgICB9XG5cbiAgICAvL0NoZWNrIHRvIHNlZSBpZiB3ZSBoYXZlIERhdGUubm93IGF2YWlsYWJsZSwgaWYgbm90IHNoaW0gaXQgZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgaWYoIURhdGUubm93KXtcbiAgICAgIERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcbiAgICB9XG5cbiAgICAvL1VzZSB0aW1lc3RhbXAgKyBhIHJhbmRvbSBmYWN0b3IgdG8gYWNjb3VudCBmb3IgYSBsb3Qgb2YgcmVxdWVzdHMgaW4gYSBzaG9ydCB0aW1lXG4gICAgLy9lLmcuIGpzb25wMTM5NDU3MTc3NTE2MVxuICAgIHZhciB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICAgIHZhciBnZW5lcmF0ZWRGdW5jdGlvbiA9ICdqc29ucCcrTWF0aC5yb3VuZCh0aW1lc3RhbXArTWF0aC5yYW5kb20oKSoxMDAwMDAxKVxuXG4gICAgLy9HZW5lcmF0ZSB0aGUgdGVtcCBKU09OUCBmdW5jdGlvbiB1c2luZyB0aGUgbmFtZSBhYm92ZVxuICAgIC8vRmlyc3QsIGNhbGwgdGhlIGZ1bmN0aW9uIHRoZSB1c2VyIGRlZmluZWQgaW4gdGhlIGNhbGxiYWNrIHBhcmFtIFtjYWxsYmFjayhqc29uKV1cbiAgICAvL1RoZW4gZGVsZXRlIHRoZSBnZW5lcmF0ZWQgZnVuY3Rpb24gZnJvbSB0aGUgd2luZG93IFtkZWxldGUgd2luZG93W2dlbmVyYXRlZEZ1bmN0aW9uXV1cbiAgICB3aW5kb3dbZ2VuZXJhdGVkRnVuY3Rpb25dID0gZnVuY3Rpb24oanNvbil7XG4gICAgICBjYWxsYmFjayhqc29uKTtcbiAgICAgIGRlbGV0ZSB3aW5kb3dbZ2VuZXJhdGVkRnVuY3Rpb25dO1xuICAgIH07XG5cbiAgICAvL0NoZWNrIGlmIHRoZSB1c2VyIHNldCB0aGVpciBvd24gcGFyYW1zLCBhbmQgaWYgbm90IGFkZCBhID8gdG8gc3RhcnQgYSBsaXN0IG9mIHBhcmFtc1xuICAgIC8vSWYgaW4gZmFjdCB0aGV5IGRpZCB3ZSBhZGQgYSAmIHRvIGFkZCBvbnRvIHRoZSBwYXJhbXNcbiAgICAvL2V4YW1wbGUxOiB1cmwgPSBodHRwOi8vdXJsLmNvbSBUSEVOIGh0dHA6Ly91cmwuY29tP2NhbGxiYWNrPVhcbiAgICAvL2V4YW1wbGUyOiB1cmwgPSBodHRwOi8vdXJsLmNvbT9leGFtcGxlPXBhcmFtIFRIRU4gaHR0cDovL3VybC5jb20/ZXhhbXBsZT1wYXJhbSZjYWxsYmFjaz1YXG4gICAgaWYodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpeyB1cmwgPSB1cmwrJz8nOyB9XG4gICAgZWxzZXsgdXJsID0gdXJsKycmJzsgfVxuXG4gICAgLy9UaGlzIGdlbmVyYXRlcyB0aGUgPHNjcmlwdD4gdGFnXG4gICAgdmFyIGpzb25wU2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAganNvbnBTY3JpcHQuc2V0QXR0cmlidXRlKFwic3JjXCIsIHVybCttZXRob2QrJz0nK2dlbmVyYXRlZEZ1bmN0aW9uKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoanNvbnBTY3JpcHQpXG4gIH1cbiAgd2luZG93LkpTT05QID0gSlNPTlA7XG59KSh3aW5kb3cpO1xuXG53aW5kb3cuYWJjZCA9IHt9O1xuYWJjZC5ob3N0ID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hcGkvJztcbmFiY2QuZW5kcG9pbnQgPSBudWxsO1xuXG5hYmNkLnBhcnRpY2lwYXRlID0gZnVuY3Rpb24gKGV4cGVyaW1lbnQpIHtcbiAgcmV0dXJuIG5ldyBFeHBlcmltZW50KGV4cGVyaW1lbnQpO1xufTtcblxudmFyIEV4cGVyaW1lbnQgPSBmdW5jdGlvbiAoZXhwZXJpbWVudCkge1xuICB0aGlzLmV4cGVyaW1lbnQgPSBleHBlcmltZW50O1xuICB0aGlzLnZhcmlhbnRzID0ge307XG59O1xuXG5FeHBlcmltZW50LnByb3RvdHlwZS52YXJpYW50ID0gZnVuY3Rpb24gKHZhcmlhbnQsIGNhbGxiYWNrKSB7XG4gIHRoaXMudmFyaWFudHNbdmFyaWFudF0gPSBjYWxsYmFjaztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FeHBlcmltZW50LnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGFjdGlvbiA9IHN0b3JlLmdldCgnYWJjZDonICsgdGhpcy5leHBlcmltZW50KTtcbiAgaWYgKCFhY3Rpb24gfHwgIWFjdGlvbi5pZCkge1xuICAgIGFjdGlvbiA9IHtcbiAgICAgIHZhcmlhbnQ6IE9iamVjdC5rZXlzKHRoaXMudmFyaWFudHMpW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpPYmplY3Qua2V5cyh0aGlzLnZhcmlhbnRzKS5sZW5ndGgpXVxuICAgIH07XG4gICAgSlNPTlAoYWJjZC5ob3N0ICsgJ2FjdGlvbnMvc3RhcnQnLCB7XG4gICAgICB2YXJpYW50OiBhY3Rpb24udmFyaWFudCxcbiAgICAgIGV4cGVyaW1lbnQ6IHRoaXMuZXhwZXJpbWVudCxcbiAgICAgIGVuZHBvaW50OiBhYmNkLmVuZHBvaW50XG4gICAgfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGFjdGlvbi5pZCA9IGRhdGEuYWN0aW9uLmlkO1xuICAgICAgc3RvcmUuc2V0KCdhYmNkOicgKyB0aGlzLmV4cGVyaW1lbnQsIGFjdGlvbik7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuICB0aGlzLnZhcmlhbnRzW2FjdGlvbi52YXJpYW50XSgpO1xufTtcblxuYWJjZC5jb21wbGV0ZSA9IGZ1bmN0aW9uIChleHBlcmltZW50KSB7XG4gIHZhciBhY3Rpb24gPSBzdG9yZS5nZXQoJ2FiY2Q6JyArIGV4cGVyaW1lbnQpO1xuICAvLyBkZWJ1Z2dlclxuICBKU09OUChhYmNkLmhvc3QgKyAnYWN0aW9ucy9jb21wbGV0ZScsIHtcbiAgICBpZDogYWN0aW9uLmlkLFxuICAgIGVuZHBvaW50OiBhYmNkLmVuZHBvaW50XG4gIH0pO1xufTtcblxud2luZG93LnMgPSBzdG9yZTtcbiJdfQ==
