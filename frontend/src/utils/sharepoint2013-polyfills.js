/**
 * SharePoint 2013 Browser Compatibility Polyfills
 * Supports IE8, IE9, IE10, IE11
 *
 * Include this file FIRST in your application entry point
 */

// ========================================
// ARRAY POLYFILLS
// ========================================

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    if (this == null) throw new TypeError('Array.prototype.forEach called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;

    for (var i = 0; i < len; i++) {
      if (i in O) {
        callback.call(thisArg, O[i], i, O);
      }
    }
  };
}

if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {
    if (this == null) throw new TypeError('Array.prototype.map called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;
    var result = new Array(len);

    for (var i = 0; i < len; i++) {
      if (i in O) {
        result[i] = callback.call(thisArg, O[i], i, O);
      }
    }
    return result;
  };
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(callback, thisArg) {
    if (this == null) throw new TypeError('Array.prototype.filter called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;
    var result = [];

    for (var i = 0; i < len; i++) {
      if (i in O) {
        var val = O[i];
        if (callback.call(thisArg, val, i, O)) {
          result.push(val);
        }
      }
    }
    return result;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(callback, thisArg) {
    if (this == null) throw new TypeError('Array.prototype.find called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;

    for (var i = 0; i < len; i++) {
      if (i in O) {
        var val = O[i];
        if (callback.call(thisArg, val, i, O)) {
          return val;
        }
      }
    }
    return undefined;
  };
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(callback, thisArg) {
    if (this == null) throw new TypeError('Array.prototype.findIndex called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;

    for (var i = 0; i < len; i++) {
      if (i in O) {
        if (callback.call(thisArg, O[i], i, O)) {
          return i;
        }
      }
    }
    return -1;
  };
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) throw new TypeError('Array.prototype.includes called on null or undefined');

    var O = Object(this);
    var len = O.length >>> 0;

    if (len === 0) return false;

    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    while (k < len) {
      if (O[k] === searchElement || (searchElement !== searchElement && O[k] !== O[k])) {
        return true;
      }
      k++;
    }
    return false;
  };
}

if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(callback, initialValue) {
    if (this == null) throw new TypeError('Array.prototype.reduce called on null or undefined');
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');

    var O = Object(this);
    var len = O.length >>> 0;
    var k = 0;
    var accumulator;

    if (arguments.length >= 2) {
      accumulator = initialValue;
    } else {
      while (k < len && !(k in O)) k++;
      if (k >= len) throw new TypeError('Reduce of empty array with no initial value');
      accumulator = O[k++];
    }

    while (k < len) {
      if (k in O) {
        accumulator = callback(accumulator, O[k], k, O);
      }
      k++;
    }
    return accumulator;
  };
}

if (!Array.from) {
  Array.from = function(arrayLike, mapFn, thisArg) {
    if (arrayLike == null) throw new TypeError('Array.from requires an array-like object');

    var len = arrayLike.length >>> 0;
    var result = new Array(len);

    for (var i = 0; i < len; i++) {
      if (mapFn) {
        result[i] = thisArg ? mapFn.call(thisArg, arrayLike[i], i) : mapFn(arrayLike[i], i);
      } else {
        result[i] = arrayLike[i];
      }
    }
    return result;
  };
}

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// ========================================
// OBJECT POLYFILLS
// ========================================

if (!Object.assign) {
  Object.assign = function(target) {
    if (target == null) throw new TypeError('Cannot convert undefined or null to object');

    var to = Object(target);

    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    }
    return to;
  };
}

if (!Object.keys) {
  Object.keys = function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Object.keys called on non-object');

    var keys = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
}

if (!Object.values) {
  Object.values = function(obj) {
    if (obj == null) throw new TypeError('Cannot convert undefined or null to object');

    var values = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        values.push(obj[key]);
      }
    }
    return values;
  };
}

if (!Object.entries) {
  Object.entries = function(obj) {
    if (obj == null) throw new TypeError('Cannot convert undefined or null to object');

    var entries = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        entries.push([key, obj[key]]);
      }
    }
    return entries;
  };
}

// ========================================
// STRING POLYFILLS
// ========================================

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') start = 0;
    if (start + search.length > this.length) return false;
    return this.indexOf(search, start) !== -1;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search, pos) {
    pos = !pos || pos < 0 ? 0 : +pos;
    return this.substring(pos, pos + search.length) === search;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search, length) {
    if (length === undefined || length > this.length) length = this.length;
    return this.substring(length - search.length, length) === search;
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

if (!String.prototype.padStart) {
  String.prototype.padStart = function(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(padString !== undefined ? padString : ' ');
    if (this.length >= targetLength) return String(this);
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length);
    }
    return padString.slice(0, targetLength) + String(this);
  };
}

if (!String.prototype.padEnd) {
  String.prototype.padEnd = function(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(padString !== undefined ? padString : ' ');
    if (this.length >= targetLength) return String(this);
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length);
    }
    return String(this) + padString.slice(0, targetLength);
  };
}

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    if (this == null) throw new TypeError("can't convert " + this + ' to object');
    var str = '' + this;
    count = +count;
    if (count !== count) count = 0;
    if (count < 0) throw new RangeError('repeat count must be non-negative');
    if (count === Infinity) throw new RangeError('repeat count must be less than infinity');
    count = Math.floor(count);
    if (str.length === 0 || count === 0) return '';

    var result = '';
    while (count > 0) {
      if (count & 1) result += str;
      count >>>= 1;
      str += str;
    }
    return result;
  };
}

// ========================================
// NUMBER POLYFILLS
// ========================================

if (!Number.isNaN) {
  Number.isNaN = function(value) {
    return typeof value === 'number' && value !== value;
  };
}

