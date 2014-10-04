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

startAction('http://alex.dev:3000', '7f691557-b280-4edf-8c64-4b3f31ac8b38', 'Experiment 1', 'Variant 1', function (error, action) {
  completeAction('http://alex.dev:3000', '7f691557-b280-4edf-8c64-4b3f31ac8b38', action.id, function () {});
});

var Experiment = function (name, options) {

};

window.startAction = startAction;
