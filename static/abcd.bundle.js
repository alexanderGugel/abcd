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

// options.persists
// options.endpoint

/*
 Provide the XMLHttpRequest constructor for Internet Explorer 5.x-6.x:
 Other browsers (including Internet Explorer 7.x-9.x) do not redefine
 XMLHttpRequest if it already exists.

 This example is based on findings at:
 http://blogs.msdn.com/xmlteam/archive/2006/10/23/using-the-right-version-of-msxml-in-internet-explorer.aspx
*/
var XMLHttpRequest = window.XMLHttpRequest;
if (typeof XMLHttpRequest === 'undefined') {
  XMLHttpRequest = function () {
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); }
    catch (e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); }
    catch (e) {}
    try { return new ActiveXObject('Microsoft.XMLHTTP'); }
    catch (e) {}
    throw new Error('This browser does not support XMLHttpRequest.');
  };
}

// var Experiment = function (name, options) {
//   if (typeof name !== 'string' || name.length === 0) {
//     throw new Error('No name specified for event');
//   }
//   this.name = name;
//   this.options = options || {};
//   this.variants = [];
// };
//
// var _Variant = function (name, options, callback) {
//   if (typeof name !== 'string' || name.length === 0) {
//     throw new Error('No name specified for variant');
//   }
//   this.name = name;
//   this.options = options || {};
//   this.callback = callback || function () {};
//   this.options.weight = this.options.weight || 1;
// };
//
// Experiment.prototype.addVariant = function (name, options, callback) {
//   this.variants.push(new _Variant(name, options, callback));
//   return this;
// };
//
// // Experiment.prototype.continue = function () {
// // };
//
// Experiment.prototype.start = function (name) {
//   if (name) {
//     request = new XMLHttpRequest();
//     request.open('GET', '/my/url', true);
//
//     request.onload = function() {
//       if (request.status >= 200 && request.status < 400){
//         // Success!
//         resp = request.responseText;
//       } else {
//         // We reached our target server, but it returned an error
//
//       }
//     };
//
//     request.onerror = function() {
//       // There was a connection error of some sort
//     };
//
//     request.send();
//   } else {
//     var absoluteWeight = 0;
//     for (var i = 0; i < this.variant.length; i++) {
//       absoluteWeight
//     }
//
//   }
// };
//
// Experiment.prototype.complete = function () {
//
// };
//
// Experiment.prototype.reset = function () {
//
// };
//
// Experiment.prototype.continue = function () {
//
// };

var startAction = function (server, endpoint, experiment, variant, callback) {
  var request = new XMLHttpRequest();
  request.open('POST', server + '/api/action', true);
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.onreadystatechange = function() {
    if (this.readyState === 4){
      if (this.status >= 200 && this.status < 400){
        callback(null, JSON.parse(this.responseText).action);
      } else {
        callback(new Error(JSON.parse(this.responseText).error));
      }
    }
  };
  request.send(JSON.stringify({
    endpoint: endpoint,
    experiment: experiment,
    variant: variant
  }));
};

var completeAction = function (server, endpoint, id, callback) {
  var request = new XMLHttpRequest();
  request.open('POST', server + '/api/action/' + id, true);
  request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.onreadystatechange = function() {
    if (this.readyState === 4){
      if (this.status >= 200 && this.status < 400){
        callback(null, JSON.parse(this.responseText));
      } else {
        callback(new Error(JSON.parse(this.responseText).error));
      }
    }
  };
  request.send(JSON.stringify({
    endpoint: endpoint
  }));
};

startAction('http://alex.dev:3000', '2f3ea756-d39b-48c8-a69f-b563bb075a2b', 'Experiment 2', 'Variant 2', function (error, action) {
  completeAction('http://alex.dev:3000', '2f3ea756-d39b-48c8-a69f-b563bb075a2b', action.id, function () {});
});