if (!Number.isFinite) {
  Number.isFinite = function(value) {
    return typeof value === 'number' && isFinite(value);
  };
}

if (!Number.isInteger) {
  Number.isInteger = function(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };
}

// ========================================
// PROMISE POLYFILL (Basic)
// For full Promise support, use es6-promise library
// ========================================

if (typeof Promise === 'undefined') {
  console.warn('Promise not available. Loading es6-promise polyfill is recommended.');
  // Basic Promise implementation for simple cases
  window.Promise = function(executor) {
    var self = this;
    self._state = 'pending';
    self._value = undefined;
    self._handlers = [];

    function resolve(value) {
      if (self._state !== 'pending') return;
      self._state = 'fulfilled';
      self._value = value;
      self._handlers.forEach(function(h) { h.onFulfilled(value); });
    }

    function reject(reason) {
      if (self._state !== 'pending') return;
      self._state = 'rejected';
      self._value = reason;
      self._handlers.forEach(function(h) { h.onRejected(reason); });
    }

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;
    return new Promise(function(resolve, reject) {
      function handle(handler) {
        try {
          var result = handler(self._value);
          if (result && typeof result.then === 'function') {
            result.then(resolve, reject);
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(e);
        }
      }

      if (self._state === 'pending') {
        self._handlers.push({
          onFulfilled: function(value) {
            handle(onFulfilled || function(v) { return v; });
          },
          onRejected: function(reason) {
            if (onRejected) handle(onRejected);
            else reject(reason);
          }
        });
      } else if (self._state === 'fulfilled') {
        setTimeout(function() { handle(onFulfilled || function(v) { return v; }); }, 0);
      } else if (self._state === 'rejected') {
        setTimeout(function() {
          if (onRejected) handle(onRejected);
          else reject(self._value);
        }, 0);
      }
    });
  };

  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.resolve = function(value) {
    return new Promise(function(resolve) { resolve(value); });
  };

  Promise.reject = function(reason) {
    return new Promise(function(resolve, reject) { reject(reason); });
  };

  Promise.all = function(promises) {
    return new Promise(function(resolve, reject) {
      var results = [];
      var completed = 0;

      if (promises.length === 0) {
        resolve(results);
        return;
      }

      promises.forEach(function(promise, index) {
        Promise.resolve(promise).then(function(value) {
          results[index] = value;
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        }, reject);
      });
    });
  };
}

// ========================================
// FETCH POLYFILL CHECK
// For full fetch support, use whatwg-fetch library
// ========================================

if (typeof fetch === 'undefined') {
  console.warn('Fetch API not available. For SharePoint 2013, include whatwg-fetch polyfill.');
  // Note: A full fetch polyfill is complex; use the whatwg-fetch npm package
}

// ========================================
// CONSOLE POLYFILL (for IE8)
// ========================================

if (typeof console === 'undefined') {
  window.console = {
    log: function() {},
    warn: function() {},
    error: function() {},
    info: function() {},
    debug: function() {}
  };
}

// Ensure console methods exist
['log', 'warn', 'error', 'info', 'debug', 'group', 'groupEnd', 'time', 'timeEnd'].forEach(function(method) {
  if (!console[method]) {
    console[method] = function() {};
  }
});

// ========================================
// JSON POLYFILL CHECK
// ========================================

if (typeof JSON === 'undefined') {
  console.error('JSON not available. Include json2.js for IE7 support.');
}

// ========================================
// DATE POLYFILLS
// ========================================

if (!Date.prototype.toISOString) {
  Date.prototype.toISOString = function() {
    function pad(number) {
      return number < 10 ? '0' + number : number;
    }

    return this.getUTCFullYear() +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };
}

if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

// ========================================
// FUNCTION POLYFILLS
// ========================================

if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1);
    var fToBind = this;
    var fNOP = function() {};
    var fBound = function() {
      return fToBind.apply(
        this instanceof fNOP ? this : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments))
      );
    };

    if (this.prototype) {
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// ========================================
// REQUESTANIMATIONFRAME POLYFILL
// ========================================

if (!window.requestAnimationFrame) {
  var lastTime = 0;
  window.requestAnimationFrame = function(callback) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function() {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

// ========================================
// CLASSLIST POLYFILL (for IE9)
// ========================================

if (!('classList' in document.createElement('_'))) {
  (function() {
    var classListPrototype = {
      add: function(className) {
        if (!this.contains(className)) {
          this._element.className += ' ' + className;
        }
      },
      remove: function(className) {
        this._element.className = this._element.className.replace(
          new RegExp('(^|\\s)' + className + '(\\s|$)', 'g'),
          ' '
        ).trim();
      },
      toggle: function(className) {
        if (this.contains(className)) {
          this.remove(className);
          return false;
        } else {
          this.add(className);
          return true;
        }
      },
      contains: function(className) {
        return new RegExp('(^|\\s)' + className + '(\\s|$)').test(this._element.className);
      }
    };

    Object.defineProperty(Element.prototype, 'classList', {
      get: function() {
        var obj = Object.create(classListPrototype);
        obj._element = this;
        return obj;
      }
    });
  })();
}

// ========================================
// EVENT LISTENER POLYFILL (for IE8)
// ========================================

if (!Element.prototype.addEventListener) {
  Element.prototype.addEventListener = function(event, handler) {
    this.attachEvent('on' + event, handler);
  };
  Element.prototype.removeEventListener = function(event, handler) {
    this.detachEvent('on' + event, handler);
  };
}

// ========================================
// INITIALIZATION LOG
// ========================================

console.log('SharePoint 2013 polyfills loaded successfully');
console.log('Browser: ' + navigator.userAgent);
