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
  this.experiment = experiment || function () {};
  this.variants = {};
};

Experiment.prototype.variant = function (variant, callback) {
  this.variants[variant] = callback;
  return this;
};

Experiment.prototype.start = function (callback) {
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
      if (data.error) {
        callback(new Error(data.error));
      } else {
        action.id = data.action.id;
        store.set('abcd:' + this.experiment, action);
        callback(null, action);
      }
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
