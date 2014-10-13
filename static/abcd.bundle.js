(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/alexander/abcd/static/abcd.js":[function(require,module,exports){
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

},{}]},{},["/Users/alexander/abcd/static/abcd.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL3N0YXRpYy9hYmNkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogSlNPTlAgc2V0cyB1cCBhbmQgYWxsb3dzIHlvdSB0byBleGVjdXRlIGEgSlNPTlAgcmVxdWVzdFxuICogQHBhcmFtIHtTdHJpbmd9IHVybCAgVGhlIFVSTCB5b3UgYXJlIHJlcXVlc3Rpbmcgd2l0aCB0aGUgSlNPTiBkYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBUaGUgRGF0YSBvYmplY3QgeW91IHdhbnQgdG8gZ2VuZXJhdGUgdGhlIFVSTCBwYXJhbXMgZnJvbVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCAgVGhlIG1ldGhvZCBuYW1lIGZvciB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uIERlZmF1bHRzIHRvIGNhbGxiYWNrIChmb3IgZXhhbXBsZSwgZmxpY2tyJ3MgaXMgXCJqc29uY2FsbGJhY2tcIilcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrICBUaGUgY2FsbGJhY2sgeW91IHdhbnQgdG8gZXhlY3V0ZSBhcyBhbiBhbm9ueW1vdXMgZnVuY3Rpb24uIFRoZSBmaXJzdCBwYXJhbWV0ZXIgb2YgdGhlIGFub255bW91cyBjYWxsYmFjayBmdW5jdGlvbiBpcyB0aGUgSlNPTlxuICpcbiAqIEBleGFtcGxlXG4gKiBKU09OUCgnaHR0cDovL3R3aXR0ZXIuY29tL3VzZXJzL29zY2FyZ29kc29uLmpzb24nLGZ1bmN0aW9uKGpzb24pe1xuICogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdmF0YXInKS5pbm5lckhUTUwgPSAnPHA+VHdpdHRlciBQaWM6PC9wPjxpbWcgc3JjPVwiJytqc29uLnByb2ZpbGVfaW1hZ2VfdXJsKydcIj4nO1xuICogfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqIEpTT05QKCdodHRwOi8vYXBpLmZsaWNrci5jb20vc2VydmljZXMvZmVlZHMvcGhvdG9zX3B1YmxpYy5nbmUnLHsnaWQnOicxMjM4OTk0NEBOMDMnLCdmb3JtYXQnOidqc29uJ30sJ2pzb25jYWxsYmFjaycsZnVuY3Rpb24oanNvbil7XG4gKiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZsaWNrclBpYycpLmlubmVySFRNTCA9ICc8cD5GbGlja3IgUGljOjwvcD48aW1nIHNyYz1cIicranNvbi5pdGVtc1swXS5tZWRpYS5tKydcIj4nO1xuICogfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqIEpTT05QKCdodHRwOi8vZ3JhcGguZmFjZWJvb2suY29tL0ZhY2Vib29rRGV2ZWxvcGVycycsICdjYWxsYmFjaycsIGZ1bmN0aW9uKGpzb24pe1xuICogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYWNlYm9vaycpLmlubmVySFRNTCA9IGpzb24uYWJvdXQ7XG4gKiB9KTtcbiAqL1xuKGZ1bmN0aW9uKCB3aW5kb3csIHVuZGVmaW5lZCkge1xuICB2YXIgSlNPTlAgPSBmdW5jdGlvbih1cmwsZGF0YSxtZXRob2QsY2FsbGJhY2spe1xuICAgIC8vU2V0IHRoZSBkZWZhdWx0c1xuICAgIHVybCA9IHVybCB8fCAnJztcbiAgICBkYXRhID0gZGF0YSB8fCB7fTtcbiAgICBtZXRob2QgPSBtZXRob2QgfHwgJyc7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpe307XG5cbiAgICAvL0dldHMgYWxsIHRoZSBrZXlzIHRoYXQgYmVsb25nXG4gICAgLy90byBhbiBvYmplY3RcbiAgICB2YXIgZ2V0S2V5cyA9IGZ1bmN0aW9uKG9iail7XG4gICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgZm9yKHZhciBrZXkgaW4gb2JqKXtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgICAgcmV0dXJuIGtleXM7XG4gICAgfVxuXG4gICAgLy9UdXJuIHRoZSBkYXRhIG9iamVjdCBpbnRvIGEgcXVlcnkgc3RyaW5nLlxuICAgIC8vQWRkIGNoZWNrIHRvIHNlZSBpZiB0aGUgc2Vjb25kIHBhcmFtZXRlciBpcyBpbmRlZWRcbiAgICAvL2EgZGF0YSBvYmplY3QuIElmIG5vdCwga2VlcCB0aGUgZGVmYXVsdCBiZWhhdmlvdXJcbiAgICBpZih0eXBlb2YgZGF0YSA9PSAnb2JqZWN0Jyl7XG4gICAgICB2YXIgcXVlcnlTdHJpbmcgPSAnJztcbiAgICAgIHZhciBrZXlzID0gZ2V0S2V5cyhkYXRhKTtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgcXVlcnlTdHJpbmcgKz0gZW5jb2RlVVJJQ29tcG9uZW50KGtleXNbaV0pICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFba2V5c1tpXV0pXG4gICAgICAgIGlmKGkgIT0ga2V5cy5sZW5ndGggLSAxKXtcbiAgICAgICAgICBxdWVyeVN0cmluZyArPSAnJic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHVybCArPSAnPycgKyBxdWVyeVN0cmluZztcbiAgICB9IGVsc2UgaWYodHlwZW9mIGRhdGEgPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBtZXRob2QgPSBkYXRhO1xuICAgICAgY2FsbGJhY2sgPSBtZXRob2Q7XG4gICAgfVxuXG4gICAgLy9JZiBubyBtZXRob2Qgd2FzIHNldCBhbmQgdGhleSB1c2VkIHRoZSBjYWxsYmFjayBwYXJhbSBpbiBwbGFjZSBvZlxuICAgIC8vdGhlIG1ldGhvZCBwYXJhbSBpbnN0ZWFkLCB3ZSBzYXkgbWV0aG9kIGlzIGNhbGxiYWNrIGFuZCBzZXQgYVxuICAgIC8vZGVmYXVsdCBtZXRob2Qgb2YgXCJjYWxsYmFja1wiXG4gICAgaWYodHlwZW9mIG1ldGhvZCA9PSAnZnVuY3Rpb24nKXtcbiAgICAgIGNhbGxiYWNrID0gbWV0aG9kO1xuICAgICAgbWV0aG9kID0gJ2NhbGxiYWNrJztcbiAgICB9XG5cbiAgICAvL0NoZWNrIHRvIHNlZSBpZiB3ZSBoYXZlIERhdGUubm93IGF2YWlsYWJsZSwgaWYgbm90IHNoaW0gaXQgZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgaWYoIURhdGUubm93KXtcbiAgICAgIERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcbiAgICB9XG5cbiAgICAvL1VzZSB0aW1lc3RhbXAgKyBhIHJhbmRvbSBmYWN0b3IgdG8gYWNjb3VudCBmb3IgYSBsb3Qgb2YgcmVxdWVzdHMgaW4gYSBzaG9ydCB0aW1lXG4gICAgLy9lLmcuIGpzb25wMTM5NDU3MTc3NTE2MVxuICAgIHZhciB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICAgIHZhciBnZW5lcmF0ZWRGdW5jdGlvbiA9ICdqc29ucCcrTWF0aC5yb3VuZCh0aW1lc3RhbXArTWF0aC5yYW5kb20oKSoxMDAwMDAxKVxuXG4gICAgLy9HZW5lcmF0ZSB0aGUgdGVtcCBKU09OUCBmdW5jdGlvbiB1c2luZyB0aGUgbmFtZSBhYm92ZVxuICAgIC8vRmlyc3QsIGNhbGwgdGhlIGZ1bmN0aW9uIHRoZSB1c2VyIGRlZmluZWQgaW4gdGhlIGNhbGxiYWNrIHBhcmFtIFtjYWxsYmFjayhqc29uKV1cbiAgICAvL1RoZW4gZGVsZXRlIHRoZSBnZW5lcmF0ZWQgZnVuY3Rpb24gZnJvbSB0aGUgd2luZG93IFtkZWxldGUgd2luZG93W2dlbmVyYXRlZEZ1bmN0aW9uXV1cbiAgICB3aW5kb3dbZ2VuZXJhdGVkRnVuY3Rpb25dID0gZnVuY3Rpb24oanNvbil7XG4gICAgICBjYWxsYmFjayhqc29uKTtcbiAgICAgIGRlbGV0ZSB3aW5kb3dbZ2VuZXJhdGVkRnVuY3Rpb25dO1xuICAgIH07XG5cbiAgICAvL0NoZWNrIGlmIHRoZSB1c2VyIHNldCB0aGVpciBvd24gcGFyYW1zLCBhbmQgaWYgbm90IGFkZCBhID8gdG8gc3RhcnQgYSBsaXN0IG9mIHBhcmFtc1xuICAgIC8vSWYgaW4gZmFjdCB0aGV5IGRpZCB3ZSBhZGQgYSAmIHRvIGFkZCBvbnRvIHRoZSBwYXJhbXNcbiAgICAvL2V4YW1wbGUxOiB1cmwgPSBodHRwOi8vdXJsLmNvbSBUSEVOIGh0dHA6Ly91cmwuY29tP2NhbGxiYWNrPVhcbiAgICAvL2V4YW1wbGUyOiB1cmwgPSBodHRwOi8vdXJsLmNvbT9leGFtcGxlPXBhcmFtIFRIRU4gaHR0cDovL3VybC5jb20/ZXhhbXBsZT1wYXJhbSZjYWxsYmFjaz1YXG4gICAgaWYodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEpeyB1cmwgPSB1cmwrJz8nOyB9XG4gICAgZWxzZXsgdXJsID0gdXJsKycmJzsgfVxuXG4gICAgLy9UaGlzIGdlbmVyYXRlcyB0aGUgPHNjcmlwdD4gdGFnXG4gICAgdmFyIGpzb25wU2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAganNvbnBTY3JpcHQuc2V0QXR0cmlidXRlKFwic3JjXCIsIHVybCttZXRob2QrJz0nK2dlbmVyYXRlZEZ1bmN0aW9uKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoanNvbnBTY3JpcHQpXG4gIH1cbiAgd2luZG93LkpTT05QID0gSlNPTlA7XG59KSh3aW5kb3cpO1xuIl19
