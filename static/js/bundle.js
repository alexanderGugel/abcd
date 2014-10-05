(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/alexander/abcd/node_modules/hogan.js/lib/compiler.js":[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g,
      rLineSep = /\u2028/,
      rParagraphSep = /\u2029/;

  Hogan.tags = {
    '#': 1, '^': 2, '<': 3, '$': 4,
    '/': 5, '!': 6, '>': 7, '=': 8, '_v': 9,
    '{': 10, '&': 11, '_t': 12
  };

  Hogan.scan = function scan(text, delimiters) {
    var len = text.length,
        IN_TEXT = 0,
        IN_TAG_TYPE = 1,
        IN_TAG = 2,
        state = IN_TEXT,
        tagType = null,
        tag = null,
        buf = '',
        tokens = [],
        seenTag = false,
        i = 0,
        lineStart = 0,
        otag = '{{',
        ctag = '}}';

    function addBuf() {
      if (buf.length > 0) {
        tokens.push({tag: '_t', text: new String(buf)});
        buf = '';
      }
    }

    function lineIsWhitespace() {
      var isAllWhitespace = true;
      for (var j = lineStart; j < tokens.length; j++) {
        isAllWhitespace =
          (Hogan.tags[tokens[j].tag] < Hogan.tags['_v']) ||
          (tokens[j].tag == '_t' && tokens[j].text.match(rIsWhitespace) === null);
        if (!isAllWhitespace) {
          return false;
        }
      }

      return isAllWhitespace;
    }

    function filterLine(haveSeenTag, noNewLine) {
      addBuf();

      if (haveSeenTag && lineIsWhitespace()) {
        for (var j = lineStart, next; j < tokens.length; j++) {
          if (tokens[j].text) {
            if ((next = tokens[j+1]) && next.tag == '>') {
              // set indent to token value
              next.indent = tokens[j].text.toString()
            }
            tokens.splice(j, 1);
          }
        }
      } else if (!noNewLine) {
        tokens.push({tag:'\n'});
      }

      seenTag = false;
      lineStart = tokens.length;
    }

    function changeDelimiters(text, index) {
      var close = '=' + ctag,
          closeIndex = text.indexOf(close, index),
          delimiters = trim(
            text.substring(text.indexOf('=', index) + 1, closeIndex)
          ).split(' ');

      otag = delimiters[0];
      ctag = delimiters[delimiters.length - 1];

      return closeIndex + close.length - 1;
    }

    if (delimiters) {
      delimiters = delimiters.split(' ');
      otag = delimiters[0];
      ctag = delimiters[1];
    }

    for (i = 0; i < len; i++) {
      if (state == IN_TEXT) {
        if (tagChange(otag, text, i)) {
          --i;
          addBuf();
          state = IN_TAG_TYPE;
        } else {
          if (text.charAt(i) == '\n') {
            filterLine(seenTag);
          } else {
            buf += text.charAt(i);
          }
        }
      } else if (state == IN_TAG_TYPE) {
        i += otag.length - 1;
        tag = Hogan.tags[text.charAt(i + 1)];
        tagType = tag ? text.charAt(i + 1) : '_v';
        if (tagType == '=') {
          i = changeDelimiters(text, i);
          state = IN_TEXT;
        } else {
          if (tag) {
            i++;
          }
          state = IN_TAG;
        }
        seenTag = i;
      } else {
        if (tagChange(ctag, text, i)) {
          tokens.push({tag: tagType, n: trim(buf), otag: otag, ctag: ctag,
                       i: (tagType == '/') ? seenTag - otag.length : i + ctag.length});
          buf = '';
          i += ctag.length - 1;
          state = IN_TEXT;
          if (tagType == '{') {
            if (ctag == '}}') {
              i++;
            } else {
              cleanTripleStache(tokens[tokens.length - 1]);
            }
          }
        } else {
          buf += text.charAt(i);
        }
      }
    }

    filterLine(seenTag, true);

    return tokens;
  }

  function cleanTripleStache(token) {
    if (token.n.substr(token.n.length - 1) === '}') {
      token.n = token.n.substring(0, token.n.length - 1);
    }
  }

  function trim(s) {
    if (s.trim) {
      return s.trim();
    }

    return s.replace(/^\s*|\s*$/g, '');
  }

  function tagChange(tag, text, index) {
    if (text.charAt(index) != tag.charAt(0)) {
      return false;
    }

    for (var i = 1, l = tag.length; i < l; i++) {
      if (text.charAt(index + i) != tag.charAt(i)) {
        return false;
      }
    }

    return true;
  }

  // the tags allowed inside super templates
  var allowedInSuper = {'_t': true, '\n': true, '$': true, '/': true};

  function buildTree(tokens, kind, stack, customTags) {
    var instructions = [],
        opener = null,
        tail = null,
        token = null;

    tail = stack[stack.length - 1];

    while (tokens.length > 0) {
      token = tokens.shift();

      if (tail && tail.tag == '<' && !(token.tag in allowedInSuper)) {
        throw new Error('Illegal content in < super tag.');
      }

      if (Hogan.tags[token.tag] <= Hogan.tags['$'] || isOpener(token, customTags)) {
        stack.push(token);
        token.nodes = buildTree(tokens, token.tag, stack, customTags);
      } else if (token.tag == '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return instructions;
      } else if (token.tag == '\n') {
        token.last = (tokens.length == 0) || (tokens[0].tag == '\n');
      }

      instructions.push(token);
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return instructions;
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o == token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c == close && tags[i].o == open) {
        return true;
      }
    }
  }

  function stringifySubstitutions(obj) {
    var items = [];
    for (var key in obj) {
      items.push('"' + esc(key) + '": function(c,p,t,i) {' + obj[key] + '}');
    }
    return "{ " + items.join(",") + " }";
  }

  function stringifyPartials(codeObj) {
    var partials = [];
    for (var key in codeObj.partials) {
      partials.push('"' + esc(key) + '":{name:"' + esc(codeObj.partials[key].name) + '", ' + stringifyPartials(codeObj.partials[key]) + "}");
    }
    return "partials: {" + partials.join(",") + "}, subs: " + stringifySubstitutions(codeObj.subs);
  }

  Hogan.stringify = function(codeObj, text, options) {
    return "{code: function (c,p,i) { " + Hogan.wrapMain(codeObj.code) + " }," + stringifyPartials(codeObj) +  "}";
  }

  var serialNo = 0;
  Hogan.generate = function(tree, text, options) {
    serialNo = 0;
    var context = { code: '', subs: {}, partials: {} };
    Hogan.walk(tree, context);

    if (options.asString) {
      return this.stringify(context, text, options);
    }

    return this.makeTemplate(context, text, options);
  }

  Hogan.wrapMain = function(code) {
    return 'var t=this;t.b(i=i||"");' + code + 'return t.fl();';
  }

  Hogan.template = Hogan.Template;

  Hogan.makeTemplate = function(codeObj, text, options) {
    var template = this.makePartials(codeObj);
    template.code = new Function('c', 'p', 'i', this.wrapMain(codeObj.code));
    return new this.template(template, text, this, options);
  }

  Hogan.makePartials = function(codeObj) {
    var key, template = {subs: {}, partials: codeObj.partials, name: codeObj.name};
    for (key in template.partials) {
      template.partials[key] = this.makePartials(template.partials[key]);
    }
    for (key in codeObj.subs) {
      template.subs[key] = new Function('c', 'p', 't', 'i', codeObj.subs[key]);
    }
    return template;
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r')
            .replace(rLineSep, '\\u2028')
            .replace(rParagraphSep, '\\u2029');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function createPartial(node, context) {
    var prefix = "<" + (context.prefix || "");
    var sym = prefix + node.n + serialNo++;
    context.partials[sym] = {name: node.n, partials: {}};
    context.code += 't.b(t.rp("' +  esc(sym) + '",c,p,"' + (node.indent || '') + '"));';
    return sym;
  }

  Hogan.codegen = {
    '#': function(node, context) {
      context.code += 'if(t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),' +
                      'c,p,0,' + node.i + ',' + node.end + ',"' + node.otag + " " + node.ctag + '")){' +
                      't.rs(c,p,' + 'function(c,p,t){';
      Hogan.walk(node.nodes, context);
      context.code += '});c.pop();}';
    },

    '^': function(node, context) {
      context.code += 'if(!t.s(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,1),c,p,1,0,0,"")){';
      Hogan.walk(node.nodes, context);
      context.code += '};';
    },

    '>': createPartial,
    '<': function(node, context) {
      var ctx = {partials: {}, code: '', subs: {}, inPartial: true};
      Hogan.walk(node.nodes, ctx);
      var template = context.partials[createPartial(node, context)];
      template.subs = ctx.subs;
      template.partials = ctx.partials;
    },

    '$': function(node, context) {
      var ctx = {subs: {}, code: '', partials: context.partials, prefix: node.n};
      Hogan.walk(node.nodes, ctx);
      context.subs[node.n] = ctx.code;
      if (!context.inPartial) {
        context.code += 't.sub("' + esc(node.n) + '",c,p,i);';
      }
    },

    '\n': function(node, context) {
      context.code += write('"\\n"' + (node.last ? '' : ' + i'));
    },

    '_v': function(node, context) {
      context.code += 't.b(t.v(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
    },

    '_t': function(node, context) {
      context.code += write('"' + esc(node.text) + '"');
    },

    '{': tripleStache,

    '&': tripleStache
  }

  function tripleStache(node, context) {
    context.code += 't.b(t.t(t.' + chooseMethod(node.n) + '("' + esc(node.n) + '",c,p,0)));';
  }

  function write(s) {
    return 't.b(' + s + ');';
  }

  Hogan.walk = function(nodelist, context) {
    var func;
    for (var i = 0, l = nodelist.length; i < l; i++) {
      func = Hogan.codegen[nodelist[i].tag];
      func && func(nodelist[i], context);
    }
    return context;
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, '', [], options.sectionTags || []);
  }

  Hogan.cache = {};

  Hogan.cacheKey = function(text, options) {
    return [text, !!options.asString, !!options.disableLambda, options.delimiters, !!options.modelGet].join('||');
  }

  Hogan.compile = function(text, options) {
    options = options || {};
    var key = Hogan.cacheKey(text, options);
    var template = this.cache[key];

    if (template) {
      var partials = template.partials;
      for (var name in partials) {
        delete partials[name].instance;
      }
      return template;
    }

    template = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = template;
  }
})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],"/Users/alexander/abcd/node_modules/hogan.js/lib/hogan.js":[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// This file is for use with Node.js. See dist/ for browser files.

var Hogan = require('./compiler');
Hogan.Template = require('./template').Template;
Hogan.template = Hogan.Template;
module.exports = Hogan;

},{"./compiler":"/Users/alexander/abcd/node_modules/hogan.js/lib/compiler.js","./template":"/Users/alexander/abcd/node_modules/hogan.js/lib/template.js"}],"/Users/alexander/abcd/node_modules/hogan.js/lib/template.js":[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Hogan = {};

(function (Hogan) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options || {};
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.buf = '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        // Make sure we consider parent template now
        if (!partials.stackText) partials.stackText = {};
        for (key in partial.subs) {
          if (!partials.stackText[key]) {
            partials.stackText[key] = (this.activeSub !== undefined && partials.stackText[this.activeSub]) ? partials.stackText[this.activeSub] : this.text;
          }
        }
        template = createSpecializedPartial(template, partial.subs, partial.partials,
          this.stackSubs, this.stackPartials, partials.stackText);
      }
      this.partials[symbol].instance = template;

      return template;
    },

    // tries to find a partial in the current scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var found,
          names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          doModelGet = this.options.modelGet,
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        val = ctx[ctx.length - 1];
      } else {
        for (var i = 1; i < names.length; i++) {
          found = findInScope(names[i], val, doModelGet);
          if (found !== undefined) {
            cx = val;
            val = found;
          } else {
            val = '';
          }
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false,
          doModelGet = this.options.modelGet;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        val = findInScope(key, v, doModelGet);
        if (val !== undefined) {
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: function(s) { this.buf += s; },

    fl: function() { var r = this.buf; this.buf = ''; return r; },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var textSource,
          cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          textSource = (this.activeSub && this.subsText && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
          return this.ls(result, cx, partials, textSource.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        this.activeSub = name;
        f(context, partials, this, indent);
        this.activeSub = false;
      }
    }

  };

  //Find a key in an object
  function findInScope(key, scope, doModelGet) {
    var val;

    if (scope && typeof scope == 'object') {

      if (scope[key] !== undefined) {
        val = scope[key];

      // try lookup with get for backbone or similar model data
      } else if (doModelGet && scope.get && typeof scope.get == 'function') {
        val = scope.get(key);
      }
    }

    return val;
  }

  function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.subsText = {};  //hehe. substext.
    partial.buf = '';

    stackSubs = stackSubs || {};
    partial.stackSubs = stackSubs;
    partial.subsText = stackText;
    for (key in subs) {
      if (!stackSubs[key]) stackSubs[key] = subs[key];
    }
    for (key in stackSubs) {
      partial.subs[key] = stackSubs[key];
    }

    stackPartials = stackPartials || {};
    partial.stackPartials = stackPartials;
    for (key in partials) {
      if (!stackPartials[key]) stackPartials[key] = partials[key];
    }
    for (key in stackPartials) {
      partial.partials[key] = stackPartials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],"/Users/alexander/abcd/node_modules/page/index.js":[function(require,module,exports){

;(function(){

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' == typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' == typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
    // show <path> with [state]
    } else if ('string' == typeof path) {
      page.show(path, fn);
    // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path){
    if (0 == arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options){
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (!dispatch) return;
    var url = location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function(){
    running = false;
    removeEventListener('click', onclick, false);
    removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch){
    var ctx = new Context(path, state);
    if (false !== dispatch) page.dispatch(ctx);
    if (!ctx.unhandled) ctx.pushState();
    return ctx;
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function(path, state, init, dispatch){
    var ctx = new Context(path, state);
    ctx.init = init;
    if (null == dispatch) dispatch = true;
    if (dispatch) page.dispatch(ctx);
    ctx.save();
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx){
    var i = 0;

    function next() {
      var fn = page.callbacks[i++];
      if (!fn) return unhandled(ctx);
      fn(ctx, next);
    }

    next();
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    var current = window.location.pathname + window.location.search;
    if (current == ctx.canonicalPath) return;
    page.stop();
    ctx.unhandled = true;
    window.location = ctx.canonicalPath;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? path.slice(i + 1) : '';
    this.pathname = ~i ? path.slice(0, i) : path;
    this.params = [];

    // fragment
    this.hash = '';
    if (!~this.path.indexOf('#')) return;
    var parts = this.path.split('#');
    this.path = parts[0];
    this.hash = parts[1] || '';
    this.querystring = this.querystring.split('#')[0];
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function(){
    history.pushState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function(){
    history.replaceState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(path
      , this.keys = []
      , options.sensitive
      , options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn){
    var self = this;
    return function(ctx, next){
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params){
    var keys = this.keys
      , qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
      , m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val;
      } else {
        params.push(val);
      }
    }

    return true;
  };

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Boolean} sensitive
   * @param  {Boolean} strict
   * @return {RegExp}
   * @api private
   */

  function pathtoRegexp(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  }

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {
    if (1 != which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' != el.nodeName) el = el.parentNode;
    if (!el || 'A' != el.nodeName) return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // same page
    var orig = path + el.hash;

    path = path.replace(base, '');
    if (base && orig == path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null == e.which
      ? e.button
      : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  }

  /**
   * Expose `page`.
   */

  if ('undefined' == typeof module) {
    window.page = page;
  } else {
    module.exports = page;
  }

})();

},{}],"/Users/alexander/abcd/static/js/dashboard.js":[function(require,module,exports){
var Hogan = require('hogan.js');

var endpointsTemplate;

var loadExperiments = function () {
  if (!endpointsTemplate) {
    endpointsTemplate = $('#endpoints-template').html();
    endpointsTemplate = Hogan.compile(endpointsTemplate);
  }

  $.ajax({
    url: '/api/experiments',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (experimentResponse) {

      $.ajax({
        url: '/api/endpoints',
        type: 'GET',
        data: {
          token: localStorage.getItem('token')
        },
        dataType: 'json',
        success: function (endpointResponse) {
          var experiments = experimentResponse.experiments;
          var endpoints = endpointResponse.endpoints;
          var sortedExperiments = {};

          for (var i = 0; i < endpoints.length; i++) {
            sortedExperiments[endpoints[i].endpoint] = [];
          }

          for (var i = 0; i < experiments.length; i++) {
            sortedExperiments[experiments[i].endpoint].push(experiments[i]);
          }

          endpoints = [];
          for (var endpoint in sortedExperiments) {
            endpoints.push({
              endpoint: endpoint,
              experiments: sortedExperiments[endpoint]
            });
          }

          $('#dashboard .endpoints').html(endpointsTemplate.render({
            endpoints: endpoints,
            empty: endpoints.length === 0
          }));
        }
      });
    }
  });
};

var createEndpoint = function () {
  $.ajax({
    url: '/api/endpoints',
    type: 'POST',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

var deleteEndpoint = function (endpoint) {
  $.ajax({
    url: '/api/endpoints/' + endpoint,
    type: 'DELETE',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

var deleteExperiment = function (id) {
  $.ajax({
    url: '/api/experiments/' + id,
    type: 'DELETE',
    data: JSON.stringify({
      token: localStorage.getItem('token')
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function () {
      loadExperiments();
    }
  });
};

$('#dashboard .experiments').on('click', '.delete-experiment', function () {
  var id = $(this).closest('.experiment').data('id');
  var confirmation = confirm('Are you sure you want to delete this experiment?');
  if (confirmation) {
    deleteExperiment(id);
  }
});

$('#dashboard .create-endpoint').on('click', function (e) {
  e.preventDefault();
  createEndpoint();
});

$('#dashboard .endpoints').on('click', '.delete-endpoint', function () {
  var endpoint = $(this).closest('.endpoint').data('endpoint');
  var confirmation = confirm('Are you sure you want to delete this endpoint and all its experiments?');
  if (confirmation) {
    deleteEndpoint(endpoint);
  }
});

module.exports = function () {
  if (localStorage.getItem('token') === null) {
    page('/login');
    return;
  }

  $(function () {
    $('section').hide();
    $('#dashboard').show();
    loadExperiments();
  });
};

},{"hogan.js":"/Users/alexander/abcd/node_modules/hogan.js/lib/hogan.js"}],"/Users/alexander/abcd/static/js/docs.js":[function(require,module,exports){
module.exports = function (context) {
  $(function () {
    $('section').hide();
    $('#docs').show();
  });
};

},{}],"/Users/alexander/abcd/static/js/landing.js":[function(require,module,exports){
module.exports = function () {
  $(function () {
    $('section').hide();
    $('#landing').show();
  });

  if (localStorage.getItem('token')) {
    page('/dashboard');
    return;
  }
};

},{}],"/Users/alexander/abcd/static/js/login.js":[function(require,module,exports){
$('#login form').on('submit', function (e) {
  e.preventDefault();
  var email = $('#login input[type=email]').val();
  var password = $('#login input[type=password]').val();
  $.ajax({
    url: '/api/tokens',
    type: 'POST',
    data: JSON.stringify({
      email: email,
      password: password
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (response) {
      localStorage.setItem('token', response.token);
      page('/dashboard');
    },
    error: function (response) {
      $('#login .error').text(response.responseJSON.error);
    }
  });
});

module.exports = function (context) {
  if (localStorage.getItem('token') !== null) {
    page('/dashboard');
    return;
  }

  $(function () {
    $('section').hide();
    $('#login').show();
  });
};

},{}],"/Users/alexander/abcd/static/js/logout.js":[function(require,module,exports){
module.exports = function () {
  localStorage.removeItem('token');
  page('/');
};

},{}],"/Users/alexander/abcd/static/js/main.js":[function(require,module,exports){
// if (localStorage.getItem('newbie') && !localStorage.getItem('hide-getting-started')) {
//   $('#getting-started').show();
//   $('#getting-started').on('click', '.close', function () {
//     localStorage.setItem('hide-getting-started', new Date().getTime());
//     $('#getting-started').hide();
//   })
// }

require('./router');

},{"./router":"/Users/alexander/abcd/static/js/router.js"}],"/Users/alexander/abcd/static/js/router.js":[function(require,module,exports){
window.page = require('page');

  // if (localStorage.getItem('newbie') && !localStorage.getItem('hide-getting-started')) {
  //   $('#getting-started').show();
  //   $('#getting-started').on('click', '.close', function () {
  //     localStorage.setItem('hide-getting-started', new Date().getTime());
  //     $('#getting-started').hide();
  //   })
  // }


// Not available to logged in users
page('/', require('./landing'));
page('/signup', require('./signup'));
page('/login', require('./login'));
page('/docs', require('./docs'));

// Only for logged in users
page('/dashboard', require('./dashboard'));
page('/logout', require('./logout'));
page('/settings', require('./settings'))
page();

},{"./dashboard":"/Users/alexander/abcd/static/js/dashboard.js","./docs":"/Users/alexander/abcd/static/js/docs.js","./landing":"/Users/alexander/abcd/static/js/landing.js","./login":"/Users/alexander/abcd/static/js/login.js","./logout":"/Users/alexander/abcd/static/js/logout.js","./settings":"/Users/alexander/abcd/static/js/settings.js","./signup":"/Users/alexander/abcd/static/js/signup.js","page":"/Users/alexander/abcd/node_modules/page/index.js"}],"/Users/alexander/abcd/static/js/settings.js":[function(require,module,exports){
var loadUser = function () {
  $.ajax({
    url: '/api/users/me',
    type: 'GET',
    data: {
      token: localStorage.getItem('token')
    },
    dataType: 'json',
    success: function (response) {
      $('#update-account input[type=email]').val(response.user.email);
    }
  });
};


$('#update-account').on('submit', function (e) {
  e.preventDefault();

  var newEmail = $('#update-account input[type=email]').val();
  var newPassword = $('#update-account input[type=password]').val();

  $.ajax({
    url: '/api/users/me',
    type: 'PUT',
    data: JSON.stringify({
      token: localStorage.getItem('token'),
      email: newEmail,
      password: newPassword
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (response) {
      $('#message').stop(true);
      $('#message').addClass('success');
      $('#message').text('Successfully changed account information');
      $('#message').slideDown().delay(1000).slideUp();
      $('#update-account input[type=password]').val('')
    },
    error: function (response) {
      $('#message').stop(true);
      $('#message').removeClass('success');
      $('#message').addClass('error');
      $('#message').text(response.responseJSON.error);
      $('#message').slideDown().delay(1000).slideUp();
      $('#update-account input[type=password]').val('')
    }
  });
});

module.exports = function (context) {
  if (localStorage.getItem('token') === null) {
    page('/login');
    return;
  }

  $(function () {
    $('section').hide();
    $('#settings').show();
    loadUser();
  });
};

},{}],"/Users/alexander/abcd/static/js/signup.js":[function(require,module,exports){
$('#signup form').on('submit', function (e) {
  e.preventDefault();
  var email = $('#signup input[type=email]').val();
  var password = $('#signup input[type=password]').val();
  $.ajax({
    url: '/api/users',
    type: 'POST',
    data: JSON.stringify({
      email: email,
      password: password
    }),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    success: function (response) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('newbie', new Date().getTime());
      page('/dashboard');
    },
    error: function (response) {
      $('#signup .error').text(response.responseJSON.error);
    }
  });
});

module.exports = function (context) {
  if (localStorage.getItem('token') !== null) {
    page('/dashboard');
    return;
  }

  $(function () {
    $('section').hide();
    $('#signup').show();
  });
};

},{}]},{},["/Users/alexander/abcd/static/js/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvY29tcGlsZXIuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi9ob2dhbi5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9ub2RlX21vZHVsZXMvaG9nYW4uanMvbGliL3RlbXBsYXRlLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL25vZGVfbW9kdWxlcy9wYWdlL2luZGV4LmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL3N0YXRpYy9qcy9kYXNoYm9hcmQuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL2RvY3MuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL2xhbmRpbmcuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL2xvZ2luLmpzIiwiL1VzZXJzL2FsZXhhbmRlci9hYmNkL3N0YXRpYy9qcy9sb2dvdXQuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL21haW4uanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL3JvdXRlci5qcyIsIi9Vc2Vycy9hbGV4YW5kZXIvYWJjZC9zdGF0aWMvanMvc2V0dGluZ3MuanMiLCIvVXNlcnMvYWxleGFuZGVyL2FiY2Qvc3RhdGljL2pzL3NpZ251cC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogIENvcHlyaWdodCAyMDExIFR3aXR0ZXIsIEluYy5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgLy8gU2V0dXAgcmVnZXggIGFzc2lnbm1lbnRzXG4gIC8vIHJlbW92ZSB3aGl0ZXNwYWNlIGFjY29yZGluZyB0byBNdXN0YWNoZSBzcGVjXG4gIHZhciBySXNXaGl0ZXNwYWNlID0gL1xcUy8sXG4gICAgICByUXVvdCA9IC9cXFwiL2csXG4gICAgICByTmV3bGluZSA9ICAvXFxuL2csXG4gICAgICByQ3IgPSAvXFxyL2csXG4gICAgICByU2xhc2ggPSAvXFxcXC9nLFxuICAgICAgckxpbmVTZXAgPSAvXFx1MjAyOC8sXG4gICAgICByUGFyYWdyYXBoU2VwID0gL1xcdTIwMjkvO1xuXG4gIEhvZ2FuLnRhZ3MgPSB7XG4gICAgJyMnOiAxLCAnXic6IDIsICc8JzogMywgJyQnOiA0LFxuICAgICcvJzogNSwgJyEnOiA2LCAnPic6IDcsICc9JzogOCwgJ192JzogOSxcbiAgICAneyc6IDEwLCAnJic6IDExLCAnX3QnOiAxMlxuICB9O1xuXG4gIEhvZ2FuLnNjYW4gPSBmdW5jdGlvbiBzY2FuKHRleHQsIGRlbGltaXRlcnMpIHtcbiAgICB2YXIgbGVuID0gdGV4dC5sZW5ndGgsXG4gICAgICAgIElOX1RFWFQgPSAwLFxuICAgICAgICBJTl9UQUdfVFlQRSA9IDEsXG4gICAgICAgIElOX1RBRyA9IDIsXG4gICAgICAgIHN0YXRlID0gSU5fVEVYVCxcbiAgICAgICAgdGFnVHlwZSA9IG51bGwsXG4gICAgICAgIHRhZyA9IG51bGwsXG4gICAgICAgIGJ1ZiA9ICcnLFxuICAgICAgICB0b2tlbnMgPSBbXSxcbiAgICAgICAgc2VlblRhZyA9IGZhbHNlLFxuICAgICAgICBpID0gMCxcbiAgICAgICAgbGluZVN0YXJ0ID0gMCxcbiAgICAgICAgb3RhZyA9ICd7eycsXG4gICAgICAgIGN0YWcgPSAnfX0nO1xuXG4gICAgZnVuY3Rpb24gYWRkQnVmKCkge1xuICAgICAgaWYgKGJ1Zi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRva2Vucy5wdXNoKHt0YWc6ICdfdCcsIHRleHQ6IG5ldyBTdHJpbmcoYnVmKX0pO1xuICAgICAgICBidWYgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5lSXNXaGl0ZXNwYWNlKCkge1xuICAgICAgdmFyIGlzQWxsV2hpdGVzcGFjZSA9IHRydWU7XG4gICAgICBmb3IgKHZhciBqID0gbGluZVN0YXJ0OyBqIDwgdG9rZW5zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlzQWxsV2hpdGVzcGFjZSA9XG4gICAgICAgICAgKEhvZ2FuLnRhZ3NbdG9rZW5zW2pdLnRhZ10gPCBIb2dhbi50YWdzWydfdiddKSB8fFxuICAgICAgICAgICh0b2tlbnNbal0udGFnID09ICdfdCcgJiYgdG9rZW5zW2pdLnRleHQubWF0Y2gocklzV2hpdGVzcGFjZSkgPT09IG51bGwpO1xuICAgICAgICBpZiAoIWlzQWxsV2hpdGVzcGFjZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNBbGxXaGl0ZXNwYWNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckxpbmUoaGF2ZVNlZW5UYWcsIG5vTmV3TGluZSkge1xuICAgICAgYWRkQnVmKCk7XG5cbiAgICAgIGlmIChoYXZlU2VlblRhZyAmJiBsaW5lSXNXaGl0ZXNwYWNlKCkpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IGxpbmVTdGFydCwgbmV4dDsgaiA8IHRva2Vucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmICh0b2tlbnNbal0udGV4dCkge1xuICAgICAgICAgICAgaWYgKChuZXh0ID0gdG9rZW5zW2orMV0pICYmIG5leHQudGFnID09ICc+Jykge1xuICAgICAgICAgICAgICAvLyBzZXQgaW5kZW50IHRvIHRva2VuIHZhbHVlXG4gICAgICAgICAgICAgIG5leHQuaW5kZW50ID0gdG9rZW5zW2pdLnRleHQudG9TdHJpbmcoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW5zLnNwbGljZShqLCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIW5vTmV3TGluZSkge1xuICAgICAgICB0b2tlbnMucHVzaCh7dGFnOidcXG4nfSk7XG4gICAgICB9XG5cbiAgICAgIHNlZW5UYWcgPSBmYWxzZTtcbiAgICAgIGxpbmVTdGFydCA9IHRva2Vucy5sZW5ndGg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hhbmdlRGVsaW1pdGVycyh0ZXh0LCBpbmRleCkge1xuICAgICAgdmFyIGNsb3NlID0gJz0nICsgY3RhZyxcbiAgICAgICAgICBjbG9zZUluZGV4ID0gdGV4dC5pbmRleE9mKGNsb3NlLCBpbmRleCksXG4gICAgICAgICAgZGVsaW1pdGVycyA9IHRyaW0oXG4gICAgICAgICAgICB0ZXh0LnN1YnN0cmluZyh0ZXh0LmluZGV4T2YoJz0nLCBpbmRleCkgKyAxLCBjbG9zZUluZGV4KVxuICAgICAgICAgICkuc3BsaXQoJyAnKTtcblxuICAgICAgb3RhZyA9IGRlbGltaXRlcnNbMF07XG4gICAgICBjdGFnID0gZGVsaW1pdGVyc1tkZWxpbWl0ZXJzLmxlbmd0aCAtIDFdO1xuXG4gICAgICByZXR1cm4gY2xvc2VJbmRleCArIGNsb3NlLmxlbmd0aCAtIDE7XG4gICAgfVxuXG4gICAgaWYgKGRlbGltaXRlcnMpIHtcbiAgICAgIGRlbGltaXRlcnMgPSBkZWxpbWl0ZXJzLnNwbGl0KCcgJyk7XG4gICAgICBvdGFnID0gZGVsaW1pdGVyc1swXTtcbiAgICAgIGN0YWcgPSBkZWxpbWl0ZXJzWzFdO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKHN0YXRlID09IElOX1RFWFQpIHtcbiAgICAgICAgaWYgKHRhZ0NoYW5nZShvdGFnLCB0ZXh0LCBpKSkge1xuICAgICAgICAgIC0taTtcbiAgICAgICAgICBhZGRCdWYoKTtcbiAgICAgICAgICBzdGF0ZSA9IElOX1RBR19UWVBFO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0ZXh0LmNoYXJBdChpKSA9PSAnXFxuJykge1xuICAgICAgICAgICAgZmlsdGVyTGluZShzZWVuVGFnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmICs9IHRleHQuY2hhckF0KGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PSBJTl9UQUdfVFlQRSkge1xuICAgICAgICBpICs9IG90YWcubGVuZ3RoIC0gMTtcbiAgICAgICAgdGFnID0gSG9nYW4udGFnc1t0ZXh0LmNoYXJBdChpICsgMSldO1xuICAgICAgICB0YWdUeXBlID0gdGFnID8gdGV4dC5jaGFyQXQoaSArIDEpIDogJ192JztcbiAgICAgICAgaWYgKHRhZ1R5cGUgPT0gJz0nKSB7XG4gICAgICAgICAgaSA9IGNoYW5nZURlbGltaXRlcnModGV4dCwgaSk7XG4gICAgICAgICAgc3RhdGUgPSBJTl9URVhUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0YWcpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSBJTl9UQUc7XG4gICAgICAgIH1cbiAgICAgICAgc2VlblRhZyA9IGk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGFnQ2hhbmdlKGN0YWcsIHRleHQsIGkpKSB7XG4gICAgICAgICAgdG9rZW5zLnB1c2goe3RhZzogdGFnVHlwZSwgbjogdHJpbShidWYpLCBvdGFnOiBvdGFnLCBjdGFnOiBjdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICBpOiAodGFnVHlwZSA9PSAnLycpID8gc2VlblRhZyAtIG90YWcubGVuZ3RoIDogaSArIGN0YWcubGVuZ3RofSk7XG4gICAgICAgICAgYnVmID0gJyc7XG4gICAgICAgICAgaSArPSBjdGFnLmxlbmd0aCAtIDE7XG4gICAgICAgICAgc3RhdGUgPSBJTl9URVhUO1xuICAgICAgICAgIGlmICh0YWdUeXBlID09ICd7Jykge1xuICAgICAgICAgICAgaWYgKGN0YWcgPT0gJ319Jykge1xuICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjbGVhblRyaXBsZVN0YWNoZSh0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmICs9IHRleHQuY2hhckF0KGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZmlsdGVyTGluZShzZWVuVGFnLCB0cnVlKTtcblxuICAgIHJldHVybiB0b2tlbnM7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhblRyaXBsZVN0YWNoZSh0b2tlbikge1xuICAgIGlmICh0b2tlbi5uLnN1YnN0cih0b2tlbi5uLmxlbmd0aCAtIDEpID09PSAnfScpIHtcbiAgICAgIHRva2VuLm4gPSB0b2tlbi5uLnN1YnN0cmluZygwLCB0b2tlbi5uLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaW0ocykge1xuICAgIGlmIChzLnRyaW0pIHtcbiAgICAgIHJldHVybiBzLnRyaW0oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJyk7XG4gIH1cblxuICBmdW5jdGlvbiB0YWdDaGFuZ2UodGFnLCB0ZXh0LCBpbmRleCkge1xuICAgIGlmICh0ZXh0LmNoYXJBdChpbmRleCkgIT0gdGFnLmNoYXJBdCgwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAxLCBsID0gdGFnLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRleHQuY2hhckF0KGluZGV4ICsgaSkgIT0gdGFnLmNoYXJBdChpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyB0aGUgdGFncyBhbGxvd2VkIGluc2lkZSBzdXBlciB0ZW1wbGF0ZXNcbiAgdmFyIGFsbG93ZWRJblN1cGVyID0geydfdCc6IHRydWUsICdcXG4nOiB0cnVlLCAnJCc6IHRydWUsICcvJzogdHJ1ZX07XG5cbiAgZnVuY3Rpb24gYnVpbGRUcmVlKHRva2Vucywga2luZCwgc3RhY2ssIGN1c3RvbVRhZ3MpIHtcbiAgICB2YXIgaW5zdHJ1Y3Rpb25zID0gW10sXG4gICAgICAgIG9wZW5lciA9IG51bGwsXG4gICAgICAgIHRhaWwgPSBudWxsLFxuICAgICAgICB0b2tlbiA9IG51bGw7XG5cbiAgICB0YWlsID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG5cbiAgICB3aGlsZSAodG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRva2VuID0gdG9rZW5zLnNoaWZ0KCk7XG5cbiAgICAgIGlmICh0YWlsICYmIHRhaWwudGFnID09ICc8JyAmJiAhKHRva2VuLnRhZyBpbiBhbGxvd2VkSW5TdXBlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbGxlZ2FsIGNvbnRlbnQgaW4gPCBzdXBlciB0YWcuJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChIb2dhbi50YWdzW3Rva2VuLnRhZ10gPD0gSG9nYW4udGFnc1snJCddIHx8IGlzT3BlbmVyKHRva2VuLCBjdXN0b21UYWdzKSkge1xuICAgICAgICBzdGFjay5wdXNoKHRva2VuKTtcbiAgICAgICAgdG9rZW4ubm9kZXMgPSBidWlsZFRyZWUodG9rZW5zLCB0b2tlbi50YWcsIHN0YWNrLCBjdXN0b21UYWdzKTtcbiAgICAgIH0gZWxzZSBpZiAodG9rZW4udGFnID09ICcvJykge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDbG9zaW5nIHRhZyB3aXRob3V0IG9wZW5lcjogLycgKyB0b2tlbi5uKTtcbiAgICAgICAgfVxuICAgICAgICBvcGVuZXIgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKHRva2VuLm4gIT0gb3BlbmVyLm4gJiYgIWlzQ2xvc2VyKHRva2VuLm4sIG9wZW5lci5uLCBjdXN0b21UYWdzKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmVzdGluZyBlcnJvcjogJyArIG9wZW5lci5uICsgJyB2cy4gJyArIHRva2VuLm4pO1xuICAgICAgICB9XG4gICAgICAgIG9wZW5lci5lbmQgPSB0b2tlbi5pO1xuICAgICAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xuICAgICAgfSBlbHNlIGlmICh0b2tlbi50YWcgPT0gJ1xcbicpIHtcbiAgICAgICAgdG9rZW4ubGFzdCA9ICh0b2tlbnMubGVuZ3RoID09IDApIHx8ICh0b2tlbnNbMF0udGFnID09ICdcXG4nKTtcbiAgICAgIH1cblxuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIGlmIChzdGFjay5sZW5ndGggPiAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pc3NpbmcgY2xvc2luZyB0YWc6ICcgKyBzdGFjay5wb3AoKS5uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNPcGVuZXIodG9rZW4sIHRhZ3MpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRhZ3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGFnc1tpXS5vID09IHRva2VuLm4pIHtcbiAgICAgICAgdG9rZW4udGFnID0gJyMnO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpc0Nsb3NlcihjbG9zZSwgb3BlbiwgdGFncykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGFncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0YWdzW2ldLmMgPT0gY2xvc2UgJiYgdGFnc1tpXS5vID09IG9wZW4pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RyaW5naWZ5U3Vic3RpdHV0aW9ucyhvYmopIHtcbiAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpdGVtcy5wdXNoKCdcIicgKyBlc2Moa2V5KSArICdcIjogZnVuY3Rpb24oYyxwLHQsaSkgeycgKyBvYmpba2V5XSArICd9Jyk7XG4gICAgfVxuICAgIHJldHVybiBcInsgXCIgKyBpdGVtcy5qb2luKFwiLFwiKSArIFwiIH1cIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0cmluZ2lmeVBhcnRpYWxzKGNvZGVPYmopIHtcbiAgICB2YXIgcGFydGlhbHMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gY29kZU9iai5wYXJ0aWFscykge1xuICAgICAgcGFydGlhbHMucHVzaCgnXCInICsgZXNjKGtleSkgKyAnXCI6e25hbWU6XCInICsgZXNjKGNvZGVPYmoucGFydGlhbHNba2V5XS5uYW1lKSArICdcIiwgJyArIHN0cmluZ2lmeVBhcnRpYWxzKGNvZGVPYmoucGFydGlhbHNba2V5XSkgKyBcIn1cIik7XG4gICAgfVxuICAgIHJldHVybiBcInBhcnRpYWxzOiB7XCIgKyBwYXJ0aWFscy5qb2luKFwiLFwiKSArIFwifSwgc3ViczogXCIgKyBzdHJpbmdpZnlTdWJzdGl0dXRpb25zKGNvZGVPYmouc3Vicyk7XG4gIH1cblxuICBIb2dhbi5zdHJpbmdpZnkgPSBmdW5jdGlvbihjb2RlT2JqLCB0ZXh0LCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIFwie2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyBcIiArIEhvZ2FuLndyYXBNYWluKGNvZGVPYmouY29kZSkgKyBcIiB9LFwiICsgc3RyaW5naWZ5UGFydGlhbHMoY29kZU9iaikgKyAgXCJ9XCI7XG4gIH1cblxuICB2YXIgc2VyaWFsTm8gPSAwO1xuICBIb2dhbi5nZW5lcmF0ZSA9IGZ1bmN0aW9uKHRyZWUsIHRleHQsIG9wdGlvbnMpIHtcbiAgICBzZXJpYWxObyA9IDA7XG4gICAgdmFyIGNvbnRleHQgPSB7IGNvZGU6ICcnLCBzdWJzOiB7fSwgcGFydGlhbHM6IHt9IH07XG4gICAgSG9nYW4ud2Fsayh0cmVlLCBjb250ZXh0KTtcblxuICAgIGlmIChvcHRpb25zLmFzU3RyaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdHJpbmdpZnkoY29udGV4dCwgdGV4dCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFrZVRlbXBsYXRlKGNvbnRleHQsIHRleHQsIG9wdGlvbnMpO1xuICB9XG5cbiAgSG9nYW4ud3JhcE1haW4gPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgcmV0dXJuICd2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpOycgKyBjb2RlICsgJ3JldHVybiB0LmZsKCk7JztcbiAgfVxuXG4gIEhvZ2FuLnRlbXBsYXRlID0gSG9nYW4uVGVtcGxhdGU7XG5cbiAgSG9nYW4ubWFrZVRlbXBsYXRlID0gZnVuY3Rpb24oY29kZU9iaiwgdGV4dCwgb3B0aW9ucykge1xuICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMubWFrZVBhcnRpYWxzKGNvZGVPYmopO1xuICAgIHRlbXBsYXRlLmNvZGUgPSBuZXcgRnVuY3Rpb24oJ2MnLCAncCcsICdpJywgdGhpcy53cmFwTWFpbihjb2RlT2JqLmNvZGUpKTtcbiAgICByZXR1cm4gbmV3IHRoaXMudGVtcGxhdGUodGVtcGxhdGUsIHRleHQsIHRoaXMsIG9wdGlvbnMpO1xuICB9XG5cbiAgSG9nYW4ubWFrZVBhcnRpYWxzID0gZnVuY3Rpb24oY29kZU9iaikge1xuICAgIHZhciBrZXksIHRlbXBsYXRlID0ge3N1YnM6IHt9LCBwYXJ0aWFsczogY29kZU9iai5wYXJ0aWFscywgbmFtZTogY29kZU9iai5uYW1lfTtcbiAgICBmb3IgKGtleSBpbiB0ZW1wbGF0ZS5wYXJ0aWFscykge1xuICAgICAgdGVtcGxhdGUucGFydGlhbHNba2V5XSA9IHRoaXMubWFrZVBhcnRpYWxzKHRlbXBsYXRlLnBhcnRpYWxzW2tleV0pO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBjb2RlT2JqLnN1YnMpIHtcbiAgICAgIHRlbXBsYXRlLnN1YnNba2V5XSA9IG5ldyBGdW5jdGlvbignYycsICdwJywgJ3QnLCAnaScsIGNvZGVPYmouc3Vic1trZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG5cbiAgZnVuY3Rpb24gZXNjKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKHJTbGFzaCwgJ1xcXFxcXFxcJylcbiAgICAgICAgICAgIC5yZXBsYWNlKHJRdW90LCAnXFxcXFxcXCInKVxuICAgICAgICAgICAgLnJlcGxhY2Uock5ld2xpbmUsICdcXFxcbicpXG4gICAgICAgICAgICAucmVwbGFjZShyQ3IsICdcXFxccicpXG4gICAgICAgICAgICAucmVwbGFjZShyTGluZVNlcCwgJ1xcXFx1MjAyOCcpXG4gICAgICAgICAgICAucmVwbGFjZShyUGFyYWdyYXBoU2VwLCAnXFxcXHUyMDI5Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBjaG9vc2VNZXRob2Qocykge1xuICAgIHJldHVybiAofnMuaW5kZXhPZignLicpKSA/ICdkJyA6ICdmJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVBhcnRpYWwobm9kZSwgY29udGV4dCkge1xuICAgIHZhciBwcmVmaXggPSBcIjxcIiArIChjb250ZXh0LnByZWZpeCB8fCBcIlwiKTtcbiAgICB2YXIgc3ltID0gcHJlZml4ICsgbm9kZS5uICsgc2VyaWFsTm8rKztcbiAgICBjb250ZXh0LnBhcnRpYWxzW3N5bV0gPSB7bmFtZTogbm9kZS5uLCBwYXJ0aWFsczoge319O1xuICAgIGNvbnRleHQuY29kZSArPSAndC5iKHQucnAoXCInICsgIGVzYyhzeW0pICsgJ1wiLGMscCxcIicgKyAobm9kZS5pbmRlbnQgfHwgJycpICsgJ1wiKSk7JztcbiAgICByZXR1cm4gc3ltO1xuICB9XG5cbiAgSG9nYW4uY29kZWdlbiA9IHtcbiAgICAnIyc6IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQpIHtcbiAgICAgIGNvbnRleHQuY29kZSArPSAnaWYodC5zKHQuJyArIGNob29zZU1ldGhvZChub2RlLm4pICsgJyhcIicgKyBlc2Mobm9kZS5uKSArICdcIixjLHAsMSksJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2MscCwwLCcgKyBub2RlLmkgKyAnLCcgKyBub2RlLmVuZCArICcsXCInICsgbm9kZS5vdGFnICsgXCIgXCIgKyBub2RlLmN0YWcgKyAnXCIpKXsnICtcbiAgICAgICAgICAgICAgICAgICAgICAndC5ycyhjLHAsJyArICdmdW5jdGlvbihjLHAsdCl7JztcbiAgICAgIEhvZ2FuLndhbGsobm9kZS5ub2RlcywgY29udGV4dCk7XG4gICAgICBjb250ZXh0LmNvZGUgKz0gJ30pO2MucG9wKCk7fSc7XG4gICAgfSxcblxuICAgICdeJzogZnVuY3Rpb24obm9kZSwgY29udGV4dCkge1xuICAgICAgY29udGV4dC5jb2RlICs9ICdpZighdC5zKHQuJyArIGNob29zZU1ldGhvZChub2RlLm4pICsgJyhcIicgKyBlc2Mobm9kZS5uKSArICdcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXsnO1xuICAgICAgSG9nYW4ud2Fsayhub2RlLm5vZGVzLCBjb250ZXh0KTtcbiAgICAgIGNvbnRleHQuY29kZSArPSAnfTsnO1xuICAgIH0sXG5cbiAgICAnPic6IGNyZWF0ZVBhcnRpYWwsXG4gICAgJzwnOiBmdW5jdGlvbihub2RlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgY3R4ID0ge3BhcnRpYWxzOiB7fSwgY29kZTogJycsIHN1YnM6IHt9LCBpblBhcnRpYWw6IHRydWV9O1xuICAgICAgSG9nYW4ud2Fsayhub2RlLm5vZGVzLCBjdHgpO1xuICAgICAgdmFyIHRlbXBsYXRlID0gY29udGV4dC5wYXJ0aWFsc1tjcmVhdGVQYXJ0aWFsKG5vZGUsIGNvbnRleHQpXTtcbiAgICAgIHRlbXBsYXRlLnN1YnMgPSBjdHguc3VicztcbiAgICAgIHRlbXBsYXRlLnBhcnRpYWxzID0gY3R4LnBhcnRpYWxzO1xuICAgIH0sXG5cbiAgICAnJCc6IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBjdHggPSB7c3Viczoge30sIGNvZGU6ICcnLCBwYXJ0aWFsczogY29udGV4dC5wYXJ0aWFscywgcHJlZml4OiBub2RlLm59O1xuICAgICAgSG9nYW4ud2Fsayhub2RlLm5vZGVzLCBjdHgpO1xuICAgICAgY29udGV4dC5zdWJzW25vZGUubl0gPSBjdHguY29kZTtcbiAgICAgIGlmICghY29udGV4dC5pblBhcnRpYWwpIHtcbiAgICAgICAgY29udGV4dC5jb2RlICs9ICd0LnN1YihcIicgKyBlc2Mobm9kZS5uKSArICdcIixjLHAsaSk7JztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgJ1xcbic6IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQpIHtcbiAgICAgIGNvbnRleHQuY29kZSArPSB3cml0ZSgnXCJcXFxcblwiJyArIChub2RlLmxhc3QgPyAnJyA6ICcgKyBpJykpO1xuICAgIH0sXG5cbiAgICAnX3YnOiBmdW5jdGlvbihub2RlLCBjb250ZXh0KSB7XG4gICAgICBjb250ZXh0LmNvZGUgKz0gJ3QuYih0LnYodC4nICsgY2hvb3NlTWV0aG9kKG5vZGUubikgKyAnKFwiJyArIGVzYyhub2RlLm4pICsgJ1wiLGMscCwwKSkpOyc7XG4gICAgfSxcblxuICAgICdfdCc6IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQpIHtcbiAgICAgIGNvbnRleHQuY29kZSArPSB3cml0ZSgnXCInICsgZXNjKG5vZGUudGV4dCkgKyAnXCInKTtcbiAgICB9LFxuXG4gICAgJ3snOiB0cmlwbGVTdGFjaGUsXG5cbiAgICAnJic6IHRyaXBsZVN0YWNoZVxuICB9XG5cbiAgZnVuY3Rpb24gdHJpcGxlU3RhY2hlKG5vZGUsIGNvbnRleHQpIHtcbiAgICBjb250ZXh0LmNvZGUgKz0gJ3QuYih0LnQodC4nICsgY2hvb3NlTWV0aG9kKG5vZGUubikgKyAnKFwiJyArIGVzYyhub2RlLm4pICsgJ1wiLGMscCwwKSkpOyc7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZShzKSB7XG4gICAgcmV0dXJuICd0LmIoJyArIHMgKyAnKTsnO1xuICB9XG5cbiAgSG9nYW4ud2FsayA9IGZ1bmN0aW9uKG5vZGVsaXN0LCBjb250ZXh0KSB7XG4gICAgdmFyIGZ1bmM7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2RlbGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGZ1bmMgPSBIb2dhbi5jb2RlZ2VuW25vZGVsaXN0W2ldLnRhZ107XG4gICAgICBmdW5jICYmIGZ1bmMobm9kZWxpc3RbaV0sIGNvbnRleHQpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGV4dDtcbiAgfVxuXG4gIEhvZ2FuLnBhcnNlID0gZnVuY3Rpb24odG9rZW5zLCB0ZXh0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgcmV0dXJuIGJ1aWxkVHJlZSh0b2tlbnMsICcnLCBbXSwgb3B0aW9ucy5zZWN0aW9uVGFncyB8fCBbXSk7XG4gIH1cblxuICBIb2dhbi5jYWNoZSA9IHt9O1xuXG4gIEhvZ2FuLmNhY2hlS2V5ID0gZnVuY3Rpb24odGV4dCwgb3B0aW9ucykge1xuICAgIHJldHVybiBbdGV4dCwgISFvcHRpb25zLmFzU3RyaW5nLCAhIW9wdGlvbnMuZGlzYWJsZUxhbWJkYSwgb3B0aW9ucy5kZWxpbWl0ZXJzLCAhIW9wdGlvbnMubW9kZWxHZXRdLmpvaW4oJ3x8Jyk7XG4gIH1cblxuICBIb2dhbi5jb21waWxlID0gZnVuY3Rpb24odGV4dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBrZXkgPSBIb2dhbi5jYWNoZUtleSh0ZXh0LCBvcHRpb25zKTtcbiAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLmNhY2hlW2tleV07XG5cbiAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgIHZhciBwYXJ0aWFscyA9IHRlbXBsYXRlLnBhcnRpYWxzO1xuICAgICAgZm9yICh2YXIgbmFtZSBpbiBwYXJ0aWFscykge1xuICAgICAgICBkZWxldGUgcGFydGlhbHNbbmFtZV0uaW5zdGFuY2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuXG4gICAgdGVtcGxhdGUgPSB0aGlzLmdlbmVyYXRlKHRoaXMucGFyc2UodGhpcy5zY2FuKHRleHQsIG9wdGlvbnMuZGVsaW1pdGVycyksIHRleHQsIG9wdGlvbnMpLCB0ZXh0LCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZVtrZXldID0gdGVtcGxhdGU7XG4gIH1cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBIb2dhbik7XG4iLCIvKlxuICogIENvcHlyaWdodCAyMDExIFR3aXR0ZXIsIEluYy5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIFRoaXMgZmlsZSBpcyBmb3IgdXNlIHdpdGggTm9kZS5qcy4gU2VlIGRpc3QvIGZvciBicm93c2VyIGZpbGVzLlxuXG52YXIgSG9nYW4gPSByZXF1aXJlKCcuL2NvbXBpbGVyJyk7XG5Ib2dhbi5UZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKS5UZW1wbGF0ZTtcbkhvZ2FuLnRlbXBsYXRlID0gSG9nYW4uVGVtcGxhdGU7XG5tb2R1bGUuZXhwb3J0cyA9IEhvZ2FuO1xuIiwiLypcbiAqICBDb3B5cmlnaHQgMjAxMSBUd2l0dGVyLCBJbmMuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgSG9nYW4gPSB7fTtcblxuKGZ1bmN0aW9uIChIb2dhbikge1xuICBIb2dhbi5UZW1wbGF0ZSA9IGZ1bmN0aW9uIChjb2RlT2JqLCB0ZXh0LCBjb21waWxlciwgb3B0aW9ucykge1xuICAgIGNvZGVPYmogPSBjb2RlT2JqIHx8IHt9O1xuICAgIHRoaXMuciA9IGNvZGVPYmouY29kZSB8fCB0aGlzLnI7XG4gICAgdGhpcy5jID0gY29tcGlsZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0IHx8ICcnO1xuICAgIHRoaXMucGFydGlhbHMgPSBjb2RlT2JqLnBhcnRpYWxzIHx8IHt9O1xuICAgIHRoaXMuc3VicyA9IGNvZGVPYmouc3VicyB8fCB7fTtcbiAgICB0aGlzLmJ1ZiA9ICcnO1xuICB9XG5cbiAgSG9nYW4uVGVtcGxhdGUucHJvdG90eXBlID0ge1xuICAgIC8vIHJlbmRlcjogcmVwbGFjZWQgYnkgZ2VuZXJhdGVkIGNvZGUuXG4gICAgcjogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHsgcmV0dXJuICcnOyB9LFxuXG4gICAgLy8gdmFyaWFibGUgZXNjYXBpbmdcbiAgICB2OiBob2dhbkVzY2FwZSxcblxuICAgIC8vIHRyaXBsZSBzdGFjaGVcbiAgICB0OiBjb2VyY2VUb1N0cmluZyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJpKFtjb250ZXh0XSwgcGFydGlhbHMgfHwge30sIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBpbnRlcm5hbCAtLSBhIGhvb2sgZm9yIG92ZXJyaWRlcyB0aGF0IGNhdGNoZXMgcGFydGlhbHMgdG9vXG4gICAgcmk6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyBlbnN1cmVQYXJ0aWFsXG4gICAgZXA6IGZ1bmN0aW9uKHN5bWJvbCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5wYXJ0aWFsc1tzeW1ib2xdO1xuXG4gICAgICAvLyBjaGVjayB0byBzZWUgdGhhdCBpZiB3ZSd2ZSBpbnN0YW50aWF0ZWQgdGhpcyBwYXJ0aWFsIGJlZm9yZVxuICAgICAgdmFyIHRlbXBsYXRlID0gcGFydGlhbHNbcGFydGlhbC5uYW1lXTtcbiAgICAgIGlmIChwYXJ0aWFsLmluc3RhbmNlICYmIHBhcnRpYWwuYmFzZSA9PSB0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gcGFydGlhbC5pbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIXRoaXMuYykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvbXBpbGVyIGF2YWlsYWJsZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLmMuY29tcGlsZSh0ZW1wbGF0ZSwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciB0aGUgcGFydGlhbHMgZGljdGlvbmFyeSBoYXMgY2hhbmdlZFxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmJhc2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgaWYgKHBhcnRpYWwuc3Vicykge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY29uc2lkZXIgcGFyZW50IHRlbXBsYXRlIG5vd1xuICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dCkgcGFydGlhbHMuc3RhY2tUZXh0ID0ge307XG4gICAgICAgIGZvciAoa2V5IGluIHBhcnRpYWwuc3Vicykge1xuICAgICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0W2tleV0pIHtcbiAgICAgICAgICAgIHBhcnRpYWxzLnN0YWNrVGV4dFtrZXldID0gKHRoaXMuYWN0aXZlU3ViICE9PSB1bmRlZmluZWQgJiYgcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbCh0ZW1wbGF0ZSwgcGFydGlhbC5zdWJzLCBwYXJ0aWFsLnBhcnRpYWxzLFxuICAgICAgICAgIHRoaXMuc3RhY2tTdWJzLCB0aGlzLnN0YWNrUGFydGlhbHMsIHBhcnRpYWxzLnN0YWNrVGV4dCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uaW5zdGFuY2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH0sXG5cbiAgICAvLyB0cmllcyB0byBmaW5kIGEgcGFydGlhbCBpbiB0aGUgY3VycmVudCBzY29wZSBhbmQgcmVuZGVyIGl0XG4gICAgcnA6IGZ1bmN0aW9uKHN5bWJvbCwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLmVwKHN5bWJvbCwgcGFydGlhbHMpO1xuICAgICAgaWYgKCFwYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcnRpYWwucmkoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBhIHNlY3Rpb25cbiAgICByczogZnVuY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHNlY3Rpb24pIHtcbiAgICAgIHZhciB0YWlsID0gY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgICBpZiAoIWlzQXJyYXkodGFpbCkpIHtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWlsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnRleHQucHVzaCh0YWlsW2ldKTtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIGNvbnRleHQucG9wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIG1heWJlIHN0YXJ0IGEgc2VjdGlvblxuICAgIHM6IGZ1bmN0aW9uKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciBwYXNzO1xuXG4gICAgICBpZiAoaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXModmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncyk7XG4gICAgICB9XG5cbiAgICAgIHBhc3MgPSAhIXZhbDtcblxuICAgICAgaWYgKCFpbnZlcnRlZCAmJiBwYXNzICYmIGN0eCkge1xuICAgICAgICBjdHgucHVzaCgodHlwZW9mIHZhbCA9PSAnb2JqZWN0JykgPyB2YWwgOiBjdHhbY3R4Lmxlbmd0aCAtIDFdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhc3M7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggZG90dGVkIG5hbWVzXG4gICAgZDogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIGZvdW5kLFxuICAgICAgICAgIG5hbWVzID0ga2V5LnNwbGl0KCcuJyksXG4gICAgICAgICAgdmFsID0gdGhpcy5mKG5hbWVzWzBdLCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCksXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldCxcbiAgICAgICAgICBjeCA9IG51bGw7XG5cbiAgICAgIGlmIChrZXkgPT09ICcuJyAmJiBpc0FycmF5KGN0eFtjdHgubGVuZ3RoIC0gMl0pKSB7XG4gICAgICAgIHZhbCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQgPSBmaW5kSW5TY29wZShuYW1lc1tpXSwgdmFsLCBkb01vZGVsR2V0KTtcbiAgICAgICAgICBpZiAoZm91bmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3ggPSB2YWw7XG4gICAgICAgICAgICB2YWwgPSBmb3VuZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXR1cm5Gb3VuZCAmJiAhdmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY3R4LnB1c2goY3gpO1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICAgIGN0eC5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBub3JtYWwgbmFtZXNcbiAgICBmOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgdmFsID0gZmFsc2UsXG4gICAgICAgICAgdiA9IG51bGwsXG4gICAgICAgICAgZm91bmQgPSBmYWxzZSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0O1xuXG4gICAgICBmb3IgKHZhciBpID0gY3R4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHYgPSBjdHhbaV07XG4gICAgICAgIHZhbCA9IGZpbmRJblNjb3BlKGtleSwgdiwgZG9Nb2RlbEdldCk7XG4gICAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHJldHVybiAocmV0dXJuRm91bmQpID8gZmFsc2UgOiBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGhpZ2hlciBvcmRlciB0ZW1wbGF0ZXNcbiAgICBsczogZnVuY3Rpb24oZnVuYywgY3gsIHBhcnRpYWxzLCB0ZXh0LCB0YWdzKSB7XG4gICAgICB2YXIgb2xkVGFncyA9IHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzO1xuXG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IHRhZ3M7XG4gICAgICB0aGlzLmIodGhpcy5jdChjb2VyY2VUb1N0cmluZyhmdW5jLmNhbGwoY3gsIHRleHQpKSwgY3gsIHBhcnRpYWxzKSk7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IG9sZFRhZ3M7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gY29tcGlsZSB0ZXh0XG4gICAgY3Q6IGZ1bmN0aW9uKHRleHQsIGN4LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlTGFtYmRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTGFtYmRhIGZlYXR1cmVzIGRpc2FibGVkLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYy5jb21waWxlKHRleHQsIHRoaXMub3B0aW9ucykucmVuZGVyKGN4LCBwYXJ0aWFscyk7XG4gICAgfSxcblxuICAgIC8vIHRlbXBsYXRlIHJlc3VsdCBidWZmZXJpbmdcbiAgICBiOiBmdW5jdGlvbihzKSB7IHRoaXMuYnVmICs9IHM7IH0sXG5cbiAgICBmbDogZnVuY3Rpb24oKSB7IHZhciByID0gdGhpcy5idWY7IHRoaXMuYnVmID0gJyc7IHJldHVybiByOyB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2Ugc2VjdGlvblxuICAgIG1zOiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHRleHRTb3VyY2UsXG4gICAgICAgICAgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKGludmVydGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dFNvdXJjZSA9ICh0aGlzLmFjdGl2ZVN1YiAmJiB0aGlzLnN1YnNUZXh0ICYmIHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIHJldHVybiB0aGlzLmxzKHJlc3VsdCwgY3gsIHBhcnRpYWxzLCB0ZXh0U291cmNlLnN1YnN0cmluZyhzdGFydCwgZW5kKSwgdGFncyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2UgdmFyaWFibGVcbiAgICBtdjogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscykge1xuICAgICAgdmFyIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKHJlc3VsdC5jYWxsKGN4KSksIGN4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIHN1YjogZnVuY3Rpb24obmFtZSwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIGYgPSB0aGlzLnN1YnNbbmFtZV07XG4gICAgICBpZiAoZikge1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IG5hbWU7XG4gICAgICAgIGYoY29udGV4dCwgcGFydGlhbHMsIHRoaXMsIGluZGVudCk7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gIH07XG5cbiAgLy9GaW5kIGEga2V5IGluIGFuIG9iamVjdFxuICBmdW5jdGlvbiBmaW5kSW5TY29wZShrZXksIHNjb3BlLCBkb01vZGVsR2V0KSB7XG4gICAgdmFyIHZhbDtcblxuICAgIGlmIChzY29wZSAmJiB0eXBlb2Ygc2NvcGUgPT0gJ29iamVjdCcpIHtcblxuICAgICAgaWYgKHNjb3BlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWwgPSBzY29wZVtrZXldO1xuXG4gICAgICAvLyB0cnkgbG9va3VwIHdpdGggZ2V0IGZvciBiYWNrYm9uZSBvciBzaW1pbGFyIG1vZGVsIGRhdGFcbiAgICAgIH0gZWxzZSBpZiAoZG9Nb2RlbEdldCAmJiBzY29wZS5nZXQgJiYgdHlwZW9mIHNjb3BlLmdldCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwoaW5zdGFuY2UsIHN1YnMsIHBhcnRpYWxzLCBzdGFja1N1YnMsIHN0YWNrUGFydGlhbHMsIHN0YWNrVGV4dCkge1xuICAgIGZ1bmN0aW9uIFBhcnRpYWxUZW1wbGF0ZSgpIHt9O1xuICAgIFBhcnRpYWxUZW1wbGF0ZS5wcm90b3R5cGUgPSBpbnN0YW5jZTtcbiAgICBmdW5jdGlvbiBTdWJzdGl0dXRpb25zKCkge307XG4gICAgU3Vic3RpdHV0aW9ucy5wcm90b3R5cGUgPSBpbnN0YW5jZS5zdWJzO1xuICAgIHZhciBrZXk7XG4gICAgdmFyIHBhcnRpYWwgPSBuZXcgUGFydGlhbFRlbXBsYXRlKCk7XG4gICAgcGFydGlhbC5zdWJzID0gbmV3IFN1YnN0aXR1dGlvbnMoKTtcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0ge307ICAvL2hlaGUuIHN1YnN0ZXh0LlxuICAgIHBhcnRpYWwuYnVmID0gJyc7XG5cbiAgICBzdGFja1N1YnMgPSBzdGFja1N1YnMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1N1YnMgPSBzdGFja1N1YnM7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHN0YWNrVGV4dDtcbiAgICBmb3IgKGtleSBpbiBzdWJzKSB7XG4gICAgICBpZiAoIXN0YWNrU3Vic1trZXldKSBzdGFja1N1YnNba2V5XSA9IHN1YnNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tTdWJzKSB7XG4gICAgICBwYXJ0aWFsLnN1YnNba2V5XSA9IHN0YWNrU3Vic1trZXldO1xuICAgIH1cblxuICAgIHN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHM7XG4gICAgZm9yIChrZXkgaW4gcGFydGlhbHMpIHtcbiAgICAgIGlmICghc3RhY2tQYXJ0aWFsc1trZXldKSBzdGFja1BhcnRpYWxzW2tleV0gPSBwYXJ0aWFsc1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1BhcnRpYWxzKSB7XG4gICAgICBwYXJ0aWFsLnBhcnRpYWxzW2tleV0gPSBzdGFja1BhcnRpYWxzW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRpYWw7XG4gIH1cblxuICB2YXIgckFtcCA9IC8mL2csXG4gICAgICByTHQgPSAvPC9nLFxuICAgICAgckd0ID0gLz4vZyxcbiAgICAgIHJBcG9zID0gL1xcJy9nLFxuICAgICAgclF1b3QgPSAvXFxcIi9nLFxuICAgICAgaENoYXJzID0gL1smPD5cXFwiXFwnXS87XG5cbiAgZnVuY3Rpb24gY29lcmNlVG9TdHJpbmcodmFsKSB7XG4gICAgcmV0dXJuIFN0cmluZygodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogdmFsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhvZ2FuRXNjYXBlKHN0cikge1xuICAgIHN0ciA9IGNvZXJjZVRvU3RyaW5nKHN0cik7XG4gICAgcmV0dXJuIGhDaGFycy50ZXN0KHN0cikgP1xuICAgICAgc3RyXG4gICAgICAgIC5yZXBsYWNlKHJBbXAsICcmYW1wOycpXG4gICAgICAgIC5yZXBsYWNlKHJMdCwgJyZsdDsnKVxuICAgICAgICAucmVwbGFjZShyR3QsICcmZ3Q7JylcbiAgICAgICAgLnJlcGxhY2UockFwb3MsICcmIzM5OycpXG4gICAgICAgIC5yZXBsYWNlKHJRdW90LCAnJnF1b3Q7JykgOlxuICAgICAgc3RyO1xuICB9XG5cbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogSG9nYW4pO1xuIiwiXG47KGZ1bmN0aW9uKCl7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaC5cbiAgICovXG5cbiAgdmFyIGRpc3BhdGNoID0gdHJ1ZTtcblxuICAvKipcbiAgICogQmFzZSBwYXRoLlxuICAgKi9cblxuICB2YXIgYmFzZSA9ICcnO1xuXG4gIC8qKlxuICAgKiBSdW5uaW5nIGZsYWcuXG4gICAqL1xuXG4gIHZhciBydW5uaW5nO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBgcGF0aGAgd2l0aCBjYWxsYmFjayBgZm4oKWAsXG4gICAqIG9yIHJvdXRlIGBwYXRoYCwgb3IgYHBhZ2Uuc3RhcnQoKWAuXG4gICAqXG4gICAqICAgcGFnZShmbik7XG4gICAqICAgcGFnZSgnKicsIGZuKTtcbiAgICogICBwYWdlKCcvdXNlci86aWQnLCBsb2FkLCB1c2VyKTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCwgeyBzb21lOiAndGhpbmcnIH0pO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkKTtcbiAgICogICBwYWdlKCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBwYXRoXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuLi4uXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhZ2UocGF0aCwgZm4pIHtcbiAgICAvLyA8Y2FsbGJhY2s+XG4gICAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHJldHVybiBwYWdlKCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgPHBhdGg+IHRvIDxjYWxsYmFjayAuLi4+XG4gICAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGZuKSB7XG4gICAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBwYWdlLmNhbGxiYWNrcy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgICB9XG4gICAgLy8gc2hvdyA8cGF0aD4gd2l0aCBbc3RhdGVdXG4gICAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcGFnZS5zaG93KHBhdGgsIGZuKTtcbiAgICAvLyBzdGFydCBbb3B0aW9uc11cbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZS5zdGFydChwYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgKi9cblxuICBwYWdlLmNhbGxiYWNrcyA9IFtdO1xuXG4gIC8qKlxuICAgKiBHZXQgb3Igc2V0IGJhc2VwYXRoIHRvIGBwYXRoYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYXNlID0gZnVuY3Rpb24ocGF0aCl7XG4gICAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGJhc2U7XG4gICAgYmFzZSA9IHBhdGg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgd2l0aCB0aGUgZ2l2ZW4gYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgICAtIGBjbGlja2AgYmluZCB0byBjbGljayBldmVudHMgW3RydWVdXG4gICAqICAgIC0gYHBvcHN0YXRlYCBiaW5kIHRvIHBvcHN0YXRlIFt0cnVlXVxuICAgKiAgICAtIGBkaXNwYXRjaGAgcGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoIFt0cnVlXVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0YXJ0ID0gZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHJ1bm5pbmcpIHJldHVybjtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGlzcGF0Y2gpIGRpc3BhdGNoID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLnBvcHN0YXRlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLmNsaWNrKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbmNsaWNrLCBmYWxzZSk7XG4gICAgaWYgKCFkaXNwYXRjaCkgcmV0dXJuO1xuICAgIHZhciB1cmwgPSBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgcGFnZS5yZXBsYWNlKHVybCwgbnVsbCwgdHJ1ZSwgZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0b3AgPSBmdW5jdGlvbigpe1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzcGF0Y2hcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoKXtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHBhZ2UuZGlzcGF0Y2goY3R4KTtcbiAgICBpZiAoIWN0eC51bmhhbmRsZWQpIGN0eC5wdXNoU3RhdGUoKTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5yZXBsYWNlID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGluaXQsIGRpc3BhdGNoKXtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIGN0eC5pbml0ID0gaW5pdDtcbiAgICBpZiAobnVsbCA9PSBkaXNwYXRjaCkgZGlzcGF0Y2ggPSB0cnVlO1xuICAgIGlmIChkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIGN0eC5zYXZlKCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2ggdGhlIGdpdmVuIGBjdHhgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBwYWdlLmRpc3BhdGNoID0gZnVuY3Rpb24oY3R4KXtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5jYWxsYmFja3NbaSsrXTtcbiAgICAgIGlmICghZm4pIHJldHVybiB1bmhhbmRsZWQoY3R4KTtcbiAgICAgIGZuKGN0eCwgbmV4dCk7XG4gICAgfVxuXG4gICAgbmV4dCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmhhbmRsZWQgYGN0eGAuIFdoZW4gaXQncyBub3QgdGhlIGluaXRpYWxcbiAgICogcG9wc3RhdGUgdGhlbiByZWRpcmVjdC4gSWYgeW91IHdpc2ggdG8gaGFuZGxlXG4gICAqIDQwNHMgb24geW91ciBvd24gdXNlIGBwYWdlKCcqJywgY2FsbGJhY2spYC5cbiAgICpcbiAgICogQHBhcmFtIHtDb250ZXh0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICB2YXIgY3VycmVudCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XG4gICAgaWYgKGN1cnJlbnQgPT0gY3R4LmNhbm9uaWNhbFBhdGgpIHJldHVybjtcbiAgICBwYWdlLnN0b3AoKTtcbiAgICBjdHgudW5oYW5kbGVkID0gdHJ1ZTtcbiAgICB3aW5kb3cubG9jYXRpb24gPSBjdHguY2Fub25pY2FsUGF0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbmV3IFwicmVxdWVzdFwiIGBDb250ZXh0YFxuICAgKiB3aXRoIHRoZSBnaXZlbiBgcGF0aGAgYW5kIG9wdGlvbmFsIGluaXRpYWwgYHN0YXRlYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIENvbnRleHQocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAoJy8nID09IHBhdGhbMF0gJiYgMCAhPSBwYXRoLmluZGV4T2YoYmFzZSkpIHBhdGggPSBiYXNlICsgcGF0aDtcbiAgICB2YXIgaSA9IHBhdGguaW5kZXhPZignPycpO1xuXG4gICAgdGhpcy5jYW5vbmljYWxQYXRoID0gcGF0aDtcbiAgICB0aGlzLnBhdGggPSBwYXRoLnJlcGxhY2UoYmFzZSwgJycpIHx8ICcvJztcblxuICAgIHRoaXMudGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGUgfHwge307XG4gICAgdGhpcy5zdGF0ZS5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gfmkgPyBwYXRoLnNsaWNlKGkgKyAxKSA6ICcnO1xuICAgIHRoaXMucGF0aG5hbWUgPSB+aSA/IHBhdGguc2xpY2UoMCwgaSkgOiBwYXRoO1xuICAgIHRoaXMucGFyYW1zID0gW107XG5cbiAgICAvLyBmcmFnbWVudFxuICAgIHRoaXMuaGFzaCA9ICcnO1xuICAgIGlmICghfnRoaXMucGF0aC5pbmRleE9mKCcjJykpIHJldHVybjtcbiAgICB2YXIgcGFydHMgPSB0aGlzLnBhdGguc3BsaXQoJyMnKTtcbiAgICB0aGlzLnBhdGggPSBwYXJ0c1swXTtcbiAgICB0aGlzLmhhc2ggPSBwYXJ0c1sxXSB8fCAnJztcbiAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gdGhpcy5xdWVyeXN0cmluZy5zcGxpdCgnIycpWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgQ29udGV4dGAuXG4gICAqL1xuXG4gIHBhZ2UuQ29udGV4dCA9IENvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFB1c2ggc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpe1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhdmUgdGhlIGNvbnRleHQgc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpe1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYFJvdXRlYCB3aXRoIHRoZSBnaXZlbiBIVFRQIGBwYXRoYCxcbiAgICogYW5kIGFuIGFycmF5IG9mIGBjYWxsYmFja3NgIGFuZCBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgLSBgc2Vuc2l0aXZlYCAgICBlbmFibGUgY2FzZS1zZW5zaXRpdmUgcm91dGVzXG4gICAqICAgLSBgc3RyaWN0YCAgICAgICBlbmFibGUgc3RyaWN0IG1hdGNoaW5nIGZvciB0cmFpbGluZyBzbGFzaGVzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUm91dGUocGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5tZXRob2QgPSAnR0VUJztcbiAgICB0aGlzLnJlZ2V4cCA9IHBhdGh0b1JlZ2V4cChwYXRoXG4gICAgICAsIHRoaXMua2V5cyA9IFtdXG4gICAgICAsIG9wdGlvbnMuc2Vuc2l0aXZlXG4gICAgICAsIG9wdGlvbnMuc3RyaWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYFJvdXRlYC5cbiAgICovXG5cbiAgcGFnZS5Sb3V0ZSA9IFJvdXRlO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gcm91dGUgbWlkZGxld2FyZSB3aXRoXG4gICAqIHRoZSBnaXZlbiBjYWxsYmFjayBgZm4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWlkZGxld2FyZSA9IGZ1bmN0aW9uKGZuKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0eCwgbmV4dCl7XG4gICAgICBpZiAoc2VsZi5tYXRjaChjdHgucGF0aCwgY3R4LnBhcmFtcykpIHJldHVybiBmbihjdHgsIG5leHQpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgcm91dGUgbWF0Y2hlcyBgcGF0aGAsIGlmIHNvXG4gICAqIHBvcHVsYXRlIGBwYXJhbXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge0FycmF5fSBwYXJhbXNcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uKHBhdGgsIHBhcmFtcyl7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXNcbiAgICAgICwgcXNJbmRleCA9IHBhdGguaW5kZXhPZignPycpXG4gICAgICAsIHBhdGhuYW1lID0gfnFzSW5kZXggPyBwYXRoLnNsaWNlKDAsIHFzSW5kZXgpIDogcGF0aFxuICAgICAgLCBtID0gdGhpcy5yZWdleHAuZXhlYyhwYXRobmFtZSk7XG5cbiAgICBpZiAoIW0pIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBtLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV07XG5cbiAgICAgIHZhciB2YWwgPSAnc3RyaW5nJyA9PSB0eXBlb2YgbVtpXVxuICAgICAgICA/IGRlY29kZVVSSUNvbXBvbmVudChtW2ldKVxuICAgICAgICA6IG1baV07XG5cbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IHVuZGVmaW5lZCAhPT0gcGFyYW1zW2tleS5uYW1lXVxuICAgICAgICAgID8gcGFyYW1zW2tleS5uYW1lXVxuICAgICAgICAgIDogdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zLnB1c2godmFsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvKipcbiAgICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZyxcbiAgICogcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICAgKlxuICAgKiBBbiBlbXB0eSBhcnJheSBzaG91bGQgYmUgcGFzc2VkLFxuICAgKiB3aGljaCB3aWxsIGNvbnRhaW4gdGhlIHBsYWNlaG9sZGVyXG4gICAqIGtleSBuYW1lcy4gRm9yIGV4YW1wbGUgXCIvdXNlci86aWRcIiB3aWxsXG4gICAqIHRoZW4gY29udGFpbiBbXCJpZFwiXS5cbiAgICpcbiAgICogQHBhcmFtICB7U3RyaW5nfFJlZ0V4cHxBcnJheX0gcGF0aFxuICAgKiBAcGFyYW0gIHtBcnJheX0ga2V5c1xuICAgKiBAcGFyYW0gIHtCb29sZWFufSBzZW5zaXRpdmVcbiAgICogQHBhcmFtICB7Qm9vbGVhbn0gc3RyaWN0XG4gICAqIEByZXR1cm4ge1JlZ0V4cH1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhdGh0b1JlZ2V4cChwYXRoLCBrZXlzLCBzZW5zaXRpdmUsIHN0cmljdCkge1xuICAgIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gcGF0aDtcbiAgICBpZiAocGF0aCBpbnN0YW5jZW9mIEFycmF5KSBwYXRoID0gJygnICsgcGF0aC5qb2luKCd8JykgKyAnKSc7XG4gICAgcGF0aCA9IHBhdGhcbiAgICAgIC5jb25jYXQoc3RyaWN0ID8gJycgOiAnLz8nKVxuICAgICAgLnJlcGxhY2UoL1xcL1xcKC9nLCAnKD86LycpXG4gICAgICAucmVwbGFjZSgvKFxcLyk/KFxcLik/OihcXHcrKSg/OihcXCguKj9cXCkpKT8oXFw/KT8vZywgZnVuY3Rpb24oXywgc2xhc2gsIGZvcm1hdCwga2V5LCBjYXB0dXJlLCBvcHRpb25hbCl7XG4gICAgICAgIGtleXMucHVzaCh7IG5hbWU6IGtleSwgb3B0aW9uYWw6ICEhIG9wdGlvbmFsIH0pO1xuICAgICAgICBzbGFzaCA9IHNsYXNoIHx8ICcnO1xuICAgICAgICByZXR1cm4gJydcbiAgICAgICAgICArIChvcHRpb25hbCA/ICcnIDogc2xhc2gpXG4gICAgICAgICAgKyAnKD86J1xuICAgICAgICAgICsgKG9wdGlvbmFsID8gc2xhc2ggOiAnJylcbiAgICAgICAgICArIChmb3JtYXQgfHwgJycpICsgKGNhcHR1cmUgfHwgKGZvcm1hdCAmJiAnKFteLy5dKz8pJyB8fCAnKFteL10rPyknKSkgKyAnKSdcbiAgICAgICAgICArIChvcHRpb25hbCB8fCAnJyk7XG4gICAgICB9KVxuICAgICAgLnJlcGxhY2UoLyhbXFwvLl0pL2csICdcXFxcJDEnKVxuICAgICAgLnJlcGxhY2UoL1xcKi9nLCAnKC4qKScpO1xuICAgIHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHBhdGggKyAnJCcsIHNlbnNpdGl2ZSA/ICcnIDogJ2knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgXCJwb3B1bGF0ZVwiIGV2ZW50cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gb25wb3BzdGF0ZShlKSB7XG4gICAgaWYgKGUuc3RhdGUpIHtcbiAgICAgIHZhciBwYXRoID0gZS5zdGF0ZS5wYXRoO1xuICAgICAgcGFnZS5yZXBsYWNlKHBhdGgsIGUuc3RhdGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgXCJjbGlja1wiIGV2ZW50cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gb25jbGljayhlKSB7XG4gICAgaWYgKDEgIT0gd2hpY2goZSkpIHJldHVybjtcbiAgICBpZiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSB8fCBlLnNoaWZ0S2V5KSByZXR1cm47XG4gICAgaWYgKGUuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xuXG4gICAgLy8gZW5zdXJlIGxpbmtcbiAgICB2YXIgZWwgPSBlLnRhcmdldDtcbiAgICB3aGlsZSAoZWwgJiYgJ0EnICE9IGVsLm5vZGVOYW1lKSBlbCA9IGVsLnBhcmVudE5vZGU7XG4gICAgaWYgKCFlbCB8fCAnQScgIT0gZWwubm9kZU5hbWUpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKGVsLnBhdGhuYW1lID09IGxvY2F0aW9uLnBhdGhuYW1lICYmIChlbC5oYXNoIHx8ICcjJyA9PSBsaW5rKSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgdGFyZ2V0XG4gICAgaWYgKGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICBpZiAoIXNhbWVPcmlnaW4oZWwuaHJlZikpIHJldHVybjtcblxuICAgIC8vIHJlYnVpbGQgcGF0aFxuICAgIHZhciBwYXRoID0gZWwucGF0aG5hbWUgKyBlbC5zZWFyY2ggKyAoZWwuaGFzaCB8fCAnJyk7XG5cbiAgICAvLyBzYW1lIHBhZ2VcbiAgICB2YXIgb3JpZyA9IHBhdGggKyBlbC5oYXNoO1xuXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZShiYXNlLCAnJyk7XG4gICAgaWYgKGJhc2UgJiYgb3JpZyA9PSBwYXRoKSByZXR1cm47XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcGFnZS5zaG93KG9yaWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGJ1dHRvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2hpY2goZSkge1xuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICByZXR1cm4gbnVsbCA9PSBlLndoaWNoXG4gICAgICA/IGUuYnV0dG9uXG4gICAgICA6IGUud2hpY2g7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYGhyZWZgIGlzIHRoZSBzYW1lIG9yaWdpbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gc2FtZU9yaWdpbihocmVmKSB7XG4gICAgdmFyIG9yaWdpbiA9IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIGlmIChsb2NhdGlvbi5wb3J0KSBvcmlnaW4gKz0gJzonICsgbG9jYXRpb24ucG9ydDtcbiAgICByZXR1cm4gMCA9PSBocmVmLmluZGV4T2Yob3JpZ2luKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYHBhZ2VgLlxuICAgKi9cblxuICBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIG1vZHVsZSkge1xuICAgIHdpbmRvdy5wYWdlID0gcGFnZTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBhZ2U7XG4gIH1cblxufSkoKTtcbiIsInZhciBIb2dhbiA9IHJlcXVpcmUoJ2hvZ2FuLmpzJyk7XG5cbnZhciBlbmRwb2ludHNUZW1wbGF0ZTtcblxudmFyIGxvYWRFeHBlcmltZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCFlbmRwb2ludHNUZW1wbGF0ZSkge1xuICAgIGVuZHBvaW50c1RlbXBsYXRlID0gJCgnI2VuZHBvaW50cy10ZW1wbGF0ZScpLmh0bWwoKTtcbiAgICBlbmRwb2ludHNUZW1wbGF0ZSA9IEhvZ2FuLmNvbXBpbGUoZW5kcG9pbnRzVGVtcGxhdGUpO1xuICB9XG5cbiAgJC5hamF4KHtcbiAgICB1cmw6ICcvYXBpL2V4cGVyaW1lbnRzJyxcbiAgICB0eXBlOiAnR0VUJyxcbiAgICBkYXRhOiB7XG4gICAgICB0b2tlbjogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJylcbiAgICB9LFxuICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKGV4cGVyaW1lbnRSZXNwb25zZSkge1xuXG4gICAgICAkLmFqYXgoe1xuICAgICAgICB1cmw6ICcvYXBpL2VuZHBvaW50cycsXG4gICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgdG9rZW46IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpXG4gICAgICAgIH0sXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChlbmRwb2ludFJlc3BvbnNlKSB7XG4gICAgICAgICAgdmFyIGV4cGVyaW1lbnRzID0gZXhwZXJpbWVudFJlc3BvbnNlLmV4cGVyaW1lbnRzO1xuICAgICAgICAgIHZhciBlbmRwb2ludHMgPSBlbmRwb2ludFJlc3BvbnNlLmVuZHBvaW50cztcbiAgICAgICAgICB2YXIgc29ydGVkRXhwZXJpbWVudHMgPSB7fTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kcG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzb3J0ZWRFeHBlcmltZW50c1tlbmRwb2ludHNbaV0uZW5kcG9pbnRdID0gW107XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHBlcmltZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc29ydGVkRXhwZXJpbWVudHNbZXhwZXJpbWVudHNbaV0uZW5kcG9pbnRdLnB1c2goZXhwZXJpbWVudHNbaV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVuZHBvaW50cyA9IFtdO1xuICAgICAgICAgIGZvciAodmFyIGVuZHBvaW50IGluIHNvcnRlZEV4cGVyaW1lbnRzKSB7XG4gICAgICAgICAgICBlbmRwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgIGVuZHBvaW50OiBlbmRwb2ludCxcbiAgICAgICAgICAgICAgZXhwZXJpbWVudHM6IHNvcnRlZEV4cGVyaW1lbnRzW2VuZHBvaW50XVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgJCgnI2Rhc2hib2FyZCAuZW5kcG9pbnRzJykuaHRtbChlbmRwb2ludHNUZW1wbGF0ZS5yZW5kZXIoe1xuICAgICAgICAgICAgZW5kcG9pbnRzOiBlbmRwb2ludHMsXG4gICAgICAgICAgICBlbXB0eTogZW5kcG9pbnRzLmxlbmd0aCA9PT0gMFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn07XG5cbnZhciBjcmVhdGVFbmRwb2ludCA9IGZ1bmN0aW9uICgpIHtcbiAgJC5hamF4KHtcbiAgICB1cmw6ICcvYXBpL2VuZHBvaW50cycsXG4gICAgdHlwZTogJ1BPU1QnLFxuICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHRva2VuOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKVxuICAgIH0pLFxuICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICBsb2FkRXhwZXJpbWVudHMoKTtcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGRlbGV0ZUVuZHBvaW50ID0gZnVuY3Rpb24gKGVuZHBvaW50KSB7XG4gICQuYWpheCh7XG4gICAgdXJsOiAnL2FwaS9lbmRwb2ludHMvJyArIGVuZHBvaW50LFxuICAgIHR5cGU6ICdERUxFVEUnLFxuICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHRva2VuOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKVxuICAgIH0pLFxuICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICBsb2FkRXhwZXJpbWVudHMoKTtcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGRlbGV0ZUV4cGVyaW1lbnQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgJC5hamF4KHtcbiAgICB1cmw6ICcvYXBpL2V4cGVyaW1lbnRzLycgKyBpZCxcbiAgICB0eXBlOiAnREVMRVRFJyxcbiAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICB0b2tlbjogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJylcbiAgICB9KSxcbiAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnLFxuICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgbG9hZEV4cGVyaW1lbnRzKCk7XG4gICAgfVxuICB9KTtcbn07XG5cbiQoJyNkYXNoYm9hcmQgLmV4cGVyaW1lbnRzJykub24oJ2NsaWNrJywgJy5kZWxldGUtZXhwZXJpbWVudCcsIGZ1bmN0aW9uICgpIHtcbiAgdmFyIGlkID0gJCh0aGlzKS5jbG9zZXN0KCcuZXhwZXJpbWVudCcpLmRhdGEoJ2lkJyk7XG4gIHZhciBjb25maXJtYXRpb24gPSBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgZXhwZXJpbWVudD8nKTtcbiAgaWYgKGNvbmZpcm1hdGlvbikge1xuICAgIGRlbGV0ZUV4cGVyaW1lbnQoaWQpO1xuICB9XG59KTtcblxuJCgnI2Rhc2hib2FyZCAuY3JlYXRlLWVuZHBvaW50Jykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICBjcmVhdGVFbmRwb2ludCgpO1xufSk7XG5cbiQoJyNkYXNoYm9hcmQgLmVuZHBvaW50cycpLm9uKCdjbGljaycsICcuZGVsZXRlLWVuZHBvaW50JywgZnVuY3Rpb24gKCkge1xuICB2YXIgZW5kcG9pbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5lbmRwb2ludCcpLmRhdGEoJ2VuZHBvaW50Jyk7XG4gIHZhciBjb25maXJtYXRpb24gPSBjb25maXJtKCdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgZW5kcG9pbnQgYW5kIGFsbCBpdHMgZXhwZXJpbWVudHM/Jyk7XG4gIGlmIChjb25maXJtYXRpb24pIHtcbiAgICBkZWxldGVFbmRwb2ludChlbmRwb2ludCk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpID09PSBudWxsKSB7XG4gICAgcGFnZSgnL2xvZ2luJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJCgnc2VjdGlvbicpLmhpZGUoKTtcbiAgICAkKCcjZGFzaGJvYXJkJykuc2hvdygpO1xuICAgIGxvYWRFeHBlcmltZW50cygpO1xuICB9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICQoZnVuY3Rpb24gKCkge1xuICAgICQoJ3NlY3Rpb24nKS5oaWRlKCk7XG4gICAgJCgnI2RvY3MnKS5zaG93KCk7XG4gIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAkKGZ1bmN0aW9uICgpIHtcbiAgICAkKCdzZWN0aW9uJykuaGlkZSgpO1xuICAgICQoJyNsYW5kaW5nJykuc2hvdygpO1xuICB9KTtcblxuICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJykpIHtcbiAgICBwYWdlKCcvZGFzaGJvYXJkJyk7XG4gICAgcmV0dXJuO1xuICB9XG59O1xuIiwiJCgnI2xvZ2luIGZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24gKGUpIHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB2YXIgZW1haWwgPSAkKCcjbG9naW4gaW5wdXRbdHlwZT1lbWFpbF0nKS52YWwoKTtcbiAgdmFyIHBhc3N3b3JkID0gJCgnI2xvZ2luIGlucHV0W3R5cGU9cGFzc3dvcmRdJykudmFsKCk7XG4gICQuYWpheCh7XG4gICAgdXJsOiAnL2FwaS90b2tlbnMnLFxuICAgIHR5cGU6ICdQT1NUJyxcbiAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBlbWFpbDogZW1haWwsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmRcbiAgICB9KSxcbiAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnLFxuICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICBwYWdlKCcvZGFzaGJvYXJkJyk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAkKCcjbG9naW4gLmVycm9yJykudGV4dChyZXNwb25zZS5yZXNwb25zZUpTT04uZXJyb3IpO1xuICAgIH1cbiAgfSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBpZiAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJykgIT09IG51bGwpIHtcbiAgICBwYWdlKCcvZGFzaGJvYXJkJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJCgnc2VjdGlvbicpLmhpZGUoKTtcbiAgICAkKCcjbG9naW4nKS5zaG93KCk7XG4gIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgcGFnZSgnLycpO1xufTtcbiIsIi8vIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbmV3YmllJykgJiYgIWxvY2FsU3RvcmFnZS5nZXRJdGVtKCdoaWRlLWdldHRpbmctc3RhcnRlZCcpKSB7XG4vLyAgICQoJyNnZXR0aW5nLXN0YXJ0ZWQnKS5zaG93KCk7XG4vLyAgICQoJyNnZXR0aW5nLXN0YXJ0ZWQnKS5vbignY2xpY2snLCAnLmNsb3NlJywgZnVuY3Rpb24gKCkge1xuLy8gICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdoaWRlLWdldHRpbmctc3RhcnRlZCcsIG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbi8vICAgICAkKCcjZ2V0dGluZy1zdGFydGVkJykuaGlkZSgpO1xuLy8gICB9KVxuLy8gfVxuXG5yZXF1aXJlKCcuL3JvdXRlcicpO1xuIiwid2luZG93LnBhZ2UgPSByZXF1aXJlKCdwYWdlJyk7XG5cbiAgLy8gaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCduZXdiaWUnKSAmJiAhbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2hpZGUtZ2V0dGluZy1zdGFydGVkJykpIHtcbiAgLy8gICAkKCcjZ2V0dGluZy1zdGFydGVkJykuc2hvdygpO1xuICAvLyAgICQoJyNnZXR0aW5nLXN0YXJ0ZWQnKS5vbignY2xpY2snLCAnLmNsb3NlJywgZnVuY3Rpb24gKCkge1xuICAvLyAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2hpZGUtZ2V0dGluZy1zdGFydGVkJywgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAvLyAgICAgJCgnI2dldHRpbmctc3RhcnRlZCcpLmhpZGUoKTtcbiAgLy8gICB9KVxuICAvLyB9XG5cblxuLy8gTm90IGF2YWlsYWJsZSB0byBsb2dnZWQgaW4gdXNlcnNcbnBhZ2UoJy8nLCByZXF1aXJlKCcuL2xhbmRpbmcnKSk7XG5wYWdlKCcvc2lnbnVwJywgcmVxdWlyZSgnLi9zaWdudXAnKSk7XG5wYWdlKCcvbG9naW4nLCByZXF1aXJlKCcuL2xvZ2luJykpO1xucGFnZSgnL2RvY3MnLCByZXF1aXJlKCcuL2RvY3MnKSk7XG5cbi8vIE9ubHkgZm9yIGxvZ2dlZCBpbiB1c2Vyc1xucGFnZSgnL2Rhc2hib2FyZCcsIHJlcXVpcmUoJy4vZGFzaGJvYXJkJykpO1xucGFnZSgnL2xvZ291dCcsIHJlcXVpcmUoJy4vbG9nb3V0JykpO1xucGFnZSgnL3NldHRpbmdzJywgcmVxdWlyZSgnLi9zZXR0aW5ncycpKVxucGFnZSgpO1xuIiwidmFyIGxvYWRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAkLmFqYXgoe1xuICAgIHVybDogJy9hcGkvdXNlcnMvbWUnLFxuICAgIHR5cGU6ICdHRVQnLFxuICAgIGRhdGE6IHtcbiAgICAgIHRva2VuOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKVxuICAgIH0sXG4gICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICQoJyN1cGRhdGUtYWNjb3VudCBpbnB1dFt0eXBlPWVtYWlsXScpLnZhbChyZXNwb25zZS51c2VyLmVtYWlsKTtcbiAgICB9XG4gIH0pO1xufTtcblxuXG4kKCcjdXBkYXRlLWFjY291bnQnKS5vbignc3VibWl0JywgZnVuY3Rpb24gKGUpIHtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gIHZhciBuZXdFbWFpbCA9ICQoJyN1cGRhdGUtYWNjb3VudCBpbnB1dFt0eXBlPWVtYWlsXScpLnZhbCgpO1xuICB2YXIgbmV3UGFzc3dvcmQgPSAkKCcjdXBkYXRlLWFjY291bnQgaW5wdXRbdHlwZT1wYXNzd29yZF0nKS52YWwoKTtcblxuICAkLmFqYXgoe1xuICAgIHVybDogJy9hcGkvdXNlcnMvbWUnLFxuICAgIHR5cGU6ICdQVVQnLFxuICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHRva2VuOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKSxcbiAgICAgIGVtYWlsOiBuZXdFbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBuZXdQYXNzd29yZFxuICAgIH0pLFxuICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICQoJyNtZXNzYWdlJykuc3RvcCh0cnVlKTtcbiAgICAgICQoJyNtZXNzYWdlJykuYWRkQ2xhc3MoJ3N1Y2Nlc3MnKTtcbiAgICAgICQoJyNtZXNzYWdlJykudGV4dCgnU3VjY2Vzc2Z1bGx5IGNoYW5nZWQgYWNjb3VudCBpbmZvcm1hdGlvbicpO1xuICAgICAgJCgnI21lc3NhZ2UnKS5zbGlkZURvd24oKS5kZWxheSgxMDAwKS5zbGlkZVVwKCk7XG4gICAgICAkKCcjdXBkYXRlLWFjY291bnQgaW5wdXRbdHlwZT1wYXNzd29yZF0nKS52YWwoJycpXG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAkKCcjbWVzc2FnZScpLnN0b3AodHJ1ZSk7XG4gICAgICAkKCcjbWVzc2FnZScpLnJlbW92ZUNsYXNzKCdzdWNjZXNzJyk7XG4gICAgICAkKCcjbWVzc2FnZScpLmFkZENsYXNzKCdlcnJvcicpO1xuICAgICAgJCgnI21lc3NhZ2UnKS50ZXh0KHJlc3BvbnNlLnJlc3BvbnNlSlNPTi5lcnJvcik7XG4gICAgICAkKCcjbWVzc2FnZScpLnNsaWRlRG93bigpLmRlbGF5KDEwMDApLnNsaWRlVXAoKTtcbiAgICAgICQoJyN1cGRhdGUtYWNjb3VudCBpbnB1dFt0eXBlPXBhc3N3b3JkXScpLnZhbCgnJylcbiAgICB9XG4gIH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpID09PSBudWxsKSB7XG4gICAgcGFnZSgnL2xvZ2luJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgJChmdW5jdGlvbiAoKSB7XG4gICAgJCgnc2VjdGlvbicpLmhpZGUoKTtcbiAgICAkKCcjc2V0dGluZ3MnKS5zaG93KCk7XG4gICAgbG9hZFVzZXIoKTtcbiAgfSk7XG59O1xuIiwiJCgnI3NpZ251cCBmb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gIGUucHJldmVudERlZmF1bHQoKTtcbiAgdmFyIGVtYWlsID0gJCgnI3NpZ251cCBpbnB1dFt0eXBlPWVtYWlsXScpLnZhbCgpO1xuICB2YXIgcGFzc3dvcmQgPSAkKCcjc2lnbnVwIGlucHV0W3R5cGU9cGFzc3dvcmRdJykudmFsKCk7XG4gICQuYWpheCh7XG4gICAgdXJsOiAnL2FwaS91c2VycycsXG4gICAgdHlwZTogJ1BPU1QnLFxuICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgIH0pLFxuICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCcsXG4gICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHJlc3BvbnNlLnRva2VuKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCduZXdiaWUnLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgICBwYWdlKCcvZGFzaGJvYXJkJyk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAkKCcjc2lnbnVwIC5lcnJvcicpLnRleHQocmVzcG9uc2UucmVzcG9uc2VKU09OLmVycm9yKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpICE9PSBudWxsKSB7XG4gICAgcGFnZSgnL2Rhc2hib2FyZCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gICQoZnVuY3Rpb24gKCkge1xuICAgICQoJ3NlY3Rpb24nKS5oaWRlKCk7XG4gICAgJCgnI3NpZ251cCcpLnNob3coKTtcbiAgfSk7XG59O1xuIl19