// var abcd = {};
//
// abcd.Experiment = function (name, options) {
//   options = options || {};
//   this.name = name;
//   this.variants = {};
//   this.endpoint = options.endpoint || abcd.endpoint;
//   this.persists = options.persists || true;
// };
//
// abcd.Experiment.prototype.variant = function (variant, options, callback) {
//   options = options || {};
//   if (typeof options === 'function') {
//     callback = options;
//   }
//   this.variants[variant] = {
//     weight: options.weight || 1,
//     callback: callback || (function () {})
//   };
//   return this;
// };
//
// abcd.Experiment.prototype.control = function (options, callback) {
//   return this.variant('control', options, callback);
// };
//
// abcd.Experiment.prototype.start = function (variant, data) {
//   // Check if experiment is already running/ variant already chosen
//   var experiment = store.get('abcd:' + this.endpoint + ':' + this.name);
//   if (experiment) {
//   }
//
// };
//
// abcd.Experiment.prototype.complete = function (data) {
//
// };


// window.abcd = abcd;

},{"store":"/Users/alexander/abcd/node_modules/store/store.js"}]},{},["/Users/alexander/abcd/static/abcd.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9zdG9yZS9zdG9yZS5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9zdGF0aWMvYWJjZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7KGZ1bmN0aW9uKHdpbil7XG5cdHZhciBzdG9yZSA9IHt9LFxuXHRcdGRvYyA9IHdpbi5kb2N1bWVudCxcblx0XHRsb2NhbFN0b3JhZ2VOYW1lID0gJ2xvY2FsU3RvcmFnZScsXG5cdFx0c2NyaXB0VGFnID0gJ3NjcmlwdCcsXG5cdFx0c3RvcmFnZVxuXG5cdHN0b3JlLmRpc2FibGVkID0gZmFsc2Vcblx0c3RvcmUuc2V0ID0gZnVuY3Rpb24oa2V5LCB2YWx1ZSkge31cblx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7fVxuXHRzdG9yZS5yZW1vdmUgPSBmdW5jdGlvbihrZXkpIHt9XG5cdHN0b3JlLmNsZWFyID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS50cmFuc2FjdCA9IGZ1bmN0aW9uKGtleSwgZGVmYXVsdFZhbCwgdHJhbnNhY3Rpb25Gbikge1xuXHRcdHZhciB2YWwgPSBzdG9yZS5nZXQoa2V5KVxuXHRcdGlmICh0cmFuc2FjdGlvbkZuID09IG51bGwpIHtcblx0XHRcdHRyYW5zYWN0aW9uRm4gPSBkZWZhdWx0VmFsXG5cdFx0XHRkZWZhdWx0VmFsID0gbnVsbFxuXHRcdH1cblx0XHRpZiAodHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJykgeyB2YWwgPSBkZWZhdWx0VmFsIHx8IHt9IH1cblx0XHR0cmFuc2FjdGlvbkZuKHZhbClcblx0XHRzdG9yZS5zZXQoa2V5LCB2YWwpXG5cdH1cblx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oKSB7fVxuXHRzdG9yZS5mb3JFYWNoID0gZnVuY3Rpb24oKSB7fVxuXG5cdHN0b3JlLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuXHR9XG5cdHN0b3JlLmRlc2VyaWFsaXplID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7IHJldHVybiB1bmRlZmluZWQgfVxuXHRcdHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHZhbHVlKSB9XG5cdFx0Y2F0Y2goZSkgeyByZXR1cm4gdmFsdWUgfHwgdW5kZWZpbmVkIH1cblx0fVxuXG5cdC8vIEZ1bmN0aW9ucyB0byBlbmNhcHN1bGF0ZSBxdWVzdGlvbmFibGUgRmlyZUZveCAzLjYuMTMgYmVoYXZpb3Jcblx0Ly8gd2hlbiBhYm91dC5jb25maWc6OmRvbS5zdG9yYWdlLmVuYWJsZWQgPT09IGZhbHNlXG5cdC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFyY3Vzd2VzdGluL3N0b3JlLmpzL2lzc3VlcyNpc3N1ZS8xM1xuXHRmdW5jdGlvbiBpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSB7XG5cdFx0dHJ5IHsgcmV0dXJuIChsb2NhbFN0b3JhZ2VOYW1lIGluIHdpbiAmJiB3aW5bbG9jYWxTdG9yYWdlTmFtZV0pIH1cblx0XHRjYXRjaChlcnIpIHsgcmV0dXJuIGZhbHNlIH1cblx0fVxuXG5cdGlmIChpc0xvY2FsU3RvcmFnZU5hbWVTdXBwb3J0ZWQoKSkge1xuXHRcdHN0b3JhZ2UgPSB3aW5bbG9jYWxTdG9yYWdlTmFtZV1cblx0XHRzdG9yZS5zZXQgPSBmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0aWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBzdG9yZS5yZW1vdmUoa2V5KSB9XG5cdFx0XHRzdG9yYWdlLnNldEl0ZW0oa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHJldHVybiB2YWxcblx0XHR9XG5cdFx0c3RvcmUuZ2V0ID0gZnVuY3Rpb24oa2V5KSB7IHJldHVybiBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEl0ZW0oa2V5KSkgfVxuXHRcdHN0b3JlLnJlbW92ZSA9IGZ1bmN0aW9uKGtleSkgeyBzdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KSB9XG5cdFx0c3RvcmUuY2xlYXIgPSBmdW5jdGlvbigpIHsgc3RvcmFnZS5jbGVhcigpIH1cblx0XHRzdG9yZS5nZXRBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciByZXQgPSB7fVxuXHRcdFx0c3RvcmUuZm9yRWFjaChmdW5jdGlvbihrZXksIHZhbCkge1xuXHRcdFx0XHRyZXRba2V5XSA9IHZhbFxuXHRcdFx0fSlcblx0XHRcdHJldHVybiByZXRcblx0XHR9XG5cdFx0c3RvcmUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0XHRmb3IgKHZhciBpPTA7IGk8c3RvcmFnZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIga2V5ID0gc3RvcmFnZS5rZXkoaSlcblx0XHRcdFx0Y2FsbGJhY2soa2V5LCBzdG9yZS5nZXQoa2V5KSlcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoZG9jLmRvY3VtZW50RWxlbWVudC5hZGRCZWhhdmlvcikge1xuXHRcdHZhciBzdG9yYWdlT3duZXIsXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyXG5cdFx0Ly8gU2luY2UgI3VzZXJEYXRhIHN0b3JhZ2UgYXBwbGllcyBvbmx5IHRvIHNwZWNpZmljIHBhdGhzLCB3ZSBuZWVkIHRvXG5cdFx0Ly8gc29tZWhvdyBsaW5rIG91ciBkYXRhIHRvIGEgc3BlY2lmaWMgcGF0aC4gIFdlIGNob29zZSAvZmF2aWNvbi5pY29cblx0XHQvLyBhcyBhIHByZXR0eSBzYWZlIG9wdGlvbiwgc2luY2UgYWxsIGJyb3dzZXJzIGFscmVhZHkgbWFrZSBhIHJlcXVlc3QgdG9cblx0XHQvLyB0aGlzIFVSTCBhbnl3YXkgYW5kIGJlaW5nIGEgNDA0IHdpbGwgbm90IGh1cnQgdXMgaGVyZS4gIFdlIHdyYXAgYW5cblx0XHQvLyBpZnJhbWUgcG9pbnRpbmcgdG8gdGhlIGZhdmljb24gaW4gYW4gQWN0aXZlWE9iamVjdChodG1sZmlsZSkgb2JqZWN0XG5cdFx0Ly8gKHNlZTogaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2FhNzUyNTc0KHY9VlMuODUpLmFzcHgpXG5cdFx0Ly8gc2luY2UgdGhlIGlmcmFtZSBhY2Nlc3MgcnVsZXMgYXBwZWFyIHRvIGFsbG93IGRpcmVjdCBhY2Nlc3MgYW5kXG5cdFx0Ly8gbWFuaXB1bGF0aW9uIG9mIHRoZSBkb2N1bWVudCBlbGVtZW50LCBldmVuIGZvciBhIDQwNCBwYWdlLiAgVGhpc1xuXHRcdC8vIGRvY3VtZW50IGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgZG9jdW1lbnQgKHdoaWNoIHdvdWxkXG5cdFx0Ly8gaGF2ZSBiZWVuIGxpbWl0ZWQgdG8gdGhlIGN1cnJlbnQgcGF0aCkgdG8gcGVyZm9ybSAjdXNlckRhdGEgc3RvcmFnZS5cblx0XHR0cnkge1xuXHRcdFx0c3RvcmFnZUNvbnRhaW5lciA9IG5ldyBBY3RpdmVYT2JqZWN0KCdodG1sZmlsZScpXG5cdFx0XHRzdG9yYWdlQ29udGFpbmVyLm9wZW4oKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci53cml0ZSgnPCcrc2NyaXB0VGFnKyc+ZG9jdW1lbnQudz13aW5kb3c8Lycrc2NyaXB0VGFnKyc+PGlmcmFtZSBzcmM9XCIvZmF2aWNvbi5pY29cIj48L2lmcmFtZT4nKVxuXHRcdFx0c3RvcmFnZUNvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBzdG9yYWdlQ29udGFpbmVyLncuZnJhbWVzWzBdLmRvY3VtZW50XG5cdFx0XHRzdG9yYWdlID0gc3RvcmFnZU93bmVyLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0fSBjYXRjaChlKSB7XG5cdFx0XHQvLyBzb21laG93IEFjdGl2ZVhPYmplY3QgaW5zdGFudGlhdGlvbiBmYWlsZWQgKHBlcmhhcHMgc29tZSBzcGVjaWFsXG5cdFx0XHQvLyBzZWN1cml0eSBzZXR0aW5ncyBvciBvdGhlcndzZSksIGZhbGwgYmFjayB0byBwZXItcGF0aCBzdG9yYWdlXG5cdFx0XHRzdG9yYWdlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG5cdFx0XHRzdG9yYWdlT3duZXIgPSBkb2MuYm9keVxuXHRcdH1cblx0XHRmdW5jdGlvbiB3aXRoSUVTdG9yYWdlKHN0b3JlRnVuY3Rpb24pIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cdFx0XHRcdGFyZ3MudW5zaGlmdChzdG9yYWdlKVxuXHRcdFx0XHQvLyBTZWUgaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zNTMxMDgxKHY9VlMuODUpLmFzcHhcblx0XHRcdFx0Ly8gYW5kIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczUzMTQyNCh2PVZTLjg1KS5hc3B4XG5cdFx0XHRcdHN0b3JhZ2VPd25lci5hcHBlbmRDaGlsZChzdG9yYWdlKVxuXHRcdFx0XHRzdG9yYWdlLmFkZEJlaGF2aW9yKCcjZGVmYXVsdCN1c2VyRGF0YScpXG5cdFx0XHRcdHN0b3JhZ2UubG9hZChsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gc3RvcmVGdW5jdGlvbi5hcHBseShzdG9yZSwgYXJncylcblx0XHRcdFx0c3RvcmFnZU93bmVyLnJlbW92ZUNoaWxkKHN0b3JhZ2UpXG5cdFx0XHRcdHJldHVybiByZXN1bHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJbiBJRTcsIGtleXMgY2Fubm90IHN0YXJ0IHdpdGggYSBkaWdpdCBvciBjb250YWluIGNlcnRhaW4gY2hhcnMuXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzQwXG5cdFx0Ly8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJjdXN3ZXN0aW4vc3RvcmUuanMvaXNzdWVzLzgzXG5cdFx0dmFyIGZvcmJpZGRlbkNoYXJzUmVnZXggPSBuZXcgUmVnRXhwKFwiWyFcXFwiIyQlJicoKSorLC9cXFxcXFxcXDo7PD0+P0BbXFxcXF1eYHt8fX5dXCIsIFwiZ1wiKVxuXHRcdGZ1bmN0aW9uIGllS2V5Rml4KGtleSkge1xuXHRcdFx0cmV0dXJuIGtleS5yZXBsYWNlKC9eZC8sICdfX18kJicpLnJlcGxhY2UoZm9yYmlkZGVuQ2hhcnNSZWdleCwgJ19fXycpXG5cdFx0fVxuXHRcdHN0b3JlLnNldCA9IHdpdGhJRVN0b3JhZ2UoZnVuY3Rpb24oc3RvcmFnZSwga2V5LCB2YWwpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gc3RvcmUucmVtb3ZlKGtleSkgfVxuXHRcdFx0c3RvcmFnZS5zZXRBdHRyaWJ1dGUoa2V5LCBzdG9yZS5zZXJpYWxpemUodmFsKSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdFx0cmV0dXJuIHZhbFxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0ID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXkpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHJldHVybiBzdG9yZS5kZXNlcmlhbGl6ZShzdG9yYWdlLmdldEF0dHJpYnV0ZShrZXkpKVxuXHRcdH0pXG5cdFx0c3RvcmUucmVtb3ZlID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBrZXkpIHtcblx0XHRcdGtleSA9IGllS2V5Rml4KGtleSlcblx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGtleSlcblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuY2xlYXIgPSB3aXRoSUVTdG9yYWdlKGZ1bmN0aW9uKHN0b3JhZ2UpIHtcblx0XHRcdHZhciBhdHRyaWJ1dGVzID0gc3RvcmFnZS5YTUxEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXR0cmlidXRlc1xuXHRcdFx0c3RvcmFnZS5sb2FkKGxvY2FsU3RvcmFnZU5hbWUpXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgaSsrKSB7XG5cdFx0XHRcdHN0b3JhZ2UucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSlcblx0XHRcdH1cblx0XHRcdHN0b3JhZ2Uuc2F2ZShsb2NhbFN0b3JhZ2VOYW1lKVxuXHRcdH0pXG5cdFx0c3RvcmUuZ2V0QWxsID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuXHRcdFx0dmFyIHJldCA9IHt9XG5cdFx0XHRzdG9yZS5mb3JFYWNoKGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldFtrZXldID0gdmFsXG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIHJldFxuXHRcdH1cblx0XHRzdG9yZS5mb3JFYWNoID0gd2l0aElFU3RvcmFnZShmdW5jdGlvbihzdG9yYWdlLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGF0dHJpYnV0ZXMgPSBzdG9yYWdlLlhNTERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hdHRyaWJ1dGVzXG5cdFx0XHRmb3IgKHZhciBpPTAsIGF0dHI7IGF0dHI9YXR0cmlidXRlc1tpXTsgKytpKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGF0dHIubmFtZSwgc3RvcmUuZGVzZXJpYWxpemUoc3RvcmFnZS5nZXRBdHRyaWJ1dGUoYXR0ci5uYW1lKSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHRyeSB7XG5cdFx0dmFyIHRlc3RLZXkgPSAnX19zdG9yZWpzX18nXG5cdFx0c3RvcmUuc2V0KHRlc3RLZXksIHRlc3RLZXkpXG5cdFx0aWYgKHN0b3JlLmdldCh0ZXN0S2V5KSAhPSB0ZXN0S2V5KSB7IHN0b3JlLmRpc2FibGVkID0gdHJ1ZSB9XG5cdFx0c3RvcmUucmVtb3ZlKHRlc3RLZXkpXG5cdH0gY2F0Y2goZSkge1xuXHRcdHN0b3JlLmRpc2FibGVkID0gdHJ1ZVxuXHR9XG5cdHN0b3JlLmVuYWJsZWQgPSAhc3RvcmUuZGlzYWJsZWRcblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyAmJiB0aGlzLm1vZHVsZSAhPT0gbW9kdWxlKSB7IG1vZHVsZS5leHBvcnRzID0gc3RvcmUgfVxuXHRlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHsgZGVmaW5lKHN0b3JlKSB9XG5cdGVsc2UgeyB3aW4uc3RvcmUgPSBzdG9yZSB9XG5cbn0pKEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCkpO1xuIiwidmFyIHN0b3JlID0gcmVxdWlyZSgnc3RvcmUnKTtcblxuLy8gb3B0aW9ucy5wZXJzaXN0c1xuLy8gb3B0aW9ucy5lbmRwb2ludFxuXG4vKlxuIFByb3ZpZGUgdGhlIFhNTEh0dHBSZXF1ZXN0IGNvbnN0cnVjdG9yIGZvciBJbnRlcm5ldCBFeHBsb3JlciA1LngtNi54OlxuIE90aGVyIGJyb3dzZXJzIChpbmNsdWRpbmcgSW50ZXJuZXQgRXhwbG9yZXIgNy54LTkueCkgZG8gbm90IHJlZGVmaW5lXG4gWE1MSHR0cFJlcXVlc3QgaWYgaXQgYWxyZWFkeSBleGlzdHMuXG5cbiBUaGlzIGV4YW1wbGUgaXMgYmFzZWQgb24gZmluZGluZ3MgYXQ6XG4gaHR0cDovL2Jsb2dzLm1zZG4uY29tL3htbHRlYW0vYXJjaGl2ZS8yMDA2LzEwLzIzL3VzaW5nLXRoZS1yaWdodC12ZXJzaW9uLW9mLW1zeG1sLWluLWludGVybmV0LWV4cGxvcmVyLmFzcHhcbiovXG52YXIgWE1MSHR0cFJlcXVlc3QgPSB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XG5pZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ID09PSAndW5kZWZpbmVkJykge1xuICBYTUxIdHRwUmVxdWVzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQLjYuMCcpOyB9XG4gICAgY2F0Y2ggKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUC4zLjAnKTsgfVxuICAgIGNhdGNoIChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfVxuICAgIGNhdGNoIChlKSB7fVxuICAgIHRocm93IG5ldyBFcnJvcignVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgWE1MSHR0cFJlcXVlc3QuJyk7XG4gIH07XG59XG5cbi8vIHZhciBFeHBlcmltZW50ID0gZnVuY3Rpb24gKG5hbWUsIG9wdGlvbnMpIHtcbi8vICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuLy8gICAgIHRocm93IG5ldyBFcnJvcignTm8gbmFtZSBzcGVjaWZpZWQgZm9yIGV2ZW50Jyk7XG4vLyAgIH1cbi8vICAgdGhpcy5uYW1lID0gbmFtZTtcbi8vICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbi8vICAgdGhpcy52YXJpYW50cyA9IFtdO1xuLy8gfTtcbi8vXG4vLyB2YXIgX1ZhcmlhbnQgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbi8vICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuLy8gICAgIHRocm93IG5ldyBFcnJvcignTm8gbmFtZSBzcGVjaWZpZWQgZm9yIHZhcmlhbnQnKTtcbi8vICAgfVxuLy8gICB0aGlzLm5hbWUgPSBuYW1lO1xuLy8gICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuLy8gICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG4vLyAgIHRoaXMub3B0aW9ucy53ZWlnaHQgPSB0aGlzLm9wdGlvbnMud2VpZ2h0IHx8IDE7XG4vLyB9O1xuLy9cbi8vIEV4cGVyaW1lbnQucHJvdG90eXBlLmFkZFZhcmlhbnQgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbi8vICAgdGhpcy52YXJpYW50cy5wdXNoKG5ldyBfVmFyaWFudChuYW1lLCBvcHRpb25zLCBjYWxsYmFjaykpO1xuLy8gICByZXR1cm4gdGhpcztcbi8vIH07XG4vL1xuLy8gLy8gRXhwZXJpbWVudC5wcm90b3R5cGUuY29udGludWUgPSBmdW5jdGlvbiAoKSB7XG4vLyAvLyB9O1xuLy9cbi8vIEV4cGVyaW1lbnQucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbi8vICAgaWYgKG5hbWUpIHtcbi8vICAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4vLyAgICAgcmVxdWVzdC5vcGVuKCdHRVQnLCAnL215L3VybCcsIHRydWUpO1xuLy9cbi8vICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuLy8gICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiByZXF1ZXN0LnN0YXR1cyA8IDQwMCl7XG4vLyAgICAgICAgIC8vIFN1Y2Nlc3MhXG4vLyAgICAgICAgIHJlc3AgPSByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIC8vIFdlIHJlYWNoZWQgb3VyIHRhcmdldCBzZXJ2ZXIsIGJ1dCBpdCByZXR1cm5lZCBhbiBlcnJvclxuLy9cbi8vICAgICAgIH1cbi8vICAgICB9O1xuLy9cbi8vICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbi8vICAgICAgIC8vIFRoZXJlIHdhcyBhIGNvbm5lY3Rpb24gZXJyb3Igb2Ygc29tZSBzb3J0XG4vLyAgICAgfTtcbi8vXG4vLyAgICAgcmVxdWVzdC5zZW5kKCk7XG4vLyAgIH0gZWxzZSB7XG4vLyAgICAgdmFyIGFic29sdXRlV2VpZ2h0ID0gMDtcbi8vICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmFyaWFudC5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgYWJzb2x1dGVXZWlnaHRcbi8vICAgICB9XG4vL1xuLy8gICB9XG4vLyB9O1xuLy9cbi8vIEV4cGVyaW1lbnQucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuLy9cbi8vIH07XG4vL1xuLy8gRXhwZXJpbWVudC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4vL1xuLy8gfTtcbi8vXG4vLyBFeHBlcmltZW50LnByb3RvdHlwZS5jb250aW51ZSA9IGZ1bmN0aW9uICgpIHtcbi8vXG4vLyB9O1xuXG52YXIgc3RhcnRBY3Rpb24gPSBmdW5jdGlvbiAoc2VydmVyLCBlbmRwb2ludCwgZXhwZXJpbWVudCwgdmFyaWFudCwgY2FsbGJhY2spIHtcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgcmVxdWVzdC5vcGVuKCdQT1NUJywgc2VydmVyICsgJy9hcGkvYWN0aW9uJywgdHJ1ZSk7XG4gIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9VVRGLTgnKTtcbiAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XG4gIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gNCl7XG4gICAgICBpZiAodGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgNDAwKXtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlVGV4dCkuYWN0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihKU09OLnBhcnNlKHRoaXMucmVzcG9uc2VUZXh0KS5lcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgcmVxdWVzdC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICBlbmRwb2ludDogZW5kcG9pbnQsXG4gICAgZXhwZXJpbWVudDogZXhwZXJpbWVudCxcbiAgICB2YXJpYW50OiB2YXJpYW50XG4gIH0pKTtcbn07XG5cbnZhciBjb21wbGV0ZUFjdGlvbiA9IGZ1bmN0aW9uIChzZXJ2ZXIsIGVuZHBvaW50LCBpZCwgY2FsbGJhY2spIHtcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgcmVxdWVzdC5vcGVuKCdQT1NUJywgc2VydmVyICsgJy9hcGkvYWN0aW9uLycgKyBpZCwgdHJ1ZSk7XG4gIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9VVRGLTgnKTtcbiAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XG4gIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gNCl7XG4gICAgICBpZiAodGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgNDAwKXtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgSlNPTi5wYXJzZSh0aGlzLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKEpTT04ucGFyc2UodGhpcy5yZXNwb25zZVRleHQpLmVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICByZXF1ZXN0LnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgIGVuZHBvaW50OiBlbmRwb2ludFxuICB9KSk7XG59O1xuXG5zdGFydEFjdGlvbignaHR0cDovL2FsZXguZGV2OjMwMDAnLCAnMmYzZWE3NTYtZDM5Yi00OGM4LWE2OWYtYjU2M2JiMDc1YTJiJywgJ0V4cGVyaW1lbnQgMicsICdWYXJpYW50IDInLCBmdW5jdGlvbiAoZXJyb3IsIGFjdGlvbikge1xuICBjb21wbGV0ZUFjdGlvbignaHR0cDovL2FsZXguZGV2OjMwMDAnLCAnMmYzZWE3NTYtZDM5Yi00OGM4LWE2OWYtYjU2M2JiMDc1YTJiJywgYWN0aW9uLmlkLCBmdW5jdGlvbiAoKSB7fSk7XG59KTtcblxuLy8gdmFyIGFiY2QgPSB7fTtcbi8vXG4vLyBhYmNkLkV4cGVyaW1lbnQgPSBmdW5jdGlvbiAobmFtZSwgb3B0aW9ucykge1xuLy8gICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbi8vICAgdGhpcy5uYW1lID0gbmFtZTtcbi8vICAgdGhpcy52YXJpYW50cyA9IHt9O1xuLy8gICB0aGlzLmVuZHBvaW50ID0gb3B0aW9ucy5lbmRwb2ludCB8fCBhYmNkLmVuZHBvaW50O1xuLy8gICB0aGlzLnBlcnNpc3RzID0gb3B0aW9ucy5wZXJzaXN0cyB8fCB0cnVlO1xuLy8gfTtcbi8vXG4vLyBhYmNkLkV4cGVyaW1lbnQucHJvdG90eXBlLnZhcmlhbnQgPSBmdW5jdGlvbiAodmFyaWFudCwgb3B0aW9ucywgY2FsbGJhY2spIHtcbi8vICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4vLyAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuLy8gICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbi8vICAgfVxuLy8gICB0aGlzLnZhcmlhbnRzW3ZhcmlhbnRdID0ge1xuLy8gICAgIHdlaWdodDogb3B0aW9ucy53ZWlnaHQgfHwgMSxcbi8vICAgICBjYWxsYmFjazogY2FsbGJhY2sgfHwgKGZ1bmN0aW9uICgpIHt9KVxuLy8gICB9O1xuLy8gICByZXR1cm4gdGhpcztcbi8vIH07XG4vL1xuLy8gYWJjZC5FeHBlcmltZW50LnByb3RvdHlwZS5jb250cm9sID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4vLyAgIHJldHVybiB0aGlzLnZhcmlhbnQoJ2NvbnRyb2wnLCBvcHRpb25zLCBjYWxsYmFjayk7XG4vLyB9O1xuLy9cbi8vIGFiY2QuRXhwZXJpbWVudC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAodmFyaWFudCwgZGF0YSkge1xuLy8gICAvLyBDaGVjayBpZiBleHBlcmltZW50IGlzIGFscmVhZHkgcnVubmluZy8gdmFyaWFudCBhbHJlYWR5IGNob3NlblxuLy8gICB2YXIgZXhwZXJpbWVudCA9IHN0b3JlLmdldCgnYWJjZDonICsgdGhpcy5lbmRwb2ludCArICc6JyArIHRoaXMubmFtZSk7XG4vLyAgIGlmIChleHBlcmltZW50KSB7XG4vLyAgIH1cbi8vXG4vLyB9O1xuLy9cbi8vIGFiY2QuRXhwZXJpbWVudC5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbiAoZGF0YSkge1xuLy9cbi8vIH07XG5cblxuLy8gd2luZG93LmFiY2QgPSBhYmNkO1xuIl19
