(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(lib$es6$promise$$internal$$noop);

      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
        lib$es6$promise$$internal$$makePromise(child);
      }

      var state = parent._state;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    var lib$es6$promise$$internal$$id = 0;
    function lib$es6$promise$$internal$$nextId() {
      return lib$es6$promise$$internal$$id++;
    }

    function lib$es6$promise$$internal$$makePromise(promise) {
      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!lib$es6$promise$utils$$isArray(entries)) {
        return new Constructor(function(resolve, reject) {
          reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function(resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;


    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
      this._result = this._state = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
        lib$es6$promise$$internal$$makePromise(this.promise);
      }

      if (lib$es6$promise$utils$$isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
      }
    }

    function lib$es6$promise$enumerator$$validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":35}],2:[function(require,module,exports){
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var db = require('mime-db')
var extname = require('path').extname

/**
 * Module variables.
 * @private
 */

var extractTypeRegExp = /^\s*([^;\s]*)(?:;|\s|$)/
var textTypeRegExp = /^text\//i

/**
 * Module exports.
 * @public
 */

exports.charset = charset
exports.charsets = { lookup: charset }
exports.contentType = contentType
exports.extension = extension
exports.extensions = Object.create(null)
exports.lookup = lookup
exports.types = Object.create(null)

// Populate the extensions/types maps
populateMaps(exports.extensions, exports.types)

/**
 * Get the default charset for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function charset(type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = extractTypeRegExp.exec(type)
  var mime = match && db[match[1].toLowerCase()]

  if (mime && mime.charset) {
    return mime.charset
  }

  // default text/* to utf-8
  if (match && textTypeRegExp.test(match[1])) {
    return 'UTF-8'
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 *
 * @param {string} str
 * @return {boolean|string}
 */

function contentType(str) {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  var mime = str.indexOf('/') === -1
    ? exports.lookup(str)
    : str

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (mime.indexOf('charset') === -1) {
    var charset = exports.charset(mime)
    if (charset) mime += '; charset=' + charset.toLowerCase()
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function extension(type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = extractTypeRegExp.exec(type)

  // get extensions
  var exts = match && exports.extensions[match[1].toLowerCase()]

  if (!exts || !exts.length) {
    return false
  }

  return exts[0]
}

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */

function lookup(path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  var extension = extname('x.' + path)
    .toLowerCase()
    .substr(1)

  if (!extension) {
    return false
  }

  return exports.types[extension] || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(extensions, types) {
  // source preference (least -> most)
  var preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType(type) {
    var mime = db[type]
    var exts = mime.extensions

    if (!exts || !exts.length) {
      return
    }

    // mime -> extensions
    extensions[type] = exts

    // extension -> mime
    for (var i = 0; i < exts.length; i++) {
      var extension = exts[i]

      if (types[extension]) {
        var from = preference.indexOf(db[types[extension]].source)
        var to = preference.indexOf(mime.source)

        if (types[extension] !== 'application/octet-stream'
          && from > to || (from === to && types[extension].substr(0, 12) === 'application/')) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime
      types[extension] = type
    }
  })
}

},{"mime-db":4,"path":34}],3:[function(require,module,exports){
module.exports={
  "application/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "application/3gpdash-qoe-report+xml": {
    "source": "iana"
  },
  "application/3gpp-ims+xml": {
    "source": "iana"
  },
  "application/a2l": {
    "source": "iana"
  },
  "application/activemessage": {
    "source": "iana"
  },
  "application/alto-costmap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-costmapfilter+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-directory+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointcost+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointcostparams+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointprop+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-endpointpropparams+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-error+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-networkmap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/alto-networkmapfilter+json": {
    "source": "iana",
    "compressible": true
  },
  "application/aml": {
    "source": "iana"
  },
  "application/andrew-inset": {
    "source": "iana",
    "extensions": ["ez"]
  },
  "application/applefile": {
    "source": "iana"
  },
  "application/applixware": {
    "source": "apache",
    "extensions": ["aw"]
  },
  "application/atf": {
    "source": "iana"
  },
  "application/atfx": {
    "source": "iana"
  },
  "application/atom+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["atom"]
  },
  "application/atomcat+xml": {
    "source": "iana",
    "extensions": ["atomcat"]
  },
  "application/atomdeleted+xml": {
    "source": "iana"
  },
  "application/atomicmail": {
    "source": "iana"
  },
  "application/atomsvc+xml": {
    "source": "iana",
    "extensions": ["atomsvc"]
  },
  "application/atxml": {
    "source": "iana"
  },
  "application/auth-policy+xml": {
    "source": "iana"
  },
  "application/bacnet-xdd+zip": {
    "source": "iana"
  },
  "application/batch-smtp": {
    "source": "iana"
  },
  "application/bdoc": {
    "compressible": false,
    "extensions": ["bdoc"]
  },
  "application/beep+xml": {
    "source": "iana"
  },
  "application/calendar+json": {
    "source": "iana",
    "compressible": true
  },
  "application/calendar+xml": {
    "source": "iana"
  },
  "application/call-completion": {
    "source": "iana"
  },
  "application/cals-1840": {
    "source": "iana"
  },
  "application/cbor": {
    "source": "iana"
  },
  "application/ccmp+xml": {
    "source": "iana"
  },
  "application/ccxml+xml": {
    "source": "iana",
    "extensions": ["ccxml"]
  },
  "application/cdfx+xml": {
    "source": "iana"
  },
  "application/cdmi-capability": {
    "source": "iana",
    "extensions": ["cdmia"]
  },
  "application/cdmi-container": {
    "source": "iana",
    "extensions": ["cdmic"]
  },
  "application/cdmi-domain": {
    "source": "iana",
    "extensions": ["cdmid"]
  },
  "application/cdmi-object": {
    "source": "iana",
    "extensions": ["cdmio"]
  },
  "application/cdmi-queue": {
    "source": "iana",
    "extensions": ["cdmiq"]
  },
  "application/cdni": {
    "source": "iana"
  },
  "application/cea": {
    "source": "iana"
  },
  "application/cea-2018+xml": {
    "source": "iana"
  },
  "application/cellml+xml": {
    "source": "iana"
  },
  "application/cfw": {
    "source": "iana"
  },
  "application/cms": {
    "source": "iana"
  },
  "application/cnrp+xml": {
    "source": "iana"
  },
  "application/coap-group+json": {
    "source": "iana",
    "compressible": true
  },
  "application/commonground": {
    "source": "iana"
  },
  "application/conference-info+xml": {
    "source": "iana"
  },
  "application/cpl+xml": {
    "source": "iana"
  },
  "application/csrattrs": {
    "source": "iana"
  },
  "application/csta+xml": {
    "source": "iana"
  },
  "application/cstadata+xml": {
    "source": "iana"
  },
  "application/csvm+json": {
    "source": "iana",
    "compressible": true
  },
  "application/cu-seeme": {
    "source": "apache",
    "extensions": ["cu"]
  },
  "application/cybercash": {
    "source": "iana"
  },
  "application/dart": {
    "compressible": true
  },
  "application/dash+xml": {
    "source": "iana",
    "extensions": ["mpd"]
  },
  "application/dashdelta": {
    "source": "iana"
  },
  "application/davmount+xml": {
    "source": "iana",
    "extensions": ["davmount"]
  },
  "application/dca-rft": {
    "source": "iana"
  },
  "application/dcd": {
    "source": "iana"
  },
  "application/dec-dx": {
    "source": "iana"
  },
  "application/dialog-info+xml": {
    "source": "iana"
  },
  "application/dicom": {
    "source": "iana"
  },
  "application/dii": {
    "source": "iana"
  },
  "application/dit": {
    "source": "iana"
  },
  "application/dns": {
    "source": "iana"
  },
  "application/docbook+xml": {
    "source": "apache",
    "extensions": ["dbk"]
  },
  "application/dskpp+xml": {
    "source": "iana"
  },
  "application/dssc+der": {
    "source": "iana",
    "extensions": ["dssc"]
  },
  "application/dssc+xml": {
    "source": "iana",
    "extensions": ["xdssc"]
  },
  "application/dvcs": {
    "source": "iana"
  },
  "application/ecmascript": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ecma"]
  },
  "application/edi-consent": {
    "source": "iana"
  },
  "application/edi-x12": {
    "source": "iana",
    "compressible": false
  },
  "application/edifact": {
    "source": "iana",
    "compressible": false
  },
  "application/efi": {
    "source": "iana"
  },
  "application/emergencycalldata.comment+xml": {
    "source": "iana"
  },
  "application/emergencycalldata.deviceinfo+xml": {
    "source": "iana"
  },
  "application/emergencycalldata.providerinfo+xml": {
    "source": "iana"
  },
  "application/emergencycalldata.serviceinfo+xml": {
    "source": "iana"
  },
  "application/emergencycalldata.subscriberinfo+xml": {
    "source": "iana"
  },
  "application/emma+xml": {
    "source": "iana",
    "extensions": ["emma"]
  },
  "application/emotionml+xml": {
    "source": "iana"
  },
  "application/encaprtp": {
    "source": "iana"
  },
  "application/epp+xml": {
    "source": "iana"
  },
  "application/epub+zip": {
    "source": "iana",
    "extensions": ["epub"]
  },
  "application/eshop": {
    "source": "iana"
  },
  "application/exi": {
    "source": "iana",
    "extensions": ["exi"]
  },
  "application/fastinfoset": {
    "source": "iana"
  },
  "application/fastsoap": {
    "source": "iana"
  },
  "application/fdt+xml": {
    "source": "iana"
  },
  "application/fits": {
    "source": "iana"
  },
  "application/font-sfnt": {
    "source": "iana"
  },
  "application/font-tdpfr": {
    "source": "iana",
    "extensions": ["pfr"]
  },
  "application/font-woff": {
    "source": "iana",
    "compressible": false,
    "extensions": ["woff"]
  },
  "application/font-woff2": {
    "compressible": false,
    "extensions": ["woff2"]
  },
  "application/framework-attributes+xml": {
    "source": "iana"
  },
  "application/gml+xml": {
    "source": "apache",
    "extensions": ["gml"]
  },
  "application/gpx+xml": {
    "source": "apache",
    "extensions": ["gpx"]
  },
  "application/gxf": {
    "source": "apache",
    "extensions": ["gxf"]
  },
  "application/gzip": {
    "source": "iana",
    "compressible": false
  },
  "application/h224": {
    "source": "iana"
  },
  "application/held+xml": {
    "source": "iana"
  },
  "application/http": {
    "source": "iana"
  },
  "application/hyperstudio": {
    "source": "iana",
    "extensions": ["stk"]
  },
  "application/ibe-key-request+xml": {
    "source": "iana"
  },
  "application/ibe-pkg-reply+xml": {
    "source": "iana"
  },
  "application/ibe-pp-data": {
    "source": "iana"
  },
  "application/iges": {
    "source": "iana"
  },
  "application/im-iscomposing+xml": {
    "source": "iana"
  },
  "application/index": {
    "source": "iana"
  },
  "application/index.cmd": {
    "source": "iana"
  },
  "application/index.obj": {
    "source": "iana"
  },
  "application/index.response": {
    "source": "iana"
  },
  "application/index.vnd": {
    "source": "iana"
  },
  "application/inkml+xml": {
    "source": "iana",
    "extensions": ["ink","inkml"]
  },
  "application/iotp": {
    "source": "iana"
  },
  "application/ipfix": {
    "source": "iana",
    "extensions": ["ipfix"]
  },
  "application/ipp": {
    "source": "iana"
  },
  "application/isup": {
    "source": "iana"
  },
  "application/its+xml": {
    "source": "iana"
  },
  "application/java-archive": {
    "source": "apache",
    "compressible": false,
    "extensions": ["jar","war","ear"]
  },
  "application/java-serialized-object": {
    "source": "apache",
    "compressible": false,
    "extensions": ["ser"]
  },
  "application/java-vm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["class"]
  },
  "application/javascript": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["js"]
  },
  "application/jose": {
    "source": "iana"
  },
  "application/jose+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jrd+json": {
    "source": "iana",
    "compressible": true
  },
  "application/json": {
    "source": "iana",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["json","map"]
  },
  "application/json-patch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/json-seq": {
    "source": "iana"
  },
  "application/json5": {
    "extensions": ["json5"]
  },
  "application/jsonml+json": {
    "source": "apache",
    "compressible": true,
    "extensions": ["jsonml"]
  },
  "application/jwk+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jwk-set+json": {
    "source": "iana",
    "compressible": true
  },
  "application/jwt": {
    "source": "iana"
  },
  "application/kpml-request+xml": {
    "source": "iana"
  },
  "application/kpml-response+xml": {
    "source": "iana"
  },
  "application/ld+json": {
    "source": "iana",
    "compressible": true,
    "extensions": ["jsonld"]
  },
  "application/link-format": {
    "source": "iana"
  },
  "application/load-control+xml": {
    "source": "iana"
  },
  "application/lost+xml": {
    "source": "iana",
    "extensions": ["lostxml"]
  },
  "application/lostsync+xml": {
    "source": "iana"
  },
  "application/lxf": {
    "source": "iana"
  },
  "application/mac-binhex40": {
    "source": "iana",
    "extensions": ["hqx"]
  },
  "application/mac-compactpro": {
    "source": "apache",
    "extensions": ["cpt"]
  },
  "application/macwriteii": {
    "source": "iana"
  },
  "application/mads+xml": {
    "source": "iana",
    "extensions": ["mads"]
  },
  "application/manifest+json": {
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["webmanifest"]
  },
  "application/marc": {
    "source": "iana",
    "extensions": ["mrc"]
  },
  "application/marcxml+xml": {
    "source": "iana",
    "extensions": ["mrcx"]
  },
  "application/mathematica": {
    "source": "iana",
    "extensions": ["ma","nb","mb"]
  },
  "application/mathml+xml": {
    "source": "iana",
    "extensions": ["mathml"]
  },
  "application/mathml-content+xml": {
    "source": "iana"
  },
  "application/mathml-presentation+xml": {
    "source": "iana"
  },
  "application/mbms-associated-procedure-description+xml": {
    "source": "iana"
  },
  "application/mbms-deregister+xml": {
    "source": "iana"
  },
  "application/mbms-envelope+xml": {
    "source": "iana"
  },
  "application/mbms-msk+xml": {
    "source": "iana"
  },
  "application/mbms-msk-response+xml": {
    "source": "iana"
  },
  "application/mbms-protection-description+xml": {
    "source": "iana"
  },
  "application/mbms-reception-report+xml": {
    "source": "iana"
  },
  "application/mbms-register+xml": {
    "source": "iana"
  },
  "application/mbms-register-response+xml": {
    "source": "iana"
  },
  "application/mbms-schedule+xml": {
    "source": "iana"
  },
  "application/mbms-user-service-description+xml": {
    "source": "iana"
  },
  "application/mbox": {
    "source": "iana",
    "extensions": ["mbox"]
  },
  "application/media-policy-dataset+xml": {
    "source": "iana"
  },
  "application/media_control+xml": {
    "source": "iana"
  },
  "application/mediaservercontrol+xml": {
    "source": "iana",
    "extensions": ["mscml"]
  },
  "application/merge-patch+json": {
    "source": "iana",
    "compressible": true
  },
  "application/metalink+xml": {
    "source": "apache",
    "extensions": ["metalink"]
  },
  "application/metalink4+xml": {
    "source": "iana",
    "extensions": ["meta4"]
  },
  "application/mets+xml": {
    "source": "iana",
    "extensions": ["mets"]
  },
  "application/mf4": {
    "source": "iana"
  },
  "application/mikey": {
    "source": "iana"
  },
  "application/mods+xml": {
    "source": "iana",
    "extensions": ["mods"]
  },
  "application/moss-keys": {
    "source": "iana"
  },
  "application/moss-signature": {
    "source": "iana"
  },
  "application/mosskey-data": {
    "source": "iana"
  },
  "application/mosskey-request": {
    "source": "iana"
  },
  "application/mp21": {
    "source": "iana",
    "extensions": ["m21","mp21"]
  },
  "application/mp4": {
    "source": "iana",
    "extensions": ["mp4s","m4p"]
  },
  "application/mpeg4-generic": {
    "source": "iana"
  },
  "application/mpeg4-iod": {
    "source": "iana"
  },
  "application/mpeg4-iod-xmt": {
    "source": "iana"
  },
  "application/mrb-consumer+xml": {
    "source": "iana"
  },
  "application/mrb-publish+xml": {
    "source": "iana"
  },
  "application/msc-ivr+xml": {
    "source": "iana"
  },
  "application/msc-mixer+xml": {
    "source": "iana"
  },
  "application/msword": {
    "source": "iana",
    "compressible": false,
    "extensions": ["doc","dot"]
  },
  "application/mxf": {
    "source": "iana",
    "extensions": ["mxf"]
  },
  "application/nasdata": {
    "source": "iana"
  },
  "application/news-checkgroups": {
    "source": "iana"
  },
  "application/news-groupinfo": {
    "source": "iana"
  },
  "application/news-transmission": {
    "source": "iana"
  },
  "application/nlsml+xml": {
    "source": "iana"
  },
  "application/nss": {
    "source": "iana"
  },
  "application/ocsp-request": {
    "source": "iana"
  },
  "application/ocsp-response": {
    "source": "iana"
  },
  "application/octet-stream": {
    "source": "iana",
    "compressible": false,
    "extensions": ["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]
  },
  "application/oda": {
    "source": "iana",
    "extensions": ["oda"]
  },
  "application/odx": {
    "source": "iana"
  },
  "application/oebps-package+xml": {
    "source": "iana",
    "extensions": ["opf"]
  },
  "application/ogg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ogx"]
  },
  "application/omdoc+xml": {
    "source": "apache",
    "extensions": ["omdoc"]
  },
  "application/onenote": {
    "source": "apache",
    "extensions": ["onetoc","onetoc2","onetmp","onepkg"]
  },
  "application/oxps": {
    "source": "iana",
    "extensions": ["oxps"]
  },
  "application/p2p-overlay+xml": {
    "source": "iana"
  },
  "application/parityfec": {
    "source": "iana"
  },
  "application/patch-ops-error+xml": {
    "source": "iana",
    "extensions": ["xer"]
  },
  "application/pdf": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pdf"]
  },
  "application/pdx": {
    "source": "iana"
  },
  "application/pgp-encrypted": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pgp"]
  },
  "application/pgp-keys": {
    "source": "iana"
  },
  "application/pgp-signature": {
    "source": "iana",
    "extensions": ["asc","sig"]
  },
  "application/pics-rules": {
    "source": "apache",
    "extensions": ["prf"]
  },
  "application/pidf+xml": {
    "source": "iana"
  },
  "application/pidf-diff+xml": {
    "source": "iana"
  },
  "application/pkcs10": {
    "source": "iana",
    "extensions": ["p10"]
  },
  "application/pkcs12": {
    "source": "iana"
  },
  "application/pkcs7-mime": {
    "source": "iana",
    "extensions": ["p7m","p7c"]
  },
  "application/pkcs7-signature": {
    "source": "iana",
    "extensions": ["p7s"]
  },
  "application/pkcs8": {
    "source": "iana",
    "extensions": ["p8"]
  },
  "application/pkix-attr-cert": {
    "source": "iana",
    "extensions": ["ac"]
  },
  "application/pkix-cert": {
    "source": "iana",
    "extensions": ["cer"]
  },
  "application/pkix-crl": {
    "source": "iana",
    "extensions": ["crl"]
  },
  "application/pkix-pkipath": {
    "source": "iana",
    "extensions": ["pkipath"]
  },
  "application/pkixcmp": {
    "source": "iana",
    "extensions": ["pki"]
  },
  "application/pls+xml": {
    "source": "iana",
    "extensions": ["pls"]
  },
  "application/poc-settings+xml": {
    "source": "iana"
  },
  "application/postscript": {
    "source": "iana",
    "compressible": true,
    "extensions": ["ai","eps","ps"]
  },
  "application/ppsp-tracker+json": {
    "source": "iana",
    "compressible": true
  },
  "application/problem+json": {
    "source": "iana",
    "compressible": true
  },
  "application/problem+xml": {
    "source": "iana"
  },
  "application/provenance+xml": {
    "source": "iana"
  },
  "application/prs.alvestrand.titrax-sheet": {
    "source": "iana"
  },
  "application/prs.cww": {
    "source": "iana",
    "extensions": ["cww"]
  },
  "application/prs.hpub+zip": {
    "source": "iana"
  },
  "application/prs.nprend": {
    "source": "iana"
  },
  "application/prs.plucker": {
    "source": "iana"
  },
  "application/prs.rdf-xml-crypt": {
    "source": "iana"
  },
  "application/prs.xsf+xml": {
    "source": "iana"
  },
  "application/pskc+xml": {
    "source": "iana",
    "extensions": ["pskcxml"]
  },
  "application/qsig": {
    "source": "iana"
  },
  "application/raptorfec": {
    "source": "iana"
  },
  "application/rdap+json": {
    "source": "iana",
    "compressible": true
  },
  "application/rdf+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rdf"]
  },
  "application/reginfo+xml": {
    "source": "iana",
    "extensions": ["rif"]
  },
  "application/relax-ng-compact-syntax": {
    "source": "iana",
    "extensions": ["rnc"]
  },
  "application/remote-printing": {
    "source": "iana"
  },
  "application/reputon+json": {
    "source": "iana",
    "compressible": true
  },
  "application/resource-lists+xml": {
    "source": "iana",
    "extensions": ["rl"]
  },
  "application/resource-lists-diff+xml": {
    "source": "iana",
    "extensions": ["rld"]
  },
  "application/rfc+xml": {
    "source": "iana"
  },
  "application/riscos": {
    "source": "iana"
  },
  "application/rlmi+xml": {
    "source": "iana"
  },
  "application/rls-services+xml": {
    "source": "iana",
    "extensions": ["rs"]
  },
  "application/rpki-ghostbusters": {
    "source": "iana",
    "extensions": ["gbr"]
  },
  "application/rpki-manifest": {
    "source": "iana",
    "extensions": ["mft"]
  },
  "application/rpki-roa": {
    "source": "iana",
    "extensions": ["roa"]
  },
  "application/rpki-updown": {
    "source": "iana"
  },
  "application/rsd+xml": {
    "source": "apache",
    "extensions": ["rsd"]
  },
  "application/rss+xml": {
    "source": "apache",
    "compressible": true,
    "extensions": ["rss"]
  },
  "application/rtf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtf"]
  },
  "application/rtploopback": {
    "source": "iana"
  },
  "application/rtx": {
    "source": "iana"
  },
  "application/samlassertion+xml": {
    "source": "iana"
  },
  "application/samlmetadata+xml": {
    "source": "iana"
  },
  "application/sbml+xml": {
    "source": "iana",
    "extensions": ["sbml"]
  },
  "application/scaip+xml": {
    "source": "iana"
  },
  "application/scim+json": {
    "source": "iana",
    "compressible": true
  },
  "application/scvp-cv-request": {
    "source": "iana",
    "extensions": ["scq"]
  },
  "application/scvp-cv-response": {
    "source": "iana",
    "extensions": ["scs"]
  },
  "application/scvp-vp-request": {
    "source": "iana",
    "extensions": ["spq"]
  },
  "application/scvp-vp-response": {
    "source": "iana",
    "extensions": ["spp"]
  },
  "application/sdp": {
    "source": "iana",
    "extensions": ["sdp"]
  },
  "application/sep+xml": {
    "source": "iana"
  },
  "application/sep-exi": {
    "source": "iana"
  },
  "application/session-info": {
    "source": "iana"
  },
  "application/set-payment": {
    "source": "iana"
  },
  "application/set-payment-initiation": {
    "source": "iana",
    "extensions": ["setpay"]
  },
  "application/set-registration": {
    "source": "iana"
  },
  "application/set-registration-initiation": {
    "source": "iana",
    "extensions": ["setreg"]
  },
  "application/sgml": {
    "source": "iana"
  },
  "application/sgml-open-catalog": {
    "source": "iana"
  },
  "application/shf+xml": {
    "source": "iana",
    "extensions": ["shf"]
  },
  "application/sieve": {
    "source": "iana"
  },
  "application/simple-filter+xml": {
    "source": "iana"
  },
  "application/simple-message-summary": {
    "source": "iana"
  },
  "application/simplesymbolcontainer": {
    "source": "iana"
  },
  "application/slate": {
    "source": "iana"
  },
  "application/smil": {
    "source": "iana"
  },
  "application/smil+xml": {
    "source": "iana",
    "extensions": ["smi","smil"]
  },
  "application/smpte336m": {
    "source": "iana"
  },
  "application/soap+fastinfoset": {
    "source": "iana"
  },
  "application/soap+xml": {
    "source": "iana",
    "compressible": true
  },
  "application/sparql-query": {
    "source": "iana",
    "extensions": ["rq"]
  },
  "application/sparql-results+xml": {
    "source": "iana",
    "extensions": ["srx"]
  },
  "application/spirits-event+xml": {
    "source": "iana"
  },
  "application/sql": {
    "source": "iana"
  },
  "application/srgs": {
    "source": "iana",
    "extensions": ["gram"]
  },
  "application/srgs+xml": {
    "source": "iana",
    "extensions": ["grxml"]
  },
  "application/sru+xml": {
    "source": "iana",
    "extensions": ["sru"]
  },
  "application/ssdl+xml": {
    "source": "apache",
    "extensions": ["ssdl"]
  },
  "application/ssml+xml": {
    "source": "iana",
    "extensions": ["ssml"]
  },
  "application/tamp-apex-update": {
    "source": "iana"
  },
  "application/tamp-apex-update-confirm": {
    "source": "iana"
  },
  "application/tamp-community-update": {
    "source": "iana"
  },
  "application/tamp-community-update-confirm": {
    "source": "iana"
  },
  "application/tamp-error": {
    "source": "iana"
  },
  "application/tamp-sequence-adjust": {
    "source": "iana"
  },
  "application/tamp-sequence-adjust-confirm": {
    "source": "iana"
  },
  "application/tamp-status-query": {
    "source": "iana"
  },
  "application/tamp-status-response": {
    "source": "iana"
  },
  "application/tamp-update": {
    "source": "iana"
  },
  "application/tamp-update-confirm": {
    "source": "iana"
  },
  "application/tar": {
    "compressible": true
  },
  "application/tei+xml": {
    "source": "iana",
    "extensions": ["tei","teicorpus"]
  },
  "application/thraud+xml": {
    "source": "iana",
    "extensions": ["tfi"]
  },
  "application/timestamp-query": {
    "source": "iana"
  },
  "application/timestamp-reply": {
    "source": "iana"
  },
  "application/timestamped-data": {
    "source": "iana",
    "extensions": ["tsd"]
  },
  "application/ttml+xml": {
    "source": "iana"
  },
  "application/tve-trigger": {
    "source": "iana"
  },
  "application/ulpfec": {
    "source": "iana"
  },
  "application/urc-grpsheet+xml": {
    "source": "iana"
  },
  "application/urc-ressheet+xml": {
    "source": "iana"
  },
  "application/urc-targetdesc+xml": {
    "source": "iana"
  },
  "application/urc-uisocketdesc+xml": {
    "source": "iana"
  },
  "application/vcard+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vcard+xml": {
    "source": "iana"
  },
  "application/vemmi": {
    "source": "iana"
  },
  "application/vividence.scriptfile": {
    "source": "apache"
  },
  "application/vnd.3gpp-prose+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp-prose-pc3ch+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.access-transfer-events+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.bsf+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.mid-call+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.pic-bw-large": {
    "source": "iana",
    "extensions": ["plb"]
  },
  "application/vnd.3gpp.pic-bw-small": {
    "source": "iana",
    "extensions": ["psb"]
  },
  "application/vnd.3gpp.pic-bw-var": {
    "source": "iana",
    "extensions": ["pvb"]
  },
  "application/vnd.3gpp.sms": {
    "source": "iana"
  },
  "application/vnd.3gpp.sms+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.srvcc-ext+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.srvcc-info+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.state-and-event-info+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp.ussd+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp2.bcmcsinfo+xml": {
    "source": "iana"
  },
  "application/vnd.3gpp2.sms": {
    "source": "iana"
  },
  "application/vnd.3gpp2.tcap": {
    "source": "iana",
    "extensions": ["tcap"]
  },
  "application/vnd.3lightssoftware.imagescal": {
    "source": "iana"
  },
  "application/vnd.3m.post-it-notes": {
    "source": "iana",
    "extensions": ["pwn"]
  },
  "application/vnd.accpac.simply.aso": {
    "source": "iana",
    "extensions": ["aso"]
  },
  "application/vnd.accpac.simply.imp": {
    "source": "iana",
    "extensions": ["imp"]
  },
  "application/vnd.acucobol": {
    "source": "iana",
    "extensions": ["acu"]
  },
  "application/vnd.acucorp": {
    "source": "iana",
    "extensions": ["atc","acutc"]
  },
  "application/vnd.adobe.air-application-installer-package+zip": {
    "source": "apache",
    "extensions": ["air"]
  },
  "application/vnd.adobe.flash.movie": {
    "source": "iana"
  },
  "application/vnd.adobe.formscentral.fcdt": {
    "source": "iana",
    "extensions": ["fcdt"]
  },
  "application/vnd.adobe.fxp": {
    "source": "iana",
    "extensions": ["fxp","fxpl"]
  },
  "application/vnd.adobe.partial-upload": {
    "source": "iana"
  },
  "application/vnd.adobe.xdp+xml": {
    "source": "iana",
    "extensions": ["xdp"]
  },
  "application/vnd.adobe.xfdf": {
    "source": "iana",
    "extensions": ["xfdf"]
  },
  "application/vnd.aether.imp": {
    "source": "iana"
  },
  "application/vnd.ah-barcode": {
    "source": "iana"
  },
  "application/vnd.ahead.space": {
    "source": "iana",
    "extensions": ["ahead"]
  },
  "application/vnd.airzip.filesecure.azf": {
    "source": "iana",
    "extensions": ["azf"]
  },
  "application/vnd.airzip.filesecure.azs": {
    "source": "iana",
    "extensions": ["azs"]
  },
  "application/vnd.amazon.ebook": {
    "source": "apache",
    "extensions": ["azw"]
  },
  "application/vnd.americandynamics.acc": {
    "source": "iana",
    "extensions": ["acc"]
  },
  "application/vnd.amiga.ami": {
    "source": "iana",
    "extensions": ["ami"]
  },
  "application/vnd.amundsen.maze+xml": {
    "source": "iana"
  },
  "application/vnd.android.package-archive": {
    "source": "apache",
    "compressible": false,
    "extensions": ["apk"]
  },
  "application/vnd.anki": {
    "source": "iana"
  },
  "application/vnd.anser-web-certificate-issue-initiation": {
    "source": "iana",
    "extensions": ["cii"]
  },
  "application/vnd.anser-web-funds-transfer-initiation": {
    "source": "apache",
    "extensions": ["fti"]
  },
  "application/vnd.antix.game-component": {
    "source": "iana",
    "extensions": ["atx"]
  },
  "application/vnd.apache.thrift.binary": {
    "source": "iana"
  },
  "application/vnd.apache.thrift.compact": {
    "source": "iana"
  },
  "application/vnd.apache.thrift.json": {
    "source": "iana"
  },
  "application/vnd.api+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.apple.installer+xml": {
    "source": "iana",
    "extensions": ["mpkg"]
  },
  "application/vnd.apple.mpegurl": {
    "source": "iana",
    "extensions": ["m3u8"]
  },
  "application/vnd.apple.pkpass": {
    "compressible": false,
    "extensions": ["pkpass"]
  },
  "application/vnd.arastra.swi": {
    "source": "iana"
  },
  "application/vnd.aristanetworks.swi": {
    "source": "iana",
    "extensions": ["swi"]
  },
  "application/vnd.artsquare": {
    "source": "iana"
  },
  "application/vnd.astraea-software.iota": {
    "source": "iana",
    "extensions": ["iota"]
  },
  "application/vnd.audiograph": {
    "source": "iana",
    "extensions": ["aep"]
  },
  "application/vnd.autopackage": {
    "source": "iana"
  },
  "application/vnd.avistar+xml": {
    "source": "iana"
  },
  "application/vnd.balsamiq.bmml+xml": {
    "source": "iana"
  },
  "application/vnd.balsamiq.bmpr": {
    "source": "iana"
  },
  "application/vnd.bekitzur-stech+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.biopax.rdf+xml": {
    "source": "iana"
  },
  "application/vnd.blueice.multipass": {
    "source": "iana",
    "extensions": ["mpm"]
  },
  "application/vnd.bluetooth.ep.oob": {
    "source": "iana"
  },
  "application/vnd.bluetooth.le.oob": {
    "source": "iana"
  },
  "application/vnd.bmi": {
    "source": "iana",
    "extensions": ["bmi"]
  },
  "application/vnd.businessobjects": {
    "source": "iana",
    "extensions": ["rep"]
  },
  "application/vnd.cab-jscript": {
    "source": "iana"
  },
  "application/vnd.canon-cpdl": {
    "source": "iana"
  },
  "application/vnd.canon-lips": {
    "source": "iana"
  },
  "application/vnd.cendio.thinlinc.clientconf": {
    "source": "iana"
  },
  "application/vnd.century-systems.tcp_stream": {
    "source": "iana"
  },
  "application/vnd.chemdraw+xml": {
    "source": "iana",
    "extensions": ["cdxml"]
  },
  "application/vnd.chipnuts.karaoke-mmd": {
    "source": "iana",
    "extensions": ["mmd"]
  },
  "application/vnd.cinderella": {
    "source": "iana",
    "extensions": ["cdy"]
  },
  "application/vnd.cirpack.isdn-ext": {
    "source": "iana"
  },
  "application/vnd.citationstyles.style+xml": {
    "source": "iana"
  },
  "application/vnd.claymore": {
    "source": "iana",
    "extensions": ["cla"]
  },
  "application/vnd.cloanto.rp9": {
    "source": "iana",
    "extensions": ["rp9"]
  },
  "application/vnd.clonk.c4group": {
    "source": "iana",
    "extensions": ["c4g","c4d","c4f","c4p","c4u"]
  },
  "application/vnd.cluetrust.cartomobile-config": {
    "source": "iana",
    "extensions": ["c11amc"]
  },
  "application/vnd.cluetrust.cartomobile-config-pkg": {
    "source": "iana",
    "extensions": ["c11amz"]
  },
  "application/vnd.coffeescript": {
    "source": "iana"
  },
  "application/vnd.collection+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.collection.doc+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.collection.next+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.commerce-battelle": {
    "source": "iana"
  },
  "application/vnd.commonspace": {
    "source": "iana",
    "extensions": ["csp"]
  },
  "application/vnd.contact.cmsg": {
    "source": "iana",
    "extensions": ["cdbcmsg"]
  },
  "application/vnd.coreos.ignition+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.cosmocaller": {
    "source": "iana",
    "extensions": ["cmc"]
  },
  "application/vnd.crick.clicker": {
    "source": "iana",
    "extensions": ["clkx"]
  },
  "application/vnd.crick.clicker.keyboard": {
    "source": "iana",
    "extensions": ["clkk"]
  },
  "application/vnd.crick.clicker.palette": {
    "source": "iana",
    "extensions": ["clkp"]
  },
  "application/vnd.crick.clicker.template": {
    "source": "iana",
    "extensions": ["clkt"]
  },
  "application/vnd.crick.clicker.wordbank": {
    "source": "iana",
    "extensions": ["clkw"]
  },
  "application/vnd.criticaltools.wbs+xml": {
    "source": "iana",
    "extensions": ["wbs"]
  },
  "application/vnd.ctc-posml": {
    "source": "iana",
    "extensions": ["pml"]
  },
  "application/vnd.ctct.ws+xml": {
    "source": "iana"
  },
  "application/vnd.cups-pdf": {
    "source": "iana"
  },
  "application/vnd.cups-postscript": {
    "source": "iana"
  },
  "application/vnd.cups-ppd": {
    "source": "iana",
    "extensions": ["ppd"]
  },
  "application/vnd.cups-raster": {
    "source": "iana"
  },
  "application/vnd.cups-raw": {
    "source": "iana"
  },
  "application/vnd.curl": {
    "source": "iana"
  },
  "application/vnd.curl.car": {
    "source": "apache",
    "extensions": ["car"]
  },
  "application/vnd.curl.pcurl": {
    "source": "apache",
    "extensions": ["pcurl"]
  },
  "application/vnd.cyan.dean.root+xml": {
    "source": "iana"
  },
  "application/vnd.cybank": {
    "source": "iana"
  },
  "application/vnd.dart": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dart"]
  },
  "application/vnd.data-vision.rdz": {
    "source": "iana",
    "extensions": ["rdz"]
  },
  "application/vnd.debian.binary-package": {
    "source": "iana"
  },
  "application/vnd.dece.data": {
    "source": "iana",
    "extensions": ["uvf","uvvf","uvd","uvvd"]
  },
  "application/vnd.dece.ttml+xml": {
    "source": "iana",
    "extensions": ["uvt","uvvt"]
  },
  "application/vnd.dece.unspecified": {
    "source": "iana",
    "extensions": ["uvx","uvvx"]
  },
  "application/vnd.dece.zip": {
    "source": "iana",
    "extensions": ["uvz","uvvz"]
  },
  "application/vnd.denovo.fcselayout-link": {
    "source": "iana",
    "extensions": ["fe_launch"]
  },
  "application/vnd.desmume-movie": {
    "source": "iana"
  },
  "application/vnd.desmume.movie": {
    "source": "apache"
  },
  "application/vnd.dir-bi.plate-dl-nosuffix": {
    "source": "iana"
  },
  "application/vnd.dm.delegation+xml": {
    "source": "iana"
  },
  "application/vnd.dna": {
    "source": "iana",
    "extensions": ["dna"]
  },
  "application/vnd.document+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.dolby.mlp": {
    "source": "apache",
    "extensions": ["mlp"]
  },
  "application/vnd.dolby.mobile.1": {
    "source": "iana"
  },
  "application/vnd.dolby.mobile.2": {
    "source": "iana"
  },
  "application/vnd.doremir.scorecloud-binary-document": {
    "source": "iana"
  },
  "application/vnd.dpgraph": {
    "source": "iana",
    "extensions": ["dpg"]
  },
  "application/vnd.dreamfactory": {
    "source": "iana",
    "extensions": ["dfac"]
  },
  "application/vnd.drive+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ds-keypoint": {
    "source": "apache",
    "extensions": ["kpxx"]
  },
  "application/vnd.dtg.local": {
    "source": "iana"
  },
  "application/vnd.dtg.local.flash": {
    "source": "iana"
  },
  "application/vnd.dtg.local.html": {
    "source": "iana"
  },
  "application/vnd.dvb.ait": {
    "source": "iana",
    "extensions": ["ait"]
  },
  "application/vnd.dvb.dvbj": {
    "source": "iana"
  },
  "application/vnd.dvb.esgcontainer": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcdftnotifaccess": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgaccess": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgaccess2": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcesgpdd": {
    "source": "iana"
  },
  "application/vnd.dvb.ipdcroaming": {
    "source": "iana"
  },
  "application/vnd.dvb.iptv.alfec-base": {
    "source": "iana"
  },
  "application/vnd.dvb.iptv.alfec-enhancement": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-aggregate-root+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-container+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-generic+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-ia-msglist+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-ia-registration-request+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-ia-registration-response+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.notif-init+xml": {
    "source": "iana"
  },
  "application/vnd.dvb.pfr": {
    "source": "iana"
  },
  "application/vnd.dvb.service": {
    "source": "iana",
    "extensions": ["svc"]
  },
  "application/vnd.dxr": {
    "source": "iana"
  },
  "application/vnd.dynageo": {
    "source": "iana",
    "extensions": ["geo"]
  },
  "application/vnd.dzr": {
    "source": "iana"
  },
  "application/vnd.easykaraoke.cdgdownload": {
    "source": "iana"
  },
  "application/vnd.ecdis-update": {
    "source": "iana"
  },
  "application/vnd.ecowin.chart": {
    "source": "iana",
    "extensions": ["mag"]
  },
  "application/vnd.ecowin.filerequest": {
    "source": "iana"
  },
  "application/vnd.ecowin.fileupdate": {
    "source": "iana"
  },
  "application/vnd.ecowin.series": {
    "source": "iana"
  },
  "application/vnd.ecowin.seriesrequest": {
    "source": "iana"
  },
  "application/vnd.ecowin.seriesupdate": {
    "source": "iana"
  },
  "application/vnd.emclient.accessrequest+xml": {
    "source": "iana"
  },
  "application/vnd.enliven": {
    "source": "iana",
    "extensions": ["nml"]
  },
  "application/vnd.enphase.envoy": {
    "source": "iana"
  },
  "application/vnd.eprints.data+xml": {
    "source": "iana"
  },
  "application/vnd.epson.esf": {
    "source": "iana",
    "extensions": ["esf"]
  },
  "application/vnd.epson.msf": {
    "source": "iana",
    "extensions": ["msf"]
  },
  "application/vnd.epson.quickanime": {
    "source": "iana",
    "extensions": ["qam"]
  },
  "application/vnd.epson.salt": {
    "source": "iana",
    "extensions": ["slt"]
  },
  "application/vnd.epson.ssf": {
    "source": "iana",
    "extensions": ["ssf"]
  },
  "application/vnd.ericsson.quickcall": {
    "source": "iana"
  },
  "application/vnd.eszigno3+xml": {
    "source": "iana",
    "extensions": ["es3","et3"]
  },
  "application/vnd.etsi.aoc+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.asic-e+zip": {
    "source": "iana"
  },
  "application/vnd.etsi.asic-s+zip": {
    "source": "iana"
  },
  "application/vnd.etsi.cug+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvcommand+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvdiscovery+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvprofile+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvsad-bc+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvsad-cod+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvsad-npvr+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvservice+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvsync+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.iptvueprofile+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.mcid+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.mheg5": {
    "source": "iana"
  },
  "application/vnd.etsi.overload-control-policy-dataset+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.pstn+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.sci+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.simservs+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.timestamp-token": {
    "source": "iana"
  },
  "application/vnd.etsi.tsl+xml": {
    "source": "iana"
  },
  "application/vnd.etsi.tsl.der": {
    "source": "iana"
  },
  "application/vnd.eudora.data": {
    "source": "iana"
  },
  "application/vnd.ezpix-album": {
    "source": "iana",
    "extensions": ["ez2"]
  },
  "application/vnd.ezpix-package": {
    "source": "iana",
    "extensions": ["ez3"]
  },
  "application/vnd.f-secure.mobile": {
    "source": "iana"
  },
  "application/vnd.fastcopy-disk-image": {
    "source": "iana"
  },
  "application/vnd.fdf": {
    "source": "iana",
    "extensions": ["fdf"]
  },
  "application/vnd.fdsn.mseed": {
    "source": "iana",
    "extensions": ["mseed"]
  },
  "application/vnd.fdsn.seed": {
    "source": "iana",
    "extensions": ["seed","dataless"]
  },
  "application/vnd.ffsns": {
    "source": "iana"
  },
  "application/vnd.filmit.zfc": {
    "source": "iana"
  },
  "application/vnd.fints": {
    "source": "iana"
  },
  "application/vnd.firemonkeys.cloudcell": {
    "source": "iana"
  },
  "application/vnd.flographit": {
    "source": "iana",
    "extensions": ["gph"]
  },
  "application/vnd.fluxtime.clip": {
    "source": "iana",
    "extensions": ["ftc"]
  },
  "application/vnd.font-fontforge-sfd": {
    "source": "iana"
  },
  "application/vnd.framemaker": {
    "source": "iana",
    "extensions": ["fm","frame","maker","book"]
  },
  "application/vnd.frogans.fnc": {
    "source": "iana",
    "extensions": ["fnc"]
  },
  "application/vnd.frogans.ltf": {
    "source": "iana",
    "extensions": ["ltf"]
  },
  "application/vnd.fsc.weblaunch": {
    "source": "iana",
    "extensions": ["fsc"]
  },
  "application/vnd.fujitsu.oasys": {
    "source": "iana",
    "extensions": ["oas"]
  },
  "application/vnd.fujitsu.oasys2": {
    "source": "iana",
    "extensions": ["oa2"]
  },
  "application/vnd.fujitsu.oasys3": {
    "source": "iana",
    "extensions": ["oa3"]
  },
  "application/vnd.fujitsu.oasysgp": {
    "source": "iana",
    "extensions": ["fg5"]
  },
  "application/vnd.fujitsu.oasysprs": {
    "source": "iana",
    "extensions": ["bh2"]
  },
  "application/vnd.fujixerox.art-ex": {
    "source": "iana"
  },
  "application/vnd.fujixerox.art4": {
    "source": "iana"
  },
  "application/vnd.fujixerox.ddd": {
    "source": "iana",
    "extensions": ["ddd"]
  },
  "application/vnd.fujixerox.docuworks": {
    "source": "iana",
    "extensions": ["xdw"]
  },
  "application/vnd.fujixerox.docuworks.binder": {
    "source": "iana",
    "extensions": ["xbd"]
  },
  "application/vnd.fujixerox.docuworks.container": {
    "source": "iana"
  },
  "application/vnd.fujixerox.hbpl": {
    "source": "iana"
  },
  "application/vnd.fut-misnet": {
    "source": "iana"
  },
  "application/vnd.fuzzysheet": {
    "source": "iana",
    "extensions": ["fzs"]
  },
  "application/vnd.genomatix.tuxedo": {
    "source": "iana",
    "extensions": ["txd"]
  },
  "application/vnd.geo+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.geocube+xml": {
    "source": "iana"
  },
  "application/vnd.geogebra.file": {
    "source": "iana",
    "extensions": ["ggb"]
  },
  "application/vnd.geogebra.tool": {
    "source": "iana",
    "extensions": ["ggt"]
  },
  "application/vnd.geometry-explorer": {
    "source": "iana",
    "extensions": ["gex","gre"]
  },
  "application/vnd.geonext": {
    "source": "iana",
    "extensions": ["gxt"]
  },
  "application/vnd.geoplan": {
    "source": "iana",
    "extensions": ["g2w"]
  },
  "application/vnd.geospace": {
    "source": "iana",
    "extensions": ["g3w"]
  },
  "application/vnd.gerber": {
    "source": "iana"
  },
  "application/vnd.globalplatform.card-content-mgt": {
    "source": "iana"
  },
  "application/vnd.globalplatform.card-content-mgt-response": {
    "source": "iana"
  },
  "application/vnd.gmx": {
    "source": "iana",
    "extensions": ["gmx"]
  },
  "application/vnd.google-apps.document": {
    "compressible": false,
    "extensions": ["gdoc"]
  },
  "application/vnd.google-apps.presentation": {
    "compressible": false,
    "extensions": ["gslides"]
  },
  "application/vnd.google-apps.spreadsheet": {
    "compressible": false,
    "extensions": ["gsheet"]
  },
  "application/vnd.google-earth.kml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["kml"]
  },
  "application/vnd.google-earth.kmz": {
    "source": "iana",
    "compressible": false,
    "extensions": ["kmz"]
  },
  "application/vnd.gov.sk.e-form+xml": {
    "source": "iana"
  },
  "application/vnd.gov.sk.e-form+zip": {
    "source": "iana"
  },
  "application/vnd.gov.sk.xmldatacontainer+xml": {
    "source": "iana"
  },
  "application/vnd.grafeq": {
    "source": "iana",
    "extensions": ["gqf","gqs"]
  },
  "application/vnd.gridmp": {
    "source": "iana"
  },
  "application/vnd.groove-account": {
    "source": "iana",
    "extensions": ["gac"]
  },
  "application/vnd.groove-help": {
    "source": "iana",
    "extensions": ["ghf"]
  },
  "application/vnd.groove-identity-message": {
    "source": "iana",
    "extensions": ["gim"]
  },
  "application/vnd.groove-injector": {
    "source": "iana",
    "extensions": ["grv"]
  },
  "application/vnd.groove-tool-message": {
    "source": "iana",
    "extensions": ["gtm"]
  },
  "application/vnd.groove-tool-template": {
    "source": "iana",
    "extensions": ["tpl"]
  },
  "application/vnd.groove-vcard": {
    "source": "iana",
    "extensions": ["vcg"]
  },
  "application/vnd.hal+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hal+xml": {
    "source": "iana",
    "extensions": ["hal"]
  },
  "application/vnd.handheld-entertainment+xml": {
    "source": "iana",
    "extensions": ["zmm"]
  },
  "application/vnd.hbci": {
    "source": "iana",
    "extensions": ["hbci"]
  },
  "application/vnd.hcl-bireports": {
    "source": "iana"
  },
  "application/vnd.hdt": {
    "source": "iana"
  },
  "application/vnd.heroku+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hhe.lesson-player": {
    "source": "iana",
    "extensions": ["les"]
  },
  "application/vnd.hp-hpgl": {
    "source": "iana",
    "extensions": ["hpgl"]
  },
  "application/vnd.hp-hpid": {
    "source": "iana",
    "extensions": ["hpid"]
  },
  "application/vnd.hp-hps": {
    "source": "iana",
    "extensions": ["hps"]
  },
  "application/vnd.hp-jlyt": {
    "source": "iana",
    "extensions": ["jlt"]
  },
  "application/vnd.hp-pcl": {
    "source": "iana",
    "extensions": ["pcl"]
  },
  "application/vnd.hp-pclxl": {
    "source": "iana",
    "extensions": ["pclxl"]
  },
  "application/vnd.httphone": {
    "source": "iana"
  },
  "application/vnd.hydrostatix.sof-data": {
    "source": "iana",
    "extensions": ["sfd-hdstx"]
  },
  "application/vnd.hyperdrive+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.hzn-3d-crossword": {
    "source": "iana"
  },
  "application/vnd.ibm.afplinedata": {
    "source": "iana"
  },
  "application/vnd.ibm.electronic-media": {
    "source": "iana"
  },
  "application/vnd.ibm.minipay": {
    "source": "iana",
    "extensions": ["mpy"]
  },
  "application/vnd.ibm.modcap": {
    "source": "iana",
    "extensions": ["afp","listafp","list3820"]
  },
  "application/vnd.ibm.rights-management": {
    "source": "iana",
    "extensions": ["irm"]
  },
  "application/vnd.ibm.secure-container": {
    "source": "iana",
    "extensions": ["sc"]
  },
  "application/vnd.iccprofile": {
    "source": "iana",
    "extensions": ["icc","icm"]
  },
  "application/vnd.ieee.1905": {
    "source": "iana"
  },
  "application/vnd.igloader": {
    "source": "iana",
    "extensions": ["igl"]
  },
  "application/vnd.immervision-ivp": {
    "source": "iana",
    "extensions": ["ivp"]
  },
  "application/vnd.immervision-ivu": {
    "source": "iana",
    "extensions": ["ivu"]
  },
  "application/vnd.ims.imsccv1p1": {
    "source": "iana"
  },
  "application/vnd.ims.imsccv1p2": {
    "source": "iana"
  },
  "application/vnd.ims.imsccv1p3": {
    "source": "iana"
  },
  "application/vnd.ims.lis.v2.result+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolproxy+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolproxy.id+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolsettings+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.informedcontrol.rms+xml": {
    "source": "iana"
  },
  "application/vnd.informix-visionary": {
    "source": "iana"
  },
  "application/vnd.infotech.project": {
    "source": "iana"
  },
  "application/vnd.infotech.project+xml": {
    "source": "iana"
  },
  "application/vnd.innopath.wamp.notification": {
    "source": "iana"
  },
  "application/vnd.insors.igm": {
    "source": "iana",
    "extensions": ["igm"]
  },
  "application/vnd.intercon.formnet": {
    "source": "iana",
    "extensions": ["xpw","xpx"]
  },
  "application/vnd.intergeo": {
    "source": "iana",
    "extensions": ["i2g"]
  },
  "application/vnd.intertrust.digibox": {
    "source": "iana"
  },
  "application/vnd.intertrust.nncp": {
    "source": "iana"
  },
  "application/vnd.intu.qbo": {
    "source": "iana",
    "extensions": ["qbo"]
  },
  "application/vnd.intu.qfx": {
    "source": "iana",
    "extensions": ["qfx"]
  },
  "application/vnd.iptc.g2.catalogitem+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.conceptitem+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.knowledgeitem+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.newsitem+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.newsmessage+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.packageitem+xml": {
    "source": "iana"
  },
  "application/vnd.iptc.g2.planningitem+xml": {
    "source": "iana"
  },
  "application/vnd.ipunplugged.rcprofile": {
    "source": "iana",
    "extensions": ["rcprofile"]
  },
  "application/vnd.irepository.package+xml": {
    "source": "iana",
    "extensions": ["irp"]
  },
  "application/vnd.is-xpr": {
    "source": "iana",
    "extensions": ["xpr"]
  },
  "application/vnd.isac.fcs": {
    "source": "iana",
    "extensions": ["fcs"]
  },
  "application/vnd.jam": {
    "source": "iana",
    "extensions": ["jam"]
  },
  "application/vnd.japannet-directory-service": {
    "source": "iana"
  },
  "application/vnd.japannet-jpnstore-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-payment-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-registration": {
    "source": "iana"
  },
  "application/vnd.japannet-registration-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-setstore-wakeup": {
    "source": "iana"
  },
  "application/vnd.japannet-verification": {
    "source": "iana"
  },
  "application/vnd.japannet-verification-wakeup": {
    "source": "iana"
  },
  "application/vnd.jcp.javame.midlet-rms": {
    "source": "iana",
    "extensions": ["rms"]
  },
  "application/vnd.jisp": {
    "source": "iana",
    "extensions": ["jisp"]
  },
  "application/vnd.joost.joda-archive": {
    "source": "iana",
    "extensions": ["joda"]
  },
  "application/vnd.jsk.isdn-ngn": {
    "source": "iana"
  },
  "application/vnd.kahootz": {
    "source": "iana",
    "extensions": ["ktz","ktr"]
  },
  "application/vnd.kde.karbon": {
    "source": "iana",
    "extensions": ["karbon"]
  },
  "application/vnd.kde.kchart": {
    "source": "iana",
    "extensions": ["chrt"]
  },
  "application/vnd.kde.kformula": {
    "source": "iana",
    "extensions": ["kfo"]
  },
  "application/vnd.kde.kivio": {
    "source": "iana",
    "extensions": ["flw"]
  },
  "application/vnd.kde.kontour": {
    "source": "iana",
    "extensions": ["kon"]
  },
  "application/vnd.kde.kpresenter": {
    "source": "iana",
    "extensions": ["kpr","kpt"]
  },
  "application/vnd.kde.kspread": {
    "source": "iana",
    "extensions": ["ksp"]
  },
  "application/vnd.kde.kword": {
    "source": "iana",
    "extensions": ["kwd","kwt"]
  },
  "application/vnd.kenameaapp": {
    "source": "iana",
    "extensions": ["htke"]
  },
  "application/vnd.kidspiration": {
    "source": "iana",
    "extensions": ["kia"]
  },
  "application/vnd.kinar": {
    "source": "iana",
    "extensions": ["kne","knp"]
  },
  "application/vnd.koan": {
    "source": "iana",
    "extensions": ["skp","skd","skt","skm"]
  },
  "application/vnd.kodak-descriptor": {
    "source": "iana",
    "extensions": ["sse"]
  },
  "application/vnd.las.las+xml": {
    "source": "iana",
    "extensions": ["lasxml"]
  },
  "application/vnd.liberty-request+xml": {
    "source": "iana"
  },
  "application/vnd.llamagraphics.life-balance.desktop": {
    "source": "iana",
    "extensions": ["lbd"]
  },
  "application/vnd.llamagraphics.life-balance.exchange+xml": {
    "source": "iana",
    "extensions": ["lbe"]
  },
  "application/vnd.lotus-1-2-3": {
    "source": "iana",
    "extensions": ["123"]
  },
  "application/vnd.lotus-approach": {
    "source": "iana",
    "extensions": ["apr"]
  },
  "application/vnd.lotus-freelance": {
    "source": "iana",
    "extensions": ["pre"]
  },
  "application/vnd.lotus-notes": {
    "source": "iana",
    "extensions": ["nsf"]
  },
  "application/vnd.lotus-organizer": {
    "source": "iana",
    "extensions": ["org"]
  },
  "application/vnd.lotus-screencam": {
    "source": "iana",
    "extensions": ["scm"]
  },
  "application/vnd.lotus-wordpro": {
    "source": "iana",
    "extensions": ["lwp"]
  },
  "application/vnd.macports.portpkg": {
    "source": "iana",
    "extensions": ["portpkg"]
  },
  "application/vnd.mapbox-vector-tile": {
    "source": "iana"
  },
  "application/vnd.marlin.drm.actiontoken+xml": {
    "source": "iana"
  },
  "application/vnd.marlin.drm.conftoken+xml": {
    "source": "iana"
  },
  "application/vnd.marlin.drm.license+xml": {
    "source": "iana"
  },
  "application/vnd.marlin.drm.mdcf": {
    "source": "iana"
  },
  "application/vnd.mason+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.maxmind.maxmind-db": {
    "source": "iana"
  },
  "application/vnd.mcd": {
    "source": "iana",
    "extensions": ["mcd"]
  },
  "application/vnd.medcalcdata": {
    "source": "iana",
    "extensions": ["mc1"]
  },
  "application/vnd.mediastation.cdkey": {
    "source": "iana",
    "extensions": ["cdkey"]
  },
  "application/vnd.meridian-slingshot": {
    "source": "iana"
  },
  "application/vnd.mfer": {
    "source": "iana",
    "extensions": ["mwf"]
  },
  "application/vnd.mfmp": {
    "source": "iana",
    "extensions": ["mfm"]
  },
  "application/vnd.micro+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.micrografx.flo": {
    "source": "iana",
    "extensions": ["flo"]
  },
  "application/vnd.micrografx.igx": {
    "source": "iana",
    "extensions": ["igx"]
  },
  "application/vnd.microsoft.portable-executable": {
    "source": "iana"
  },
  "application/vnd.miele+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.mif": {
    "source": "iana",
    "extensions": ["mif"]
  },
  "application/vnd.minisoft-hp3000-save": {
    "source": "iana"
  },
  "application/vnd.mitsubishi.misty-guard.trustweb": {
    "source": "iana"
  },
  "application/vnd.mobius.daf": {
    "source": "iana",
    "extensions": ["daf"]
  },
  "application/vnd.mobius.dis": {
    "source": "iana",
    "extensions": ["dis"]
  },
  "application/vnd.mobius.mbk": {
    "source": "iana",
    "extensions": ["mbk"]
  },
  "application/vnd.mobius.mqy": {
    "source": "iana",
    "extensions": ["mqy"]
  },
  "application/vnd.mobius.msl": {
    "source": "iana",
    "extensions": ["msl"]
  },
  "application/vnd.mobius.plc": {
    "source": "iana",
    "extensions": ["plc"]
  },
  "application/vnd.mobius.txf": {
    "source": "iana",
    "extensions": ["txf"]
  },
  "application/vnd.mophun.application": {
    "source": "iana",
    "extensions": ["mpn"]
  },
  "application/vnd.mophun.certificate": {
    "source": "iana",
    "extensions": ["mpc"]
  },
  "application/vnd.motorola.flexsuite": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.adsi": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.fis": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.gotap": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.kmr": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.ttc": {
    "source": "iana"
  },
  "application/vnd.motorola.flexsuite.wem": {
    "source": "iana"
  },
  "application/vnd.motorola.iprm": {
    "source": "iana"
  },
  "application/vnd.mozilla.xul+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xul"]
  },
  "application/vnd.ms-3mfdocument": {
    "source": "iana"
  },
  "application/vnd.ms-artgalry": {
    "source": "iana",
    "extensions": ["cil"]
  },
  "application/vnd.ms-asf": {
    "source": "iana"
  },
  "application/vnd.ms-cab-compressed": {
    "source": "iana",
    "extensions": ["cab"]
  },
  "application/vnd.ms-color.iccprofile": {
    "source": "apache"
  },
  "application/vnd.ms-excel": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xls","xlm","xla","xlc","xlt","xlw"]
  },
  "application/vnd.ms-excel.addin.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlam"]
  },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlsb"]
  },
  "application/vnd.ms-excel.sheet.macroenabled.12": {
    "source": "iana",
    "extensions": ["xlsm"]
  },
  "application/vnd.ms-excel.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["xltm"]
  },
  "application/vnd.ms-fontobject": {
    "source": "iana",
    "compressible": true,
    "extensions": ["eot"]
  },
  "application/vnd.ms-htmlhelp": {
    "source": "iana",
    "extensions": ["chm"]
  },
  "application/vnd.ms-ims": {
    "source": "iana",
    "extensions": ["ims"]
  },
  "application/vnd.ms-lrm": {
    "source": "iana",
    "extensions": ["lrm"]
  },
  "application/vnd.ms-office.activex+xml": {
    "source": "iana"
  },
  "application/vnd.ms-officetheme": {
    "source": "iana",
    "extensions": ["thmx"]
  },
  "application/vnd.ms-opentype": {
    "source": "apache",
    "compressible": true
  },
  "application/vnd.ms-package.obfuscated-opentype": {
    "source": "apache"
  },
  "application/vnd.ms-pki.seccat": {
    "source": "apache",
    "extensions": ["cat"]
  },
  "application/vnd.ms-pki.stl": {
    "source": "apache",
    "extensions": ["stl"]
  },
  "application/vnd.ms-playready.initiator+xml": {
    "source": "iana"
  },
  "application/vnd.ms-powerpoint": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ppt","pps","pot"]
  },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {
    "source": "iana",
    "extensions": ["ppam"]
  },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    "source": "iana",
    "extensions": ["pptm"]
  },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {
    "source": "iana",
    "extensions": ["sldm"]
  },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    "source": "iana",
    "extensions": ["ppsm"]
  },
  "application/vnd.ms-powerpoint.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["potm"]
  },
  "application/vnd.ms-printdevicecapabilities+xml": {
    "source": "iana"
  },
  "application/vnd.ms-printing.printticket+xml": {
    "source": "apache"
  },
  "application/vnd.ms-printschematicket+xml": {
    "source": "iana"
  },
  "application/vnd.ms-project": {
    "source": "iana",
    "extensions": ["mpp","mpt"]
  },
  "application/vnd.ms-tnef": {
    "source": "iana"
  },
  "application/vnd.ms-windows.devicepairing": {
    "source": "iana"
  },
  "application/vnd.ms-windows.nwprinting.oob": {
    "source": "iana"
  },
  "application/vnd.ms-windows.printerpairing": {
    "source": "iana"
  },
  "application/vnd.ms-windows.wsd.oob": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.lic-chlg-req": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.lic-resp": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.meter-chlg-req": {
    "source": "iana"
  },
  "application/vnd.ms-wmdrm.meter-resp": {
    "source": "iana"
  },
  "application/vnd.ms-word.document.macroenabled.12": {
    "source": "iana",
    "extensions": ["docm"]
  },
  "application/vnd.ms-word.template.macroenabled.12": {
    "source": "iana",
    "extensions": ["dotm"]
  },
  "application/vnd.ms-works": {
    "source": "iana",
    "extensions": ["wps","wks","wcm","wdb"]
  },
  "application/vnd.ms-wpl": {
    "source": "iana",
    "extensions": ["wpl"]
  },
  "application/vnd.ms-xpsdocument": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xps"]
  },
  "application/vnd.msa-disk-image": {
    "source": "iana"
  },
  "application/vnd.mseq": {
    "source": "iana",
    "extensions": ["mseq"]
  },
  "application/vnd.msign": {
    "source": "iana"
  },
  "application/vnd.multiad.creator": {
    "source": "iana"
  },
  "application/vnd.multiad.creator.cif": {
    "source": "iana"
  },
  "application/vnd.music-niff": {
    "source": "iana"
  },
  "application/vnd.musician": {
    "source": "iana",
    "extensions": ["mus"]
  },
  "application/vnd.muvee.style": {
    "source": "iana",
    "extensions": ["msty"]
  },
  "application/vnd.mynfc": {
    "source": "iana",
    "extensions": ["taglet"]
  },
  "application/vnd.ncd.control": {
    "source": "iana"
  },
  "application/vnd.ncd.reference": {
    "source": "iana"
  },
  "application/vnd.nervana": {
    "source": "iana"
  },
  "application/vnd.netfpx": {
    "source": "iana"
  },
  "application/vnd.neurolanguage.nlu": {
    "source": "iana",
    "extensions": ["nlu"]
  },
  "application/vnd.nintendo.nitro.rom": {
    "source": "iana"
  },
  "application/vnd.nintendo.snes.rom": {
    "source": "iana"
  },
  "application/vnd.nitf": {
    "source": "iana",
    "extensions": ["ntf","nitf"]
  },
  "application/vnd.noblenet-directory": {
    "source": "iana",
    "extensions": ["nnd"]
  },
  "application/vnd.noblenet-sealer": {
    "source": "iana",
    "extensions": ["nns"]
  },
  "application/vnd.noblenet-web": {
    "source": "iana",
    "extensions": ["nnw"]
  },
  "application/vnd.nokia.catalogs": {
    "source": "iana"
  },
  "application/vnd.nokia.conml+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.conml+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.iptv.config+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.isds-radio-presets": {
    "source": "iana"
  },
  "application/vnd.nokia.landmark+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.landmark+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.landmarkcollection+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.n-gage.ac+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.n-gage.data": {
    "source": "iana",
    "extensions": ["ngdat"]
  },
  "application/vnd.nokia.n-gage.symbian.install": {
    "source": "iana",
    "extensions": ["n-gage"]
  },
  "application/vnd.nokia.ncd": {
    "source": "iana"
  },
  "application/vnd.nokia.pcd+wbxml": {
    "source": "iana"
  },
  "application/vnd.nokia.pcd+xml": {
    "source": "iana"
  },
  "application/vnd.nokia.radio-preset": {
    "source": "iana",
    "extensions": ["rpst"]
  },
  "application/vnd.nokia.radio-presets": {
    "source": "iana",
    "extensions": ["rpss"]
  },
  "application/vnd.novadigm.edm": {
    "source": "iana",
    "extensions": ["edm"]
  },
  "application/vnd.novadigm.edx": {
    "source": "iana",
    "extensions": ["edx"]
  },
  "application/vnd.novadigm.ext": {
    "source": "iana",
    "extensions": ["ext"]
  },
  "application/vnd.ntt-local.content-share": {
    "source": "iana"
  },
  "application/vnd.ntt-local.file-transfer": {
    "source": "iana"
  },
  "application/vnd.ntt-local.ogw_remote-access": {
    "source": "iana"
  },
  "application/vnd.ntt-local.sip-ta_remote": {
    "source": "iana"
  },
  "application/vnd.ntt-local.sip-ta_tcp_stream": {
    "source": "iana"
  },
  "application/vnd.oasis.opendocument.chart": {
    "source": "iana",
    "extensions": ["odc"]
  },
  "application/vnd.oasis.opendocument.chart-template": {
    "source": "iana",
    "extensions": ["otc"]
  },
  "application/vnd.oasis.opendocument.database": {
    "source": "iana",
    "extensions": ["odb"]
  },
  "application/vnd.oasis.opendocument.formula": {
    "source": "iana",
    "extensions": ["odf"]
  },
  "application/vnd.oasis.opendocument.formula-template": {
    "source": "iana",
    "extensions": ["odft"]
  },
  "application/vnd.oasis.opendocument.graphics": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odg"]
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    "source": "iana",
    "extensions": ["otg"]
  },
  "application/vnd.oasis.opendocument.image": {
    "source": "iana",
    "extensions": ["odi"]
  },
  "application/vnd.oasis.opendocument.image-template": {
    "source": "iana",
    "extensions": ["oti"]
  },
  "application/vnd.oasis.opendocument.presentation": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odp"]
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    "source": "iana",
    "extensions": ["otp"]
  },
  "application/vnd.oasis.opendocument.spreadsheet": {
    "source": "iana",
    "compressible": false,
    "extensions": ["ods"]
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    "source": "iana",
    "extensions": ["ots"]
  },
  "application/vnd.oasis.opendocument.text": {
    "source": "iana",
    "compressible": false,
    "extensions": ["odt"]
  },
  "application/vnd.oasis.opendocument.text-master": {
    "source": "iana",
    "extensions": ["odm"]
  },
  "application/vnd.oasis.opendocument.text-template": {
    "source": "iana",
    "extensions": ["ott"]
  },
  "application/vnd.oasis.opendocument.text-web": {
    "source": "iana",
    "extensions": ["oth"]
  },
  "application/vnd.obn": {
    "source": "iana"
  },
  "application/vnd.oftn.l10n+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.oipf.contentaccessdownload+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.contentaccessstreaming+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.cspg-hexbinary": {
    "source": "iana"
  },
  "application/vnd.oipf.dae.svg+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.dae.xhtml+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.mippvcontrolmessage+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.pae.gem": {
    "source": "iana"
  },
  "application/vnd.oipf.spdiscovery+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.spdlist+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.ueprofile+xml": {
    "source": "iana"
  },
  "application/vnd.oipf.userprofile+xml": {
    "source": "iana"
  },
  "application/vnd.olpc-sugar": {
    "source": "iana",
    "extensions": ["xo"]
  },
  "application/vnd.oma-scws-config": {
    "source": "iana"
  },
  "application/vnd.oma-scws-http-request": {
    "source": "iana"
  },
  "application/vnd.oma-scws-http-response": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.drm-trigger+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.imd+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.ltkm": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.notification+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.provisioningtrigger": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sgboot": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sgdd+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sgdu": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.simple-symbol-container": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.smartcard-trigger+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.sprov+xml": {
    "source": "iana"
  },
  "application/vnd.oma.bcast.stkm": {
    "source": "iana"
  },
  "application/vnd.oma.cab-address-book+xml": {
    "source": "iana"
  },
  "application/vnd.oma.cab-feature-handler+xml": {
    "source": "iana"
  },
  "application/vnd.oma.cab-pcc+xml": {
    "source": "iana"
  },
  "application/vnd.oma.cab-subs-invite+xml": {
    "source": "iana"
  },
  "application/vnd.oma.cab-user-prefs+xml": {
    "source": "iana"
  },
  "application/vnd.oma.dcd": {
    "source": "iana"
  },
  "application/vnd.oma.dcdc": {
    "source": "iana"
  },
  "application/vnd.oma.dd2+xml": {
    "source": "iana",
    "extensions": ["dd2"]
  },
  "application/vnd.oma.drm.risd+xml": {
    "source": "iana"
  },
  "application/vnd.oma.group-usage-list+xml": {
    "source": "iana"
  },
  "application/vnd.oma.pal+xml": {
    "source": "iana"
  },
  "application/vnd.oma.poc.detailed-progress-report+xml": {
    "source": "iana"
  },
  "application/vnd.oma.poc.final-report+xml": {
    "source": "iana"
  },
  "application/vnd.oma.poc.groups+xml": {
    "source": "iana"
  },
  "application/vnd.oma.poc.invocation-descriptor+xml": {
    "source": "iana"
  },
  "application/vnd.oma.poc.optimized-progress-report+xml": {
    "source": "iana"
  },
  "application/vnd.oma.push": {
    "source": "iana"
  },
  "application/vnd.oma.scidm.messages+xml": {
    "source": "iana"
  },
  "application/vnd.oma.xcap-directory+xml": {
    "source": "iana"
  },
  "application/vnd.omads-email+xml": {
    "source": "iana"
  },
  "application/vnd.omads-file+xml": {
    "source": "iana"
  },
  "application/vnd.omads-folder+xml": {
    "source": "iana"
  },
  "application/vnd.omaloc-supl-init": {
    "source": "iana"
  },
  "application/vnd.onepager": {
    "source": "iana"
  },
  "application/vnd.openblox.game+xml": {
    "source": "iana"
  },
  "application/vnd.openblox.game-binary": {
    "source": "iana"
  },
  "application/vnd.openeye.oeb": {
    "source": "iana"
  },
  "application/vnd.openofficeorg.extension": {
    "source": "apache",
    "extensions": ["oxt"]
  },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawing+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml-template": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    "source": "iana",
    "compressible": false,
    "extensions": ["pptx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {
    "source": "iana",
    "extensions": ["sldx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    "source": "iana",
    "extensions": ["ppsx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    "source": "apache",
    "extensions": ["potx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml-template": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    "source": "iana",
    "compressible": false,
    "extensions": ["xlsx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    "source": "apache",
    "extensions": ["xltx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.theme+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.vmldrawing": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml-template": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    "source": "iana",
    "compressible": false,
    "extensions": ["docx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    "source": "apache",
    "extensions": ["dotx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-package.core-properties+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
    "source": "iana"
  },
  "application/vnd.openxmlformats-package.relationships+xml": {
    "source": "iana"
  },
  "application/vnd.oracle.resource+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.orange.indata": {
    "source": "iana"
  },
  "application/vnd.osa.netdeploy": {
    "source": "iana"
  },
  "application/vnd.osgeo.mapguide.package": {
    "source": "iana",
    "extensions": ["mgp"]
  },
  "application/vnd.osgi.bundle": {
    "source": "iana"
  },
  "application/vnd.osgi.dp": {
    "source": "iana",
    "extensions": ["dp"]
  },
  "application/vnd.osgi.subsystem": {
    "source": "iana",
    "extensions": ["esa"]
  },
  "application/vnd.otps.ct-kip+xml": {
    "source": "iana"
  },
  "application/vnd.oxli.countgraph": {
    "source": "iana"
  },
  "application/vnd.pagerduty+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.palm": {
    "source": "iana",
    "extensions": ["pdb","pqa","oprc"]
  },
  "application/vnd.panoply": {
    "source": "iana"
  },
  "application/vnd.paos+xml": {
    "source": "iana"
  },
  "application/vnd.paos.xml": {
    "source": "apache"
  },
  "application/vnd.pawaafile": {
    "source": "iana",
    "extensions": ["paw"]
  },
  "application/vnd.pcos": {
    "source": "iana"
  },
  "application/vnd.pg.format": {
    "source": "iana",
    "extensions": ["str"]
  },
  "application/vnd.pg.osasli": {
    "source": "iana",
    "extensions": ["ei6"]
  },
  "application/vnd.piaccess.application-licence": {
    "source": "iana"
  },
  "application/vnd.picsel": {
    "source": "iana",
    "extensions": ["efif"]
  },
  "application/vnd.pmi.widget": {
    "source": "iana",
    "extensions": ["wg"]
  },
  "application/vnd.poc.group-advertisement+xml": {
    "source": "iana"
  },
  "application/vnd.pocketlearn": {
    "source": "iana",
    "extensions": ["plf"]
  },
  "application/vnd.powerbuilder6": {
    "source": "iana",
    "extensions": ["pbd"]
  },
  "application/vnd.powerbuilder6-s": {
    "source": "iana"
  },
  "application/vnd.powerbuilder7": {
    "source": "iana"
  },
  "application/vnd.powerbuilder7-s": {
    "source": "iana"
  },
  "application/vnd.powerbuilder75": {
    "source": "iana"
  },
  "application/vnd.powerbuilder75-s": {
    "source": "iana"
  },
  "application/vnd.preminet": {
    "source": "iana"
  },
  "application/vnd.previewsystems.box": {
    "source": "iana",
    "extensions": ["box"]
  },
  "application/vnd.proteus.magazine": {
    "source": "iana",
    "extensions": ["mgz"]
  },
  "application/vnd.publishare-delta-tree": {
    "source": "iana",
    "extensions": ["qps"]
  },
  "application/vnd.pvi.ptid1": {
    "source": "iana",
    "extensions": ["ptid"]
  },
  "application/vnd.pwg-multiplexed": {
    "source": "iana"
  },
  "application/vnd.pwg-xhtml-print+xml": {
    "source": "iana"
  },
  "application/vnd.qualcomm.brew-app-res": {
    "source": "iana"
  },
  "application/vnd.quark.quarkxpress": {
    "source": "iana",
    "extensions": ["qxd","qxt","qwd","qwt","qxl","qxb"]
  },
  "application/vnd.quobject-quoxdocument": {
    "source": "iana"
  },
  "application/vnd.radisys.moml+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-audit+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-audit-conf+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-audit-conn+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-audit-dialog+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-audit-stream+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-conf+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-base+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-group+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-speech+xml": {
    "source": "iana"
  },
  "application/vnd.radisys.msml-dialog-transform+xml": {
    "source": "iana"
  },
  "application/vnd.rainstor.data": {
    "source": "iana"
  },
  "application/vnd.rapid": {
    "source": "iana"
  },
  "application/vnd.realvnc.bed": {
    "source": "iana",
    "extensions": ["bed"]
  },
  "application/vnd.recordare.musicxml": {
    "source": "iana",
    "extensions": ["mxl"]
  },
  "application/vnd.recordare.musicxml+xml": {
    "source": "iana",
    "extensions": ["musicxml"]
  },
  "application/vnd.renlearn.rlprint": {
    "source": "iana"
  },
  "application/vnd.rig.cryptonote": {
    "source": "iana",
    "extensions": ["cryptonote"]
  },
  "application/vnd.rim.cod": {
    "source": "apache",
    "extensions": ["cod"]
  },
  "application/vnd.rn-realmedia": {
    "source": "apache",
    "extensions": ["rm"]
  },
  "application/vnd.rn-realmedia-vbr": {
    "source": "apache",
    "extensions": ["rmvb"]
  },
  "application/vnd.route66.link66+xml": {
    "source": "iana",
    "extensions": ["link66"]
  },
  "application/vnd.rs-274x": {
    "source": "iana"
  },
  "application/vnd.ruckus.download": {
    "source": "iana"
  },
  "application/vnd.s3sms": {
    "source": "iana"
  },
  "application/vnd.sailingtracker.track": {
    "source": "iana",
    "extensions": ["st"]
  },
  "application/vnd.sbm.cid": {
    "source": "iana"
  },
  "application/vnd.sbm.mid2": {
    "source": "iana"
  },
  "application/vnd.scribus": {
    "source": "iana"
  },
  "application/vnd.sealed.3df": {
    "source": "iana"
  },
  "application/vnd.sealed.csf": {
    "source": "iana"
  },
  "application/vnd.sealed.doc": {
    "source": "iana"
  },
  "application/vnd.sealed.eml": {
    "source": "iana"
  },
  "application/vnd.sealed.mht": {
    "source": "iana"
  },
  "application/vnd.sealed.net": {
    "source": "iana"
  },
  "application/vnd.sealed.ppt": {
    "source": "iana"
  },
  "application/vnd.sealed.tiff": {
    "source": "iana"
  },
  "application/vnd.sealed.xls": {
    "source": "iana"
  },
  "application/vnd.sealedmedia.softseal.html": {
    "source": "iana"
  },
  "application/vnd.sealedmedia.softseal.pdf": {
    "source": "iana"
  },
  "application/vnd.seemail": {
    "source": "iana",
    "extensions": ["see"]
  },
  "application/vnd.sema": {
    "source": "iana",
    "extensions": ["sema"]
  },
  "application/vnd.semd": {
    "source": "iana",
    "extensions": ["semd"]
  },
  "application/vnd.semf": {
    "source": "iana",
    "extensions": ["semf"]
  },
  "application/vnd.shana.informed.formdata": {
    "source": "iana",
    "extensions": ["ifm"]
  },
  "application/vnd.shana.informed.formtemplate": {
    "source": "iana",
    "extensions": ["itp"]
  },
  "application/vnd.shana.informed.interchange": {
    "source": "iana",
    "extensions": ["iif"]
  },
  "application/vnd.shana.informed.package": {
    "source": "iana",
    "extensions": ["ipk"]
  },
  "application/vnd.simtech-mindmapper": {
    "source": "iana",
    "extensions": ["twd","twds"]
  },
  "application/vnd.siren+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.smaf": {
    "source": "iana",
    "extensions": ["mmf"]
  },
  "application/vnd.smart.notebook": {
    "source": "iana"
  },
  "application/vnd.smart.teacher": {
    "source": "iana",
    "extensions": ["teacher"]
  },
  "application/vnd.software602.filler.form+xml": {
    "source": "iana"
  },
  "application/vnd.software602.filler.form-xml-zip": {
    "source": "iana"
  },
  "application/vnd.solent.sdkm+xml": {
    "source": "iana",
    "extensions": ["sdkm","sdkd"]
  },
  "application/vnd.spotfire.dxp": {
    "source": "iana",
    "extensions": ["dxp"]
  },
  "application/vnd.spotfire.sfs": {
    "source": "iana",
    "extensions": ["sfs"]
  },
  "application/vnd.sss-cod": {
    "source": "iana"
  },
  "application/vnd.sss-dtf": {
    "source": "iana"
  },
  "application/vnd.sss-ntf": {
    "source": "iana"
  },
  "application/vnd.stardivision.calc": {
    "source": "apache",
    "extensions": ["sdc"]
  },
  "application/vnd.stardivision.draw": {
    "source": "apache",
    "extensions": ["sda"]
  },
  "application/vnd.stardivision.impress": {
    "source": "apache",
    "extensions": ["sdd"]
  },
  "application/vnd.stardivision.math": {
    "source": "apache",
    "extensions": ["smf"]
  },
  "application/vnd.stardivision.writer": {
    "source": "apache",
    "extensions": ["sdw","vor"]
  },
  "application/vnd.stardivision.writer-global": {
    "source": "apache",
    "extensions": ["sgl"]
  },
  "application/vnd.stepmania.package": {
    "source": "iana",
    "extensions": ["smzip"]
  },
  "application/vnd.stepmania.stepchart": {
    "source": "iana",
    "extensions": ["sm"]
  },
  "application/vnd.street-stream": {
    "source": "iana"
  },
  "application/vnd.sun.wadl+xml": {
    "source": "iana"
  },
  "application/vnd.sun.xml.calc": {
    "source": "apache",
    "extensions": ["sxc"]
  },
  "application/vnd.sun.xml.calc.template": {
    "source": "apache",
    "extensions": ["stc"]
  },
  "application/vnd.sun.xml.draw": {
    "source": "apache",
    "extensions": ["sxd"]
  },
  "application/vnd.sun.xml.draw.template": {
    "source": "apache",
    "extensions": ["std"]
  },
  "application/vnd.sun.xml.impress": {
    "source": "apache",
    "extensions": ["sxi"]
  },
  "application/vnd.sun.xml.impress.template": {
    "source": "apache",
    "extensions": ["sti"]
  },
  "application/vnd.sun.xml.math": {
    "source": "apache",
    "extensions": ["sxm"]
  },
  "application/vnd.sun.xml.writer": {
    "source": "apache",
    "extensions": ["sxw"]
  },
  "application/vnd.sun.xml.writer.global": {
    "source": "apache",
    "extensions": ["sxg"]
  },
  "application/vnd.sun.xml.writer.template": {
    "source": "apache",
    "extensions": ["stw"]
  },
  "application/vnd.sus-calendar": {
    "source": "iana",
    "extensions": ["sus","susp"]
  },
  "application/vnd.svd": {
    "source": "iana",
    "extensions": ["svd"]
  },
  "application/vnd.swiftview-ics": {
    "source": "iana"
  },
  "application/vnd.symbian.install": {
    "source": "apache",
    "extensions": ["sis","sisx"]
  },
  "application/vnd.syncml+xml": {
    "source": "iana",
    "extensions": ["xsm"]
  },
  "application/vnd.syncml.dm+wbxml": {
    "source": "iana",
    "extensions": ["bdm"]
  },
  "application/vnd.syncml.dm+xml": {
    "source": "iana",
    "extensions": ["xdm"]
  },
  "application/vnd.syncml.dm.notification": {
    "source": "iana"
  },
  "application/vnd.syncml.dmddf+wbxml": {
    "source": "iana"
  },
  "application/vnd.syncml.dmddf+xml": {
    "source": "iana"
  },
  "application/vnd.syncml.dmtnds+wbxml": {
    "source": "iana"
  },
  "application/vnd.syncml.dmtnds+xml": {
    "source": "iana"
  },
  "application/vnd.syncml.ds.notification": {
    "source": "iana"
  },
  "application/vnd.tao.intent-module-archive": {
    "source": "iana",
    "extensions": ["tao"]
  },
  "application/vnd.tcpdump.pcap": {
    "source": "iana",
    "extensions": ["pcap","cap","dmp"]
  },
  "application/vnd.tmd.mediaflex.api+xml": {
    "source": "iana"
  },
  "application/vnd.tml": {
    "source": "iana"
  },
  "application/vnd.tmobile-livetv": {
    "source": "iana",
    "extensions": ["tmo"]
  },
  "application/vnd.trid.tpt": {
    "source": "iana",
    "extensions": ["tpt"]
  },
  "application/vnd.triscape.mxs": {
    "source": "iana",
    "extensions": ["mxs"]
  },
  "application/vnd.trueapp": {
    "source": "iana",
    "extensions": ["tra"]
  },
  "application/vnd.truedoc": {
    "source": "iana"
  },
  "application/vnd.ubisoft.webplayer": {
    "source": "iana"
  },
  "application/vnd.ufdl": {
    "source": "iana",
    "extensions": ["ufd","ufdl"]
  },
  "application/vnd.uiq.theme": {
    "source": "iana",
    "extensions": ["utz"]
  },
  "application/vnd.umajin": {
    "source": "iana",
    "extensions": ["umj"]
  },
  "application/vnd.unity": {
    "source": "iana",
    "extensions": ["unityweb"]
  },
  "application/vnd.uoml+xml": {
    "source": "iana",
    "extensions": ["uoml"]
  },
  "application/vnd.uplanet.alert": {
    "source": "iana"
  },
  "application/vnd.uplanet.alert-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.bearer-choice": {
    "source": "iana"
  },
  "application/vnd.uplanet.bearer-choice-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.cacheop": {
    "source": "iana"
  },
  "application/vnd.uplanet.cacheop-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.channel": {
    "source": "iana"
  },
  "application/vnd.uplanet.channel-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.list": {
    "source": "iana"
  },
  "application/vnd.uplanet.list-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.listcmd": {
    "source": "iana"
  },
  "application/vnd.uplanet.listcmd-wbxml": {
    "source": "iana"
  },
  "application/vnd.uplanet.signal": {
    "source": "iana"
  },
  "application/vnd.uri-map": {
    "source": "iana"
  },
  "application/vnd.valve.source.material": {
    "source": "iana"
  },
  "application/vnd.vcx": {
    "source": "iana",
    "extensions": ["vcx"]
  },
  "application/vnd.vd-study": {
    "source": "iana"
  },
  "application/vnd.vectorworks": {
    "source": "iana"
  },
  "application/vnd.vel+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.verimatrix.vcas": {
    "source": "iana"
  },
  "application/vnd.vidsoft.vidconference": {
    "source": "iana"
  },
  "application/vnd.visio": {
    "source": "iana",
    "extensions": ["vsd","vst","vss","vsw"]
  },
  "application/vnd.visionary": {
    "source": "iana",
    "extensions": ["vis"]
  },
  "application/vnd.vividence.scriptfile": {
    "source": "iana"
  },
  "application/vnd.vsf": {
    "source": "iana",
    "extensions": ["vsf"]
  },
  "application/vnd.wap.sic": {
    "source": "iana"
  },
  "application/vnd.wap.slc": {
    "source": "iana"
  },
  "application/vnd.wap.wbxml": {
    "source": "iana",
    "extensions": ["wbxml"]
  },
  "application/vnd.wap.wmlc": {
    "source": "iana",
    "extensions": ["wmlc"]
  },
  "application/vnd.wap.wmlscriptc": {
    "source": "iana",
    "extensions": ["wmlsc"]
  },
  "application/vnd.webturbo": {
    "source": "iana",
    "extensions": ["wtb"]
  },
  "application/vnd.wfa.p2p": {
    "source": "iana"
  },
  "application/vnd.wfa.wsc": {
    "source": "iana"
  },
  "application/vnd.windows.devicepairing": {
    "source": "iana"
  },
  "application/vnd.wmc": {
    "source": "iana"
  },
  "application/vnd.wmf.bootstrap": {
    "source": "iana"
  },
  "application/vnd.wolfram.mathematica": {
    "source": "iana"
  },
  "application/vnd.wolfram.mathematica.package": {
    "source": "iana"
  },
  "application/vnd.wolfram.player": {
    "source": "iana",
    "extensions": ["nbp"]
  },
  "application/vnd.wordperfect": {
    "source": "iana",
    "extensions": ["wpd"]
  },
  "application/vnd.wqd": {
    "source": "iana",
    "extensions": ["wqd"]
  },
  "application/vnd.wrq-hp3000-labelled": {
    "source": "iana"
  },
  "application/vnd.wt.stf": {
    "source": "iana",
    "extensions": ["stf"]
  },
  "application/vnd.wv.csp+wbxml": {
    "source": "iana"
  },
  "application/vnd.wv.csp+xml": {
    "source": "iana"
  },
  "application/vnd.wv.ssp+xml": {
    "source": "iana"
  },
  "application/vnd.xacml+json": {
    "source": "iana",
    "compressible": true
  },
  "application/vnd.xara": {
    "source": "iana",
    "extensions": ["xar"]
  },
  "application/vnd.xfdl": {
    "source": "iana",
    "extensions": ["xfdl"]
  },
  "application/vnd.xfdl.webform": {
    "source": "iana"
  },
  "application/vnd.xmi+xml": {
    "source": "iana"
  },
  "application/vnd.xmpie.cpkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.dpkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.plan": {
    "source": "iana"
  },
  "application/vnd.xmpie.ppkg": {
    "source": "iana"
  },
  "application/vnd.xmpie.xlim": {
    "source": "iana"
  },
  "application/vnd.yamaha.hv-dic": {
    "source": "iana",
    "extensions": ["hvd"]
  },
  "application/vnd.yamaha.hv-script": {
    "source": "iana",
    "extensions": ["hvs"]
  },
  "application/vnd.yamaha.hv-voice": {
    "source": "iana",
    "extensions": ["hvp"]
  },
  "application/vnd.yamaha.openscoreformat": {
    "source": "iana",
    "extensions": ["osf"]
  },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    "source": "iana",
    "extensions": ["osfpvg"]
  },
  "application/vnd.yamaha.remote-setup": {
    "source": "iana"
  },
  "application/vnd.yamaha.smaf-audio": {
    "source": "iana",
    "extensions": ["saf"]
  },
  "application/vnd.yamaha.smaf-phrase": {
    "source": "iana",
    "extensions": ["spf"]
  },
  "application/vnd.yamaha.through-ngn": {
    "source": "iana"
  },
  "application/vnd.yamaha.tunnel-udpencap": {
    "source": "iana"
  },
  "application/vnd.yaoweme": {
    "source": "iana"
  },
  "application/vnd.yellowriver-custom-menu": {
    "source": "iana",
    "extensions": ["cmp"]
  },
  "application/vnd.zul": {
    "source": "iana",
    "extensions": ["zir","zirz"]
  },
  "application/vnd.zzazz.deck+xml": {
    "source": "iana",
    "extensions": ["zaz"]
  },
  "application/voicexml+xml": {
    "source": "iana",
    "extensions": ["vxml"]
  },
  "application/vq-rtcpxr": {
    "source": "iana"
  },
  "application/watcherinfo+xml": {
    "source": "iana"
  },
  "application/whoispp-query": {
    "source": "iana"
  },
  "application/whoispp-response": {
    "source": "iana"
  },
  "application/widget": {
    "source": "iana",
    "extensions": ["wgt"]
  },
  "application/winhlp": {
    "source": "apache",
    "extensions": ["hlp"]
  },
  "application/wita": {
    "source": "iana"
  },
  "application/wordperfect5.1": {
    "source": "iana"
  },
  "application/wsdl+xml": {
    "source": "iana",
    "extensions": ["wsdl"]
  },
  "application/wspolicy+xml": {
    "source": "iana",
    "extensions": ["wspolicy"]
  },
  "application/x-7z-compressed": {
    "source": "apache",
    "compressible": false,
    "extensions": ["7z"]
  },
  "application/x-abiword": {
    "source": "apache",
    "extensions": ["abw"]
  },
  "application/x-ace-compressed": {
    "source": "apache",
    "extensions": ["ace"]
  },
  "application/x-amf": {
    "source": "apache"
  },
  "application/x-apple-diskimage": {
    "source": "apache",
    "extensions": ["dmg"]
  },
  "application/x-authorware-bin": {
    "source": "apache",
    "extensions": ["aab","x32","u32","vox"]
  },
  "application/x-authorware-map": {
    "source": "apache",
    "extensions": ["aam"]
  },
  "application/x-authorware-seg": {
    "source": "apache",
    "extensions": ["aas"]
  },
  "application/x-bcpio": {
    "source": "apache",
    "extensions": ["bcpio"]
  },
  "application/x-bdoc": {
    "compressible": false,
    "extensions": ["bdoc"]
  },
  "application/x-bittorrent": {
    "source": "apache",
    "extensions": ["torrent"]
  },
  "application/x-blorb": {
    "source": "apache",
    "extensions": ["blb","blorb"]
  },
  "application/x-bzip": {
    "source": "apache",
    "compressible": false,
    "extensions": ["bz"]
  },
  "application/x-bzip2": {
    "source": "apache",
    "compressible": false,
    "extensions": ["bz2","boz"]
  },
  "application/x-cbr": {
    "source": "apache",
    "extensions": ["cbr","cba","cbt","cbz","cb7"]
  },
  "application/x-cdlink": {
    "source": "apache",
    "extensions": ["vcd"]
  },
  "application/x-cfs-compressed": {
    "source": "apache",
    "extensions": ["cfs"]
  },
  "application/x-chat": {
    "source": "apache",
    "extensions": ["chat"]
  },
  "application/x-chess-pgn": {
    "source": "apache",
    "extensions": ["pgn"]
  },
  "application/x-chrome-extension": {
    "extensions": ["crx"]
  },
  "application/x-cocoa": {
    "source": "nginx",
    "extensions": ["cco"]
  },
  "application/x-compress": {
    "source": "apache"
  },
  "application/x-conference": {
    "source": "apache",
    "extensions": ["nsc"]
  },
  "application/x-cpio": {
    "source": "apache",
    "extensions": ["cpio"]
  },
  "application/x-csh": {
    "source": "apache",
    "extensions": ["csh"]
  },
  "application/x-deb": {
    "compressible": false
  },
  "application/x-debian-package": {
    "source": "apache",
    "extensions": ["deb","udeb"]
  },
  "application/x-dgc-compressed": {
    "source": "apache",
    "extensions": ["dgc"]
  },
  "application/x-director": {
    "source": "apache",
    "extensions": ["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]
  },
  "application/x-doom": {
    "source": "apache",
    "extensions": ["wad"]
  },
  "application/x-dtbncx+xml": {
    "source": "apache",
    "extensions": ["ncx"]
  },
  "application/x-dtbook+xml": {
    "source": "apache",
    "extensions": ["dtb"]
  },
  "application/x-dtbresource+xml": {
    "source": "apache",
    "extensions": ["res"]
  },
  "application/x-dvi": {
    "source": "apache",
    "compressible": false,
    "extensions": ["dvi"]
  },
  "application/x-envoy": {
    "source": "apache",
    "extensions": ["evy"]
  },
  "application/x-eva": {
    "source": "apache",
    "extensions": ["eva"]
  },
  "application/x-font-bdf": {
    "source": "apache",
    "extensions": ["bdf"]
  },
  "application/x-font-dos": {
    "source": "apache"
  },
  "application/x-font-framemaker": {
    "source": "apache"
  },
  "application/x-font-ghostscript": {
    "source": "apache",
    "extensions": ["gsf"]
  },
  "application/x-font-libgrx": {
    "source": "apache"
  },
  "application/x-font-linux-psf": {
    "source": "apache",
    "extensions": ["psf"]
  },
  "application/x-font-otf": {
    "source": "apache",
    "compressible": true,
    "extensions": ["otf"]
  },
  "application/x-font-pcf": {
    "source": "apache",
    "extensions": ["pcf"]
  },
  "application/x-font-snf": {
    "source": "apache",
    "extensions": ["snf"]
  },
  "application/x-font-speedo": {
    "source": "apache"
  },
  "application/x-font-sunos-news": {
    "source": "apache"
  },
  "application/x-font-ttf": {
    "source": "apache",
    "compressible": true,
    "extensions": ["ttf","ttc"]
  },
  "application/x-font-type1": {
    "source": "apache",
    "extensions": ["pfa","pfb","pfm","afm"]
  },
  "application/x-font-vfont": {
    "source": "apache"
  },
  "application/x-freearc": {
    "source": "apache",
    "extensions": ["arc"]
  },
  "application/x-futuresplash": {
    "source": "apache",
    "extensions": ["spl"]
  },
  "application/x-gca-compressed": {
    "source": "apache",
    "extensions": ["gca"]
  },
  "application/x-glulx": {
    "source": "apache",
    "extensions": ["ulx"]
  },
  "application/x-gnumeric": {
    "source": "apache",
    "extensions": ["gnumeric"]
  },
  "application/x-gramps-xml": {
    "source": "apache",
    "extensions": ["gramps"]
  },
  "application/x-gtar": {
    "source": "apache",
    "extensions": ["gtar"]
  },
  "application/x-gzip": {
    "source": "apache"
  },
  "application/x-hdf": {
    "source": "apache",
    "extensions": ["hdf"]
  },
  "application/x-httpd-php": {
    "compressible": true,
    "extensions": ["php"]
  },
  "application/x-install-instructions": {
    "source": "apache",
    "extensions": ["install"]
  },
  "application/x-iso9660-image": {
    "source": "apache",
    "extensions": ["iso"]
  },
  "application/x-java-archive-diff": {
    "source": "nginx",
    "extensions": ["jardiff"]
  },
  "application/x-java-jnlp-file": {
    "source": "apache",
    "compressible": false,
    "extensions": ["jnlp"]
  },
  "application/x-javascript": {
    "compressible": true
  },
  "application/x-latex": {
    "source": "apache",
    "compressible": false,
    "extensions": ["latex"]
  },
  "application/x-lua-bytecode": {
    "extensions": ["luac"]
  },
  "application/x-lzh-compressed": {
    "source": "apache",
    "extensions": ["lzh","lha"]
  },
  "application/x-makeself": {
    "source": "nginx",
    "extensions": ["run"]
  },
  "application/x-mie": {
    "source": "apache",
    "extensions": ["mie"]
  },
  "application/x-mobipocket-ebook": {
    "source": "apache",
    "extensions": ["prc","mobi"]
  },
  "application/x-mpegurl": {
    "compressible": false
  },
  "application/x-ms-application": {
    "source": "apache",
    "extensions": ["application"]
  },
  "application/x-ms-shortcut": {
    "source": "apache",
    "extensions": ["lnk"]
  },
  "application/x-ms-wmd": {
    "source": "apache",
    "extensions": ["wmd"]
  },
  "application/x-ms-wmz": {
    "source": "apache",
    "extensions": ["wmz"]
  },
  "application/x-ms-xbap": {
    "source": "apache",
    "extensions": ["xbap"]
  },
  "application/x-msaccess": {
    "source": "apache",
    "extensions": ["mdb"]
  },
  "application/x-msbinder": {
    "source": "apache",
    "extensions": ["obd"]
  },
  "application/x-mscardfile": {
    "source": "apache",
    "extensions": ["crd"]
  },
  "application/x-msclip": {
    "source": "apache",
    "extensions": ["clp"]
  },
  "application/x-msdos-program": {
    "extensions": ["exe"]
  },
  "application/x-msdownload": {
    "source": "apache",
    "extensions": ["exe","dll","com","bat","msi"]
  },
  "application/x-msmediaview": {
    "source": "apache",
    "extensions": ["mvb","m13","m14"]
  },
  "application/x-msmetafile": {
    "source": "apache",
    "extensions": ["wmf","wmz","emf","emz"]
  },
  "application/x-msmoney": {
    "source": "apache",
    "extensions": ["mny"]
  },
  "application/x-mspublisher": {
    "source": "apache",
    "extensions": ["pub"]
  },
  "application/x-msschedule": {
    "source": "apache",
    "extensions": ["scd"]
  },
  "application/x-msterminal": {
    "source": "apache",
    "extensions": ["trm"]
  },
  "application/x-mswrite": {
    "source": "apache",
    "extensions": ["wri"]
  },
  "application/x-netcdf": {
    "source": "apache",
    "extensions": ["nc","cdf"]
  },
  "application/x-ns-proxy-autoconfig": {
    "compressible": true,
    "extensions": ["pac"]
  },
  "application/x-nzb": {
    "source": "apache",
    "extensions": ["nzb"]
  },
  "application/x-perl": {
    "source": "nginx",
    "extensions": ["pl","pm"]
  },
  "application/x-pilot": {
    "source": "nginx",
    "extensions": ["prc","pdb"]
  },
  "application/x-pkcs12": {
    "source": "apache",
    "compressible": false,
    "extensions": ["p12","pfx"]
  },
  "application/x-pkcs7-certificates": {
    "source": "apache",
    "extensions": ["p7b","spc"]
  },
  "application/x-pkcs7-certreqresp": {
    "source": "apache",
    "extensions": ["p7r"]
  },
  "application/x-rar-compressed": {
    "source": "apache",
    "compressible": false,
    "extensions": ["rar"]
  },
  "application/x-redhat-package-manager": {
    "source": "nginx",
    "extensions": ["rpm"]
  },
  "application/x-research-info-systems": {
    "source": "apache",
    "extensions": ["ris"]
  },
  "application/x-sea": {
    "source": "nginx",
    "extensions": ["sea"]
  },
  "application/x-sh": {
    "source": "apache",
    "compressible": true,
    "extensions": ["sh"]
  },
  "application/x-shar": {
    "source": "apache",
    "extensions": ["shar"]
  },
  "application/x-shockwave-flash": {
    "source": "apache",
    "compressible": false,
    "extensions": ["swf"]
  },
  "application/x-silverlight-app": {
    "source": "apache",
    "extensions": ["xap"]
  },
  "application/x-sql": {
    "source": "apache",
    "extensions": ["sql"]
  },
  "application/x-stuffit": {
    "source": "apache",
    "compressible": false,
    "extensions": ["sit"]
  },
  "application/x-stuffitx": {
    "source": "apache",
    "extensions": ["sitx"]
  },
  "application/x-subrip": {
    "source": "apache",
    "extensions": ["srt"]
  },
  "application/x-sv4cpio": {
    "source": "apache",
    "extensions": ["sv4cpio"]
  },
  "application/x-sv4crc": {
    "source": "apache",
    "extensions": ["sv4crc"]
  },
  "application/x-t3vm-image": {
    "source": "apache",
    "extensions": ["t3"]
  },
  "application/x-tads": {
    "source": "apache",
    "extensions": ["gam"]
  },
  "application/x-tar": {
    "source": "apache",
    "compressible": true,
    "extensions": ["tar"]
  },
  "application/x-tcl": {
    "source": "apache",
    "extensions": ["tcl","tk"]
  },
  "application/x-tex": {
    "source": "apache",
    "extensions": ["tex"]
  },
  "application/x-tex-tfm": {
    "source": "apache",
    "extensions": ["tfm"]
  },
  "application/x-texinfo": {
    "source": "apache",
    "extensions": ["texinfo","texi"]
  },
  "application/x-tgif": {
    "source": "apache",
    "extensions": ["obj"]
  },
  "application/x-ustar": {
    "source": "apache",
    "extensions": ["ustar"]
  },
  "application/x-wais-source": {
    "source": "apache",
    "extensions": ["src"]
  },
  "application/x-web-app-manifest+json": {
    "compressible": true,
    "extensions": ["webapp"]
  },
  "application/x-www-form-urlencoded": {
    "source": "iana",
    "compressible": true
  },
  "application/x-x509-ca-cert": {
    "source": "apache",
    "extensions": ["der","crt","pem"]
  },
  "application/x-xfig": {
    "source": "apache",
    "extensions": ["fig"]
  },
  "application/x-xliff+xml": {
    "source": "apache",
    "extensions": ["xlf"]
  },
  "application/x-xpinstall": {
    "source": "apache",
    "compressible": false,
    "extensions": ["xpi"]
  },
  "application/x-xz": {
    "source": "apache",
    "extensions": ["xz"]
  },
  "application/x-zmachine": {
    "source": "apache",
    "extensions": ["z1","z2","z3","z4","z5","z6","z7","z8"]
  },
  "application/x400-bp": {
    "source": "iana"
  },
  "application/xacml+xml": {
    "source": "iana"
  },
  "application/xaml+xml": {
    "source": "apache",
    "extensions": ["xaml"]
  },
  "application/xcap-att+xml": {
    "source": "iana"
  },
  "application/xcap-caps+xml": {
    "source": "iana"
  },
  "application/xcap-diff+xml": {
    "source": "iana",
    "extensions": ["xdf"]
  },
  "application/xcap-el+xml": {
    "source": "iana"
  },
  "application/xcap-error+xml": {
    "source": "iana"
  },
  "application/xcap-ns+xml": {
    "source": "iana"
  },
  "application/xcon-conference-info+xml": {
    "source": "iana"
  },
  "application/xcon-conference-info-diff+xml": {
    "source": "iana"
  },
  "application/xenc+xml": {
    "source": "iana",
    "extensions": ["xenc"]
  },
  "application/xhtml+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xhtml","xht"]
  },
  "application/xhtml-voice+xml": {
    "source": "apache"
  },
  "application/xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xml","xsl","xsd","rng"]
  },
  "application/xml-dtd": {
    "source": "iana",
    "compressible": true,
    "extensions": ["dtd"]
  },
  "application/xml-external-parsed-entity": {
    "source": "iana"
  },
  "application/xml-patch+xml": {
    "source": "iana"
  },
  "application/xmpp+xml": {
    "source": "iana"
  },
  "application/xop+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xop"]
  },
  "application/xproc+xml": {
    "source": "apache",
    "extensions": ["xpl"]
  },
  "application/xslt+xml": {
    "source": "iana",
    "extensions": ["xslt"]
  },
  "application/xspf+xml": {
    "source": "apache",
    "extensions": ["xspf"]
  },
  "application/xv+xml": {
    "source": "iana",
    "extensions": ["mxml","xhvml","xvml","xvm"]
  },
  "application/yang": {
    "source": "iana",
    "extensions": ["yang"]
  },
  "application/yin+xml": {
    "source": "iana",
    "extensions": ["yin"]
  },
  "application/zip": {
    "source": "iana",
    "compressible": false,
    "extensions": ["zip"]
  },
  "application/zlib": {
    "source": "iana"
  },
  "audio/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "audio/32kadpcm": {
    "source": "iana"
  },
  "audio/3gpp": {
    "source": "iana",
    "compressible": false,
    "extensions": ["3gpp"]
  },
  "audio/3gpp2": {
    "source": "iana"
  },
  "audio/ac3": {
    "source": "iana"
  },
  "audio/adpcm": {
    "source": "apache",
    "extensions": ["adp"]
  },
  "audio/amr": {
    "source": "iana"
  },
  "audio/amr-wb": {
    "source": "iana"
  },
  "audio/amr-wb+": {
    "source": "iana"
  },
  "audio/aptx": {
    "source": "iana"
  },
  "audio/asc": {
    "source": "iana"
  },
  "audio/atrac-advanced-lossless": {
    "source": "iana"
  },
  "audio/atrac-x": {
    "source": "iana"
  },
  "audio/atrac3": {
    "source": "iana"
  },
  "audio/basic": {
    "source": "iana",
    "compressible": false,
    "extensions": ["au","snd"]
  },
  "audio/bv16": {
    "source": "iana"
  },
  "audio/bv32": {
    "source": "iana"
  },
  "audio/clearmode": {
    "source": "iana"
  },
  "audio/cn": {
    "source": "iana"
  },
  "audio/dat12": {
    "source": "iana"
  },
  "audio/dls": {
    "source": "iana"
  },
  "audio/dsr-es201108": {
    "source": "iana"
  },
  "audio/dsr-es202050": {
    "source": "iana"
  },
  "audio/dsr-es202211": {
    "source": "iana"
  },
  "audio/dsr-es202212": {
    "source": "iana"
  },
  "audio/dv": {
    "source": "iana"
  },
  "audio/dvi4": {
    "source": "iana"
  },
  "audio/eac3": {
    "source": "iana"
  },
  "audio/encaprtp": {
    "source": "iana"
  },
  "audio/evrc": {
    "source": "iana"
  },
  "audio/evrc-qcp": {
    "source": "iana"
  },
  "audio/evrc0": {
    "source": "iana"
  },
  "audio/evrc1": {
    "source": "iana"
  },
  "audio/evrcb": {
    "source": "iana"
  },
  "audio/evrcb0": {
    "source": "iana"
  },
  "audio/evrcb1": {
    "source": "iana"
  },
  "audio/evrcnw": {
    "source": "iana"
  },
  "audio/evrcnw0": {
    "source": "iana"
  },
  "audio/evrcnw1": {
    "source": "iana"
  },
  "audio/evrcwb": {
    "source": "iana"
  },
  "audio/evrcwb0": {
    "source": "iana"
  },
  "audio/evrcwb1": {
    "source": "iana"
  },
  "audio/evs": {
    "source": "iana"
  },
  "audio/fwdred": {
    "source": "iana"
  },
  "audio/g711-0": {
    "source": "iana"
  },
  "audio/g719": {
    "source": "iana"
  },
  "audio/g722": {
    "source": "iana"
  },
  "audio/g7221": {
    "source": "iana"
  },
  "audio/g723": {
    "source": "iana"
  },
  "audio/g726-16": {
    "source": "iana"
  },
  "audio/g726-24": {
    "source": "iana"
  },
  "audio/g726-32": {
    "source": "iana"
  },
  "audio/g726-40": {
    "source": "iana"
  },
  "audio/g728": {
    "source": "iana"
  },
  "audio/g729": {
    "source": "iana"
  },
  "audio/g7291": {
    "source": "iana"
  },
  "audio/g729d": {
    "source": "iana"
  },
  "audio/g729e": {
    "source": "iana"
  },
  "audio/gsm": {
    "source": "iana"
  },
  "audio/gsm-efr": {
    "source": "iana"
  },
  "audio/gsm-hr-08": {
    "source": "iana"
  },
  "audio/ilbc": {
    "source": "iana"
  },
  "audio/ip-mr_v2.5": {
    "source": "iana"
  },
  "audio/isac": {
    "source": "apache"
  },
  "audio/l16": {
    "source": "iana"
  },
  "audio/l20": {
    "source": "iana"
  },
  "audio/l24": {
    "source": "iana",
    "compressible": false
  },
  "audio/l8": {
    "source": "iana"
  },
  "audio/lpc": {
    "source": "iana"
  },
  "audio/midi": {
    "source": "apache",
    "extensions": ["mid","midi","kar","rmi"]
  },
  "audio/mobile-xmf": {
    "source": "iana"
  },
  "audio/mp4": {
    "source": "iana",
    "compressible": false,
    "extensions": ["m4a","mp4a"]
  },
  "audio/mp4a-latm": {
    "source": "iana"
  },
  "audio/mpa": {
    "source": "iana"
  },
  "audio/mpa-robust": {
    "source": "iana"
  },
  "audio/mpeg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["mpga","mp2","mp2a","mp3","m2a","m3a"]
  },
  "audio/mpeg4-generic": {
    "source": "iana"
  },
  "audio/musepack": {
    "source": "apache"
  },
  "audio/ogg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["oga","ogg","spx"]
  },
  "audio/opus": {
    "source": "iana"
  },
  "audio/parityfec": {
    "source": "iana"
  },
  "audio/pcma": {
    "source": "iana"
  },
  "audio/pcma-wb": {
    "source": "iana"
  },
  "audio/pcmu": {
    "source": "iana"
  },
  "audio/pcmu-wb": {
    "source": "iana"
  },
  "audio/prs.sid": {
    "source": "iana"
  },
  "audio/qcelp": {
    "source": "iana"
  },
  "audio/raptorfec": {
    "source": "iana"
  },
  "audio/red": {
    "source": "iana"
  },
  "audio/rtp-enc-aescm128": {
    "source": "iana"
  },
  "audio/rtp-midi": {
    "source": "iana"
  },
  "audio/rtploopback": {
    "source": "iana"
  },
  "audio/rtx": {
    "source": "iana"
  },
  "audio/s3m": {
    "source": "apache",
    "extensions": ["s3m"]
  },
  "audio/silk": {
    "source": "apache",
    "extensions": ["sil"]
  },
  "audio/smv": {
    "source": "iana"
  },
  "audio/smv-qcp": {
    "source": "iana"
  },
  "audio/smv0": {
    "source": "iana"
  },
  "audio/sp-midi": {
    "source": "iana"
  },
  "audio/speex": {
    "source": "iana"
  },
  "audio/t140c": {
    "source": "iana"
  },
  "audio/t38": {
    "source": "iana"
  },
  "audio/telephone-event": {
    "source": "iana"
  },
  "audio/tone": {
    "source": "iana"
  },
  "audio/uemclip": {
    "source": "iana"
  },
  "audio/ulpfec": {
    "source": "iana"
  },
  "audio/vdvi": {
    "source": "iana"
  },
  "audio/vmr-wb": {
    "source": "iana"
  },
  "audio/vnd.3gpp.iufp": {
    "source": "iana"
  },
  "audio/vnd.4sb": {
    "source": "iana"
  },
  "audio/vnd.audiokoz": {
    "source": "iana"
  },
  "audio/vnd.celp": {
    "source": "iana"
  },
  "audio/vnd.cisco.nse": {
    "source": "iana"
  },
  "audio/vnd.cmles.radio-events": {
    "source": "iana"
  },
  "audio/vnd.cns.anp1": {
    "source": "iana"
  },
  "audio/vnd.cns.inf1": {
    "source": "iana"
  },
  "audio/vnd.dece.audio": {
    "source": "iana",
    "extensions": ["uva","uvva"]
  },
  "audio/vnd.digital-winds": {
    "source": "iana",
    "extensions": ["eol"]
  },
  "audio/vnd.dlna.adts": {
    "source": "iana"
  },
  "audio/vnd.dolby.heaac.1": {
    "source": "iana"
  },
  "audio/vnd.dolby.heaac.2": {
    "source": "iana"
  },
  "audio/vnd.dolby.mlp": {
    "source": "iana"
  },
  "audio/vnd.dolby.mps": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2x": {
    "source": "iana"
  },
  "audio/vnd.dolby.pl2z": {
    "source": "iana"
  },
  "audio/vnd.dolby.pulse.1": {
    "source": "iana"
  },
  "audio/vnd.dra": {
    "source": "iana",
    "extensions": ["dra"]
  },
  "audio/vnd.dts": {
    "source": "iana",
    "extensions": ["dts"]
  },
  "audio/vnd.dts.hd": {
    "source": "iana",
    "extensions": ["dtshd"]
  },
  "audio/vnd.dvb.file": {
    "source": "iana"
  },
  "audio/vnd.everad.plj": {
    "source": "iana"
  },
  "audio/vnd.hns.audio": {
    "source": "iana"
  },
  "audio/vnd.lucent.voice": {
    "source": "iana",
    "extensions": ["lvp"]
  },
  "audio/vnd.ms-playready.media.pya": {
    "source": "iana",
    "extensions": ["pya"]
  },
  "audio/vnd.nokia.mobile-xmf": {
    "source": "iana"
  },
  "audio/vnd.nortel.vbk": {
    "source": "iana"
  },
  "audio/vnd.nuera.ecelp4800": {
    "source": "iana",
    "extensions": ["ecelp4800"]
  },
  "audio/vnd.nuera.ecelp7470": {
    "source": "iana",
    "extensions": ["ecelp7470"]
  },
  "audio/vnd.nuera.ecelp9600": {
    "source": "iana",
    "extensions": ["ecelp9600"]
  },
  "audio/vnd.octel.sbc": {
    "source": "iana"
  },
  "audio/vnd.qcelp": {
    "source": "iana"
  },
  "audio/vnd.rhetorex.32kadpcm": {
    "source": "iana"
  },
  "audio/vnd.rip": {
    "source": "iana",
    "extensions": ["rip"]
  },
  "audio/vnd.rn-realaudio": {
    "compressible": false
  },
  "audio/vnd.sealedmedia.softseal.mpeg": {
    "source": "iana"
  },
  "audio/vnd.vmx.cvsd": {
    "source": "iana"
  },
  "audio/vnd.wave": {
    "compressible": false
  },
  "audio/vorbis": {
    "source": "iana",
    "compressible": false
  },
  "audio/vorbis-config": {
    "source": "iana"
  },
  "audio/wav": {
    "compressible": false,
    "extensions": ["wav"]
  },
  "audio/wave": {
    "compressible": false,
    "extensions": ["wav"]
  },
  "audio/webm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["weba"]
  },
  "audio/x-aac": {
    "source": "apache",
    "compressible": false,
    "extensions": ["aac"]
  },
  "audio/x-aiff": {
    "source": "apache",
    "extensions": ["aif","aiff","aifc"]
  },
  "audio/x-caf": {
    "source": "apache",
    "compressible": false,
    "extensions": ["caf"]
  },
  "audio/x-flac": {
    "source": "apache",
    "extensions": ["flac"]
  },
  "audio/x-m4a": {
    "source": "nginx",
    "extensions": ["m4a"]
  },
  "audio/x-matroska": {
    "source": "apache",
    "extensions": ["mka"]
  },
  "audio/x-mpegurl": {
    "source": "apache",
    "extensions": ["m3u"]
  },
  "audio/x-ms-wax": {
    "source": "apache",
    "extensions": ["wax"]
  },
  "audio/x-ms-wma": {
    "source": "apache",
    "extensions": ["wma"]
  },
  "audio/x-pn-realaudio": {
    "source": "apache",
    "extensions": ["ram","ra"]
  },
  "audio/x-pn-realaudio-plugin": {
    "source": "apache",
    "extensions": ["rmp"]
  },
  "audio/x-realaudio": {
    "source": "nginx",
    "extensions": ["ra"]
  },
  "audio/x-tta": {
    "source": "apache"
  },
  "audio/x-wav": {
    "source": "apache",
    "extensions": ["wav"]
  },
  "audio/xm": {
    "source": "apache",
    "extensions": ["xm"]
  },
  "chemical/x-cdx": {
    "source": "apache",
    "extensions": ["cdx"]
  },
  "chemical/x-cif": {
    "source": "apache",
    "extensions": ["cif"]
  },
  "chemical/x-cmdf": {
    "source": "apache",
    "extensions": ["cmdf"]
  },
  "chemical/x-cml": {
    "source": "apache",
    "extensions": ["cml"]
  },
  "chemical/x-csml": {
    "source": "apache",
    "extensions": ["csml"]
  },
  "chemical/x-pdb": {
    "source": "apache"
  },
  "chemical/x-xyz": {
    "source": "apache",
    "extensions": ["xyz"]
  },
  "font/opentype": {
    "compressible": true,
    "extensions": ["otf"]
  },
  "image/bmp": {
    "source": "apache",
    "compressible": true,
    "extensions": ["bmp"]
  },
  "image/cgm": {
    "source": "iana",
    "extensions": ["cgm"]
  },
  "image/fits": {
    "source": "iana"
  },
  "image/g3fax": {
    "source": "iana",
    "extensions": ["g3"]
  },
  "image/gif": {
    "source": "iana",
    "compressible": false,
    "extensions": ["gif"]
  },
  "image/ief": {
    "source": "iana",
    "extensions": ["ief"]
  },
  "image/jp2": {
    "source": "iana"
  },
  "image/jpeg": {
    "source": "iana",
    "compressible": false,
    "extensions": ["jpeg","jpg","jpe"]
  },
  "image/jpm": {
    "source": "iana"
  },
  "image/jpx": {
    "source": "iana"
  },
  "image/ktx": {
    "source": "iana",
    "extensions": ["ktx"]
  },
  "image/naplps": {
    "source": "iana"
  },
  "image/pjpeg": {
    "compressible": false
  },
  "image/png": {
    "source": "iana",
    "compressible": false,
    "extensions": ["png"]
  },
  "image/prs.btif": {
    "source": "iana",
    "extensions": ["btif"]
  },
  "image/prs.pti": {
    "source": "iana"
  },
  "image/pwg-raster": {
    "source": "iana"
  },
  "image/sgi": {
    "source": "apache",
    "extensions": ["sgi"]
  },
  "image/svg+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["svg","svgz"]
  },
  "image/t38": {
    "source": "iana"
  },
  "image/tiff": {
    "source": "iana",
    "compressible": false,
    "extensions": ["tiff","tif"]
  },
  "image/tiff-fx": {
    "source": "iana"
  },
  "image/vnd.adobe.photoshop": {
    "source": "iana",
    "compressible": true,
    "extensions": ["psd"]
  },
  "image/vnd.airzip.accelerator.azv": {
    "source": "iana"
  },
  "image/vnd.cns.inf2": {
    "source": "iana"
  },
  "image/vnd.dece.graphic": {
    "source": "iana",
    "extensions": ["uvi","uvvi","uvg","uvvg"]
  },
  "image/vnd.djvu": {
    "source": "iana",
    "extensions": ["djvu","djv"]
  },
  "image/vnd.dvb.subtitle": {
    "source": "iana",
    "extensions": ["sub"]
  },
  "image/vnd.dwg": {
    "source": "iana",
    "extensions": ["dwg"]
  },
  "image/vnd.dxf": {
    "source": "iana",
    "extensions": ["dxf"]
  },
  "image/vnd.fastbidsheet": {
    "source": "iana",
    "extensions": ["fbs"]
  },
  "image/vnd.fpx": {
    "source": "iana",
    "extensions": ["fpx"]
  },
  "image/vnd.fst": {
    "source": "iana",
    "extensions": ["fst"]
  },
  "image/vnd.fujixerox.edmics-mmr": {
    "source": "iana",
    "extensions": ["mmr"]
  },
  "image/vnd.fujixerox.edmics-rlc": {
    "source": "iana",
    "extensions": ["rlc"]
  },
  "image/vnd.globalgraphics.pgb": {
    "source": "iana"
  },
  "image/vnd.microsoft.icon": {
    "source": "iana"
  },
  "image/vnd.mix": {
    "source": "iana"
  },
  "image/vnd.mozilla.apng": {
    "source": "iana"
  },
  "image/vnd.ms-modi": {
    "source": "iana",
    "extensions": ["mdi"]
  },
  "image/vnd.ms-photo": {
    "source": "apache",
    "extensions": ["wdp"]
  },
  "image/vnd.net-fpx": {
    "source": "iana",
    "extensions": ["npx"]
  },
  "image/vnd.radiance": {
    "source": "iana"
  },
  "image/vnd.sealed.png": {
    "source": "iana"
  },
  "image/vnd.sealedmedia.softseal.gif": {
    "source": "iana"
  },
  "image/vnd.sealedmedia.softseal.jpg": {
    "source": "iana"
  },
  "image/vnd.svf": {
    "source": "iana"
  },
  "image/vnd.tencent.tap": {
    "source": "iana"
  },
  "image/vnd.valve.source.texture": {
    "source": "iana"
  },
  "image/vnd.wap.wbmp": {
    "source": "iana",
    "extensions": ["wbmp"]
  },
  "image/vnd.xiff": {
    "source": "iana",
    "extensions": ["xif"]
  },
  "image/vnd.zbrush.pcx": {
    "source": "iana"
  },
  "image/webp": {
    "source": "apache",
    "extensions": ["webp"]
  },
  "image/x-3ds": {
    "source": "apache",
    "extensions": ["3ds"]
  },
  "image/x-cmu-raster": {
    "source": "apache",
    "extensions": ["ras"]
  },
  "image/x-cmx": {
    "source": "apache",
    "extensions": ["cmx"]
  },
  "image/x-freehand": {
    "source": "apache",
    "extensions": ["fh","fhc","fh4","fh5","fh7"]
  },
  "image/x-icon": {
    "source": "apache",
    "compressible": true,
    "extensions": ["ico"]
  },
  "image/x-jng": {
    "source": "nginx",
    "extensions": ["jng"]
  },
  "image/x-mrsid-image": {
    "source": "apache",
    "extensions": ["sid"]
  },
  "image/x-ms-bmp": {
    "source": "nginx",
    "compressible": true,
    "extensions": ["bmp"]
  },
  "image/x-pcx": {
    "source": "apache",
    "extensions": ["pcx"]
  },
  "image/x-pict": {
    "source": "apache",
    "extensions": ["pic","pct"]
  },
  "image/x-portable-anymap": {
    "source": "apache",
    "extensions": ["pnm"]
  },
  "image/x-portable-bitmap": {
    "source": "apache",
    "extensions": ["pbm"]
  },
  "image/x-portable-graymap": {
    "source": "apache",
    "extensions": ["pgm"]
  },
  "image/x-portable-pixmap": {
    "source": "apache",
    "extensions": ["ppm"]
  },
  "image/x-rgb": {
    "source": "apache",
    "extensions": ["rgb"]
  },
  "image/x-tga": {
    "source": "apache",
    "extensions": ["tga"]
  },
  "image/x-xbitmap": {
    "source": "apache",
    "extensions": ["xbm"]
  },
  "image/x-xcf": {
    "compressible": false
  },
  "image/x-xpixmap": {
    "source": "apache",
    "extensions": ["xpm"]
  },
  "image/x-xwindowdump": {
    "source": "apache",
    "extensions": ["xwd"]
  },
  "message/cpim": {
    "source": "iana"
  },
  "message/delivery-status": {
    "source": "iana"
  },
  "message/disposition-notification": {
    "source": "iana"
  },
  "message/external-body": {
    "source": "iana"
  },
  "message/feedback-report": {
    "source": "iana"
  },
  "message/global": {
    "source": "iana"
  },
  "message/global-delivery-status": {
    "source": "iana"
  },
  "message/global-disposition-notification": {
    "source": "iana"
  },
  "message/global-headers": {
    "source": "iana"
  },
  "message/http": {
    "source": "iana",
    "compressible": false
  },
  "message/imdn+xml": {
    "source": "iana",
    "compressible": true
  },
  "message/news": {
    "source": "iana"
  },
  "message/partial": {
    "source": "iana",
    "compressible": false
  },
  "message/rfc822": {
    "source": "iana",
    "compressible": true,
    "extensions": ["eml","mime"]
  },
  "message/s-http": {
    "source": "iana"
  },
  "message/sip": {
    "source": "iana"
  },
  "message/sipfrag": {
    "source": "iana"
  },
  "message/tracking-status": {
    "source": "iana"
  },
  "message/vnd.si.simp": {
    "source": "iana"
  },
  "message/vnd.wfa.wsc": {
    "source": "iana"
  },
  "model/iges": {
    "source": "iana",
    "compressible": false,
    "extensions": ["igs","iges"]
  },
  "model/mesh": {
    "source": "iana",
    "compressible": false,
    "extensions": ["msh","mesh","silo"]
  },
  "model/vnd.collada+xml": {
    "source": "iana",
    "extensions": ["dae"]
  },
  "model/vnd.dwf": {
    "source": "iana",
    "extensions": ["dwf"]
  },
  "model/vnd.flatland.3dml": {
    "source": "iana"
  },
  "model/vnd.gdl": {
    "source": "iana",
    "extensions": ["gdl"]
  },
  "model/vnd.gs-gdl": {
    "source": "apache"
  },
  "model/vnd.gs.gdl": {
    "source": "iana"
  },
  "model/vnd.gtw": {
    "source": "iana",
    "extensions": ["gtw"]
  },
  "model/vnd.moml+xml": {
    "source": "iana"
  },
  "model/vnd.mts": {
    "source": "iana",
    "extensions": ["mts"]
  },
  "model/vnd.opengex": {
    "source": "iana"
  },
  "model/vnd.parasolid.transmit.binary": {
    "source": "iana"
  },
  "model/vnd.parasolid.transmit.text": {
    "source": "iana"
  },
  "model/vnd.rosette.annotated-data-model": {
    "source": "iana"
  },
  "model/vnd.valve.source.compiled-map": {
    "source": "iana"
  },
  "model/vnd.vtu": {
    "source": "iana",
    "extensions": ["vtu"]
  },
  "model/vrml": {
    "source": "iana",
    "compressible": false,
    "extensions": ["wrl","vrml"]
  },
  "model/x3d+binary": {
    "source": "apache",
    "compressible": false,
    "extensions": ["x3db","x3dbz"]
  },
  "model/x3d+fastinfoset": {
    "source": "iana"
  },
  "model/x3d+vrml": {
    "source": "apache",
    "compressible": false,
    "extensions": ["x3dv","x3dvz"]
  },
  "model/x3d+xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["x3d","x3dz"]
  },
  "model/x3d-vrml": {
    "source": "iana"
  },
  "multipart/alternative": {
    "source": "iana",
    "compressible": false
  },
  "multipart/appledouble": {
    "source": "iana"
  },
  "multipart/byteranges": {
    "source": "iana"
  },
  "multipart/digest": {
    "source": "iana"
  },
  "multipart/encrypted": {
    "source": "iana",
    "compressible": false
  },
  "multipart/form-data": {
    "source": "iana",
    "compressible": false
  },
  "multipart/header-set": {
    "source": "iana"
  },
  "multipart/mixed": {
    "source": "iana",
    "compressible": false
  },
  "multipart/parallel": {
    "source": "iana"
  },
  "multipart/related": {
    "source": "iana",
    "compressible": false
  },
  "multipart/report": {
    "source": "iana"
  },
  "multipart/signed": {
    "source": "iana",
    "compressible": false
  },
  "multipart/voice-message": {
    "source": "iana"
  },
  "multipart/x-mixed-replace": {
    "source": "iana"
  },
  "text/1d-interleaved-parityfec": {
    "source": "iana"
  },
  "text/cache-manifest": {
    "source": "iana",
    "compressible": true,
    "extensions": ["appcache","manifest"]
  },
  "text/calendar": {
    "source": "iana",
    "extensions": ["ics","ifb"]
  },
  "text/calender": {
    "compressible": true
  },
  "text/cmd": {
    "compressible": true
  },
  "text/coffeescript": {
    "extensions": ["coffee","litcoffee"]
  },
  "text/css": {
    "source": "iana",
    "compressible": true,
    "extensions": ["css"]
  },
  "text/csv": {
    "source": "iana",
    "compressible": true,
    "extensions": ["csv"]
  },
  "text/csv-schema": {
    "source": "iana"
  },
  "text/directory": {
    "source": "iana"
  },
  "text/dns": {
    "source": "iana"
  },
  "text/ecmascript": {
    "source": "iana"
  },
  "text/encaprtp": {
    "source": "iana"
  },
  "text/enriched": {
    "source": "iana"
  },
  "text/fwdred": {
    "source": "iana"
  },
  "text/grammar-ref-list": {
    "source": "iana"
  },
  "text/hjson": {
    "extensions": ["hjson"]
  },
  "text/html": {
    "source": "iana",
    "compressible": true,
    "extensions": ["html","htm","shtml"]
  },
  "text/jade": {
    "extensions": ["jade"]
  },
  "text/javascript": {
    "source": "iana",
    "compressible": true
  },
  "text/jcr-cnd": {
    "source": "iana"
  },
  "text/jsx": {
    "compressible": true,
    "extensions": ["jsx"]
  },
  "text/less": {
    "extensions": ["less"]
  },
  "text/markdown": {
    "source": "iana"
  },
  "text/mathml": {
    "source": "nginx",
    "extensions": ["mml"]
  },
  "text/mizar": {
    "source": "iana"
  },
  "text/n3": {
    "source": "iana",
    "compressible": true,
    "extensions": ["n3"]
  },
  "text/parameters": {
    "source": "iana"
  },
  "text/parityfec": {
    "source": "iana"
  },
  "text/plain": {
    "source": "iana",
    "compressible": true,
    "extensions": ["txt","text","conf","def","list","log","in","ini"]
  },
  "text/provenance-notation": {
    "source": "iana"
  },
  "text/prs.fallenstein.rst": {
    "source": "iana"
  },
  "text/prs.lines.tag": {
    "source": "iana",
    "extensions": ["dsc"]
  },
  "text/prs.prop.logic": {
    "source": "iana"
  },
  "text/raptorfec": {
    "source": "iana"
  },
  "text/red": {
    "source": "iana"
  },
  "text/rfc822-headers": {
    "source": "iana"
  },
  "text/richtext": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtx"]
  },
  "text/rtf": {
    "source": "iana",
    "compressible": true,
    "extensions": ["rtf"]
  },
  "text/rtp-enc-aescm128": {
    "source": "iana"
  },
  "text/rtploopback": {
    "source": "iana"
  },
  "text/rtx": {
    "source": "iana"
  },
  "text/sgml": {
    "source": "iana",
    "extensions": ["sgml","sgm"]
  },
  "text/slim": {
    "extensions": ["slim","slm"]
  },
  "text/stylus": {
    "extensions": ["stylus","styl"]
  },
  "text/t140": {
    "source": "iana"
  },
  "text/tab-separated-values": {
    "source": "iana",
    "compressible": true,
    "extensions": ["tsv"]
  },
  "text/troff": {
    "source": "iana",
    "extensions": ["t","tr","roff","man","me","ms"]
  },
  "text/turtle": {
    "source": "iana",
    "extensions": ["ttl"]
  },
  "text/ulpfec": {
    "source": "iana"
  },
  "text/uri-list": {
    "source": "iana",
    "compressible": true,
    "extensions": ["uri","uris","urls"]
  },
  "text/vcard": {
    "source": "iana",
    "compressible": true,
    "extensions": ["vcard"]
  },
  "text/vnd.a": {
    "source": "iana"
  },
  "text/vnd.abc": {
    "source": "iana"
  },
  "text/vnd.curl": {
    "source": "iana",
    "extensions": ["curl"]
  },
  "text/vnd.curl.dcurl": {
    "source": "apache",
    "extensions": ["dcurl"]
  },
  "text/vnd.curl.mcurl": {
    "source": "apache",
    "extensions": ["mcurl"]
  },
  "text/vnd.curl.scurl": {
    "source": "apache",
    "extensions": ["scurl"]
  },
  "text/vnd.debian.copyright": {
    "source": "iana"
  },
  "text/vnd.dmclientscript": {
    "source": "iana"
  },
  "text/vnd.dvb.subtitle": {
    "source": "iana",
    "extensions": ["sub"]
  },
  "text/vnd.esmertec.theme-descriptor": {
    "source": "iana"
  },
  "text/vnd.fly": {
    "source": "iana",
    "extensions": ["fly"]
  },
  "text/vnd.fmi.flexstor": {
    "source": "iana",
    "extensions": ["flx"]
  },
  "text/vnd.graphviz": {
    "source": "iana",
    "extensions": ["gv"]
  },
  "text/vnd.in3d.3dml": {
    "source": "iana",
    "extensions": ["3dml"]
  },
  "text/vnd.in3d.spot": {
    "source": "iana",
    "extensions": ["spot"]
  },
  "text/vnd.iptc.newsml": {
    "source": "iana"
  },
  "text/vnd.iptc.nitf": {
    "source": "iana"
  },
  "text/vnd.latex-z": {
    "source": "iana"
  },
  "text/vnd.motorola.reflex": {
    "source": "iana"
  },
  "text/vnd.ms-mediapackage": {
    "source": "iana"
  },
  "text/vnd.net2phone.commcenter.command": {
    "source": "iana"
  },
  "text/vnd.radisys.msml-basic-layout": {
    "source": "iana"
  },
  "text/vnd.si.uricatalogue": {
    "source": "iana"
  },
  "text/vnd.sun.j2me.app-descriptor": {
    "source": "iana",
    "extensions": ["jad"]
  },
  "text/vnd.trolltech.linguist": {
    "source": "iana"
  },
  "text/vnd.wap.si": {
    "source": "iana"
  },
  "text/vnd.wap.sl": {
    "source": "iana"
  },
  "text/vnd.wap.wml": {
    "source": "iana",
    "extensions": ["wml"]
  },
  "text/vnd.wap.wmlscript": {
    "source": "iana",
    "extensions": ["wmls"]
  },
  "text/vtt": {
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["vtt"]
  },
  "text/x-asm": {
    "source": "apache",
    "extensions": ["s","asm"]
  },
  "text/x-c": {
    "source": "apache",
    "extensions": ["c","cc","cxx","cpp","h","hh","dic"]
  },
  "text/x-component": {
    "source": "nginx",
    "extensions": ["htc"]
  },
  "text/x-fortran": {
    "source": "apache",
    "extensions": ["f","for","f77","f90"]
  },
  "text/x-gwt-rpc": {
    "compressible": true
  },
  "text/x-handlebars-template": {
    "extensions": ["hbs"]
  },
  "text/x-java-source": {
    "source": "apache",
    "extensions": ["java"]
  },
  "text/x-jquery-tmpl": {
    "compressible": true
  },
  "text/x-lua": {
    "extensions": ["lua"]
  },
  "text/x-markdown": {
    "compressible": true,
    "extensions": ["markdown","md","mkd"]
  },
  "text/x-nfo": {
    "source": "apache",
    "extensions": ["nfo"]
  },
  "text/x-opml": {
    "source": "apache",
    "extensions": ["opml"]
  },
  "text/x-pascal": {
    "source": "apache",
    "extensions": ["p","pas"]
  },
  "text/x-processing": {
    "compressible": true,
    "extensions": ["pde"]
  },
  "text/x-sass": {
    "extensions": ["sass"]
  },
  "text/x-scss": {
    "extensions": ["scss"]
  },
  "text/x-setext": {
    "source": "apache",
    "extensions": ["etx"]
  },
  "text/x-sfv": {
    "source": "apache",
    "extensions": ["sfv"]
  },
  "text/x-suse-ymp": {
    "compressible": true,
    "extensions": ["ymp"]
  },
  "text/x-uuencode": {
    "source": "apache",
    "extensions": ["uu"]
  },
  "text/x-vcalendar": {
    "source": "apache",
    "extensions": ["vcs"]
  },
  "text/x-vcard": {
    "source": "apache",
    "extensions": ["vcf"]
  },
  "text/xml": {
    "source": "iana",
    "compressible": true,
    "extensions": ["xml"]
  },
  "text/xml-external-parsed-entity": {
    "source": "iana"
  },
  "text/yaml": {
    "extensions": ["yaml","yml"]
  },
  "video/1d-interleaved-parityfec": {
    "source": "apache"
  },
  "video/3gpp": {
    "source": "apache",
    "extensions": ["3gp","3gpp"]
  },
  "video/3gpp-tt": {
    "source": "apache"
  },
  "video/3gpp2": {
    "source": "apache",
    "extensions": ["3g2"]
  },
  "video/bmpeg": {
    "source": "apache"
  },
  "video/bt656": {
    "source": "apache"
  },
  "video/celb": {
    "source": "apache"
  },
  "video/dv": {
    "source": "apache"
  },
  "video/encaprtp": {
    "source": "apache"
  },
  "video/h261": {
    "source": "apache",
    "extensions": ["h261"]
  },
  "video/h263": {
    "source": "apache",
    "extensions": ["h263"]
  },
  "video/h263-1998": {
    "source": "apache"
  },
  "video/h263-2000": {
    "source": "apache"
  },
  "video/h264": {
    "source": "apache",
    "extensions": ["h264"]
  },
  "video/h264-rcdo": {
    "source": "apache"
  },
  "video/h264-svc": {
    "source": "apache"
  },
  "video/h265": {
    "source": "apache"
  },
  "video/iso.segment": {
    "source": "apache"
  },
  "video/jpeg": {
    "source": "apache",
    "extensions": ["jpgv"]
  },
  "video/jpeg2000": {
    "source": "apache"
  },
  "video/jpm": {
    "source": "apache",
    "extensions": ["jpm","jpgm"]
  },
  "video/mj2": {
    "source": "apache",
    "extensions": ["mj2","mjp2"]
  },
  "video/mp1s": {
    "source": "apache"
  },
  "video/mp2p": {
    "source": "apache"
  },
  "video/mp2t": {
    "source": "apache",
    "extensions": ["ts"]
  },
  "video/mp4": {
    "source": "apache",
    "compressible": false,
    "extensions": ["mp4","mp4v","mpg4"]
  },
  "video/mp4v-es": {
    "source": "apache"
  },
  "video/mpeg": {
    "source": "apache",
    "compressible": false,
    "extensions": ["mpeg","mpg","mpe","m1v","m2v"]
  },
  "video/mpeg4-generic": {
    "source": "apache"
  },
  "video/mpv": {
    "source": "apache"
  },
  "video/nv": {
    "source": "apache"
  },
  "video/ogg": {
    "source": "apache",
    "compressible": false,
    "extensions": ["ogv"]
  },
  "video/parityfec": {
    "source": "apache"
  },
  "video/pointer": {
    "source": "apache"
  },
  "video/quicktime": {
    "source": "apache",
    "compressible": false,
    "extensions": ["qt","mov"]
  },
  "video/raptorfec": {
    "source": "apache"
  },
  "video/raw": {
    "source": "apache"
  },
  "video/rtp-enc-aescm128": {
    "source": "apache"
  },
  "video/rtploopback": {
    "source": "apache"
  },
  "video/rtx": {
    "source": "apache"
  },
  "video/smpte292m": {
    "source": "apache"
  },
  "video/ulpfec": {
    "source": "apache"
  },
  "video/vc1": {
    "source": "apache"
  },
  "video/vnd.cctv": {
    "source": "apache"
  },
  "video/vnd.dece.hd": {
    "source": "apache",
    "extensions": ["uvh","uvvh"]
  },
  "video/vnd.dece.mobile": {
    "source": "apache",
    "extensions": ["uvm","uvvm"]
  },
  "video/vnd.dece.mp4": {
    "source": "apache"
  },
  "video/vnd.dece.pd": {
    "source": "apache",
    "extensions": ["uvp","uvvp"]
  },
  "video/vnd.dece.sd": {
    "source": "apache",
    "extensions": ["uvs","uvvs"]
  },
  "video/vnd.dece.video": {
    "source": "apache",
    "extensions": ["uvv","uvvv"]
  },
  "video/vnd.directv.mpeg": {
    "source": "apache"
  },
  "video/vnd.directv.mpeg-tts": {
    "source": "apache"
  },
  "video/vnd.dlna.mpeg-tts": {
    "source": "apache"
  },
  "video/vnd.dvb.file": {
    "source": "apache",
    "extensions": ["dvb"]
  },
  "video/vnd.fvt": {
    "source": "apache",
    "extensions": ["fvt"]
  },
  "video/vnd.hns.video": {
    "source": "apache"
  },
  "video/vnd.iptvforum.1dparityfec-1010": {
    "source": "apache"
  },
  "video/vnd.iptvforum.1dparityfec-2005": {
    "source": "apache"
  },
  "video/vnd.iptvforum.2dparityfec-1010": {
    "source": "apache"
  },
  "video/vnd.iptvforum.2dparityfec-2005": {
    "source": "apache"
  },
  "video/vnd.iptvforum.ttsavc": {
    "source": "apache"
  },
  "video/vnd.iptvforum.ttsmpeg2": {
    "source": "apache"
  },
  "video/vnd.motorola.video": {
    "source": "apache"
  },
  "video/vnd.motorola.videop": {
    "source": "apache"
  },
  "video/vnd.mpegurl": {
    "source": "apache",
    "extensions": ["mxu","m4u"]
  },
  "video/vnd.ms-playready.media.pyv": {
    "source": "apache",
    "extensions": ["pyv"]
  },
  "video/vnd.nokia.interleaved-multimedia": {
    "source": "apache"
  },
  "video/vnd.nokia.videovoip": {
    "source": "apache"
  },
  "video/vnd.objectvideo": {
    "source": "apache"
  },
  "video/vnd.radgamettools.bink": {
    "source": "apache"
  },
  "video/vnd.radgamettools.smacker": {
    "source": "apache"
  },
  "video/vnd.sealed.mpeg1": {
    "source": "apache"
  },
  "video/vnd.sealed.mpeg4": {
    "source": "apache"
  },
  "video/vnd.sealed.swf": {
    "source": "apache"
  },
  "video/vnd.sealedmedia.softseal.mov": {
    "source": "apache"
  },
  "video/vnd.uvvu.mp4": {
    "source": "apache",
    "extensions": ["uvu","uvvu"]
  },
  "video/vnd.vivo": {
    "source": "apache",
    "extensions": ["viv"]
  },
  "video/vp8": {
    "source": "apache"
  },
  "video/webm": {
    "source": "apache",
    "compressible": false,
    "extensions": ["webm"]
  },
  "video/x-f4v": {
    "source": "apache",
    "extensions": ["f4v"]
  },
  "video/x-fli": {
    "source": "apache",
    "extensions": ["fli"]
  },
  "video/x-flv": {
    "source": "apache",
    "compressible": false,
    "extensions": ["flv"]
  },
  "video/x-m4v": {
    "source": "apache",
    "extensions": ["m4v"]
  },
  "video/x-matroska": {
    "source": "apache",
    "compressible": false,
    "extensions": ["mkv","mk3d","mks"]
  },
  "video/x-mng": {
    "source": "apache",
    "extensions": ["mng"]
  },
  "video/x-ms-asf": {
    "source": "apache",
    "extensions": ["asf","asx"]
  },
  "video/x-ms-vob": {
    "source": "apache",
    "extensions": ["vob"]
  },
  "video/x-ms-wm": {
    "source": "apache",
    "extensions": ["wm"]
  },
  "video/x-ms-wmv": {
    "source": "apache",
    "compressible": false,
    "extensions": ["wmv"]
  },
  "video/x-ms-wmx": {
    "source": "apache",
    "extensions": ["wmx"]
  },
  "video/x-ms-wvx": {
    "source": "apache",
    "extensions": ["wvx"]
  },
  "video/x-msvideo": {
    "source": "apache",
    "extensions": ["avi"]
  },
  "video/x-sgi-movie": {
    "source": "apache",
    "extensions": ["movie"]
  },
  "video/x-smv": {
    "source": "apache",
    "extensions": ["smv"]
  },
  "x-conference/x-cooltalk": {
    "source": "apache",
    "extensions": ["ice"]
  },
  "x-shader/x-fragment": {
    "compressible": true
  },
  "x-shader/x-vertex": {
    "compressible": true
  }
}

},{}],4:[function(require,module,exports){
/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = require('./db.json')

},{"./db.json":3}],5:[function(require,module,exports){
/**
* Create an event emitter with namespaces
* @name createNamespaceEmitter
* @example
* var emitter = require('./index')()
*
* emitter.on('*', function () {
*   console.log('all events emitted', this.event)
* })
*
* emitter.on('example', function () {
*   console.log('example event emitted')
* })
*/
module.exports = function createNamespaceEmitter () {
  var emitter = { _fns: {} }

  /**
  * Emit an event. Optionally namespace the event. Separate the namespace and event with a `:`
  * @name emit
  * @param {String} event – the name of the event, with optional namespace
  * @param {...*} data – data variables that will be passed as arguments to the event listener
  * @example
  * emitter.emit('example')
  * emitter.emit('demo:test')
  * emitter.emit('data', { example: true}, 'a string', 1)
  */
  emitter.emit = function emit (event) {
    var args = [].slice.call(arguments, 1)
    var namespaced = namespaces(event)
    if (this._fns[event]) emitAll(event, this._fns[event], args)
    if (namespaced) emitAll(event, namespaced, args)
  }

  /**
  * Create en event listener.
  * @name on
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.on('example', function () {})
  * emitter.on('demo', function () {})
  */
  emitter.on = function on (event, fn) {
    if (typeof fn !== 'function') { throw new Error('callback required') }
    (this._fns[event] = this._fns[event] || []).push(fn)
  }

  /**
  * Create en event listener that fires once.
  * @name once
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.once('example', function () {})
  * emitter.once('demo', function () {})
  */
  emitter.once = function once (event, fn) {
    function one () {
      fn.apply(this, arguments)
      emitter.off(event, one)
    }
    this.on(event, one)
  }

  /**
  * Stop listening to an event. Stop all listeners on an event by only passing the event name. Stop a single listener by passing that event handler as a callback.
  * You must be explicit about what will be unsubscribed: `emitter.off('demo')` will unsubscribe an `emitter.on('demo')` listener, 
  * `emitter.off('demo:example')` will unsubscribe an `emitter.on('demo:example')` listener
  * @name off
  * @param {String} event
  * @param {Function} [fn] – the specific handler
  * @example
  * emitter.off('example')
  * emitter.off('demo', function () {})
  */
  emitter.off = function off (event, fn) {
    var keep = []

    if (event && fn) {
      for (var i = 0; i < this._fns.length; i++) {
        if (this._fns[i] !== fn) {
          keep.push(this._fns[i])
        }
      }
    }

    keep.length ? this._fns[event] = keep : delete this._fns[event]
  }

  function namespaces (e) {
    var out = []
    var args = e.split(':')
    var fns = emitter._fns
    Object.keys(fns).forEach(function (key) {
      if (key === '*') out = out.concat(fns[key])
      if (args.length === 2 && args[0] === key) out = out.concat(fns[key])
    })
    return out
  }

  function emitAll (e, fns, args) {
    for (var i = 0; i < fns.length; i++) {
      if (!fns[i]) break
      fns[i].event = e
      fns[i].apply(fns[i], args)
    }
  }

  return emitter
}

},{}],6:[function(require,module,exports){
(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob()
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift()
        return {done: value === undefined, value: value}
      }
    }

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      }
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  Headers.prototype.keys = function() {
    var items = []
    this.forEach(function(value, name) { items.push(name) })
    return iteratorFor(items)
  }

  Headers.prototype.values = function() {
    var items = []
    this.forEach(function(value) { items.push(value) })
    return iteratorFor(items)
  }

  Headers.prototype.entries = function() {
    var items = []
    this.forEach(function(value, name) { items.push([name, value]) })
    return iteratorFor(items)
  }

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  function Body() {
    this.bodyUsed = false

    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString()
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8')
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type)
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
        }
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
    this._initBody(bodyInit)
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers
  self.Request = Request
  self.Response = Response

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})(typeof self !== 'undefined' ? self : this);

},{}],7:[function(require,module,exports){
var bel = require('bel') // turns template tag into DOM elements
var morphdom = require('morphdom') // efficiently diffs + morphs two DOM elements
var defaultEvents = require('./update-events.js') // default events to be copied when dom elements update

module.exports = bel

// TODO move this + defaultEvents to a new module once we receive more feedback
module.exports.update = function (fromNode, toNode, opts) {
  if (!opts) opts = {}
  if (opts.events !== false) {
    if (!opts.onBeforeElUpdated) opts.onBeforeElUpdated = copier
  }

  return morphdom(fromNode, toNode, opts)

  // morphdom only copies attributes. we decided we also wanted to copy events
  // that can be set via attributes
  function copier (f, t) {
    // copy events:
    var events = opts.events || defaultEvents
    for (var i = 0; i < events.length; i++) {
      var ev = events[i]
      if (t[ev]) { // if new element has a whitelisted attribute
        f[ev] = t[ev] // update existing element
      } else if (f[ev]) { // if existing element has it and new one doesnt
        f[ev] = undefined // remove it from existing element
      }
    }
    // copy values for form elements
    if ((f.nodeName === 'INPUT' && f.type !== 'file') || f.nodeName === 'SELECT') {
      if (t.getAttribute('value') === null) t.value = f.value
    } else if (f.nodeName === 'TEXTAREA') {
      if (t.getAttribute('value') === null) f.value = t.value
    }
  }
}

},{"./update-events.js":15,"bel":8,"morphdom":14}],8:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  selected: 1,
  willvalidate: 1
}
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload || function () {}
    var unload = props.onunload || function () {}
    onload(el, function belOnload () {
      load(el)
    }, function belOnunload () {
      unload(el)
    },
    // We have to use non-standard `caller` to find who invokes `belCreateElement`
    belCreateElement.caller.caller.caller)
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement)
module.exports.createElement = belCreateElement

},{"global/document":9,"hyperx":11,"on-load":13}],9:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"min-document":33}],10:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12

module.exports = function (h, opts) {
  h = attrToProp(h)
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        p.push([ VAR, xstate, arg ])
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else cur[1][key] = concat(cur[1][key], parts[i][1])
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else cur[1][key] = concat(cur[1][key], parts[i][2])
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state)) {
          if (state === OPEN) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === TEXT) {
          reg += c
        } else if (state === OPEN && /\s/.test(c)) {
          res.push([OPEN, reg])
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[\w-]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":12}],12:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],13:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (Object.keys(watch).length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off, caller) {
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, caller || onload.caller]
  INDEX += 1
  return el
}

function turnon (index, el) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0](el)
    watch[index][2] = 1
  }
}

function turnoff (index, el) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1](el)
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  if (watch[mutation.oldValue]) {
    off(mutation.oldValue, mutation.target)
  }
  if (watch[newValue]) {
    on(newValue, mutation.target)
  }
}

function sameOrigin (oldValue, newValue) {
  if (!oldValue || !newValue) return false
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k, nodes[i])
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"global/document":9,"global/window":10}],14:[function(require,module,exports){
'use strict';
// Create a range object for efficently rendering strings to elements.
var range;

var doc = typeof document !== 'undefined' && document;

var testEl = doc ?
    doc.body || doc.createElement('div') :
    {};

var NS_XHTML = 'http://www.w3.org/1999/xhtml';

var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

// Fixes <https://github.com/patrick-steele-idem/morphdom/issues/32>
// (IE7+ support) <=IE7 does not support el.hasAttribute(name)
var hasAttributeNS;

if (testEl.hasAttributeNS) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttributeNS(namespaceURI, name);
    };
} else if (testEl.hasAttribute) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttribute(name);
    };
} else {
    hasAttributeNS = function(el, namespaceURI, name) {
        return !!el.getAttributeNode(name);
    };
}

function toElement(str) {
    if (!range && doc.createRange) {
        range = doc.createRange();
        range.selectNode(doc.body);
    }

    var fragment;
    if (range && range.createContextualFragment) {
        fragment = range.createContextualFragment(str);
    } else {
        fragment = doc.createElement('body');
        fragment.innerHTML = str;
    }
    return fragment.childNodes[0];
}

function syncBooleanAttrProp(fromEl, toEl, name) {
    if (fromEl[name] !== toEl[name]) {
        fromEl[name] = toEl[name];
        if (fromEl[name]) {
            fromEl.setAttribute(name, '');
        } else {
            fromEl.removeAttribute(name, '');
        }
    }
}

var specialElHandlers = {
    /**
     * Needed for IE. Apparently IE doesn't think that "selected" is an
     * attribute when reading over the attributes using selectEl.attributes
     */
    OPTION: function(fromEl, toEl) {
        syncBooleanAttrProp(fromEl, toEl, 'selected');
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
        syncBooleanAttrProp(fromEl, toEl, 'checked');
        syncBooleanAttrProp(fromEl, toEl, 'disabled');

        if (fromEl.value !== toEl.value) {
            fromEl.value = toEl.value;
        }

        if (!hasAttributeNS(toEl, null, 'value')) {
            fromEl.removeAttribute('value');
        }
    },

    TEXTAREA: function(fromEl, toEl) {
        var newValue = toEl.value;
        if (fromEl.value !== newValue) {
            fromEl.value = newValue;
        }

        if (fromEl.firstChild) {
            fromEl.firstChild.nodeValue = newValue;
        }
    }
};

function noop() {}

/**
 * Returns true if two node's names are the same.
 *
 * NOTE: We don't bother checking `namespaceURI` because you will never find two HTML elements with the same
 *       nodeName and different namespace URIs.
 *
 * @param {Element} a
 * @param {Element} b The target element
 * @return {boolean}
 */
function compareNodeNames(fromEl, toEl) {
    var fromNodeName = fromEl.nodeName;
    var toNodeName = toEl.nodeName;

    if (fromNodeName === toNodeName) {
        return true;
    }

    if (toEl.actualize &&
        fromNodeName.charCodeAt(0) < 91 && /* from tag name is upper case */
        toNodeName.charCodeAt(0) > 90 /* target tag name is lower case */) {
        // If the target element is a virtual DOM node then we may need to normalize the tag name
        // before comparing. Normal HTML elements that are in the "http://www.w3.org/1999/xhtml"
        // are converted to upper case
        return fromNodeName === toNodeName.toUpperCase();
    } else {
        return false;
    }
}

/**
 * Create an element, optionally with a known namespace URI.
 *
 * @param {string} name the element name, e.g. 'div' or 'svg'
 * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
 * its `xmlns` attribute or its inferred namespace.
 *
 * @return {Element}
 */
function createElementNS(name, namespaceURI) {
    return !namespaceURI || namespaceURI === NS_XHTML ?
        doc.createElement(name) :
        doc.createElementNS(namespaceURI, name);
}

/**
 * Loop over all of the attributes on the target node and make sure the original
 * DOM node has the same attributes. If an attribute found on the original node
 * is not on the new node then remove it from the original node.
 *
 * @param  {Element} fromNode
 * @param  {Element} toNode
 */
function morphAttrs(fromNode, toNode) {
    var attrs = toNode.attributes;
    var i;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;

    if (toNode.assignAttributes) {
        toNode.assignAttributes(fromNode);
    } else {
        for (i = attrs.length - 1; i >= 0; --i) {
            attr = attrs[i];
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;
            attrValue = attr.value;

            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;
                fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

                if (fromValue !== attrValue) {
                    fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
                }
            } else {
                fromValue = fromNode.getAttribute(attrName);

                if (fromValue !== attrValue) {
                    fromNode.setAttribute(attrName, attrValue);
                }
            }
        }
    }

    // Remove any extra attributes found on the original DOM element that
    // weren't found on the target element.
    attrs = fromNode.attributes;

    for (i = attrs.length - 1; i >= 0; --i) {
        attr = attrs[i];
        if (attr.specified !== false) {
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;

            if (attrNamespaceURI) {
                attrName = attr.localName || attrName;

                if (!hasAttributeNS(toNode, attrNamespaceURI, attrName)) {
                    fromNode.removeAttributeNS(attrNamespaceURI, attrName);
                }
            } else {
                if (!hasAttributeNS(toNode, null, attrName)) {
                    fromNode.removeAttribute(attrName);
                }
            }
        }
    }
}

/**
 * Copies the children of one DOM element to another DOM element
 */
function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
        var nextChild = curChild.nextSibling;
        toEl.appendChild(curChild);
        curChild = nextChild;
    }
    return toEl;
}

function defaultGetNodeKey(node) {
    return node.id;
}

function morphdom(fromNode, toNode, options) {
    if (!options) {
        options = {};
    }

    if (typeof toNode === 'string') {
        if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML') {
            var toNodeHtml = toNode;
            toNode = doc.createElement('html');
            toNode.innerHTML = toNodeHtml;
        } else {
            toNode = toElement(toNode);
        }
    }

    var getNodeKey = options.getNodeKey || defaultGetNodeKey;
    var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
    var onNodeAdded = options.onNodeAdded || noop;
    var onBeforeElUpdated = options.onBeforeElUpdated || noop;
    var onElUpdated = options.onElUpdated || noop;
    var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
    var onNodeDiscarded = options.onNodeDiscarded || noop;
    var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
    var childrenOnly = options.childrenOnly === true;

    // This object is used as a lookup to quickly find all keyed elements in the original DOM tree.
    var fromNodesLookup = {};
    var keyedRemovalList;

    function addKeyedRemoval(key) {
        if (keyedRemovalList) {
            keyedRemovalList.push(key);
        } else {
            keyedRemovalList = [key];
        }
    }

    function walkDiscardedChildNodes(node, skipKeyedNodes) {
        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {

                var key = undefined;

                if (skipKeyedNodes && (key = getNodeKey(curChild))) {
                    // If we are skipping keyed nodes then we add the key
                    // to a list so that it can be handled at the very end.
                    addKeyedRemoval(key);
                } else {
                    // Only report the node as discarded if it is not keyed. We do this because
                    // at the end we loop through all keyed elements that were unmatched
                    // and then discard them in one final pass.
                    onNodeDiscarded(curChild);
                    if (curChild.firstChild) {
                        walkDiscardedChildNodes(curChild, skipKeyedNodes);
                    }
                }

                curChild = curChild.nextSibling;
            }
        }
    }

    /**
     * Removes a DOM node out of the original DOM
     *
     * @param  {Node} node The node to remove
     * @param  {Node} parentNode The nodes parent
     * @param  {Boolean} skipKeyedNodes If true then elements with keys will be skipped and not discarded.
     * @return {undefined}
     */
    function removeNode(node, parentNode, skipKeyedNodes) {
        if (onBeforeNodeDiscarded(node) === false) {
            return;
        }

        if (parentNode) {
            parentNode.removeChild(node);
        }

        onNodeDiscarded(node);
        walkDiscardedChildNodes(node, skipKeyedNodes);
    }

    // // TreeWalker implementation is no faster, but keeping this around in case this changes in the future
    // function indexTree(root) {
    //     var treeWalker = document.createTreeWalker(
    //         root,
    //         NodeFilter.SHOW_ELEMENT);
    //
    //     var el;
    //     while((el = treeWalker.nextNode())) {
    //         var key = getNodeKey(el);
    //         if (key) {
    //             fromNodesLookup[key] = el;
    //         }
    //     }
    // }

    // // NodeIterator implementation is no faster, but keeping this around in case this changes in the future
    //
    // function indexTree(node) {
    //     var nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
    //     var el;
    //     while((el = nodeIterator.nextNode())) {
    //         var key = getNodeKey(el);
    //         if (key) {
    //             fromNodesLookup[key] = el;
    //         }
    //     }
    // }

    function indexTree(node) {
        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {
                var key = getNodeKey(curChild);
                if (key) {
                    fromNodesLookup[key] = curChild;
                }

                // Walk recursively
                indexTree(curChild);

                curChild = curChild.nextSibling;
            }
        }
    }

    indexTree(fromNode);

    function handleNodeAdded(el) {
        onNodeAdded(el);

        var curChild = el.firstChild;
        while (curChild) {
            var nextSibling = curChild.nextSibling;

            var key = getNodeKey(curChild);
            if (key) {
                var unmatchedFromEl = fromNodesLookup[key];
                if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
                    curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
                    morphEl(unmatchedFromEl, curChild);
                }
            }

            handleNodeAdded(curChild);
            curChild = nextSibling;
        }
    }

    function morphEl(fromEl, toEl, childrenOnly) {
        var toElKey = getNodeKey(toEl);
        var curFromNodeKey;

        if (toElKey) {
            // If an element with an ID is being morphed then it is will be in the final
            // DOM so clear it out of the saved elements collection
            delete fromNodesLookup[toElKey];
        }

        if (toNode.isSameNode && toNode.isSameNode(fromNode)) {
            return;
        }

        if (!childrenOnly) {
            if (onBeforeElUpdated(fromEl, toEl) === false) {
                return;
            }

            morphAttrs(fromEl, toEl);
            onElUpdated(fromEl);

            if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
                return;
            }
        }

        if (fromEl.nodeName !== 'TEXTAREA') {
            var curToNodeChild = toEl.firstChild;
            var curFromNodeChild = fromEl.firstChild;
            var curToNodeKey;

            var fromNextSibling;
            var toNextSibling;
            var matchingFromEl;

            outer: while (curToNodeChild) {
                toNextSibling = curToNodeChild.nextSibling;
                curToNodeKey = getNodeKey(curToNodeChild);

                while (curFromNodeChild) {
                    fromNextSibling = curFromNodeChild.nextSibling;

                    if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    curFromNodeKey = getNodeKey(curFromNodeChild);

                    var curFromNodeType = curFromNodeChild.nodeType;

                    var isCompatible = undefined;

                    if (curFromNodeType === curToNodeChild.nodeType) {
                        if (curFromNodeType === ELEMENT_NODE) {
                            // Both nodes being compared are Element nodes

                            if (curToNodeKey) {
                                // The target node has a key so we want to match it up with the correct element
                                // in the original DOM tree
                                if (curToNodeKey !== curFromNodeKey) {
                                    // The current element in the original DOM tree does not have a matching key so
                                    // let's check our lookup to see if there is a matching element in the original
                                    // DOM tree
                                    if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                                        if (curFromNodeChild.nextSibling === matchingFromEl) {
                                            // Special case for single element removals. To avoid removing the original
                                            // DOM node out of the tree (since that can break CSS transitions, etc.),
                                            // we will instead discard the current node and wait until the next
                                            // iteration to properly match up the keyed target element with its matching
                                            // element in the original tree
                                            isCompatible = false;
                                        } else {
                                            // We found a matching keyed element somewhere in the original DOM tree.
                                            // Let's moving the original DOM node into the current position and morph
                                            // it.

                                            // NOTE: We use insertBefore instead of replaceChild because we want to go through
                                            // the `removeNode()` function for the node that is being discarded so that
                                            // all lifecycle hooks are correctly invoked
                                            fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                                            if (curFromNodeKey) {
                                                // Since the node is keyed it might be matched up later so we defer
                                                // the actual removal to later
                                                addKeyedRemoval(curFromNodeKey);
                                            } else {
                                                // NOTE: we skip nested keyed nodes from being removed since there is
                                                //       still a chance they will be matched up later
                                                removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);

                                            }
                                            fromNextSibling = curFromNodeChild.nextSibling;
                                            curFromNodeChild = matchingFromEl;
                                        }
                                    } else {
                                        // The nodes are not compatible since the "to" node has a key and there
                                        // is no matching keyed node in the source tree
                                        isCompatible = false;
                                    }
                                }
                            } else if (curFromNodeKey) {
                                // The original has a key
                                isCompatible = false;
                            }

                            isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                            if (isCompatible) {
                                // We found compatible DOM elements so transform
                                // the current "from" node to match the current
                                // target DOM node.
                                morphEl(curFromNodeChild, curToNodeChild);
                            }

                        } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                            // Both nodes being compared are Text or Comment nodes
                            isCompatible = true;
                            // Simply update nodeValue on the original node to
                            // change the text value
                            curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                        }
                    }

                    if (isCompatible) {
                        // Advance both the "to" child and the "from" child since we found a match
                        curToNodeChild = toNextSibling;
                        curFromNodeChild = fromNextSibling;
                        continue outer;
                    }

                    // No compatible match so remove the old node from the DOM and continue trying to find a
                    // match in the original DOM. However, we only do this if the from node is not keyed
                    // since it is possible that a keyed node might match up with a node somewhere else in the
                    // target tree and we don't want to discard it just yet since it still might find a
                    // home in the final DOM tree. After everything is done we will remove any keyed nodes
                    // that didn't find a home
                    if (curFromNodeKey) {
                        // Since the node is keyed it might be matched up later so we defer
                        // the actual removal to later
                        addKeyedRemoval(curFromNodeKey);
                    } else {
                        // NOTE: we skip nested keyed nodes from being removed since there is
                        //       still a chance they will be matched up later
                        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                    }

                    curFromNodeChild = fromNextSibling;
                }

                // If we got this far then we did not find a candidate match for
                // our "to node" and we exhausted all of the children "from"
                // nodes. Therefore, we will just append the current "to" node
                // to the end
                if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
                    fromEl.appendChild(matchingFromEl);
                    morphEl(matchingFromEl, curToNodeChild);
                } else {
                    var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
                    if (onBeforeNodeAddedResult !== false) {
                        if (onBeforeNodeAddedResult) {
                            curToNodeChild = onBeforeNodeAddedResult;
                        }

                        if (curToNodeChild.actualize) {
                            curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
                        }
                        fromEl.appendChild(curToNodeChild);
                        handleNodeAdded(curToNodeChild);
                    }
                }

                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
            }

            // We have processed all of the "to nodes". If curFromNodeChild is
            // non-null then we still have some from nodes left over that need
            // to be removed
            while (curFromNodeChild) {
                fromNextSibling = curFromNodeChild.nextSibling;
                if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
                    // Since the node is keyed it might be matched up later so we defer
                    // the actual removal to later
                    addKeyedRemoval(curFromNodeKey);
                } else {
                    // NOTE: we skip nested keyed nodes from being removed since there is
                    //       still a chance they will be matched up later
                    removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                }
                curFromNodeChild = fromNextSibling;
            }
        }

        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
            specialElHandler(fromEl, toEl);
        }
    } // END: morphEl(...)

    var morphedNode = fromNode;
    var morphedNodeType = morphedNode.nodeType;
    var toNodeType = toNode.nodeType;

    if (!childrenOnly) {
        // Handle the case where we are given two DOM nodes that are not
        // compatible (e.g. <div> --> <span> or <div> --> TEXT)
        if (morphedNodeType === ELEMENT_NODE) {
            if (toNodeType === ELEMENT_NODE) {
                if (!compareNodeNames(fromNode, toNode)) {
                    onNodeDiscarded(fromNode);
                    morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
                }
            } else {
                // Going from an element node to a text node
                morphedNode = toNode;
            }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
            if (toNodeType === morphedNodeType) {
                morphedNode.nodeValue = toNode.nodeValue;
                return morphedNode;
            } else {
                // Text node to something else
                morphedNode = toNode;
            }
        }
    }

    if (morphedNode === toNode) {
        // The "to node" was not compatible with the "from node" so we had to
        // toss out the "from node" and use the "to node"
        onNodeDiscarded(fromNode);
    } else {
        morphEl(morphedNode, toNode, childrenOnly);

        // We now need to loop over any keyed nodes that might need to be
        // removed. We only do the removal if we know that the keyed node
        // never found a match. When a keyed node is matched up we remove
        // it out of fromNodesLookup and we use fromNodesLookup to determine
        // if a keyed node has been matched up or not
        if (keyedRemovalList) {
            for (var i=0, len=keyedRemovalList.length; i<len; i++) {
                var elToRemove = fromNodesLookup[keyedRemovalList[i]];
                if (elToRemove) {
                    removeNode(elToRemove, elToRemove.parentNode, false);
                }
            }
        }
    }

    if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        if (morphedNode.actualize) {
            morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
        }
        // If we had to swap out the from node with a new node because the old
        // node was not compatible with the target node then we need to
        // replace the old DOM node in the original DOM tree. This is only
        // possible if the original DOM node was part of a DOM tree which
        // we know is the case if it has a parent node.
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
    }

    return morphedNode;
}

module.exports = morphdom;

},{}],15:[function(require,module,exports){
module.exports = [
  // attribute events (can be set with attributes)
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'ondragstart',
  'ondrag',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondrop',
  'ondragend',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onunload',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onselect',
  'onchange',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'oninput',
  // other common events
  'oncontextmenu',
  'onfocusin',
  'onfocusout'
]

},{}],16:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Utils = require('../core/Utils');

var _Utils2 = _interopRequireDefault(_Utils);

var _Translator = require('../core/Translator');

var _Translator2 = _interopRequireDefault(_Translator);

var _namespaceEmitter = require('namespace-emitter');

var _namespaceEmitter2 = _interopRequireDefault(_namespaceEmitter);

var _UppySocket = require('./UppySocket');

var _UppySocket2 = _interopRequireDefault(_UppySocket);

var _en_US = require('../locales/en_US');

var _en_US2 = _interopRequireDefault(_en_US);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
// import deepFreeze from 'deep-freeze-strict'


// import throttle from 'throttle-debounce/throttle'

/**
 * Main Uppy core
 *
 * @param {object} opts general options, like locales, to show modal or not to show
 */
var Core = function () {
  function Core(opts) {
    _classCallCheck(this, Core);

    // set default options
    var defaultOptions = {
      // load English as the default locales
      locales: _en_US2.default,
      autoProceed: true,
      debug: false
    };

    // Merge default options with the ones set by user
    this.opts = _extends({}, defaultOptions, opts);

    // Dictates in what order different plugin types are ran:
    this.types = ['presetter', 'orchestrator', 'progressindicator', 'acquirer', 'modifier', 'uploader', 'presenter', 'debugger'];

    this.type = 'core';

    // Container for different types of plugins
    this.plugins = {};

    this.translator = new _Translator2.default({ locales: this.opts.locales });
    this.i18n = this.translator.translate.bind(this.translator);
    this.getState = this.getState.bind(this);
    this.updateMeta = this.updateMeta.bind(this);
    this.initSocket = this.initSocket.bind(this);
    this.log = this.log.bind(this);
    this.addFile = this.addFile.bind(this);

    this.bus = this.emitter = (0, _namespaceEmitter2.default)();
    this.on = this.bus.on.bind(this.bus);
    this.emit = this.bus.emit.bind(this.bus);

    this.state = {
      files: {},
      capabilities: {},
      totalProgress: 0
    };

    if (this.opts.debug) {
      // for debugging and testing
      global.UppyState = this.state;
      global.uppyLog = '';
      global.UppyAddFile = this.addFile.bind(this);
      global._Uppy = this;
    }
  }

  /**
   * Iterate on all plugins and run `update` on them. Called each time when state changes
   *
   */


  Core.prototype.updateAll = function updateAll(state) {
    var _this = this;

    Object.keys(this.plugins).forEach(function (pluginType) {
      _this.plugins[pluginType].forEach(function (plugin) {
        plugin.update(state);
      });
    });
  };

  /**
   * Updates state
   *
   * @param {newState} object
   */


  Core.prototype.setState = function setState(stateUpdate) {
    var newState = _extends({}, this.state, stateUpdate);
    this.emit('core:state-update', this.state, newState, stateUpdate);

    this.state = newState;
    this.updateAll(this.state);

    // this.log('Updating state with: ')
    // this.log(newState)
  };

  /**
   * Returns current state
   *
   */


  Core.prototype.getState = function getState() {
    // return deepFreeze(this.state)
    return this.state;
  };

  Core.prototype.updateMeta = function updateMeta(data, fileID) {
    var updatedFiles = _extends({}, this.getState().files);
    var newMeta = _extends({}, updatedFiles[fileID].meta, data);
    updatedFiles[fileID] = _extends({}, updatedFiles[fileID], {
      meta: newMeta
    });
    this.setState({ files: updatedFiles });
  };

  Core.prototype.addFile = function addFile(file) {
    var updatedFiles = _extends({}, this.state.files);

    var fileName = file.name || 'noname';
    var fileType = _Utils2.default.getFileType(file) ? _Utils2.default.getFileType(file).split('/') : ['', ''];
    var fileTypeGeneral = fileType[0];
    var fileTypeSpecific = fileType[1];
    var fileExtension = _Utils2.default.getFileNameAndExtension(fileName)[1];
    var isRemote = file.isRemote || false;

    var fileID = _Utils2.default.generateFileID(fileName);

    var newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: {
        name: fileName
      },
      type: {
        general: fileTypeGeneral,
        specific: fileTypeSpecific
      },
      data: file.data,
      progress: {
        percentage: 0,
        uploadComplete: false,
        uploadStarted: false
      },
      size: file.data.size || 0,
      isRemote: isRemote,
      remote: file.remote || ''
    };

    updatedFiles[fileID] = newFile;
    this.setState({ files: updatedFiles });

    this.bus.emit('file-added', fileID);
    this.log('Added file: ' + fileName + ', ' + fileID);

    if (fileTypeGeneral === 'image' && !isRemote) {
      this.addThumbnail(newFile.id);
    }

    if (this.opts.autoProceed) {
      this.bus.emit('core:upload');
    }
  };

  Core.prototype.removeFile = function removeFile(fileID) {
    var updatedFiles = _extends({}, this.getState().files);
    delete updatedFiles[fileID];
    this.setState({ files: updatedFiles });
  };

  Core.prototype.addThumbnail = function addThumbnail(fileID) {
    var _this2 = this;

    var file = this.getState().files[fileID];

    _Utils2.default.readFile(file.data).then(function (imgDataURI) {
      return _Utils2.default.createImageThumbnail(imgDataURI, 200);
    }).then(function (thumbnail) {
      var updatedFiles = _extends({}, _this2.getState().files);
      var updatedFile = _extends({}, updatedFiles[fileID], {
        preview: thumbnail
      });
      updatedFiles[fileID] = updatedFile;
      _this2.setState({ files: updatedFiles });
    });
  };

  Core.prototype.startUpload = function startUpload() {
    this.emit('core:upload');
  };

  Core.prototype.calculateProgress = function calculateProgress(data) {
    var fileID = data.id;
    var updatedFiles = _extends({}, this.getState().files);
    if (!updatedFiles[fileID]) {
      console.error('Trying to set progress for a file that’s not with us anymore: ', fileID);
      return;
    }

    var updatedFile = _extends({}, updatedFiles[fileID], _extends({}, {
      progress: _extends({}, updatedFiles[fileID].progress, {
        bytesUploaded: data.bytesUploaded,
        bytesTotal: data.bytesTotal,
        percentage: Math.round((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
      })
    }));
    updatedFiles[data.id] = updatedFile;

    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    var inProgress = Object.keys(updatedFiles).filter(function (file) {
      return updatedFiles[file].progress.uploadStarted;
    });
    var progressMax = inProgress.length * 100;
    var progressAll = 0;
    inProgress.forEach(function (file) {
      progressAll = progressAll + updatedFiles[file].progress.percentage;
    });

    var totalProgress = Math.round((progressAll * 100 / progressMax).toFixed(2));

    // if (totalProgress === 100) {
    //   const completeFiles = Object.keys(updatedFiles).filter((file) => {
    //     // this should be `uploadComplete`
    //     return updatedFiles[file].progress.percentage === 100
    //   })
    //   this.emit('core:success', completeFiles.length)
    // }

    this.setState({
      totalProgress: totalProgress,
      files: updatedFiles
    });
  };

  /**
   * Registers listeners for all global actions, like:
   * `file-add`, `file-remove`, `upload-progress`, `reset`
   *
   */


  Core.prototype.actions = function actions() {
    var _this3 = this;

    // this.bus.on('*', (payload) => {
    //   console.log('emitted: ', this.event)
    //   console.log('with payload: ', payload)
    // })

    // const bus = this.bus

    this.on('core:file-add', function (data) {
      _this3.addFile(data);
    });

    // `remove-file` removes a file from `state.files`, for example when
    // a user decides not to upload particular file and clicks a button to remove it
    this.on('core:file-remove', function (fileID) {
      _this3.removeFile(fileID);
    });

    this.on('core:upload-started', function (fileID, upload) {
      var updatedFiles = _extends({}, _this3.getState().files);
      var updatedFile = _extends({}, updatedFiles[fileID], _extends({}, {
        progress: _extends({}, updatedFiles[fileID].progress, {
          uploadStarted: Date.now()
        })
      }));
      updatedFiles[fileID] = updatedFile;

      _this3.setState({ files: updatedFiles });
    });

    // const throttledCalculateProgress = throttle(1000, (data) => this.calculateProgress(data))

    this.on('core:upload-progress', function (data) {
      _this3.calculateProgress(data);
      // throttledCalculateProgress(data)
    });

    this.on('core:upload-success', function (fileID, uploadURL) {
      var updatedFiles = _extends({}, _this3.getState().files);
      var updatedFile = _extends({}, updatedFiles[fileID], {
        progress: _extends({}, updatedFiles[fileID].progress, {
          uploadComplete: true
        }),
        uploadURL: uploadURL
      });
      updatedFiles[fileID] = updatedFile;

      // console.log(this.getState().totalProgress)

      if (_this3.getState().totalProgress === 100) {
        var completeFiles = Object.keys(updatedFiles).filter(function (file) {
          // this should be `uploadComplete`
          return updatedFiles[file].progress.uploadComplete;
        });
        _this3.emit('core:success', completeFiles.length);
      }

      _this3.setState({
        files: updatedFiles
      });
    });

    this.on('core:update-meta', function (data, fileID) {
      _this3.updateMeta(data, fileID);
    });

    // show informer if offline
    if (typeof window !== 'undefined') {
      window.addEventListener('online', function () {
        return _this3.isOnline(true);
      });
      window.addEventListener('offline', function () {
        return _this3.isOnline(false);
      });
      setTimeout(function () {
        return _this3.isOnline();
      }, 3000);
    }
  };

  Core.prototype.isOnline = function isOnline(status) {
    var online = status || window.navigator.onLine;
    if (!online) {
      this.emit('is-offline');
      this.emit('informer', 'No internet connection', 'error', 0);
      this.wasOffline = true;
    } else {
      this.emit('is-online');
      if (this.wasOffline) {
        this.emit('informer', 'Connected!', 'success', 3000);
        this.wasOffline = false;
      }
    }
  };

  /**
   * Registers a plugin with Core
   *
   * @param {Class} Plugin object
   * @param {Object} options object that will be passed to Plugin later
   * @return {Object} self for chaining
   */


  Core.prototype.use = function use(Plugin, opts) {
    // Prepare props to pass to plugins
    var props = {
      getState: this.getState.bind(this),
      setState: this.setState.bind(this),
      updateMeta: this.updateMeta.bind(this),
      addFile: this.addFile.bind(this),
      i18n: this.i18n.bind(this),
      bus: this.ee,
      log: this.log.bind(this)
    };
    // Instantiate
    var plugin = new Plugin(this, opts, props);
    var pluginName = plugin.id;
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];

    if (!pluginName) {
      throw new Error('Your plugin must have a name');
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type');
    }

    var existsPluginAlready = this.getPlugin(pluginName);
    if (existsPluginAlready) {
      var msg = 'Already found a plugin named \'' + existsPluginAlready.name + '\'.\n        Tried to use: \'' + pluginName + '\'.\n        Uppy is currently limited to running one of every plugin.\n        Share your use case with us over at\n        https://github.com/transloadit/uppy/issues/\n        if you want us to reconsider.';
      throw new Error(msg);
    }

    this.plugins[plugin.type].push(plugin);

    return this;
  };

  /**
   * Find one Plugin by name
   *
   * @param string name description
   */


  Core.prototype.getPlugin = function getPlugin(name) {
    var foundPlugin = false;
    this.iteratePlugins(function (plugin) {
      var pluginName = plugin.id;
      if (pluginName === name) {
        foundPlugin = plugin;
        return false;
      }
    });
    return foundPlugin;
  };

  /**
   * Iterate through all `use`d plugins
   *
   * @param function method description
   */


  Core.prototype.iteratePlugins = function iteratePlugins(method) {
    var _this4 = this;

    Object.keys(this.plugins).forEach(function (pluginType) {
      _this4.plugins[pluginType].forEach(method);
    });
  };

  /**
   * Logs stuff to console, only if `debug` is set to true. Silent in production.
   *
   * @return {String|Object} to log
   */


  Core.prototype.log = function log(msg, type) {
    if (!this.opts.debug) {
      return;
    }
    if (msg === '' + msg) {
      console.log('LOG: ' + msg);
    } else {
      console.dir(msg);
    }

    if (type === 'error') {
      console.error('LOG: ' + msg);
    }

    global.uppyLog = global.uppyLog + '\n' + 'DEBUG LOG: ' + msg;
  };

  Core.prototype.initSocket = function initSocket(opts) {
    if (!this.socket) {
      this.socket = new _UppySocket2.default(opts);
    }

    return this.socket;
  };

  Core.prototype.installAll = function installAll() {
    var _this5 = this;

    Object.keys(this.plugins).forEach(function (pluginType) {
      _this5.plugins[pluginType].forEach(function (plugin) {
        plugin.install();
      });
    });
  };

  /**
   * Initializes actions, installs all plugins (by iterating on them and calling `install`), sets options
   *
   * (In the past was used to run a waterfall of runType plugin packs, like so:
   * All preseters(data) --> All acquirers(data) --> All uploaders(data) --> done)
   */


  Core.prototype.run = function run() {
    this.log('Core is run, initializing actions, installing plugins...');

    // setInterval(() => {
    //   this.updateAll(this.state)
    // }, 1000)

    this.actions();

    // Forse set `autoProceed` option to false if there are multiple selector Plugins active
    // if (this.plugins.acquirer && this.plugins.acquirer.length > 1) {
    //   this.opts.autoProceed = false
    // }

    // Install all plugins
    this.installAll();

    return;
  };

  return Core;
}();

exports.default = Core;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../core/Translator":17,"../core/Utils":19,"../locales/en_US":21,"./UppySocket":18,"namespace-emitter":5}],17:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _en_US = require('../locales/en_US');

var _en_US2 = _interopRequireDefault(_en_US);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Translates strings with interpolation & pluralization support.Extensible with custom dictionaries
 * and pluralization functions.
 *
 * Borrows heavily from and inspired by Polyglot https://github.com/airbnb/polyglot.js,
 * basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
 * and can be easily added among with dictionaries, nested objects are used for pluralization
 * as opposed to `||||` delimeter
 *
 * Usage example: `translator.translate('files_chosen', {smart_count: 3})`
 *
 * @param {object} opts
 */
var Translator = function () {
  function Translator(opts) {
    _classCallCheck(this, Translator);

    var defaultOptions = {
      locales: _en_US2.default
    };
    this.opts = _extends({}, defaultOptions, opts);
    this.locales = this.opts.locales;
    this.locales.strings = _extends({}, _en_US2.default.strings, this.opts.locales.strings);
  }

  /**
   * Takes a string with placeholder variables like `%{smart_count} file selected`
   * and replaces it with values from options `{smart_count: 5}`
   *
   * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
   * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
   *
   * @param {string} phrase that needs interpolation, with placeholders
   * @param {object} options with values that will be used to replace placeholders
   * @return {string} interpolated
   */


  Translator.prototype.interpolate = function interpolate(phrase, options) {
    var replace = String.prototype.replace;
    var dollarRegex = /\$/g;
    var dollarBillsYall = '$$$$';

    for (var arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // Ensure replacement value is escaped to prevent special $-prefixed
        // regex replace tokens. the "$$$$" is needed because each "$" needs to
        // be escaped with "$" itself, and we need two in the resulting output.
        var replacement = options[arg];
        if (typeof replacement === 'string') {
          replacement = replace.call(options[arg], dollarRegex, dollarBillsYall);
        }
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        phrase = replace.call(phrase, new RegExp('%\\{' + arg + '\\}', 'g'), replacement);
      }
    }
    return phrase;
  };

  /**
   * Public translate method
   *
   * @param {string} key
   * @param {object} options with values that will be used later to replace placeholders in string
   * @return {string} translated (and interpolated)
   */


  Translator.prototype.translate = function translate(key, options) {
    if (options && options.smart_count) {
      var plural = this.locales.pluralize(options.smart_count);
      return this.interpolate(this.opts.locales.strings[key][plural], options);
    }

    return this.interpolate(this.opts.locales.strings[key], options);
  };

  return Translator;
}();

exports.default = Translator;

},{"../locales/en_US":21}],18:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _namespaceEmitter = require('namespace-emitter');

var _namespaceEmitter2 = _interopRequireDefault(_namespaceEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UppySocket = function () {
  function UppySocket(opts) {
    var _this = this;

    _classCallCheck(this, UppySocket);

    this.queued = [];
    this.isOpen = false;
    this.socket = new WebSocket(opts.target);
    this.emitter = (0, _namespaceEmitter2.default)();

    this.socket.onopen = function (e) {
      _this.isOpen = true;

      while (_this.queued.length > 0 && _this.isOpen) {
        var first = _this.queued[0];
        _this.send(first.action, first.payload);
        _this.queued = _this.queued.slice(1);
      }
    };

    this.socket.onclose = function (e) {
      _this.isOpen = false;
    };

    this._handleMessage = this._handleMessage.bind(this);

    this.socket.onmessage = this._handleMessage;

    this.close = this.close.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.once = this.once.bind(this);
    this.send = this.send.bind(this);
  }

  UppySocket.prototype.close = function close() {
    return this.socket.close();
  };

  UppySocket.prototype.send = function send(action, payload) {
    // attach uuid

    if (!this.isOpen) {
      this.queued.push({ action: action, payload: payload });
      return;
    }

    this.socket.send(JSON.stringify({
      action: action,
      payload: payload
    }));
  };

  UppySocket.prototype.on = function on(action, handler) {
    this.emitter.on(action, handler);
  };

  UppySocket.prototype.emit = function emit(action, payload) {
    this.emitter.emit(action, payload);
  };

  UppySocket.prototype.once = function once(action, handler) {
    this.emitter.once(action, handler);
  };

  UppySocket.prototype._handleMessage = function _handleMessage(e) {
    try {
      var message = JSON.parse(e.data);
      this.emit(message.action, message.payload);
    } catch (err) {
      console.log(err);
    }
  };

  return UppySocket;
}();

exports.default = UppySocket;

},{"namespace-emitter":5}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.flatten = flatten;
exports.isTouchDevice = isTouchDevice;
exports.$ = $;
exports.$$ = $$;
exports.truncateString = truncateString;
exports.secondsToTime = secondsToTime;
exports.groupBy = groupBy;
exports.every = every;
exports.toArray = toArray;
exports.generateFileID = generateFileID;
exports.extend = extend;
exports.getProportionalImageHeight = getProportionalImageHeight;
exports.getFileType = getFileType;
exports.getFileNameAndExtension = getFileNameAndExtension;
exports.readFile = readFile;
exports.createImageThumbnail = createImageThumbnail;
exports.dataURItoBlob = dataURItoBlob;
exports.dataURItoFile = dataURItoFile;
exports.copyToClipboard = copyToClipboard;
exports.makeWorker = makeWorker;
exports.getSpeed = getSpeed;
exports.getETA = getETA;
exports.prettyETA = prettyETA;
exports.makeCachingFunction = makeCachingFunction;

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

// import pica from 'pica'

/**
 * A collection of small utility functions that help with dom manipulation, adding listeners,
 * promises and other good things.
 *
 * @module Utils
 */

/**
 * Shallow flatten nested arrays.
 */
function flatten(arr) {
  return [].concat.apply([], arr);
}

function isTouchDevice() {
  return 'ontouchstart' in window || // works on most browsers
  navigator.maxTouchPoints; // works on IE10/11 and Surface
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector);
}

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String|Array } selector - DOM selector or nodes list
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  var els;
  if (typeof selector === 'string') {
    els = (ctx || document).querySelectorAll(selector);
  } else {
    els = selector;
    return Array.prototype.slice.call(els);
  }
}

function truncateString(str, length) {
  if (str.length > length) {
    return str.substr(0, length / 2) + '...' + str.substr(str.length - length / 4, str.length);
  }
  return str;

  // more precise version if needed
  // http://stackoverflow.com/a/831583
}

function secondsToTime(rawSeconds) {
  var hours = Math.floor(rawSeconds / 3600) % 24;
  var minutes = Math.floor(rawSeconds / 60) % 60;
  var seconds = Math.floor(rawSeconds % 60);

  return { hours: hours, minutes: minutes, seconds: seconds };
}

/**
 * Partition array by a grouping function.
 * @param  {[type]} array      Input array
 * @param  {[type]} groupingFn Grouping function
 * @return {[type]}            Array of arrays
 */
function groupBy(array, groupingFn) {
  return array.reduce(function (result, item) {
    var key = groupingFn(item);
    var xs = result.get(key) || [];
    xs.push(item);
    result.set(key, xs);
    return result;
  }, new Map());
}

/**
 * Tests if every array element passes predicate
 * @param  {Array}  array       Input array
 * @param  {Object} predicateFn Predicate
 * @return {bool}               Every element pass
 */
function every(array, predicateFn) {
  return array.reduce(function (result, item) {
    if (!result) {
      return false;
    }

    return predicateFn(item);
  }, true);
}

/**
 * Converts list into array
*/
function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

/**
 * Takes a fileName and turns it into fileID, by converting to lowercase,
 * removing extra characters and adding unix timestamp
 *
 * @param {String} fileName
 *
 */
function generateFileID(fileName) {
  var fileID = fileName.toLowerCase();
  fileID = fileID.replace(/[^A-Z0-9]/ig, '');
  fileID = fileID + Date.now();
  return fileID;
}

function extend() {
  for (var _len = arguments.length, objs = Array(_len), _key = 0; _key < _len; _key++) {
    objs[_key] = arguments[_key];
  }

  return Object.assign.apply(this, [{}].concat(objs));
}

/**
 * Takes function or class, returns its name.
 * Because IE doesn’t support `constructor.name`.
 * https://gist.github.com/dfkaye/6384439, http://stackoverflow.com/a/15714445
 *
 * @param {Object} fn — function
 *
 */
// function getFnName (fn) {
//   var f = typeof fn === 'function'
//   var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/))
//   return (!f && 'not a function') || (s && s[1] || 'anonymous')
// }

function getProportionalImageHeight(img, newWidth) {
  var aspect = img.width / img.height;
  var newHeight = Math.round(newWidth / aspect);
  return newHeight;
}

function getFileType(file) {
  if (file.type) {
    return file.type;
  }
  return _mimeTypes2.default.lookup(file.name);
}

// returns [fileName, fileExt]
function getFileNameAndExtension(fullFileName) {
  var re = /(?:\.([^.]+))?$/;
  var fileExt = re.exec(fullFileName)[1];
  var fileName = fullFileName.replace('.' + fileExt, '');
  return [fileName, fileExt];
}

/**
 * Reads file as data URI from file object,
 * the one you get from input[type=file] or drag & drop.
 *
 * @param {Object} file object
 * @return {Promise} dataURL of the file
 *
 */
function readFile(fileObj) {
  return new _Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.addEventListener('load', function (ev) {
      return resolve(ev.target.result);
    });
    reader.readAsDataURL(fileObj);

    // function workerScript () {
    //   self.addEventListener('message', (e) => {
    //     const file = e.data.file
    //     try {
    //       const reader = new FileReaderSync()
    //       postMessage({
    //         file: reader.readAsDataURL(file)
    //       })
    //     } catch (err) {
    //       console.log(err)
    //     }
    //   })
    // }
    //
    // const worker = makeWorker(workerScript)
    // worker.postMessage({file: fileObj})
    // worker.addEventListener('message', (e) => {
    //   const fileDataURL = e.data.file
    //   console.log('FILE _ DATA _ URL')
    //   return resolve(fileDataURL)
    // })
  });
}

/**
 * Resizes an image to specified width and proportional height, using canvas
 * See https://davidwalsh.name/resize-image-canvas,
 * http://babalan.com/resizing-images-with-javascript/
 * @TODO see if we need https://github.com/stomita/ios-imagefile-megapixel for iOS
 *
 * @param {String} Data URI of the original image
 * @param {String} width of the resulting image
 * @return {String} Data URI of the resized image
 */
function createImageThumbnail(imgDataURI, newWidth) {
  return new _Promise(function (resolve, reject) {
    var img = new Image();
    img.addEventListener('load', function () {
      var newImageWidth = newWidth;
      var newImageHeight = getProportionalImageHeight(img, newImageWidth);

      // create an off-screen canvas
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      // set its dimension to target size
      canvas.width = newImageWidth;
      canvas.height = newImageHeight;

      // draw source image into the off-screen canvas:
      // ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, newImageWidth, newImageHeight);

      // pica.resizeCanvas(img, canvas, (err) => {
      //   if (err) console.log(err)
      //   const thumbnail = canvas.toDataURL('image/png')
      //   return resolve(thumbnail)
      // })

      // encode image to data-uri with base64 version of compressed image
      // canvas.toDataURL('image/jpeg', quality);  // quality = [0.0, 1.0]
      var thumbnail = canvas.toDataURL('image/png');
      return resolve(thumbnail);
    });
    img.src = imgDataURI;
  });
}

function dataURItoBlob(dataURI, opts, toFile) {
  // get the base64 data
  var data = dataURI.split(',')[1];

  // user may provide mime type, if not get it from data URI
  var mimeType = opts.mimeType || dataURI.split(',')[0].split(':')[1].split(';')[0];

  // default to plain/text if data URI has no mimeType
  if (mimeType == null) {
    mimeType = 'plain/text';
  }

  var binary = atob(data);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }

  // Convert to a File?
  if (toFile) {
    return new File([new Uint8Array(array)], opts.name || '', { type: mimeType });
  }

  return new Blob([new Uint8Array(array)], { type: mimeType });
}

function dataURItoFile(dataURI, opts) {
  return dataURItoBlob(dataURI, opts, true);
}

/**
 * Copies text to clipboard by creating an almost invisible textarea,
 * adding text there, then running execCommand('copy').
 * Falls back to prompt() when the easy way fails (hello, Safari!)
 * From http://stackoverflow.com/a/30810322
 *
 * @param {String} textToCopy
 * @param {String} fallbackString
 * @return {Promise}
 */
function copyToClipboard(textToCopy, fallbackString) {
  fallbackString = fallbackString || 'Copy the URL below';

  return new _Promise(function (resolve, reject) {
    var textArea = document.createElement('textarea');
    textArea.setAttribute('style', {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '2em',
      height: '2em',
      padding: 0,
      border: 'none',
      outline: 'none',
      boxShadow: 'none',
      background: 'transparent'
    });

    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();

    var magicCopyFailed = function magicCopyFailed(err) {
      document.body.removeChild(textArea);
      window.prompt(fallbackString, textToCopy);
      return reject('Oops, unable to copy displayed fallback prompt: ' + err);
    };

    try {
      var successful = document.execCommand('copy');
      if (!successful) {
        return magicCopyFailed('copy command unavailable');
      }
      document.body.removeChild(textArea);
      return resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return magicCopyFailed(err);
    }
  });
}

// export function createInlineWorker (workerFunction) {
//   let code = workerFunction.toString()
//   code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'))
//
//   const blob = new Blob([code], {type: 'application/javascript'})
//   const worker = new Worker(URL.createObjectURL(blob))
//
//   return worker
// }

function makeWorker(script) {
  var URL = window.URL || window.webkitURL;
  var Blob = window.Blob;
  var Worker = window.Worker;

  if (!URL || !Blob || !Worker || !script) {
    return null;
  }

  var code = script.toString();
  code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

  var blob = new Blob([code]);
  var worker = new Worker(URL.createObjectURL(blob));
  return worker;
}

function getSpeed(fileProgress) {
  if (!fileProgress.bytesUploaded) return 0;

  var timeElapsed = new Date() - fileProgress.uploadStarted;
  var uploadSpeed = fileProgress.bytesUploaded / (timeElapsed / 1000);
  return uploadSpeed;
}

function getETA(fileProgress) {
  if (!fileProgress.bytesUploaded) return 0;

  var uploadSpeed = getSpeed(fileProgress);
  var bytesRemaining = fileProgress.bytesTotal - fileProgress.bytesUploaded;
  var secondsRemaining = Math.round(bytesRemaining / uploadSpeed * 10) / 10;

  return secondsRemaining;
}

function prettyETA(seconds) {
  var time = secondsToTime(seconds);

  // Only display hours and minutes if they are greater than 0 but always
  // display minutes if hours is being displayed
  var hoursStr = time.hours ? time.hours + 'h' : '';
  var minutesStr = time.hours || time.minutes ? time.minutes + 'm' : '';
  var secondsStr = time.seconds + 's';

  return hoursStr + ' ' + minutesStr + ' ' + secondsStr;
}

function makeCachingFunction() {
  var cachedEl = null;
  var lastUpdate = Date.now();

  return function cacheElement(el, time) {
    if (Date.now() - lastUpdate < time) {
      return cachedEl;
    }

    cachedEl = el;
    lastUpdate = Date.now();

    return el;
  };
}

exports.default = {
  generateFileID: generateFileID,
  toArray: toArray,
  every: every,
  flatten: flatten,
  groupBy: groupBy,
  $: $,
  $$: $$,
  extend: extend,
  readFile: readFile,
  createImageThumbnail: createImageThumbnail,
  getProportionalImageHeight: getProportionalImageHeight,
  isTouchDevice: isTouchDevice,
  getFileNameAndExtension: getFileNameAndExtension,
  truncateString: truncateString,
  getFileType: getFileType,
  secondsToTime: secondsToTime,
  dataURItoBlob: dataURItoBlob,
  dataURItoFile: dataURItoFile,
  getSpeed: getSpeed,
  getETA: getETA,
  makeWorker: makeWorker,
  makeCachingFunction: makeCachingFunction
};

},{"es6-promise":1,"mime-types":2}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _yoYo = require('yo-yo');

var _yoYo2 = _interopRequireDefault(_yoYo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _yoYo2.default;

},{"yo-yo":7}],21:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var en_US = {};

en_US.strings = {
  chooseFile: 'Choose a file',
  youHaveChosen: 'You have chosen: %{fileName}',
  orDragDrop: 'or drag it here',
  filesChosen: {
    0: '%{smart_count} file selected',
    1: '%{smart_count} files selected'
  },
  filesUploaded: {
    0: '%{smart_count} file uploaded',
    1: '%{smart_count} files uploaded'
  },
  files: {
    0: '%{smart_count} file',
    1: '%{smart_count} files'
  },
  uploadFiles: {
    0: 'Upload %{smart_count} file',
    1: 'Upload %{smart_count} files'
  },
  selectToUpload: 'Select files to upload',
  closeModal: 'Close Modal',
  upload: 'Upload',
  importFrom: 'Import files from',
  dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
  dashboardTitle: 'Uppy Dashboard',
  copyLinkToClipboardSuccess: 'Link copied to clipboard.',
  copyLinkToClipboardFallback: 'Copy the URL below',
  done: 'Done',
  localDisk: 'Local Disk',
  dropPasteImport: 'Drop files here, paste or import from one of the locations above',
  fileProgress: 'File progress: upload speed and ETA',
  numberOfSelectedFiles: 'Number of selected files',
  uploadAllNewFiles: 'Upload all new files'
};

en_US.pluralize = function (n) {
  if (n === 1) {
    return 0;
  }
  return 1;
};

if (typeof window !== 'undefined' && typeof window.Uppy !== 'undefined') {
  window.Uppy.locales.en_US = en_US;
}

exports.default = en_US;

},{}],22:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['<a onclick=', '>Proceed with Demo Account</a>'], ['<a onclick=', '>Proceed with Demo Account</a>']),
    _templateObject2 = _taggedTemplateLiteralLoose(['\n    <div class="UppyGoogleDrive-authenticate">\n      <h1>You need to authenticate with Google before selecting files.</h1>\n      <a href=', '>Authenticate</a>\n      ', '\n    </div>\n  '], ['\n    <div class="UppyGoogleDrive-authenticate">\n      <h1>You need to authenticate with Google before selecting files.</h1>\n      <a href=', '>Authenticate</a>\n      ', '\n    </div>\n  ']);

var _html = require('../../core/html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  var demoLink = props.demo ? (0, _html2.default)(_templateObject, props.handleDemoAuth) : null;
  return (0, _html2.default)(_templateObject2, props.link, demoLink);
};

},{"../../core/html":20}],23:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <div>\n      <span>\n        Something went wrong.  Probably our fault. ', '\n      </span>\n    </div>\n  '], ['\n    <div>\n      <span>\n        Something went wrong.  Probably our fault. ', '\n      </span>\n    </div>\n  ']);

var _html = require('../../core/html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  return (0, _html2.default)(_templateObject, props.error);
};

},{"../../core/html":20}],24:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _templateObject = _taggedTemplateLiteralLoose(['\n      <svg class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">\n        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>\n      </svg>\n    '], ['\n      <svg class="UppyIcon UppyModalTab-icon" width="28" height="28" viewBox="0 0 16 16">\n        <path d="M2.955 14.93l2.667-4.62H16l-2.667 4.62H2.955zm2.378-4.62l-2.666 4.62L0 10.31l5.19-8.99 2.666 4.62-2.523 4.37zm10.523-.25h-5.333l-5.19-8.99h5.334l5.19 8.99z"/>\n      </svg>\n    ']);

var _Utils = require('../../core/Utils');

var _Utils2 = _interopRequireDefault(_Utils);

var _Plugin2 = require('../Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

require('whatwg-fetch');

var _html = require('../../core/html');

var _html2 = _interopRequireDefault(_html);

var _Provider = require('../../uppy-base/src/plugins/Provider');

var _Provider2 = _interopRequireDefault(_Provider);

var _AuthView = require('./AuthView');

var _AuthView2 = _interopRequireDefault(_AuthView);

var _Browser = require('./new/Browser');

var _Browser2 = _interopRequireDefault(_Browser);

var _Error = require('./Error');

var _Error2 = _interopRequireDefault(_Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Google = function (_Plugin) {
  _inherits(Google, _Plugin);

  function Google(core, opts) {
    _classCallCheck(this, Google);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'acquirer';
    _this.id = 'GoogleDrive';
    _this.title = 'Google Drive';
    _this.icon = (0, _html2.default)(_templateObject);

    _this.GoogleDrive = new _Provider2.default({
      host: _this.opts.host,
      provider: 'drive'
    });

    _this.files = [];

    // this.core.socket.on('')
    // Logic
    _this.addFile = _this.addFile.bind(_this);
    _this.filterItems = _this.filterItems.bind(_this);
    _this.filterQuery = _this.filterQuery.bind(_this);
    _this.getFolder = _this.getFolder.bind(_this);
    _this.getNextFolder = _this.getNextFolder.bind(_this);
    _this.handleRowClick = _this.handleRowClick.bind(_this);
    _this.logout = _this.logout.bind(_this);
    _this.handleDemoAuth = _this.handleDemoAuth.bind(_this);
    _this.sortByTitle = _this.sortByTitle.bind(_this);
    _this.sortByDate = _this.sortByDate.bind(_this);

    // Visual
    _this.render = _this.render.bind(_this);

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);
    return _this;
  }

  Google.prototype.install = function install() {
    var _this2 = this;

    // Set default state for Google Drive
    this.core.setState({
      googleDrive: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [{
          title: 'My Drive',
          id: 'root'
        }],
        activeRow: -1,
        filterInput: ''
      }
    });

    var target = this.opts.target;
    var plugin = this;
    this.target = this.mount(target, plugin);

    this.checkAuthentication().then(function (authenticated) {
      _this2.updateState({ authenticated: authenticated });

      console.log('are we authenticated?');
      console.log(authenticated);

      if (authenticated) {
        return _this2.getFolder('root');
      }

      return authenticated;
    }).then(function (newState) {
      _this2.updateState(newState);
    });

    return;
  };

  Google.prototype.focus = function focus() {};

  /**
   * Little shorthand to update the state with my new state
   */


  Google.prototype.updateState = function updateState(newState) {
    var state = this.core.state;

    var googleDrive = _extends({}, state.googleDrive, newState);

    this.core.setState({ googleDrive: googleDrive });
  };

  /**
   * Check to see if the user is authenticated.
   * @return {Promise} authentication status
   */


  Google.prototype.checkAuthentication = function checkAuthentication() {
    var _this3 = this;

    return fetch(this.opts.host + '/drive/auth', {
      method: 'get',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(function (res) {
      console.log(res.status);
      if (res.status < 200 || res.status > 300) {
        _this3.updateState({
          authenticated: false,
          error: true
        });
        var error = new Error(res.statusText);
        error.response = res;
        throw error;
      }

      return res.json();
    }).then(function (data) {
      return data.authenticated;
    }).catch(function (err) {
      return err;
    });
  };

  /**
   * Based on folder ID, fetch a new folder
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */


  Google.prototype.getFolder = function getFolder() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'root';

    return this.GoogleDrive.list(id).then(function (res) {
      // let result = Utils.groupBy(data.items, (item) => item.mimeType)
      var folders = [];
      var files = [];
      res.items.forEach(function (item) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          folders.push(item);
        } else {
          files.push(item);
        }
      });
      return {
        folders: folders,
        files: files
      };
    }).catch(function (err) {
      return err;
    });
  };

  /**
   * Fetches new folder and adds to breadcrumb nav
   * @param  {String} id    Folder id
   * @param  {String} title Folder title
   */


  Google.prototype.getNextFolder = function getNextFolder(id, title) {
    var _this4 = this;

    this.getFolder(id).then(function (data) {
      var state = _this4.core.getState().googleDrive;

      var index = state.directories.findIndex(function (dir) {
        return id === dir.id;
      });
      var updatedDirectories = void 0;

      if (index !== -1) {
        updatedDirectories = state.directories.slice(0, index + 1);
      } else {
        updatedDirectories = state.directories.concat([{
          id: id,
          title: title
        }]);
      }

      _this4.updateState(_Utils2.default.extend(data, {
        directories: updatedDirectories
      }));
    });
  };

  Google.prototype.addFile = function addFile(file) {
    var tagFile = {
      source: this.id,
      data: file,
      name: file.title,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id
      },
      remote: {
        host: this.opts.host,
        url: this.opts.host + '/drive/get/' + file.id,
        body: {
          fileId: file.id
        }
      }
    };
    console.log('adding file');
    this.core.emitter.emit('core:file-add', tagFile);
  };

  Google.prototype.handleError = function handleError(response) {
    var _this5 = this;

    this.checkAuthentication().then(function (authenticated) {
      _this5.updateState({ authenticated: authenticated });
    });
  };

  /**
   * Removes session token on client side.
   */


  Google.prototype.logout = function logout() {
    var _this6 = this;

    this.GoogleDrive.logout(location.href).then(function (res) {
      return res.json();
    }).then(function (res) {
      if (res.ok) {
        console.log('ok');
        var newState = {
          authenticated: false,
          files: [],
          folders: [],
          directories: [{
            title: 'My Drive',
            id: 'root'
          }]
        };

        _this6.updateState(newState);
      }
    });
  };

  Google.prototype.getFileType = function getFileType(file) {
    var fileTypes = {
      'application/vnd.google-apps.folder': 'Folder',
      'application/vnd.google-apps.document': 'Google Docs',
      'application/vnd.google-apps.spreadsheet': 'Google Sheets',
      'application/vnd.google-apps.presentation': 'Google Slides',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image'
    };

    return fileTypes[file.mimeType] ? fileTypes[file.mimeType] : file.fileExtension.toUpperCase();
  };

  /**
   * Used to set active file/folder.
   * @param  {Object} file   Active file/folder
   */


  Google.prototype.handleRowClick = function handleRowClick(fileId) {
    var state = this.core.getState().googleDrive;
    var newState = _extends({}, state, {
      activeRow: fileId
    });

    this.updateState(newState);
  };

  Google.prototype.filterQuery = function filterQuery(e) {
    var state = this.core.getState().googleDrive;
    this.updateState(_extends({}, state, {
      filterInput: e.target.value
    }));
  };

  Google.prototype.filterItems = function filterItems(items) {
    var state = this.core.getState().googleDrive;
    return items.filter(function (folder) {
      return folder.title.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1;
    });
  };

  Google.prototype.sortByTitle = function sortByTitle() {
    var state = _extends({}, this.core.getState().googleDrive);
    var files = state.files;
    var folders = state.folders;
    var sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      if (sorting === 'titleDescending') {
        return fileB.title.localeCompare(fileA.title);
      }
      return fileA.title.localeCompare(fileB.title);
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      if (sorting === 'titleDescending') {
        return folderB.title.localeCompare(folderA.title);
      }
      return folderA.title.localeCompare(folderB.title);
    });

    this.updateState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'titleDescending' ? 'titleAscending' : 'titleDescending'
    }));
  };

  Google.prototype.sortByDate = function sortByDate() {
    var state = _extends({}, this.core.getState().googleDrive);
    var files = state.files;
    var folders = state.folders;
    var sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = new Date(fileA.modifiedByMeDate);
      var b = new Date(fileB.modifiedByMeDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      var a = new Date(folderA.modifiedByMeDate);
      var b = new Date(folderB.modifiedByMeDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });

    this.updateState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'dateDescending' ? 'dateAscending' : 'dateDescending'
    }));
  };

  Google.prototype.handleDemoAuth = function handleDemoAuth() {
    var state = this.core.getState().googleDrive;
    this.updateState({}, state, {
      authenticated: true
    });
  };

  Google.prototype.render = function render(state) {
    var _state$googleDrive = state.googleDrive;
    var authenticated = _state$googleDrive.authenticated;
    var error = _state$googleDrive.error;


    if (error) {
      return (0, _Error2.default)({ error: error });
    }

    if (!authenticated) {
      var authState = btoa(JSON.stringify({
        redirect: location.href.split('#')[0]
      }));

      var link = this.opts.host + '/connect/google?state=' + authState;

      return (0, _AuthView2.default)({
        link: link,
        demo: this.opts.demo,
        handleDemoAuth: this.handleDemoAuth
      });
    }

    var browserProps = _extends({}, state.googleDrive, {
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      addFile: this.addFile,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      handleRowClick: this.handleRowClick,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.opts.demo
    });

    return (0, _Browser2.default)(browserProps);
  };

  return Google;
}(_Plugin3.default);

exports.default = Google;

},{"../../core/Utils":19,"../../core/html":20,"../../uppy-base/src/plugins/Provider":32,"../Plugin":31,"./AuthView":22,"./Error":23,"./new/Browser":27,"whatwg-fetch":6}],25:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <li>\n      <button onclick=', '>', '</button>\n    </li>\n  '], ['\n    <li>\n      <button onclick=', '>', '</button>\n    </li>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  return (0, _html2.default)(_templateObject, props.getNextFolder, props.title);
};

},{"../../../core/html":20}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <ul class="UppyGoogleDrive-breadcrumbs">\n      ', '\n    </ul>\n  '], ['\n    <ul class="UppyGoogleDrive-breadcrumbs">\n      ', '\n    </ul>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

var _Breadcrumb = require('./Breadcrumb');

var _Breadcrumb2 = _interopRequireDefault(_Breadcrumb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  return (0, _html2.default)(_templateObject, props.directories.map(function (directory) {
    return (0, _Breadcrumb2.default)({
      getNextFolder: function getNextFolder() {
        return props.getNextFolder(directory.id, directory.title);
      },
      title: directory.title
    });
  }));
};

},{"../../../core/html":20,"./Breadcrumb":25}],27:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <div class="Browser">\n      <header>\n        <input\n          type="text"\n          class="Browser-search"\n          placeholder="Search Drive"\n          onkeyup=', '\n          value=', '/>\n      </header>\n      <div class="Browser-subHeader">\n        ', '\n      </div>\n      <div class="Browser-body">\n        <main class="Browser-content">\n          ', '\n        </main>\n      </div>\n    </div>\n  '], ['\n    <div class="Browser">\n      <header>\n        <input\n          type="text"\n          class="Browser-search"\n          placeholder="Search Drive"\n          onkeyup=', '\n          value=', '/>\n      </header>\n      <div class="Browser-subHeader">\n        ', '\n      </div>\n      <div class="Browser-body">\n        <main class="Browser-content">\n          ', '\n        </main>\n      </div>\n    </div>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

var _Breadcrumbs = require('./Breadcrumbs');

var _Breadcrumbs2 = _interopRequireDefault(_Breadcrumbs);

var _Table = require('./Table');

var _Table2 = _interopRequireDefault(_Table);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  var filteredFolders = props.folders;
  var filteredFiles = props.files;

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders);
    filteredFiles = props.filterItems(props.files);
  }

  return (0, _html2.default)(_templateObject, props.filterQuery, props.filterInput, (0, _Breadcrumbs2.default)({
    getNextFolder: props.getNextFolder,
    directories: props.directories
  }), (0, _Table2.default)({
    columns: [{
      name: 'Name',
      key: 'title'
    }],
    folders: filteredFolders,
    files: filteredFiles,
    activeRow: props.activeRow,
    sortByTitle: props.sortByTitle,
    sortByDate: props.sortByDate,
    handleRowClick: props.handleRowClick,
    handleFileDoubleClick: props.addFile,
    handleFolderDoubleClick: props.getNextFolder
  }));
};

},{"../../../core/html":20,"./Breadcrumbs":26,"./Table":28}],28:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n      <th class="BrowserTable-headerColumn BrowserTable-column" onclick=', '>\n        ', '\n      </th>\n    '], ['\n      <th class="BrowserTable-headerColumn BrowserTable-column" onclick=', '>\n        ', '\n      </th>\n    ']),
    _templateObject2 = _taggedTemplateLiteralLoose(['\n    <table class="BrowserTable">\n      <thead class="BrowserTable-header">\n        <tr>\n          ', '\n        </tr>\n      </thead>\n      <tbody>\n        ', '\n        ', '\n      </tbody>\n    </table>\n  '], ['\n    <table class="BrowserTable">\n      <thead class="BrowserTable-header">\n        <tr>\n          ', '\n        </tr>\n      </thead>\n      <tbody>\n        ', '\n        ', '\n      </tbody>\n    </table>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

var _TableRow = require('./TableRow');

var _TableRow2 = _interopRequireDefault(_TableRow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  var headers = props.columns.map(function (column) {
    return (0, _html2.default)(_templateObject, props.sortByTitle, column.name);
  });

  return (0, _html2.default)(_templateObject2, headers, props.folders.map(function (folder) {
    return (0, _TableRow2.default)({
      title: folder.title,
      active: props.activeRow === folder.id,
      iconLink: folder.iconLink,
      modifiedByMeDate: folder.modifiedByMeDate,
      handleClick: function handleClick() {
        return props.handleRowClick(folder.id);
      },
      handleDoubleClick: function handleDoubleClick() {
        return props.handleFolderDoubleClick(folder.id, folder.title);
      },
      columns: props.columns
    });
  }), props.files.map(function (file) {
    return (0, _TableRow2.default)({
      title: file.title,
      active: props.activeRow === file.id,
      iconLink: file.iconLink,
      modifiedByMeDate: file.modifiedByMeDate,
      handleClick: function handleClick() {
        return props.handleRowClick(file.id);
      },
      handleDoubleClick: function handleDoubleClick() {
        return props.handleFileDoubleClick(file);
      },
      columns: props.columns,
      owner: 'Joe Mama'
    });
  }));
};

},{"../../../core/html":20,"./TableRow":30}],29:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <td class="BrowserTable-rowColumn BrowserTable-column">\n      <img src=', '/> ', '\n    </td>\n  '], ['\n    <td class="BrowserTable-rowColumn BrowserTable-column">\n      <img src=', '/> ', '\n    </td>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  return (0, _html2.default)(_templateObject, props.iconLink, props.value);
};

},{"../../../core/html":20}],30:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _templateObject = _taggedTemplateLiteralLoose(['\n    <tr onclick=', ' ondblclick=', ' class=', '>\n      ', '\n    </tr>\n  '], ['\n    <tr onclick=', ' ondblclick=', ' class=', '>\n      ', '\n    </tr>\n  ']);

var _html = require('../../../core/html');

var _html2 = _interopRequireDefault(_html);

var _TableColumn = require('./TableColumn');

var _TableColumn2 = _interopRequireDefault(_TableColumn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteralLoose(strings, raw) { strings.raw = raw; return strings; }

exports.default = function (props) {
  var classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row';
  return (0, _html2.default)(_templateObject, props.handleClick, props.handleDoubleClick, classes, (0, _TableColumn2.default)({
    iconLink: props.iconLink,
    value: props.title || ''
  }));
};

},{"../../../core/html":20,"./TableColumn":29}],31:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _yoYo = require('yo-yo');

var _yoYo2 = _interopRequireDefault(_yoYo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
var Plugin = function () {
  function Plugin(core, opts) {
    _classCallCheck(this, Plugin);

    this.core = core;
    this.opts = opts || {};
    this.type = 'none';

    // clear everything inside the target selector
    this.opts.replaceTargetContent === this.opts.replaceTargetContent || true;

    this.update = this.update.bind(this);
    this.mount = this.mount.bind(this);
    this.focus = this.focus.bind(this);
    this.install = this.install.bind(this);
  }

  Plugin.prototype.update = function update(state) {
    if (typeof this.el === 'undefined') {
      return;
    }

    var newEl = this.render(state);
    _yoYo2.default.update(this.el, newEl);

    // optimizes performance?
    // requestAnimationFrame(() => {
    //   const newEl = this.render(state)
    //   yo.update(this.el, newEl)
    // })
  };

  /**
   * Check if supplied `target` is a `string` or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */


  Plugin.prototype.mount = function mount(target, plugin) {
    var callerPluginName = plugin.id;

    if (typeof target === 'string') {
      this.core.log('Installing ' + callerPluginName + ' to ' + target);

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        document.querySelector(target).innerHTML = '';
      }

      this.el = plugin.render(this.core.state);
      document.querySelector(target).appendChild(this.el);

      return target;
    } else {
      // TODO: is instantiating the plugin really the way to roll
      // just to get the plugin name?
      var Target = target;
      var targetPluginName = new Target().id;

      this.core.log('Installing ' + callerPluginName + ' to ' + targetPluginName);

      var targetPlugin = this.core.getPlugin(targetPluginName);
      var selectorTarget = targetPlugin.addTarget(plugin);

      return selectorTarget;
    }
  };

  Plugin.prototype.focus = function focus() {
    return;
  };

  Plugin.prototype.install = function install() {
    return;
  };

  return Plugin;
}();

exports.default = Plugin;

},{"yo-yo":7}],32:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _getName = function _getName(id) {
  return id.split('-').map(function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }).join(' ');
};

var Provider = function () {
  function Provider(opts) {
    _classCallCheck(this, Provider);

    this.opts = opts;
    this.provider = opts.provider;
    this.id = this.provider;
    this.name = this.opts.name || _getName(this.id);
  }

  _createClass(Provider, [{
    key: 'auth',
    value: function auth() {
      return fetch(this.opts.host + '/' + this.provider + '/authorize', {
        method: 'get',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application.json'
        }
      }).then(function (res) {
        return res.json().then(function (payload) {
          return payload.isAuthenticated;
        });
      });
    }
  }, {
    key: 'list',
    value: function list() {
      var directory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'root';

      return fetch(this.opts.host + '/' + this.provider + '/list/' + directory, {
        method: 'get',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(function (res) {
        return res.json();
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var redirect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : location.href;

      return fetch(this.opts.host + '/' + this.provider + '/logout?redirect=' + redirect, {
        method: 'get',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    }
  }]);

  return Provider;
}();

exports.default = Provider;

},{}],33:[function(require,module,exports){

},{}],34:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":35}],35:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],36:[function(require,module,exports){
'use strict';

var _Core = require('../../../../src/core/Core.js');

var _Core2 = _interopRequireDefault(_Core);

var _GoogleDrive = require('../../../../src/plugins/GoogleDrive');

var _GoogleDrive2 = _interopRequireDefault(_GoogleDrive);

var _env = require('../env');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uppy = new _Core2.default({ debug: true, autoProceed: false });
uppy.use(_GoogleDrive2.default, { target: '#GoogleDriveContainer', host: _env.UPPY_SERVER }).run();

},{"../../../../src/core/Core.js":16,"../../../../src/plugins/GoogleDrive":24,"../env":37}],37:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var uppyServerEndpoint = 'http://localhost:3020';

if (location.hostname === 'uppy.io') {
  uppyServerEndpoint = '//server.uppy.io';
}

// uppyServerEndpoint = 'http://server.uppy.io:3020'
var UPPY_SERVER = exports.UPPY_SERVER = uppyServerEndpoint;

},{}]},{},[36])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvZXM2LXByb21pc2UvZGlzdC9lczYtcHJvbWlzZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9taW1lLXR5cGVzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pbWUtdHlwZXMvbm9kZV9tb2R1bGVzL21pbWUtZGIvZGIuanNvbiIsIi4uL25vZGVfbW9kdWxlcy9taW1lLXR5cGVzL25vZGVfbW9kdWxlcy9taW1lLWRiL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL25hbWVzcGFjZS1lbWl0dGVyL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9mZXRjaC5qcyIsIi4uL25vZGVfbW9kdWxlcy95by15by9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy95by15by9ub2RlX21vZHVsZXMvYmVsL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3lvLXlvL25vZGVfbW9kdWxlcy9iZWwvbm9kZV9tb2R1bGVzL2dsb2JhbC9kb2N1bWVudC5qcyIsIi4uL25vZGVfbW9kdWxlcy95by15by9ub2RlX21vZHVsZXMvYmVsL25vZGVfbW9kdWxlcy9nbG9iYWwvd2luZG93LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3lvLXlvL25vZGVfbW9kdWxlcy9iZWwvbm9kZV9tb2R1bGVzL2h5cGVyeC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy95by15by9ub2RlX21vZHVsZXMvYmVsL25vZGVfbW9kdWxlcy9oeXBlcngvbm9kZV9tb2R1bGVzL2h5cGVyc2NyaXB0LWF0dHJpYnV0ZS10by1wcm9wZXJ0eS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy95by15by9ub2RlX21vZHVsZXMvYmVsL25vZGVfbW9kdWxlcy9vbi1sb2FkL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3lvLXlvL25vZGVfbW9kdWxlcy9tb3JwaGRvbS9zcmMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMveW8teW8vdXBkYXRlLWV2ZW50cy5qcyIsIi4uL3NyYy9jb3JlL0NvcmUuanMiLCIuLi9zcmMvY29yZS9UcmFuc2xhdG9yLmpzIiwiLi4vc3JjL2NvcmUvVXBweVNvY2tldC5qcyIsIi4uL3NyYy9jb3JlL1V0aWxzLmpzIiwiLi4vc3JjL2NvcmUvaHRtbC5qcyIsIi4uL3NyYy9sb2NhbGVzL2VuX1VTLmpzIiwiLi4vc3JjL3BsdWdpbnMvR29vZ2xlRHJpdmUvQXV0aFZpZXcuanMiLCIuLi9zcmMvcGx1Z2lucy9Hb29nbGVEcml2ZS9FcnJvci5qcyIsIi4uL3NyYy9wbHVnaW5zL0dvb2dsZURyaXZlL2luZGV4LmpzIiwiLi4vc3JjL3BsdWdpbnMvR29vZ2xlRHJpdmUvbmV3L0JyZWFkY3J1bWIuanMiLCIuLi9zcmMvcGx1Z2lucy9Hb29nbGVEcml2ZS9uZXcvQnJlYWRjcnVtYnMuanMiLCIuLi9zcmMvcGx1Z2lucy9Hb29nbGVEcml2ZS9uZXcvQnJvd3Nlci5qcyIsIi4uL3NyYy9wbHVnaW5zL0dvb2dsZURyaXZlL25ldy9UYWJsZS5qcyIsIi4uL3NyYy9wbHVnaW5zL0dvb2dsZURyaXZlL25ldy9UYWJsZUNvbHVtbi5qcyIsIi4uL3NyYy9wbHVnaW5zL0dvb2dsZURyaXZlL25ldy9UYWJsZVJvdy5qcyIsIi4uL3NyYy9wbHVnaW5zL1BsdWdpbi5qcyIsIi4uL3NyYy91cHB5LWJhc2Uvc3JjL3BsdWdpbnMvUHJvdmlkZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvZXhhbXBsZXMvZHJpdmUvYXBwLmVzNiIsInNyYy9leGFtcGxlcy9lbnYuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDLzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ24rTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2piQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BMQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQSxJQUFNLE9BQU8sbUJBQVMsRUFBQyxPQUFPLElBQVIsRUFBYyxhQUFhLEtBQTNCLEVBQVQsQ0FBYjtBQUNBLEtBQ0csR0FESCx3QkFDb0IsRUFBRSxRQUFRLHVCQUFWLEVBQW1DLHNCQUFuQyxFQURwQixFQUVHLEdBRkg7Ozs7OztBQ0xBLElBQUkscUJBQXFCLHVCQUF6Qjs7QUFFQSxJQUFJLFNBQVMsUUFBVCxLQUFzQixTQUExQixFQUFxQztBQUNuQyx1QkFBcUIsa0JBQXJCO0FBQ0Q7O0FBRUQ7QUFDTyxJQUFNLG9DQUFjLGtCQUFwQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjIuMVxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwID0gZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbiA9IHNjaGVkdWxlRm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXAoYXNhcEZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGFzYXBGbjtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93IHx8IHt9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHt9LnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJztcblxuICAgIC8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc1dvcmtlciA9IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSAndW5kZWZpbmVkJztcblxuICAgIC8vIG5vZGVcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKSB7XG4gICAgICAvLyBub2RlIHZlcnNpb24gMC4xMC54IGRpc3BsYXlzIGEgZGVwcmVjYXRpb24gd2FybmluZyB3aGVuIG5leHRUaWNrIGlzIHVzZWQgcmVjdXJzaXZlbHlcbiAgICAgIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHZlcnR4XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgbGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCk7XG4gICAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgIG9ic2VydmVyLm9ic2VydmUobm9kZSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5vZGUuZGF0YSA9IChpdGVyYXRpb25zID0gKytpdGVyYXRpb25zICUgMik7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIHdlYiB3b3JrZXJcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTWVzc2FnZUNoYW5uZWwoKSB7XG4gICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2g7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gsIDEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlID0gbmV3IEFycmF5KDEwMDApO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbjsgaSs9Mikge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaV07XG4gICAgICAgIHZhciBhcmcgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXTtcblxuICAgICAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2krMV0gPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRsZW4gPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKSB7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgciA9IHJlcXVpcmU7XG4gICAgICAgIHZhciB2ZXJ0eCA9IHIoJ3ZlcnR4Jyk7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR2ZXJ0eE5leHQgPSB2ZXJ0eC5ydW5Pbkxvb3AgfHwgdmVydHgucnVuT25Db250ZXh0O1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVZlcnR4VGltZXIoKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2g7XG4gICAgLy8gRGVjaWRlIHdoYXQgYXN5bmMgbWV0aG9kIHRvIHVzZSB0byB0cmlnZ2VyaW5nIHByb2Nlc3Npbmcgb2YgcXVldWVkIGNhbGxiYWNrczpcbiAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzTm9kZSkge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTmV4dFRpY2soKTtcbiAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRCcm93c2VyTXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXR0ZW1wdFZlcnR4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZVNldFRpbWVvdXQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW4ob25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKGNoaWxkW2xpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBST01JU0VfSURdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UoY2hpbGQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJndW1lbnRzW3N0YXRlIC0gMV07XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaW52b2tlQ2FsbGJhY2soc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcGFyZW50Ll9yZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR0aGVuJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHRoZW4kJHRoZW47XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkcmVzb2x2ZShvYmplY3QpIHtcbiAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgIH1cblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQUk9NSVNFX0lEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDE2KTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AoKSB7fVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgICA9IHZvaWQgMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEID0gMTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgID0gMjtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGZpbGxtZW50KCkge1xuICAgICAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJZb3UgY2Fubm90IHJlc29sdmUgYSBwcm9taXNlIHdpdGggaXRzZWxmXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKCdBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbihwcm9taXNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuO1xuICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvciA9IGVycm9yO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5VGhlbih0aGVuLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGVuLmNhbGwodmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcik7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuKSB7XG4gICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAoZnVuY3Rpb24ocHJvbWlzZSkge1xuICAgICAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBlcnJvciA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdGhlbmFibGUsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHNlYWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICBzZWFsZWQgPSB0cnVlO1xuICAgICAgICAgIGlmICh0aGVuYWJsZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcblxuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9LCAnU2V0dGxlOiAnICsgKHByb21pc2UuX2xhYmVsIHx8ICcgdW5rbm93biBwcm9taXNlJykpO1xuXG4gICAgICAgIGlmICghc2VhbGVkICYmIGVycm9yKSB7XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9LCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSkge1xuICAgICAgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKHRoZW5hYmxlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHRoZW5hYmxlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVNYXliZVRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4pIHtcbiAgICAgIGlmIChtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlLmNvbnN0cnVjdG9yICYmXG4gICAgICAgICAgdGhlbiA9PT0gbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQgJiZcbiAgICAgICAgICBjb25zdHJ1Y3Rvci5yZXNvbHZlID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRkZWZhdWx0KSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SLmVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGVuID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbih0aGVuKSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIG1heWJlVGhlbmFibGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzZWxmRnVsZmlsbG1lbnQoKSk7XG4gICAgICB9IGVsc2UgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkb2JqZWN0T3JGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZ2V0VGhlbih2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaFJlamVjdGlvbihwcm9taXNlKSB7XG4gICAgICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgICAgICBwcm9taXNlLl9vbmVycm9yKHByb21pc2UuX3Jlc3VsdCk7XG4gICAgICB9XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gocHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSkge1xuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7IHJldHVybjsgfVxuXG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEO1xuXG4gICAgICBpZiAocHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHByb21pc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cbiAgICAgIHByb21pc2UuX3N0YXRlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24sIHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZShwYXJlbnQsIGNoaWxkLCBvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHN1YnNjcmliZXJzID0gcGFyZW50Ll9zdWJzY3JpYmVycztcbiAgICAgIHZhciBsZW5ndGggPSBzdWJzY3JpYmVycy5sZW5ndGg7XG5cbiAgICAgIHBhcmVudC5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aF0gPSBjaGlsZDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRF0gPSBvbkZ1bGZpbGxtZW50O1xuICAgICAgc3Vic2NyaWJlcnNbbGVuZ3RoICsgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURURdICA9IG9uUmVqZWN0aW9uO1xuXG4gICAgICBpZiAobGVuZ3RoID09PSAwICYmIHBhcmVudC5fc3RhdGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGFzYXAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaCwgcGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHByb21pc2UuX3N1YnNjcmliZXJzO1xuICAgICAgdmFyIHNldHRsZWQgPSBwcm9taXNlLl9zdGF0ZTtcblxuICAgICAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNoaWxkID0gc3Vic2NyaWJlcnNbaV07XG4gICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgICAgIGlmIChjaGlsZCkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIGNoaWxkLCBjYWxsYmFjaywgZGV0YWlsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhkZXRhaWwpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKSB7XG4gICAgICB0aGlzLmVycm9yID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SID0gbmV3IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCk7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlDYXRjaChjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IuZXJyb3IgPSBlO1xuICAgICAgICByZXR1cm4gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHNldHRsZWQsIHByb21pc2UsIGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgICAgIHZhciBoYXNDYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNGdW5jdGlvbihjYWxsYmFjayksXG4gICAgICAgICAgdmFsdWUsIGVycm9yLCBzdWNjZWVkZWQsIGZhaWxlZDtcblxuICAgICAgaWYgKGhhc0NhbGxiYWNrKSB7XG4gICAgICAgIHZhbHVlID0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCk7XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgIGVycm9yID0gdmFsdWUuZXJyb3I7XG4gICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkY2Fubm90UmV0dXJuT3duKCkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGRldGFpbDtcbiAgICAgICAgc3VjY2VlZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIC8vIG5vb3BcbiAgICAgIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRlVMRklMTEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChzZXR0bGVkID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihmdW5jdGlvbiByZXNvbHZlUHJvbWlzZSh2YWx1ZSl7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIHJlamVjdFByb21pc2UocmVhc29uKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaWQgPSAwO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5leHRJZCgpIHtcbiAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG1ha2VQcm9taXNlKHByb21pc2UpIHtcbiAgICAgIHByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpZCsrO1xuICAgICAgcHJvbWlzZS5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycyA9IFtdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsKGVudHJpZXMpIHtcbiAgICAgIHJldHVybiBuZXcgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQodGhpcywgZW50cmllcykucHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkYWxsO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJHJhY2UoZW50cmllcykge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gYXJyYXkgdG8gcmFjZS4nKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgbGVuZ3RoID0gZW50cmllcy5sZW5ndGg7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQ29uc3RydWN0b3IucmVzb2x2ZShlbnRyaWVzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzUmVzb2x2ZXIoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgcmVzb2x2ZXIgZnVuY3Rpb24gYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJG5lZWRzTmV3KCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZhaWxlZCB0byBjb25zdHJ1Y3QgJ1Byb21pc2UnOiBQbGVhc2UgdXNlIHRoZSAnbmV3JyBvcGVyYXRvciwgdGhpcyBvYmplY3QgY29uc3RydWN0b3IgY2Fubm90IGJlIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZTtcbiAgICAvKipcbiAgICAgIFByb21pc2Ugb2JqZWN0cyByZXByZXNlbnQgdGhlIGV2ZW50dWFsIHJlc3VsdCBvZiBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBUaGVcbiAgICAgIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gICAgICByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZSByZWFzb25cbiAgICAgIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBUZXJtaW5vbG9neVxuICAgICAgLS0tLS0tLS0tLS1cblxuICAgICAgLSBgcHJvbWlzZWAgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIHdpdGggYSBgdGhlbmAgbWV0aG9kIHdob3NlIGJlaGF2aW9yIGNvbmZvcm1zIHRvIHRoaXMgc3BlY2lmaWNhdGlvbi5cbiAgICAgIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgICAgIC0gYHZhbHVlYCBpcyBhbnkgbGVnYWwgSmF2YVNjcmlwdCB2YWx1ZSAoaW5jbHVkaW5nIHVuZGVmaW5lZCwgYSB0aGVuYWJsZSwgb3IgYSBwcm9taXNlKS5cbiAgICAgIC0gYGV4Y2VwdGlvbmAgaXMgYSB2YWx1ZSB0aGF0IGlzIHRocm93biB1c2luZyB0aGUgdGhyb3cgc3RhdGVtZW50LlxuICAgICAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAgICAgLSBgc2V0dGxlZGAgdGhlIGZpbmFsIHJlc3Rpbmcgc3RhdGUgb2YgYSBwcm9taXNlLCBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG5cbiAgICAgIEEgcHJvbWlzZSBjYW4gYmUgaW4gb25lIG9mIHRocmVlIHN0YXRlczogcGVuZGluZywgZnVsZmlsbGVkLCBvciByZWplY3RlZC5cblxuICAgICAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgICAgIHN0YXRlLiAgUHJvbWlzZXMgdGhhdCBhcmUgcmVqZWN0ZWQgaGF2ZSBhIHJlamVjdGlvbiByZWFzb24gYW5kIGFyZSBpbiB0aGVcbiAgICAgIHJlamVjdGVkIHN0YXRlLiAgQSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZXZlciBhIHRoZW5hYmxlLlxuXG4gICAgICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgICAgIHByb21pc2UsIHRoZW4gdGhlIG9yaWdpbmFsIHByb21pc2UncyBzZXR0bGVkIHN0YXRlIHdpbGwgbWF0Y2ggdGhlIHZhbHVlJ3NcbiAgICAgIHNldHRsZWQgc3RhdGUuICBTbyBhIHByb21pc2UgdGhhdCAqcmVzb2x2ZXMqIGEgcHJvbWlzZSB0aGF0IHJlamVjdHMgd2lsbFxuICAgICAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICAgICAgaXRzZWxmIGZ1bGZpbGwuXG5cblxuICAgICAgQmFzaWMgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgYGBganNcbiAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG5cbiAgICAgICAgLy8gb24gZmFpbHVyZVxuICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgIH0pO1xuXG4gICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICAvLyBvbiByZWplY3Rpb25cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIFVzYWdlOlxuICAgICAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFByb21pc2VzIHNoaW5lIHdoZW4gYWJzdHJhY3RpbmcgYXdheSBhc3luY2hyb25vdXMgaW50ZXJhY3Rpb25zIHN1Y2ggYXNcbiAgICAgIGBYTUxIdHRwUmVxdWVzdGBzLlxuXG4gICAgICBgYGBqc1xuICAgICAgZnVuY3Rpb24gZ2V0SlNPTih1cmwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZXI7XG4gICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQWNjZXB0JywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IHRoaXMuRE9ORSkge1xuICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignZ2V0SlNPTjogYCcgKyB1cmwgKyAnYCBmYWlsZWQgd2l0aCBzdGF0dXM6IFsnICsgdGhpcy5zdGF0dXMgKyAnXScpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBnZXRKU09OKCcvcG9zdHMuanNvbicpLnRoZW4oZnVuY3Rpb24oanNvbikge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgVW5saWtlIGNhbGxiYWNrcywgcHJvbWlzZXMgYXJlIGdyZWF0IGNvbXBvc2FibGUgcHJpbWl0aXZlcy5cblxuICAgICAgYGBganNcbiAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgZ2V0SlNPTignL3Bvc3RzJyksXG4gICAgICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gICAgICBdKS50aGVuKGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgIHZhbHVlc1swXSAvLyA9PiBwb3N0c0pTT05cbiAgICAgICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAY2xhc3MgUHJvbWlzZVxuICAgICAgQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZXJcbiAgICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICAgIEBjb25zdHJ1Y3RvclxuICAgICovXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UocmVzb2x2ZXIpIHtcbiAgICAgIHRoaXNbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0gPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRuZXh0SWQoKTtcbiAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3Vic2NyaWJlcnMgPSBbXTtcblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3AgIT09IHJlc29sdmVyKSB7XG4gICAgICAgIHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJyAmJiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpO1xuICAgICAgICB0aGlzIGluc3RhbmNlb2YgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UgPyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcikgOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5hbGwgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRhbGwkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmFjZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVzb2x2ZSA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucmVqZWN0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVqZWN0JCRkZWZhdWx0O1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRTY2hlZHVsZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyO1xuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLl9zZXRBc2FwID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXA7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX2FzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcDtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLnByb3RvdHlwZSA9IHtcbiAgICAgIGNvbnN0cnVjdG9yOiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSxcblxuICAgIC8qKlxuICAgICAgVGhlIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsXG4gICAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgICAgcmVhc29uIHdoeSB0aGUgcHJvbWlzZSBjYW5ub3QgYmUgZnVsZmlsbGVkLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gdXNlciBpcyB1bmF2YWlsYWJsZSwgYW5kIHlvdSBhcmUgZ2l2ZW4gdGhlIHJlYXNvbiB3aHlcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIENoYWluaW5nXG4gICAgICAtLS0tLS0tLVxuXG4gICAgICBUaGUgcmV0dXJuIHZhbHVlIG9mIGB0aGVuYCBpcyBpdHNlbGYgYSBwcm9taXNlLiAgVGhpcyBzZWNvbmQsICdkb3duc3RyZWFtJ1xuICAgICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgICAgb3IgcmVqZWN0aW9uIGhhbmRsZXIsIG9yIHJlamVjdGVkIGlmIHRoZSBoYW5kbGVyIHRocm93cyBhbiBleGNlcHRpb24uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgcmV0dXJuICdkZWZhdWx0IG5hbWUnO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGB1c2VyTmFtZWAgd2lsbCBiZSB0aGUgdXNlcidzIG5hbWUsIG90aGVyd2lzZSBpdFxuICAgICAgICAvLyB3aWxsIGJlIGAnZGVmYXVsdCBuYW1lJ2BcbiAgICAgIH0pO1xuXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScpO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5ldmVyIHJlYWNoZWRcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gaWYgYGZpbmRVc2VyYCBmdWxmaWxsZWQsIGByZWFzb25gIHdpbGwgYmUgJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jy5cbiAgICAgICAgLy8gSWYgYGZpbmRVc2VyYCByZWplY3RlZCwgYHJlYXNvbmAgd2lsbCBiZSAnYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScuXG4gICAgICB9KTtcbiAgICAgIGBgYFxuICAgICAgSWYgdGhlIGRvd25zdHJlYW0gcHJvbWlzZSBkb2VzIG5vdCBzcGVjaWZ5IGEgcmVqZWN0aW9uIGhhbmRsZXIsIHJlamVjdGlvbiByZWFzb25zIHdpbGwgYmUgcHJvcGFnYXRlZCBmdXJ0aGVyIGRvd25zdHJlYW0uXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFBlZGFnb2dpY2FsRXhjZXB0aW9uKCdVcHN0cmVhbSBlcnJvcicpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUaGUgYFBlZGdhZ29jaWFsRXhjZXB0aW9uYCBpcyBwcm9wYWdhdGVkIGFsbCB0aGUgd2F5IGRvd24gdG8gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQXNzaW1pbGF0aW9uXG4gICAgICAtLS0tLS0tLS0tLS1cblxuICAgICAgU29tZXRpbWVzIHRoZSB2YWx1ZSB5b3Ugd2FudCB0byBwcm9wYWdhdGUgdG8gYSBkb3duc3RyZWFtIHByb21pc2UgY2FuIG9ubHkgYmVcbiAgICAgIHJldHJpZXZlZCBhc3luY2hyb25vdXNseS4gVGhpcyBjYW4gYmUgYWNoaWV2ZWQgYnkgcmV0dXJuaW5nIGEgcHJvbWlzZSBpbiB0aGVcbiAgICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgICB1bnRpbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBzZXR0bGVkLiBUaGlzIGlzIGNhbGxlZCAqYXNzaW1pbGF0aW9uKi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBUaGUgdXNlcidzIGNvbW1lbnRzIGFyZSBub3cgYXZhaWxhYmxlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBJZiB0aGUgYXNzaW1saWF0ZWQgcHJvbWlzZSByZWplY3RzLCB0aGVuIHRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCBhbHNvIHJlamVjdC5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChjb21tZW50cykge1xuICAgICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIGZ1bGZpbGxzLCB3ZSdsbCBoYXZlIHRoZSB2YWx1ZSBoZXJlXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgcmVqZWN0cywgd2UnbGwgaGF2ZSB0aGUgcmVhc29uIGhlcmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgICAtLS0tLS0tLS0tLS0tLVxuXG4gICAgICBTeW5jaHJvbm91cyBFeGFtcGxlXG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRSZXN1bHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEFkdmFuY2VkIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIGF1dGhvciwgYm9va3M7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1dGhvciA9IGZpbmRBdXRob3IoKTtcbiAgICAgICAgYm9va3MgID0gZmluZEJvb2tzQnlBdXRob3IoYXV0aG9yKTtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfVxuICAgICAgYGBgXG5cbiAgICAgIEVycmJhY2sgRXhhbXBsZVxuXG4gICAgICBgYGBqc1xuXG4gICAgICBmdW5jdGlvbiBmb3VuZEJvb2tzKGJvb2tzKSB7XG5cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmFpbHVyZShyZWFzb24pIHtcblxuICAgICAgfVxuXG4gICAgICBmaW5kQXV0aG9yKGZ1bmN0aW9uKGF1dGhvciwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAvLyBmYWlsdXJlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbmRCb29va3NCeUF1dGhvcihhdXRob3IsIGZ1bmN0aW9uKGJvb2tzLCBlcnIpIHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgIGZhaWx1cmUocmVhc29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBQcm9taXNlIEV4YW1wbGU7XG5cbiAgICAgIGBgYGphdmFzY3JpcHRcbiAgICAgIGZpbmRBdXRob3IoKS5cbiAgICAgICAgdGhlbihmaW5kQm9va3NCeUF1dGhvcikuXG4gICAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAgIC8vIGZvdW5kIGJvb2tzXG4gICAgICB9KS5jYXRjaChmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQG1ldGhvZCB0aGVuXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgICAgQHBhcmFtIHtGdW5jdGlvbn0gb25SZWplY3RlZFxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgdGhlbjogbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQsXG5cbiAgICAvKipcbiAgICAgIGBjYXRjaGAgaXMgc2ltcGx5IHN1Z2FyIGZvciBgdGhlbih1bmRlZmluZWQsIG9uUmVqZWN0aW9uKWAgd2hpY2ggbWFrZXMgaXQgdGhlIHNhbWVcbiAgICAgIGFzIHRoZSBjYXRjaCBibG9jayBvZiBhIHRyeS9jYXRjaCBzdGF0ZW1lbnQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGRuJ3QgZmluZCB0aGF0IGF1dGhvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBzeW5jaHJvbm91c1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmluZEF1dGhvcigpO1xuICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH1cblxuICAgICAgLy8gYXN5bmMgd2l0aCBwcm9taXNlc1xuICAgICAgZmluZEF1dGhvcigpLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIGNhdGNoXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgICAgJ2NhdGNoJzogZnVuY3Rpb24ob25SZWplY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgICAgIHRoaXMuX2luc3RhbmNlQ29uc3RydWN0b3IgPSBDb25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMucHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcblxuICAgICAgaWYgKCF0aGlzLnByb21pc2VbbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUFJPTUlTRV9JRF0pIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbWFrZVByb21pc2UodGhpcy5wcm9taXNlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSR1dGlscyQkaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIHRoaXMubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHRoaXMucHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJHZhbGlkYXRpb25FcnJvcigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkdmFsaWRhdGlvbkVycm9yKCkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsZW5ndGggID0gdGhpcy5sZW5ndGg7XG4gICAgICB2YXIgaW5wdXQgICA9IHRoaXMuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgdGhpcy5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgICAgIHZhciByZXNvbHZlID0gYy5yZXNvbHZlO1xuXG4gICAgICBpZiAocmVzb2x2ZSA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCkge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4oZW50cnkpO1xuXG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCAmJlxuICAgICAgICAgICAgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLl9yZW1haW5pbmctLTtcbiAgICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCkge1xuICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgdGhlbik7XG4gICAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbihyZXNvbHZlKSB7IHJlc29sdmUoZW50cnkpOyB9KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24oc3RhdGUsIGksIHZhbHVlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uKHByb21pc2UsIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG4iLCIvKiFcbiAqIG1pbWUtdHlwZXNcbiAqIENvcHlyaWdodChjKSAyMDE0IEpvbmF0aGFuIE9uZ1xuICogQ29weXJpZ2h0KGMpIDIwMTUgRG91Z2xhcyBDaHJpc3RvcGhlciBXaWxzb25cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbnZhciBkYiA9IHJlcXVpcmUoJ21pbWUtZGInKVxudmFyIGV4dG5hbWUgPSByZXF1aXJlKCdwYXRoJykuZXh0bmFtZVxuXG4vKipcbiAqIE1vZHVsZSB2YXJpYWJsZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbnZhciBleHRyYWN0VHlwZVJlZ0V4cCA9IC9eXFxzKihbXjtcXHNdKikoPzo7fFxcc3wkKS9cbnZhciB0ZXh0VHlwZVJlZ0V4cCA9IC9edGV4dFxcLy9pXG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKiBAcHVibGljXG4gKi9cblxuZXhwb3J0cy5jaGFyc2V0ID0gY2hhcnNldFxuZXhwb3J0cy5jaGFyc2V0cyA9IHsgbG9va3VwOiBjaGFyc2V0IH1cbmV4cG9ydHMuY29udGVudFR5cGUgPSBjb250ZW50VHlwZVxuZXhwb3J0cy5leHRlbnNpb24gPSBleHRlbnNpb25cbmV4cG9ydHMuZXh0ZW5zaW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbClcbmV4cG9ydHMubG9va3VwID0gbG9va3VwXG5leHBvcnRzLnR5cGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4vLyBQb3B1bGF0ZSB0aGUgZXh0ZW5zaW9ucy90eXBlcyBtYXBzXG5wb3B1bGF0ZU1hcHMoZXhwb3J0cy5leHRlbnNpb25zLCBleHBvcnRzLnR5cGVzKVxuXG4vKipcbiAqIEdldCB0aGUgZGVmYXVsdCBjaGFyc2V0IGZvciBhIE1JTUUgdHlwZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHJldHVybiB7Ym9vbGVhbnxzdHJpbmd9XG4gKi9cblxuZnVuY3Rpb24gY2hhcnNldCh0eXBlKSB7XG4gIGlmICghdHlwZSB8fCB0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIFRPRE86IHVzZSBtZWRpYS10eXBlclxuICB2YXIgbWF0Y2ggPSBleHRyYWN0VHlwZVJlZ0V4cC5leGVjKHR5cGUpXG4gIHZhciBtaW1lID0gbWF0Y2ggJiYgZGJbbWF0Y2hbMV0udG9Mb3dlckNhc2UoKV1cblxuICBpZiAobWltZSAmJiBtaW1lLmNoYXJzZXQpIHtcbiAgICByZXR1cm4gbWltZS5jaGFyc2V0XG4gIH1cblxuICAvLyBkZWZhdWx0IHRleHQvKiB0byB1dGYtOFxuICBpZiAobWF0Y2ggJiYgdGV4dFR5cGVSZWdFeHAudGVzdChtYXRjaFsxXSkpIHtcbiAgICByZXR1cm4gJ1VURi04J1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZnVsbCBDb250ZW50LVR5cGUgaGVhZGVyIGdpdmVuIGEgTUlNRSB0eXBlIG9yIGV4dGVuc2lvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtib29sZWFufHN0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBjb250ZW50VHlwZShzdHIpIHtcbiAgLy8gVE9ETzogc2hvdWxkIHRoaXMgZXZlbiBiZSBpbiB0aGlzIG1vZHVsZT9cbiAgaWYgKCFzdHIgfHwgdHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHZhciBtaW1lID0gc3RyLmluZGV4T2YoJy8nKSA9PT0gLTFcbiAgICA/IGV4cG9ydHMubG9va3VwKHN0cilcbiAgICA6IHN0clxuXG4gIGlmICghbWltZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gVE9ETzogdXNlIGNvbnRlbnQtdHlwZSBvciBvdGhlciBtb2R1bGVcbiAgaWYgKG1pbWUuaW5kZXhPZignY2hhcnNldCcpID09PSAtMSkge1xuICAgIHZhciBjaGFyc2V0ID0gZXhwb3J0cy5jaGFyc2V0KG1pbWUpXG4gICAgaWYgKGNoYXJzZXQpIG1pbWUgKz0gJzsgY2hhcnNldD0nICsgY2hhcnNldC50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICByZXR1cm4gbWltZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZGVmYXVsdCBleHRlbnNpb24gZm9yIGEgTUlNRSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJuIHtib29sZWFufHN0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBleHRlbnNpb24odHlwZSkge1xuICBpZiAoIXR5cGUgfHwgdHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBUT0RPOiB1c2UgbWVkaWEtdHlwZXJcbiAgdmFyIG1hdGNoID0gZXh0cmFjdFR5cGVSZWdFeHAuZXhlYyh0eXBlKVxuXG4gIC8vIGdldCBleHRlbnNpb25zXG4gIHZhciBleHRzID0gbWF0Y2ggJiYgZXhwb3J0cy5leHRlbnNpb25zW21hdGNoWzFdLnRvTG93ZXJDYXNlKCldXG5cbiAgaWYgKCFleHRzIHx8ICFleHRzLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgcmV0dXJuIGV4dHNbMF1cbn1cblxuLyoqXG4gKiBMb29rdXAgdGhlIE1JTUUgdHlwZSBmb3IgYSBmaWxlIHBhdGgvZXh0ZW5zaW9uLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcmV0dXJuIHtib29sZWFufHN0cmluZ31cbiAqL1xuXG5mdW5jdGlvbiBsb29rdXAocGF0aCkge1xuICBpZiAoIXBhdGggfHwgdHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBnZXQgdGhlIGV4dGVuc2lvbiAoXCJleHRcIiBvciBcIi5leHRcIiBvciBmdWxsIHBhdGgpXG4gIHZhciBleHRlbnNpb24gPSBleHRuYW1lKCd4LicgKyBwYXRoKVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnN1YnN0cigxKVxuXG4gIGlmICghZXh0ZW5zaW9uKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICByZXR1cm4gZXhwb3J0cy50eXBlc1tleHRlbnNpb25dIHx8IGZhbHNlXG59XG5cbi8qKlxuICogUG9wdWxhdGUgdGhlIGV4dGVuc2lvbnMgYW5kIHR5cGVzIG1hcHMuXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBvcHVsYXRlTWFwcyhleHRlbnNpb25zLCB0eXBlcykge1xuICAvLyBzb3VyY2UgcHJlZmVyZW5jZSAobGVhc3QgLT4gbW9zdClcbiAgdmFyIHByZWZlcmVuY2UgPSBbJ25naW54JywgJ2FwYWNoZScsIHVuZGVmaW5lZCwgJ2lhbmEnXVxuXG4gIE9iamVjdC5rZXlzKGRiKS5mb3JFYWNoKGZ1bmN0aW9uIGZvckVhY2hNaW1lVHlwZSh0eXBlKSB7XG4gICAgdmFyIG1pbWUgPSBkYlt0eXBlXVxuICAgIHZhciBleHRzID0gbWltZS5leHRlbnNpb25zXG5cbiAgICBpZiAoIWV4dHMgfHwgIWV4dHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBtaW1lIC0+IGV4dGVuc2lvbnNcbiAgICBleHRlbnNpb25zW3R5cGVdID0gZXh0c1xuXG4gICAgLy8gZXh0ZW5zaW9uIC0+IG1pbWVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBleHRlbnNpb24gPSBleHRzW2ldXG5cbiAgICAgIGlmICh0eXBlc1tleHRlbnNpb25dKSB7XG4gICAgICAgIHZhciBmcm9tID0gcHJlZmVyZW5jZS5pbmRleE9mKGRiW3R5cGVzW2V4dGVuc2lvbl1dLnNvdXJjZSlcbiAgICAgICAgdmFyIHRvID0gcHJlZmVyZW5jZS5pbmRleE9mKG1pbWUuc291cmNlKVxuXG4gICAgICAgIGlmICh0eXBlc1tleHRlbnNpb25dICE9PSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xuICAgICAgICAgICYmIGZyb20gPiB0byB8fCAoZnJvbSA9PT0gdG8gJiYgdHlwZXNbZXh0ZW5zaW9uXS5zdWJzdHIoMCwgMTIpID09PSAnYXBwbGljYXRpb24vJykpIHtcbiAgICAgICAgICAvLyBza2lwIHRoZSByZW1hcHBpbmdcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHNldCB0aGUgZXh0ZW5zaW9uIC0+IG1pbWVcbiAgICAgIHR5cGVzW2V4dGVuc2lvbl0gPSB0eXBlXG4gICAgfVxuICB9KVxufVxuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcImFwcGxpY2F0aW9uLzFkLWludGVybGVhdmVkLXBhcml0eWZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi8zZ3BkYXNoLXFvZS1yZXBvcnQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uLzNncHAtaW1zK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hMmxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYWN0aXZlbWVzc2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hbHRvLWNvc3RtYXAranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FsdG8tY29zdG1hcGZpbHRlcitqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYWx0by1kaXJlY3RvcnkranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FsdG8tZW5kcG9pbnRjb3N0K2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hbHRvLWVuZHBvaW50Y29zdHBhcmFtcytqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYWx0by1lbmRwb2ludHByb3AranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FsdG8tZW5kcG9pbnRwcm9wcGFyYW1zK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hbHRvLWVycm9yK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hbHRvLW5ldHdvcmttYXAranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FsdG8tbmV0d29ya21hcGZpbHRlcitqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYW1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FuZHJldy1pbnNldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImV6XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYXBwbGVmaWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2FwcGxpeHdhcmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImF3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYXRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2F0ZnhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYXRvbSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImF0b21cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hdG9tY2F0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImF0b21jYXRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hdG9tZGVsZXRlZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYXRvbWljbWFpbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hdG9tc3ZjK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImF0b21zdmNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hdHhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9hdXRoLXBvbGljeSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYmFjbmV0LXhkZCt6aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vYmF0Y2gtc210cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9iZG9jXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYmRvY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2JlZXAreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NhbGVuZGFyK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jYWxlbmRhcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY2FsbC1jb21wbGV0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NhbHMtMTg0MFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jYm9yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NjbXAreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NjeG1sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNjeG1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY2RmeCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY2RtaS1jYXBhYmlsaXR5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2RtaWFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jZG1pLWNvbnRhaW5lclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNkbWljXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY2RtaS1kb21haW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjZG1pZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NkbWktb2JqZWN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2RtaW9cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jZG1pLXF1ZXVlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2RtaXFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jZG5pXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NlYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jZWEtMjAxOCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY2VsbG1sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jZndcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY21zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NucnAreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NvYXAtZ3JvdXAranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NvbW1vbmdyb3VuZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9jb25mZXJlbmNlLWluZm8reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2NwbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY3NyYXR0cnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY3N0YSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vY3N0YWRhdGEreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2Nzdm0ranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2N1LXNlZW1lXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjdVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2N5YmVyY2FzaFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kYXJ0XCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZGFzaCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcGRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kYXNoZGVsdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZGF2bW91bnQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZGF2bW91bnRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kY2EtcmZ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2RjZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kZWMtZHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZGlhbG9nLWluZm8reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2RpY29tXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2RpaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kaXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZG5zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2RvY2Jvb2sreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkYmtcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9kc2twcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZHNzYytkZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkc3NjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZHNzYyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4ZHNzY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2R2Y3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZWNtYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2VkaS1jb25zZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2VkaS14MTJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZWRpZmFjdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9lZmlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZW1lcmdlbmN5Y2FsbGRhdGEuY29tbWVudCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZW1lcmdlbmN5Y2FsbGRhdGEuZGV2aWNlaW5mbyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZW1lcmdlbmN5Y2FsbGRhdGEucHJvdmlkZXJpbmZvK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9lbWVyZ2VuY3ljYWxsZGF0YS5zZXJ2aWNlaW5mbyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZW1lcmdlbmN5Y2FsbGRhdGEuc3Vic2NyaWJlcmluZm8reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2VtbWEreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZW1tYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2Vtb3Rpb25tbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZW5jYXBydHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZXBwK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9lcHViK3ppcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVwdWJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9lc2hvcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9leGlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJleGlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9mYXN0aW5mb3NldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9mYXN0c29hcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9mZHQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2ZpdHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZm9udC1zZm50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2ZvbnQtdGRwZnJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwZnJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9mb250LXdvZmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3b2ZmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZm9udC13b2ZmMlwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndvZmYyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZnJhbWV3b3JrLWF0dHJpYnV0ZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2dtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdtbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2dweCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdweFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2d4ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ3hmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vZ3ppcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9oMjI0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2hlbGQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2h0dHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vaHlwZXJzdHVkaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdGtcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9pYmUta2V5LXJlcXVlc3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2liZS1wa2ctcmVwbHkreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2liZS1wcC1kYXRhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2lnZXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vaW0taXNjb21wb3NpbmcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2luZGV4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2luZGV4LmNtZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9pbmRleC5vYmpcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vaW5kZXgucmVzcG9uc2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vaW5kZXgudm5kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2lua21sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlua1wiLFwiaW5rbWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9pb3RwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2lwZml4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaXBmaXhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9pcHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vaXN1cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9pdHMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2phdmEtYXJjaGl2ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiamFyXCIsXCJ3YXJcIixcImVhclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2phdmEtc2VyaWFsaXplZC1vYmplY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNlclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2phdmEtdm1cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNsYXNzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjaGFyc2V0XCI6IFwiVVRGLThcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2pvc2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vam9zZStqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vanJkK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNoYXJzZXRcIjogXCJVVEYtOFwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImpzb25cIixcIm1hcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2pzb24tcGF0Y2granNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2pzb24tc2VxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2pzb241XCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wianNvbjVcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9qc29ubWwranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqc29ubWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9qd2sranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2p3ay1zZXQranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2p3dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9rcG1sLXJlcXVlc3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2twbWwtcmVzcG9uc2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2xkK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImpzb25sZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL2xpbmstZm9ybWF0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2xvYWQtY29udHJvbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbG9zdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsb3N0eG1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbG9zdHN5bmMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL2x4ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYWMtYmluaGV4NDBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJocXhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYWMtY29tcGFjdHByb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY3B0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWFjd3JpdGVpaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYWRzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1hZHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYW5pZmVzdCtqc29uXCI6IHtcbiAgICBcImNoYXJzZXRcIjogXCJVVEYtOFwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndlYm1hbmlmZXN0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWFyY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1yY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21hcmN4bWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXJjeFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21hdGhlbWF0aWNhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWFcIixcIm5iXCIsXCJtYlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21hdGhtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtYXRobWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYXRobWwtY29udGVudCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWF0aG1sLXByZXNlbnRhdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWJtcy1hc3NvY2lhdGVkLXByb2NlZHVyZS1kZXNjcmlwdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWJtcy1kZXJlZ2lzdGVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLWVudmVsb3BlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLW1zayt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWJtcy1tc2stcmVzcG9uc2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL21ibXMtcHJvdGVjdGlvbi1kZXNjcmlwdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWJtcy1yZWNlcHRpb24tcmVwb3J0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLXJlZ2lzdGVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLXJlZ2lzdGVyLXJlc3BvbnNlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLXNjaGVkdWxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tYm1zLXVzZXItc2VydmljZS1kZXNjcmlwdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWJveFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1ib3hcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tZWRpYS1wb2xpY3ktZGF0YXNldCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWVkaWFfY29udHJvbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWVkaWFzZXJ2ZXJjb250cm9sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1zY21sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWVyZ2UtcGF0Y2granNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21ldGFsaW5rK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWV0YWxpbmtcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tZXRhbGluazQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWV0YTRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tZXRzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1ldHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tZjRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbWlrZXlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbW9kcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtb2RzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbW9zcy1rZXlzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL21vc3Mtc2lnbmF0dXJlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL21vc3NrZXktZGF0YVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tb3Nza2V5LXJlcXVlc3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbXAyMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm0yMVwiLFwibXAyMVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21wNFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1wNHNcIixcIm00cFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL21wZWc0LWdlbmVyaWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbXBlZzQtaW9kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL21wZWc0LWlvZC14bXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbXJiLWNvbnN1bWVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tcmItcHVibGlzaCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbXNjLWl2cit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbXNjLW1peGVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9tc3dvcmRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkb2NcIixcImRvdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL214ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm14ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL25hc2RhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbmV3cy1jaGVja2dyb3Vwc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9uZXdzLWdyb3VwaW5mb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9uZXdzLXRyYW5zbWlzc2lvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9ubHNtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vbnNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL29jc3AtcmVxdWVzdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9vY3NwLXJlc3BvbnNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJpblwiLFwiZG1zXCIsXCJscmZcIixcIm1hclwiLFwic29cIixcImRpc3RcIixcImRpc3R6XCIsXCJwa2dcIixcImJwa1wiLFwiZHVtcFwiLFwiZWxjXCIsXCJkZXBsb3lcIixcImV4ZVwiLFwiZGxsXCIsXCJkZWJcIixcImRtZ1wiLFwiaXNvXCIsXCJpbWdcIixcIm1zaVwiLFwibXNwXCIsXCJtc21cIixcImJ1ZmZlclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL29kYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9kYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL29keFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9vZWJwcy1wYWNrYWdlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9wZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL29nZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9neFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL29tZG9jK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib21kb2NcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9vbmVub3RlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvbmV0b2NcIixcIm9uZXRvYzJcIixcIm9uZXRtcFwiLFwib25lcGtnXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vb3hwc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm94cHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wMnAtb3ZlcmxheSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGFyaXR5ZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BhdGNoLW9wcy1lcnJvcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4ZXJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wZGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwZGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wZHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGdwLWVuY3J5cHRlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBncFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BncC1rZXlzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BncC1zaWduYXR1cmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhc2NcIixcInNpZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BpY3MtcnVsZXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInByZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BpZGYreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BpZGYtZGlmZit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGtjczEwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicDEwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGtjczEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BrY3M3LW1pbWVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwN21cIixcInA3Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BrY3M3LXNpZ25hdHVyZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInA3c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3BrY3M4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicDhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wa2l4LWF0dHItY2VydFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGtpeC1jZXJ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2VyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGtpeC1jcmxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjcmxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wa2l4LXBraXBhdGhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwa2lwYXRoXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcGtpeGNtcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBraVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bscyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwbHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wb2Mtc2V0dGluZ3MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bvc3RzY3JpcHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFpXCIsXCJlcHNcIixcInBzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcHBzcC10cmFja2VyK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wcm9ibGVtK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wcm9ibGVtK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wcm92ZW5hbmNlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wcnMuYWx2ZXN0cmFuZC50aXRyYXgtc2hlZXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcHJzLmN3d1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImN3d1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bycy5ocHViK3ppcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9wcnMubnByZW5kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bycy5wbHVja2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bycy5yZGYteG1sLWNyeXB0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bycy54c2YreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Bza2MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHNrY3htbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3FzaWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcmFwdG9yZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3JkYXAranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3JkZit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJkZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3JlZ2luZm8reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicmlmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcmVsYXgtbmctY29tcGFjdC1zeW50YXhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJybmNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9yZW1vdGUtcHJpbnRpbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcmVwdXRvbitqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcmVzb3VyY2UtbGlzdHMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicmxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9yZXNvdXJjZS1saXN0cy1kaWZmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJsZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3JmYyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcmlzY29zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3JsbWkreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Jscy1zZXJ2aWNlcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Jwa2ktZ2hvc3RidXN0ZXJzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ2JyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcnBraS1tYW5pZmVzdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1mdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3Jwa2ktcm9hXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicm9hXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcnBraS11cGRvd25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcnNkK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnNkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vcnNzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyc3NcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9ydGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJ0ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3J0cGxvb3BiYWNrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3J0eFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zYW1sYXNzZXJ0aW9uK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zYW1sbWV0YWRhdGEreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NibWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2JtbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NjYWlwK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zY2ltK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zY3ZwLWN2LXJlcXVlc3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzY3FcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zY3ZwLWN2LXJlc3BvbnNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2NzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2N2cC12cC1yZXF1ZXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3BxXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2N2cC12cC1yZXNwb25zZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNwcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NkcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNkcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NlcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2VwLWV4aVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zZXNzaW9uLWluZm9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2V0LXBheW1lbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2V0LXBheW1lbnQtaW5pdGlhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNldHBheVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NldC1yZWdpc3RyYXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2V0LXJlZ2lzdHJhdGlvbi1pbml0aWF0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2V0cmVnXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2dtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zZ21sLW9wZW4tY2F0YWxvZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zaGYreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2hmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2lldmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2ltcGxlLWZpbHRlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2ltcGxlLW1lc3NhZ2Utc3VtbWFyeVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zaW1wbGVzeW1ib2xjb250YWluZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc2xhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc21pbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zbWlsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNtaVwiLFwic21pbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NtcHRlMzM2bVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zb2FwK2Zhc3RpbmZvc2V0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NvYXAreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc3BhcnFsLXF1ZXJ5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zcGFycWwtcmVzdWx0cyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzcnhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zcGlyaXRzLWV2ZW50K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zcWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc3Jnc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdyYW1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi9zcmdzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdyeG1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc3J1K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNydVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3NzZGwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzc2RsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vc3NtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzc21sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdGFtcC1hcGV4LXVwZGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90YW1wLWFwZXgtdXBkYXRlLWNvbmZpcm1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdGFtcC1jb21tdW5pdHktdXBkYXRlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RhbXAtY29tbXVuaXR5LXVwZGF0ZS1jb25maXJtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RhbXAtZXJyb3JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdGFtcC1zZXF1ZW5jZS1hZGp1c3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdGFtcC1zZXF1ZW5jZS1hZGp1c3QtY29uZmlybVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90YW1wLXN0YXR1cy1xdWVyeVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90YW1wLXN0YXR1cy1yZXNwb25zZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90YW1wLXVwZGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90YW1wLXVwZGF0ZS1jb25maXJtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RhclwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RlaSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0ZWlcIixcInRlaWNvcnB1c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RocmF1ZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0ZmlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90aW1lc3RhbXAtcXVlcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdGltZXN0YW1wLXJlcGx5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3RpbWVzdGFtcGVkLWRhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0c2RcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90dG1sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi90dmUtdHJpZ2dlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi91bHBmZWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdXJjLWdycHNoZWV0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi91cmMtcmVzc2hlZXQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3VyYy10YXJnZXRkZXNjK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi91cmMtdWlzb2NrZXRkZXNjK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92Y2FyZCtqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdmNhcmQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZlbW1pXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZpdmlkZW5jZS5zY3JpcHRmaWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAtcHJvc2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC4zZ3BwLXByb3NlLXBjM2NoK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5hY2Nlc3MtdHJhbnNmZXItZXZlbnRzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5ic2YreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC4zZ3BwLm1pZC1jYWxsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctbGFyZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwbGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctc21hbGxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwc2JcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5waWMtYnctdmFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHZiXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAuc21zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC4zZ3BwLnNtcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAuc3J2Y2MtZXh0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5zcnZjYy1pbmZvK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcC5zdGF0ZS1hbmQtZXZlbnQtaW5mbyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAudXNzZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAyLmJjbWNzaW5mbyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLjNncHAyLnNtc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2dwcDIudGNhcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRjYXBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM2xpZ2h0c3NvZnR3YXJlLmltYWdlc2NhbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuM20ucG9zdC1pdC1ub3Rlc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInB3blwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hY2NwYWMuc2ltcGx5LmFzb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFzb1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hY2NwYWMuc2ltcGx5LmltcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImltcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hY3Vjb2JvbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFjdVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hY3Vjb3JwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXRjXCIsXCJhY3V0Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5haXItYXBwbGljYXRpb24taW5zdGFsbGVyLXBhY2thZ2UremlwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhaXJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWRvYmUuZmxhc2gubW92aWVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFkb2JlLmZvcm1zY2VudHJhbC5mY2R0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmNkdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5meHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmeHBcIixcImZ4cGxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWRvYmUucGFydGlhbC11cGxvYWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFkb2JlLnhkcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4ZHBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWRvYmUueGZkZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhmZGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWV0aGVyLmltcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWgtYmFyY29kZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWhlYWQuc3BhY2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhaGVhZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5haXJ6aXAuZmlsZXNlY3VyZS5hemZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhemZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYWlyemlwLmZpbGVzZWN1cmUuYXpzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXpzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFtYXpvbi5lYm9va1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXp3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFtZXJpY2FuZHluYW1pY3MuYWNjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYWNjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFtaWdhLmFtaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFtaVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hbXVuZHNlbi5tYXplK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYW5kcm9pZC5wYWNrYWdlLWFyY2hpdmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFwa1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hbmtpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hbnNlci13ZWItY2VydGlmaWNhdGUtaXNzdWUtaW5pdGlhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNpaVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hbnNlci13ZWItZnVuZHMtdHJhbnNmZXItaW5pdGlhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZnRpXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFudGl4LmdhbWUtY29tcG9uZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXR4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFwYWNoZS50aHJpZnQuYmluYXJ5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hcGFjaGUudGhyaWZ0LmNvbXBhY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFwYWNoZS50aHJpZnQuanNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXBwbGUuaW5zdGFsbGVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1wa2dcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXBwbGUubXBlZ3VybFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm0zdThcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXBwbGUucGtwYXNzXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicGtwYXNzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmFyYXN0cmEuc3dpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hcmlzdGFuZXR3b3Jrcy5zd2lcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzd2lcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXJ0c3F1YXJlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5hc3RyYWVhLXNvZnR3YXJlLmlvdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpb3RhXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmF1ZGlvZ3JhcGhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhZXBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYXV0b3BhY2thZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmF2aXN0YXIreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5iYWxzYW1pcS5ibW1sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYmFsc2FtaXEuYm1wclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYmVraXR6dXItc3RlY2granNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5iaW9wYXgucmRmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYmx1ZWljZS5tdWx0aXBhc3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcG1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYmx1ZXRvb3RoLmVwLm9vYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYmx1ZXRvb3RoLmxlLm9vYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuYm1pXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYm1pXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmJ1c2luZXNzb2JqZWN0c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJlcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jYWItanNjcmlwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2Fub24tY3BkbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2Fub24tbGlwc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2VuZGlvLnRoaW5saW5jLmNsaWVudGNvbmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNlbnR1cnktc3lzdGVtcy50Y3Bfc3RyZWFtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jaGVtZHJhdyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjZHhtbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jaGlwbnV0cy5rYXJhb2tlLW1tZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1tZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jaW5kZXJlbGxhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2R5XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNpcnBhY2suaXNkbi1leHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNpdGF0aW9uc3R5bGVzLnN0eWxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2xheW1vcmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjbGFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2xvYW50by5ycDlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJycDlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2xvbmsuYzRncm91cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImM0Z1wiLFwiYzRkXCIsXCJjNGZcIixcImM0cFwiLFwiYzR1XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNsdWV0cnVzdC5jYXJ0b21vYmlsZS1jb25maWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjMTFhbWNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY2x1ZXRydXN0LmNhcnRvbW9iaWxlLWNvbmZpZy1wa2dcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjMTFhbXpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY29mZmVlc2NyaXB0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jb2xsZWN0aW9uK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY29sbGVjdGlvbi5kb2MranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jb2xsZWN0aW9uLm5leHQranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jb21tZXJjZS1iYXR0ZWxsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY29tbW9uc3BhY2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjc3BcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY29udGFjdC5jbXNnXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2RiY21zZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jb3Jlb3MuaWduaXRpb24ranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jb3Ntb2NhbGxlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNtY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2xreFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLmtleWJvYXJkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2xra1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jcmljay5jbGlja2VyLnBhbGV0dGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjbGtwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIudGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjbGt0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNyaWNrLmNsaWNrZXIud29yZGJhbmtcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjbGt3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmNyaXRpY2FsdG9vbHMud2JzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndic1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jdGMtcG9zbWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwbWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY3RjdC53cyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmN1cHMtcGRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jdXBzLXBvc3RzY3JpcHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmN1cHMtcHBkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHBkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmN1cHMtcmFzdGVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jdXBzLXJhd1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY3VybFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuY3VybC5jYXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNhclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jdXJsLnBjdXJsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwY3VybFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5jeWFuLmRlYW4ucm9vdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmN5YmFua1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZGFydFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZGFydFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kYXRhLXZpc2lvbi5yZHpcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyZHpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZGViaWFuLmJpbmFyeS1wYWNrYWdlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLmRhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1dmZcIixcInV2dmZcIixcInV2ZFwiLFwidXZ2ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kZWNlLnR0bWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widXZ0XCIsXCJ1dnZ0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRlY2UudW5zcGVjaWZpZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1dnhcIixcInV2dnhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZGVjZS56aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1dnpcIixcInV2dnpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZGVub3ZvLmZjc2VsYXlvdXQtbGlua1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZlX2xhdW5jaFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kZXNtdW1lLW1vdmllXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kZXNtdW1lLm1vdmllXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRpci1iaS5wbGF0ZS1kbC1ub3N1ZmZpeFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZG0uZGVsZWdhdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRuYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRuYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kb2N1bWVudCtqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRvbGJ5Lm1scFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWxwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRvbGJ5Lm1vYmlsZS4xXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kb2xieS5tb2JpbGUuMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZG9yZW1pci5zY29yZWNsb3VkLWJpbmFyeS1kb2N1bWVudFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHBncmFwaFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRwZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kcmVhbWZhY3RvcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkZmFjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmRyaXZlK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHMta2V5cG9pbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImtweHhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHRnLmxvY2FsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdGcubG9jYWwuZmxhc2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmR0Zy5sb2NhbC5odG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuYWl0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYWl0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmR2Yi5kdmJqXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuZXNnY29udGFpbmVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuaXBkY2RmdG5vdGlmYWNjZXNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuaXBkY2VzZ2FjY2Vzc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLmlwZGNlc2dhY2Nlc3MyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuaXBkY2VzZ3BkZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLmlwZGNyb2FtaW5nXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuaXB0di5hbGZlYy1iYXNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuaXB0di5hbGZlYy1lbmhhbmNlbWVudFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLm5vdGlmLWFnZ3JlZ2F0ZS1yb290K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLm5vdGlmLWNvbnRhaW5lcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmR2Yi5ub3RpZi1nZW5lcmljK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLm5vdGlmLWlhLW1zZ2xpc3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIubm90aWYtaWEtcmVnaXN0cmF0aW9uLXJlcXVlc3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIubm90aWYtaWEtcmVnaXN0cmF0aW9uLXJlc3BvbnNlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHZiLm5vdGlmLWluaXQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIucGZyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5kdmIuc2VydmljZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN2Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5keHJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmR5bmFnZW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJnZW9cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZHpyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lYXN5a2FyYW9rZS5jZGdkb3dubG9hZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZWNkaXMtdXBkYXRlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lY293aW4uY2hhcnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtYWdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZWNvd2luLmZpbGVyZXF1ZXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lY293aW4uZmlsZXVwZGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZWNvd2luLnNlcmllc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZWNvd2luLnNlcmllc3JlcXVlc3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVjb3dpbi5zZXJpZXN1cGRhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVtY2xpZW50LmFjY2Vzc3JlcXVlc3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lbmxpdmVuXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibm1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVucGhhc2UuZW52b3lcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVwcmludHMuZGF0YSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVwc29uLmVzZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVzZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5tc2ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtc2ZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXBzb24ucXVpY2thbmltZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInFhbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lcHNvbi5zYWx0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2x0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVwc29uLnNzZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNzZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5lcmljc3Nvbi5xdWlja2NhbGxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmVzemlnbm8zK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVzM1wiLFwiZXQzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuYW9jK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXRzaS5hc2ljLWUremlwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ldHNpLmFzaWMtcyt6aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuY3VnK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXRzaS5pcHR2Y29tbWFuZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuaXB0dmRpc2NvdmVyeSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuaXB0dnByb2ZpbGUreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ldHNpLmlwdHZzYWQtYmMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ldHNpLmlwdHZzYWQtY29kK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXRzaS5pcHR2c2FkLW5wdnIreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ldHNpLmlwdHZzZXJ2aWNlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXRzaS5pcHR2c3luYyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuaXB0dnVlcHJvZmlsZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kubWNpZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kubWhlZzVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kub3ZlcmxvYWQtY29udHJvbC1wb2xpY3ktZGF0YXNldCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kucHN0bit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kuc2NpK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXRzaS5zaW1zZXJ2cyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kudGltZXN0YW1wLXRva2VuXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ldHNpLnRzbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV0c2kudHNsLmRlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZXVkb3JhLmRhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV6cGl4LWFsYnVtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZXoyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmV6cGl4LXBhY2thZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJlejNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZi1zZWN1cmUubW9iaWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mYXN0Y29weS1kaXNrLWltYWdlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mZGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmZGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZmRzbi5tc2VlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1zZWVkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZkc24uc2VlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNlZWRcIixcImRhdGFsZXNzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZmc25zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5maWxtaXQuemZjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5maW50c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZmlyZW1vbmtleXMuY2xvdWRjZWxsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mbG9ncmFwaGl0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ3BoXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZsdXh0aW1lLmNsaXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmdGNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZm9udC1mb250Zm9yZ2Utc2ZkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mcmFtZW1ha2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZm1cIixcImZyYW1lXCIsXCJtYWtlclwiLFwiYm9va1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmZuY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZuY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mcm9nYW5zLmx0ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImx0ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mc2Mud2VibGF1bmNoXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZnNjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvYXNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvYTJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5czNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvYTNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXRzdS5vYXN5c2dwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmc1XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZ1aml0c3Uub2FzeXNwcnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJiaDJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmFydC1leFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmFydDRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZ1aml4ZXJveC5kZGRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkZGRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmRvY3V3b3Jrc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhkd1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mdWppeGVyb3guZG9jdXdvcmtzLmJpbmRlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhiZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5mdWppeGVyb3guZG9jdXdvcmtzLmNvbnRhaW5lclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZnVqaXhlcm94LmhicGxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZ1dC1taXNuZXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmZ1enp5c2hlZXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmenNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ2Vub21hdGl4LnR1eGVkb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInR4ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nZW8ranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nZW9jdWJlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ2VvZ2VicmEuZmlsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdnYlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nZW9nZWJyYS50b29sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ2d0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdlb21ldHJ5LWV4cGxvcmVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ2V4XCIsXCJncmVcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ2VvbmV4dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImd4dFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nZW9wbGFuXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZzJ3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdlb3NwYWNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZzN3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdlcmJlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ2xvYmFscGxhdGZvcm0uY2FyZC1jb250ZW50LW1ndFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ2xvYmFscGxhdGZvcm0uY2FyZC1jb250ZW50LW1ndC1yZXNwb25zZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ214XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ214XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLmRvY3VtZW50XCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ2RvY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nb29nbGUtYXBwcy5wcmVzZW50YXRpb25cIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJnc2xpZGVzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLnNwcmVhZHNoZWV0XCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ3NoZWV0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS1lYXJ0aC5rbWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJrbWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWVhcnRoLmttelwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImttelwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5nb3Yuc2suZS1mb3JtK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ292LnNrLmUtZm9ybSt6aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmdvdi5zay54bWxkYXRhY29udGFpbmVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ3JhZmVxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZ3FmXCIsXCJncXNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ3JpZG1wXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtYWNjb3VudFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdhY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtaGVscFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdoZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtaWRlbnRpdHktbWVzc2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdpbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtaW5qZWN0b3JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJncnZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuZ3Jvb3ZlLXRvb2wtbWVzc2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImd0bVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtdG9vbC10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRwbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ncm9vdmUtdmNhcmRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2Y2dcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaGFsK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaGFsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImhhbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oYW5kaGVsZC1lbnRlcnRhaW5tZW50K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInptbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oYmNpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaGJjaVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oY2wtYmlyZXBvcnRzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oZHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhlcm9rdStqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhoZS5sZXNzb24tcGxheWVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibGVzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhwLWhwZ2xcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJocGdsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhwLWhwaWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJocGlkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhwLWhwc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImhwc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ocC1qbHl0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiamx0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmhwLXBjbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBjbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ocC1wY2x4bFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBjbHhsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmh0dHBob25lXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oeWRyb3N0YXRpeC5zb2YtZGF0YVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNmZC1oZHN0eFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5oeXBlcmRyaXZlK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaHpuLTNkLWNyb3Nzd29yZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWJtLmFmcGxpbmVkYXRhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pYm0uZWxlY3Ryb25pYy1tZWRpYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWJtLm1pbmlwYXlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcHlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWJtLm1vZGNhcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFmcFwiLFwibGlzdGFmcFwiLFwibGlzdDM4MjBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWJtLnJpZ2h0cy1tYW5hZ2VtZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaXJtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmlibS5zZWN1cmUtY29udGFpbmVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2NcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWNjcHJvZmlsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImljY1wiLFwiaWNtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmllZWUuMTkwNVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaWdsb2FkZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpZ2xcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaW1tZXJ2aXNpb24taXZwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaXZwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmltbWVydmlzaW9uLWl2dVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIml2dVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbXMuaW1zY2N2MXAxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbXMuaW1zY2N2MXAyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbXMuaW1zY2N2MXAzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbXMubGlzLnYyLnJlc3VsdCtqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmltcy5sdGkudjIudG9vbGNvbnN1bWVycHJvZmlsZStqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmltcy5sdGkudjIudG9vbHByb3h5K2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaW1zLmx0aS52Mi50b29scHJveHkuaWQranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbXMubHRpLnYyLnRvb2xzZXR0aW5ncytqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmltcy5sdGkudjIudG9vbHNldHRpbmdzLnNpbXBsZStqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmluZm9ybWVkY29udHJvbC5ybXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbmZvcm1peC12aXNpb25hcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmluZm90ZWNoLnByb2plY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmluZm90ZWNoLnByb2plY3QreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbm5vcGF0aC53YW1wLm5vdGlmaWNhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaW5zb3JzLmlnbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlnbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbnRlcmNvbi5mb3JtbmV0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHB3XCIsXCJ4cHhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaW50ZXJnZW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpMmdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaW50ZXJ0cnVzdC5kaWdpYm94XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pbnRlcnRydXN0Lm5uY3BcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmludHUucWJvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicWJvXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmludHUucWZ4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicWZ4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmlwdGMuZzIuY2F0YWxvZ2l0ZW0reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pcHRjLmcyLmNvbmNlcHRpdGVtK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaXB0Yy5nMi5rbm93bGVkZ2VpdGVtK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaXB0Yy5nMi5uZXdzaXRlbSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmlwdGMuZzIubmV3c21lc3NhZ2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pcHRjLmcyLnBhY2thZ2VpdGVtK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaXB0Yy5nMi5wbGFubmluZ2l0ZW0reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5pcHVucGx1Z2dlZC5yY3Byb2ZpbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyY3Byb2ZpbGVcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaXJlcG9zaXRvcnkucGFja2FnZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpcnBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuaXMteHByXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHByXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmlzYWMuZmNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmNzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmphbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImphbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5qYXBhbm5ldC1kaXJlY3Rvcnktc2VydmljZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuamFwYW5uZXQtanBuc3RvcmUtd2FrZXVwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5qYXBhbm5ldC1wYXltZW50LXdha2V1cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuamFwYW5uZXQtcmVnaXN0cmF0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5qYXBhbm5ldC1yZWdpc3RyYXRpb24td2FrZXVwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5qYXBhbm5ldC1zZXRzdG9yZS13YWtldXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmphcGFubmV0LXZlcmlmaWNhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuamFwYW5uZXQtdmVyaWZpY2F0aW9uLXdha2V1cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuamNwLmphdmFtZS5taWRsZXQtcm1zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicm1zXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmppc3BcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqaXNwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmpvb3N0LmpvZGEtYXJjaGl2ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImpvZGFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuanNrLmlzZG4tbmduXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5rYWhvb3R6XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia3R6XCIsXCJrdHJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2RlLmthcmJvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImthcmJvblwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5rZGUua2NoYXJ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2hydFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5rZGUua2Zvcm11bGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJrZm9cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2RlLmtpdmlvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmx3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmtkZS5rb250b3VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia29uXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmtkZS5rcHJlc2VudGVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia3ByXCIsXCJrcHRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2RlLmtzcHJlYWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJrc3BcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2RlLmt3b3JkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia3dkXCIsXCJrd3RcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2VuYW1lYWFwcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImh0a2VcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua2lkc3BpcmF0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia2lhXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmtpbmFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wia25lXCIsXCJrbnBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQua29hblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNrcFwiLFwic2tkXCIsXCJza3RcIixcInNrbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5rb2Rhay1kZXNjcmlwdG9yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3NlXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxhcy5sYXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibGFzeG1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxpYmVydHktcmVxdWVzdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxsYW1hZ3JhcGhpY3MubGlmZS1iYWxhbmNlLmRlc2t0b3BcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsYmRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubGxhbWFncmFwaGljcy5saWZlLWJhbGFuY2UuZXhjaGFuZ2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibGJlXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLTEtMi0zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiMTIzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLWFwcHJvYWNoXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXByXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLWZyZWVsYW5jZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInByZVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1ub3Rlc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm5zZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5sb3R1cy1vcmdhbml6ZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvcmdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubG90dXMtc2NyZWVuY2FtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2NtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLmxvdHVzLXdvcmRwcm9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsd3BcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWFjcG9ydHMucG9ydHBrZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBvcnRwa2dcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWFwYm94LXZlY3Rvci10aWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tYXJsaW4uZHJtLmFjdGlvbnRva2VuK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWFybGluLmRybS5jb25mdG9rZW4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tYXJsaW4uZHJtLmxpY2Vuc2UreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tYXJsaW4uZHJtLm1kY2ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1hc29uK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWF4bWluZC5tYXhtaW5kLWRiXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tY2RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtY2RcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWVkY2FsY2RhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtYzFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWVkaWFzdGF0aW9uLmNka2V5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2RrZXlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWVyaWRpYW4tc2xpbmdzaG90XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tZmVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXdmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1mbXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtZm1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWljcm8ranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmZsb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZsb1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5taWNyb2dyYWZ4LmlneFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlneFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5taWNyb3NvZnQucG9ydGFibGUtZXhlY3V0YWJsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWllbGUranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5taWZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtaWZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubWluaXNvZnQtaHAzMDAwLXNhdmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1pdHN1YmlzaGkubWlzdHktZ3VhcmQudHJ1c3R3ZWJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy5kYWZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkYWZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubW9iaXVzLmRpc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRpc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMubWJrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWJrXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy5tcXlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcXlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubW9iaXVzLm1zbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1zbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tb2JpdXMucGxjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicGxjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vYml1cy50eGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0eGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubW9waHVuLmFwcGxpY2F0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXBuXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vcGh1bi5jZXJ0aWZpY2F0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1wY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tb3Rvcm9sYS5mbGV4c3VpdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vdG9yb2xhLmZsZXhzdWl0ZS5hZHNpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tb3Rvcm9sYS5mbGV4c3VpdGUuZmlzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tb3Rvcm9sYS5mbGV4c3VpdGUuZ290YXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vdG9yb2xhLmZsZXhzdWl0ZS5rbXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vdG9yb2xhLmZsZXhzdWl0ZS50dGNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vdG9yb2xhLmZsZXhzdWl0ZS53ZW1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vdG9yb2xhLmlwcm1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1vemlsbGEueHVsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHVsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLTNtZmRvY3VtZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1hcnRnYWxyeVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNpbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1hc2ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLWNhYi1jb21wcmVzc2VkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2FiXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLWNvbG9yLmljY3Byb2ZpbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtZXhjZWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4bHNcIixcInhsbVwiLFwieGxhXCIsXCJ4bGNcIixcInhsdFwiLFwieGx3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLmFkZGluLm1hY3JvZW5hYmxlZC4xMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhsYW1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQuYmluYXJ5Lm1hY3JvZW5hYmxlZC4xMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhsc2JcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQubWFjcm9lbmFibGVkLjEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGxzbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC50ZW1wbGF0ZS5tYWNyb2VuYWJsZWQuMTJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4bHRtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVvdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1odG1saGVscFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNobVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1pbXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpbXNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtbHJtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibHJtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLW9mZmljZS5hY3RpdmV4K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtb2ZmaWNldGhlbWVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0aG14XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLW9wZW50eXBlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtcGFja2FnZS5vYmZ1c2NhdGVkLW9wZW50eXBlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXBraS5zZWNjYXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNhdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wa2kuc3RsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdGxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtcGxheXJlYWR5LmluaXRpYXRvcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcHRcIixcInBwc1wiLFwicG90XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQuYWRkaW4ubWFjcm9lbmFibGVkLjEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHBhbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnByZXNlbnRhdGlvbi5tYWNyb2VuYWJsZWQuMTJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcHRtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQuc2xpZGUubWFjcm9lbmFibGVkLjEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2xkbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50LnNsaWRlc2hvdy5tYWNyb2VuYWJsZWQuMTJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcHNtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQudGVtcGxhdGUubWFjcm9lbmFibGVkLjEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicG90bVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wcmludGRldmljZWNhcGFiaWxpdGllcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXByaW50aW5nLnByaW50dGlja2V0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy1wcmludHNjaGVtYXRpY2tldCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXByb2plY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcHBcIixcIm1wdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy10bmVmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy13aW5kb3dzLmRldmljZXBhaXJpbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXdpbmRvd3MubndwcmludGluZy5vb2JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXdpbmRvd3MucHJpbnRlcnBhaXJpbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXdpbmRvd3Mud3NkLm9vYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtd21kcm0ubGljLWNobGctcmVxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy13bWRybS5saWMtcmVzcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtd21kcm0ubWV0ZXItY2hsZy1yZXFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXdtZHJtLm1ldGVyLXJlc3BcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXdvcmQuZG9jdW1lbnQubWFjcm9lbmFibGVkLjEyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZG9jbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tcy13b3JkLnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRvdG1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtd29ya3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3cHNcIixcIndrc1wiLFwid2NtXCIsXCJ3ZGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXMtd3BsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid3BsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zLXhwc2RvY3VtZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHBzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm1zYS1kaXNrLWltYWdlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tc2VxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXNlcVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tc2lnblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXVsdGlhZC5jcmVhdG9yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tdWx0aWFkLmNyZWF0b3IuY2lmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tdXNpYy1uaWZmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tdXNpY2lhblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm11c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5tdXZlZS5zdHlsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1zdHlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubXluZmNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0YWdsZXRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubmNkLmNvbnRyb2xcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5jZC5yZWZlcmVuY2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5lcnZhbmFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5ldGZweFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubmV1cm9sYW5ndWFnZS5ubHVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJubHVcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubmludGVuZG8ubml0cm8ucm9tXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5uaW50ZW5kby5zbmVzLnJvbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubml0ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm50ZlwiLFwibml0ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2JsZW5ldC1kaXJlY3RvcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJubmRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9ibGVuZXQtc2VhbGVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibm5zXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5vYmxlbmV0LXdlYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm5ud1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5jYXRhbG9nc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9raWEuY29ubWwrd2J4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLmNvbm1sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9raWEuaXB0di5jb25maWcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5pc2RzLXJhZGlvLXByZXNldHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLmxhbmRtYXJrK3dieG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5sYW5kbWFyayt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLmxhbmRtYXJrY29sbGVjdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLm4tZ2FnZS5hYyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLm4tZ2FnZS5kYXRhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibmdkYXRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9raWEubi1nYWdlLnN5bWJpYW4uaW5zdGFsbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm4tZ2FnZVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5uY2RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5va2lhLnBjZCt3YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9raWEucGNkK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm9raWEucmFkaW8tcHJlc2V0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnBzdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub2tpYS5yYWRpby1wcmVzZXRzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnBzc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5ub3ZhZGlnbS5lZG1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJlZG1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubm92YWRpZ20uZWR4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZWR4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm5vdmFkaWdtLmV4dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImV4dFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5udHQtbG9jYWwuY29udGVudC1zaGFyZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubnR0LWxvY2FsLmZpbGUtdHJhbnNmZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm50dC1sb2NhbC5vZ3dfcmVtb3RlLWFjY2Vzc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQubnR0LWxvY2FsLnNpcC10YV9yZW1vdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm50dC1sb2NhbC5zaXAtdGFfdGNwX3N0cmVhbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2RjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5jaGFydC10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm90Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZGF0YWJhc2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvZGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmZvcm11bGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvZGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmZvcm11bGEtdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvZGZ0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5ncmFwaGljc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9kZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZ3JhcGhpY3MtdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvdGdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmltYWdlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2RpXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5pbWFnZS10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm90aVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQucHJlc2VudGF0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2RwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24tdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvdHBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2RzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5zcHJlYWRzaGVldC10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm90c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9kdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC1tYXN0ZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvZG1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQtdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvdHRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQtd2ViXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib3RoXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9iblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2Z0bi5sMTBuK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2lwZi5jb250ZW50YWNjZXNzZG93bmxvYWQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vaXBmLmNvbnRlbnRhY2Nlc3NzdHJlYW1pbmcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vaXBmLmNzcGctaGV4YmluYXJ5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vaXBmLmRhZS5zdmcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vaXBmLmRhZS54aHRtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9pcGYubWlwcHZjb250cm9sbWVzc2FnZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9pcGYucGFlLmdlbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2lwZi5zcGRpc2NvdmVyeSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9pcGYuc3BkbGlzdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9pcGYudWVwcm9maWxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub2lwZi51c2VycHJvZmlsZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9scGMtc3VnYXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4b1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEtc2N3cy1jb25maWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS1zY3dzLWh0dHAtcmVxdWVzdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLXNjd3MtaHR0cC1yZXNwb25zZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmJjYXN0LmFzc29jaWF0ZWQtcHJvY2VkdXJlLXBhcmFtZXRlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5kcm0tdHJpZ2dlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5pbWQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuYmNhc3QubHRrbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmJjYXN0Lm5vdGlmaWNhdGlvbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5wcm92aXNpb25pbmd0cmlnZ2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuYmNhc3Quc2dib290XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuYmNhc3Quc2dkZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5zZ2R1XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuYmNhc3Quc2ltcGxlLXN5bWJvbC1jb250YWluZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5zbWFydGNhcmQtdHJpZ2dlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5zcHJvdit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5iY2FzdC5zdGttXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuY2FiLWFkZHJlc3MtYm9vayt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5jYWItZmVhdHVyZS1oYW5kbGVyK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmNhYi1wY2MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEuY2FiLXN1YnMtaW52aXRlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmNhYi11c2VyLXByZWZzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmRjZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLmRjZGNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5kZDIreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZGQyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5kcm0ucmlzZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5ncm91cC11c2FnZS1saXN0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLnBhbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5wb2MuZGV0YWlsZWQtcHJvZ3Jlc3MtcmVwb3J0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLnBvYy5maW5hbC1yZXBvcnQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vbWEucG9jLmdyb3Vwcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5wb2MuaW52b2NhdGlvbi1kZXNjcmlwdG9yK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLnBvYy5vcHRpbWl6ZWQtcHJvZ3Jlc3MtcmVwb3J0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hLnB1c2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS5zY2lkbS5tZXNzYWdlcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYS54Y2FwLWRpcmVjdG9yeSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYWRzLWVtYWlsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub21hZHMtZmlsZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYWRzLWZvbGRlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9tYWxvYy1zdXBsLWluaXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9uZXBhZ2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVuYmxveC5nYW1lK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbmJsb3guZ2FtZS1iaW5hcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW5leWUub2ViXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVub2ZmaWNlb3JnLmV4dGVuc2lvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib3h0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LmN1c3RvbS1wcm9wZXJ0aWVzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuY3VzdG9teG1scHJvcGVydGllcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LmRyYXdpbmcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5kcmF3aW5nbWwuY2hhcnQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5kcmF3aW5nbWwuY2hhcnRzaGFwZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5kcmF3aW5nbWwuZGlhZ3JhbWNvbG9ycyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LmRyYXdpbmdtbC5kaWFncmFtZGF0YSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LmRyYXdpbmdtbC5kaWFncmFtbGF5b3V0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuZHJhd2luZ21sLmRpYWdyYW1zdHlsZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LmV4dGVuZGVkLXByb3BlcnRpZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuY29tbWVudGF1dGhvcnMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5jb21tZW50cyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLmhhbmRvdXRtYXN0ZXIreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5ub3Rlc21hc3Rlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLm5vdGVzc2xpZGUreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5wcmVzZW50YXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcHR4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnByZXNlbnRhdGlvbi5tYWluK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwucHJlc3Byb3BzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzbGR4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnNsaWRlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVsYXlvdXQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5zbGlkZW1hc3Rlcit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnNsaWRlc2hvd1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBwc3hcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwuc2xpZGVzaG93Lm1haW4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5zbGlkZXVwZGF0ZWluZm8reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC50YWJsZXN0eWxlcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnRhZ3MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC50ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicG90eFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC50ZW1wbGF0ZS5tYWluK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQucHJlc2VudGF0aW9ubWwudmlld3Byb3BzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC10ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5jYWxjY2hhaW4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLmNoYXJ0c2hlZXQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLmNvbW1lbnRzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5jb25uZWN0aW9ucyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuZGlhbG9nc2hlZXQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLmV4dGVybmFsbGluayt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwucGl2b3RjYWNoZWRlZmluaXRpb24reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnBpdm90Y2FjaGVyZWNvcmRzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5waXZvdHRhYmxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5xdWVyeXRhYmxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5yZXZpc2lvbmhlYWRlcnMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnJldmlzaW9ubG9nK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGFyZWRzdHJpbmdzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhsc3hcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldC5tYWluK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldG1ldGFkYXRhK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zdHlsZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnRhYmxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC50YWJsZXNpbmdsZWNlbGxzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC50ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGx0eFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnRlbXBsYXRlLm1haW4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnVzZXJuYW1lcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwudm9sYXRpbGVkZXBlbmRlbmNpZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLndvcmtzaGVldCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnRoZW1lK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQudGhlbWVvdmVycmlkZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnZtbGRyYXdpbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwtdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuY29tbWVudHMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZG9jeFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50Lmdsb3NzYXJ5K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudC5tYWluK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5lbmRub3Rlcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZm9udHRhYmxlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5mb290ZXIreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmZvb3Rub3Rlcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwubnVtYmVyaW5nK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5zZXR0aW5ncyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuc3R5bGVzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC50ZW1wbGF0ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZG90eFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLnRlbXBsYXRlLm1haW4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLndlYnNldHRpbmdzK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtcGFja2FnZS5jb3JlLXByb3BlcnRpZXMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1wYWNrYWdlLmRpZ2l0YWwtc2lnbmF0dXJlLXhtbHNpZ25hdHVyZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLXBhY2thZ2UucmVsYXRpb25zaGlwcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9yYWNsZS5yZXNvdXJjZStqc29uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9yYW5nZS5pbmRhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9zYS5uZXRkZXBsb3lcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9zZ2VvLm1hcGd1aWRlLnBhY2thZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtZ3BcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQub3NnaS5idW5kbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm9zZ2kuZHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vc2dpLnN1YnN5c3RlbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVzYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5vdHBzLmN0LWtpcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLm94bGkuY291bnRncmFwaFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucGFnZXJkdXR5K2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucGFsbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBkYlwiLFwicHFhXCIsXCJvcHJjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBhbm9wbHlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBhb3MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wYW9zLnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wYXdhYWZpbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwYXdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucGNvc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucGcuZm9ybWF0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3RyXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBnLm9zYXNsaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVpNlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5waWFjY2Vzcy5hcHBsaWNhdGlvbi1saWNlbmNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5waWNzZWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJlZmlmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBtaS53aWRnZXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3Z1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wb2MuZ3JvdXAtYWR2ZXJ0aXNlbWVudCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBvY2tldGxlYXJuXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicGxmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBvd2VyYnVpbGRlcjZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwYmRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucG93ZXJidWlsZGVyNi1zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wb3dlcmJ1aWxkZXI3XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wb3dlcmJ1aWxkZXI3LXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnBvd2VyYnVpbGRlcjc1XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wb3dlcmJ1aWxkZXI3NS1zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wcmVtaW5ldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucHJldmlld3N5c3RlbXMuYm94XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYm94XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnByb3RldXMubWFnYXppbmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtZ3pcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucHVibGlzaGFyZS1kZWx0YS10cmVlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicXBzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnB2aS5wdGlkMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInB0aWRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucHdnLW11bHRpcGxleGVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5wd2cteGh0bWwtcHJpbnQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5xdWFsY29tbS5icmV3LWFwcC1yZXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnF1YXJrLnF1YXJreHByZXNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicXhkXCIsXCJxeHRcIixcInF3ZFwiLFwicXd0XCIsXCJxeGxcIixcInF4YlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5xdW9iamVjdC1xdW94ZG9jdW1lbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubW9tbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1hdWRpdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1hdWRpdC1jb25mK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmFkaXN5cy5tc21sLWF1ZGl0LWNvbm4reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yYWRpc3lzLm1zbWwtYXVkaXQtZGlhbG9nK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmFkaXN5cy5tc21sLWF1ZGl0LXN0cmVhbSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1jb25mK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmFkaXN5cy5tc21sLWRpYWxvZyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1kaWFsb2ctYmFzZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1kaWFsb2ctZmF4LWRldGVjdCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1kaWFsb2ctZmF4LXNlbmRyZWN2K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmFkaXN5cy5tc21sLWRpYWxvZy1ncm91cCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJhZGlzeXMubXNtbC1kaWFsb2ctc3BlZWNoK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmFkaXN5cy5tc21sLWRpYWxvZy10cmFuc2Zvcm0reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yYWluc3Rvci5kYXRhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yYXBpZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmVhbHZuYy5iZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJiZWRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmVjb3JkYXJlLm11c2ljeG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXhsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJlY29yZGFyZS5tdXNpY3htbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtdXNpY3htbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yZW5sZWFybi5ybHByaW50XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yaWcuY3J5cHRvbm90ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNyeXB0b25vdGVcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucmltLmNvZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY29kXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnJuLXJlYWxtZWRpYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicm1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucm4tcmVhbG1lZGlhLXZiclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicm12YlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5yb3V0ZTY2Lmxpbms2Nit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsaW5rNjZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucnMtMjc0eFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQucnVja3VzLmRvd25sb2FkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zM3Ntc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2FpbGluZ3RyYWNrZXIudHJhY2tcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zYm0uY2lkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zYm0ubWlkMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2NyaWJ1c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLjNkZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLmNzZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLmRvY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLmVtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLm1odFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLm5ldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLnBwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VhbGVkLnRpZmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNlYWxlZC54bHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNlYWxlZG1lZGlhLnNvZnRzZWFsLmh0bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNlYWxlZG1lZGlhLnNvZnRzZWFsLnBkZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2VlbWFpbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNlZVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zZW1hXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2VtYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zZW1kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2VtZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zZW1mXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2VtZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtZGF0YVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlmbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zaGFuYS5pbmZvcm1lZC5mb3JtdGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpdHBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQuaW50ZXJjaGFuZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpaWZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2hhbmEuaW5mb3JtZWQucGFja2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlwa1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zaW10ZWNoLW1pbmRtYXBwZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0d2RcIixcInR3ZHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc2lyZW4ranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zbWFmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibW1mXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNtYXJ0Lm5vdGVib29rXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zbWFydC50ZWFjaGVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widGVhY2hlclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zb2Z0d2FyZTYwMi5maWxsZXIuZm9ybSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNvZnR3YXJlNjAyLmZpbGxlci5mb3JtLXhtbC16aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNvbGVudC5zZGttK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNka21cIixcInNka2RcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3BvdGZpcmUuZHhwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZHhwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnNwb3RmaXJlLnNmc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNmc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zc3MtY29kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zc3MtZHRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zc3MtbnRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdGFyZGl2aXNpb24uY2FsY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2RjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi5kcmF3XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzZGFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3RhcmRpdmlzaW9uLmltcHJlc3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNkZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdGFyZGl2aXNpb24ubWF0aFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic21mXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNkd1wiLFwidm9yXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN0YXJkaXZpc2lvbi53cml0ZXItZ2xvYmFsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzZ2xcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3RlcG1hbmlhLnBhY2thZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzbXppcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdGVwbWFuaWEuc3RlcGNoYXJ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic21cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3RyZWV0LXN0cmVhbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3VuLndhZGwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmNhbGNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN4Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmNhbGMudGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN0Y1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmRyYXdcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN4ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmRyYXcudGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN0ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmltcHJlc3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN4aVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLmltcHJlc3MudGVtcGxhdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN0aVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLm1hdGhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN4bVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zdW4ueG1sLndyaXRlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3h3XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwud3JpdGVyLmdsb2JhbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3hnXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN1bi54bWwud3JpdGVyLnRlbXBsYXRlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdHdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3VzLWNhbGVuZGFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3VzXCIsXCJzdXNwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN2ZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN2ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zd2lmdHZpZXctaWNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zeW1iaWFuLmluc3RhbGxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNpc1wiLFwic2lzeFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zeW5jbWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHNtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbSt3YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJkbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC5zeW5jbWwuZG0reG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGRtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbS5ub3RpZmljYXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kbWRkZit3YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3luY21sLmRtZGRmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3luY21sLmRtdG5kcyt3YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuc3luY21sLmRtdG5kcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnN5bmNtbC5kcy5ub3RpZmljYXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnRhby5pbnRlbnQtbW9kdWxlLWFyY2hpdmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0YW9cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudGNwZHVtcC5wY2FwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicGNhcFwiLFwiY2FwXCIsXCJkbXBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudG1kLm1lZGlhZmxleC5hcGkreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC50bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnRtb2JpbGUtbGl2ZXR2XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widG1vXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnRyaWQudHB0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widHB0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnRyaXNjYXBlLm14c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm14c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC50cnVlYXBwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widHJhXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnRydWVkb2NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnViaXNvZnQud2VicGxheWVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51ZmRsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widWZkXCIsXCJ1ZmRsXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnVpcS50aGVtZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInV0elwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51bWFqaW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1bWpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudW5pdHlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1bml0eXdlYlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51b21sK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInVvbWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5hbGVydFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5hbGVydC13YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5iZWFyZXItY2hvaWNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51cGxhbmV0LmJlYXJlci1jaG9pY2Utd2J4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnVwbGFuZXQuY2FjaGVvcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5jYWNoZW9wLXdieG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51cGxhbmV0LmNoYW5uZWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnVwbGFuZXQuY2hhbm5lbC13YnhtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5saXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51cGxhbmV0Lmxpc3Qtd2J4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnVwbGFuZXQubGlzdGNtZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXBsYW5ldC5saXN0Y21kLXdieG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC51cGxhbmV0LnNpZ25hbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudXJpLW1hcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudmFsdmUuc291cmNlLm1hdGVyaWFsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC52Y3hcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2Y3hcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudmQtc3R1ZHlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnZlY3RvcndvcmtzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC52ZWwranNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC52ZXJpbWF0cml4LnZjYXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnZpZHNvZnQudmlkY29uZmVyZW5jZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudmlzaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2c2RcIixcInZzdFwiLFwidnNzXCIsXCJ2c3dcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQudmlzaW9uYXJ5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widmlzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnZpdmlkZW5jZS5zY3JpcHRmaWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC52c2ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2c2ZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2FwLnNpY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2FwLnNsY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2FwLndieG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid2J4bWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2FwLndtbGNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3bWxjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLndhcC53bWxzY3JpcHRjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid21sc2NcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2VidHVyYm9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3dGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2ZhLnAycFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2ZhLndzY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud2luZG93cy5kZXZpY2VwYWlyaW5nXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC53bWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLndtZi5ib290c3RyYXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLndvbGZyYW0ubWF0aGVtYXRpY2FcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLndvbGZyYW0ubWF0aGVtYXRpY2EucGFja2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud29sZnJhbS5wbGF5ZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJuYnBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud29yZHBlcmZlY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3cGRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQud3FkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid3FkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLndycS1ocDMwMDAtbGFiZWxsZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnd0LnN0ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN0ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC53di5jc3Ard2J4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnd2LmNzcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnd2LnNzcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhhY21sK2pzb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueGFyYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhhclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC54ZmRsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGZkbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC54ZmRsLndlYmZvcm1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtaSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtcGllLmNwa2dcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtcGllLmRwa2dcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtcGllLnBsYW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtcGllLnBwa2dcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnhtcGllLnhsaW1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnlhbWFoYS5odi1kaWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJodmRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLmh2LXNjcmlwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImh2c1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC55YW1haGEuaHYtdm9pY2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJodnBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLm9wZW5zY29yZWZvcm1hdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9zZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZuZC55YW1haGEub3BlbnNjb3JlZm9ybWF0Lm9zZnB2Zyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvc2ZwdmdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnJlbW90ZS1zZXR1cFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtYXVkaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzYWZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnNtYWYtcGhyYXNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3BmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnlhbWFoYS50aHJvdWdoLW5nblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFtYWhhLnR1bm5lbC11ZHBlbmNhcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWFvd2VtZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQueWVsbG93cml2ZXItY3VzdG9tLW1lbnVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjbXBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi92bmQuenVsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiemlyXCIsXCJ6aXJ6XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm5kLnp6YXp6LmRlY2sreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiemF6XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vdm9pY2V4bWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widnhtbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3ZxLXJ0Y3B4clwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi93YXRjaGVyaW5mbyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vd2hvaXNwcC1xdWVyeVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi93aG9pc3BwLXJlc3BvbnNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3dpZGdldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndndFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3dpbmhscFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaGxwXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24vd2l0YVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi93b3JkcGVyZmVjdDUuMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi93c2RsK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndzZGxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi93c3BvbGljeSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3c3BvbGljeVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtN3otY29tcHJlc3NlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiN3pcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWFiaXdvcmRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFid1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYWNlLWNvbXByZXNzZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFjZVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYW1mXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1hcHBsZS1kaXNraW1hZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRtZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1iaW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFhYlwiLFwieDMyXCIsXCJ1MzJcIixcInZveFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1tYXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFhbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYXV0aG9yd2FyZS1zZWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFhc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYmNwaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJjcGlvXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1iZG9jXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYmRvY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYml0dG9ycmVudFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widG9ycmVudFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtYmxvcmJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJsYlwiLFwiYmxvcmJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWJ6aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJ6XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1iemlwMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYnoyXCIsXCJib3pcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWNiclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2JyXCIsXCJjYmFcIixcImNidFwiLFwiY2J6XCIsXCJjYjdcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWNkbGlua1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widmNkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jZnMtY29tcHJlc3NlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2ZzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jaGF0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjaGF0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jaGVzcy1wZ25cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBnblwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtY2hyb21lLWV4dGVuc2lvblwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNyeFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtY29jb2FcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY2NvXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jb21wcmVzc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtY29uZmVyZW5jZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibnNjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jcGlvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjcGlvXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1jc2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNzaFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZGViXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZGViaWFuLXBhY2thZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRlYlwiLFwidWRlYlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZGdjLWNvbXByZXNzZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRnY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZGlyZWN0b3JcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImRpclwiLFwiZGNyXCIsXCJkeHJcIixcImNzdFwiLFwiY2N0XCIsXCJjeHRcIixcInczZFwiLFwiZmdkXCIsXCJzd2FcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWRvb21cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndhZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZHRibmN4K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibmN4XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1kdGJvb2sreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkdGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWR0YnJlc291cmNlK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicmVzXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1kdmlcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImR2aVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZW52b3lcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImV2eVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZXZhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJldmFcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtYmRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJiZGZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtZG9zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1mb250LWZyYW1lbWFrZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtZ2hvc3RzY3JpcHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdzZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC1saWJncnhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtbGludXgtcHNmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwc2ZcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtb3RmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm90ZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC1wY2ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBjZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC1zbmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNuZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC1zcGVlZG9cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtc3Vub3MtbmV3c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC10dGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1widHRmXCIsXCJ0dGNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWZvbnQtdHlwZTFcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBmYVwiLFwicGZiXCIsXCJwZm1cIixcImFmbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZm9udC12Zm9udFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZnJlZWFyY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXJjXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1mdXR1cmVzcGxhc2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNwbFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZ2NhLWNvbXByZXNzZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdjYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZ2x1bHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInVseFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtZ251bWVyaWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdudW1lcmljXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1ncmFtcHMteG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJncmFtcHNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWd0YXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImd0YXJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWd6aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWhkZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaGRmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1odHRwZC1waHBcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBocFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtaW5zdGFsbC1pbnN0cnVjdGlvbnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImluc3RhbGxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWlzbzk2NjAtaW1hZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlzb1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtamF2YS1hcmNoaXZlLWRpZmZcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiamFyZGlmZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtamF2YS1qbmxwLWZpbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImpubHBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWphdmFzY3JpcHRcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LWxhdGV4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsYXRleFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbHVhLWJ5dGVjb2RlXCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibHVhY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbHpoLWNvbXByZXNzZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImx6aFwiLFwibGhhXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tYWtlc2VsZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJuZ2lueFwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJydW5cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1pZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWllXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tb2JpcG9ja2V0LWVib29rXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcmNcIixcIm1vYmlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1wZWd1cmxcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tcy1hcHBsaWNhdGlvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXBwbGljYXRpb25cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1zLXNob3J0Y3V0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJsbmtcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1zLXdtZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid21kXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tcy13bXpcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndtelwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXMteGJhcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGJhcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNhY2Nlc3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1kYlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNiaW5kZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm9iZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNjYXJkZmlsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY3JkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tc2NsaXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNscFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNkb3MtcHJvZ3JhbVwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcImV4ZVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNkb3dubG9hZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZXhlXCIsXCJkbGxcIixcImNvbVwiLFwiYmF0XCIsXCJtc2lcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1zbWVkaWF2aWV3XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtdmJcIixcIm0xM1wiLFwibTE0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tc21ldGFmaWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3bWZcIixcIndtelwiLFwiZW1mXCIsXCJlbXpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1zbW9uZXlcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1ueVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNwdWJsaXNoZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInB1YlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbXNzY2hlZHVsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2NkXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1tc3Rlcm1pbmFsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0cm1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW1zd3JpdGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndyaVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtbmV0Y2RmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJuY1wiLFwiY2RmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1ucy1wcm94eS1hdXRvY29uZmlnXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwYWNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LW56YlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibnpiXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1wZXJsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcIm5naW54XCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBsXCIsXCJwbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtcGlsb3RcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHJjXCIsXCJwZGJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXBrY3MxMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicDEyXCIsXCJwZnhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXBrY3M3LWNlcnRpZmljYXRlc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicDdiXCIsXCJzcGNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXBrY3M3LWNlcnRyZXFyZXNwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwN3JcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyYXJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXJlZGhhdC1wYWNrYWdlLW1hbmFnZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnBtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1yZXNlYXJjaC1pbmZvLXN5c3RlbXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJpc1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtc2VhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcIm5naW54XCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNlYVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtc2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2hcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXNoYXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNoYXJcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXNob2Nrd2F2ZS1mbGFzaFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3dmXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1zaWx2ZXJsaWdodC1hcHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhhcFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtc3FsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzcWxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXN0dWZmaXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNpdFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtc3R1ZmZpdHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNpdHhcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXN1YnJpcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3J0XCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1zdjRjcGlvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdjRjcGlvXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC1zdjRjcmNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN2NGNyY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtdDN2bS1pbWFnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widDNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXRhZHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdhbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtdGFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRhclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtdGNsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0Y2xcIixcInRrXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC10ZXhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRleFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtdGV4LXRmbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widGZtXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC10ZXhpbmZvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0ZXhpbmZvXCIsXCJ0ZXhpXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC10Z2lmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJvYmpcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXVzdGFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1c3RhclwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtd2Fpcy1zb3VyY2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNyY1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtd2ViLWFwcC1tYW5pZmVzdCtqc29uXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3ZWJhcHBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXg1MDktY2EtY2VydFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZGVyXCIsXCJjcnRcIixcInBlbVwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gteGZpZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmlnXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veC14bGlmZit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhsZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gteHBpbnN0YWxsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4cGlcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94LXh6XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4elwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3gtem1hY2hpbmVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInoxXCIsXCJ6MlwiLFwiejNcIixcIno0XCIsXCJ6NVwiLFwiejZcIixcIno3XCIsXCJ6OFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3g0MDAtYnBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veGFjbWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hhbWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4YW1sXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veGNhcC1hdHQreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hjYXAtY2Fwcyt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veGNhcC1kaWZmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhkZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hjYXAtZWwreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hjYXAtZXJyb3IreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hjYXAtbnMreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3hjb24tY29uZmVyZW5jZS1pbmZvK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94Y29uLWNvbmZlcmVuY2UtaW5mby1kaWZmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94ZW5jK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhlbmNcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94aHRtbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhodG1sXCIsXCJ4aHRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94aHRtbC12b2ljZSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhtbFwiLFwieHNsXCIsXCJ4c2RcIixcInJuZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3htbC1kdGRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImR0ZFwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3htbC1leHRlcm5hbC1wYXJzZWQtZW50aXR5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImFwcGxpY2F0aW9uL3htbC1wYXRjaCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veG1wcCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veG9wK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieG9wXCJdXG4gIH0sXG4gIFwiYXBwbGljYXRpb24veHByb2MreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4cGxcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94c2x0K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhzbHRcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi94c3BmK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHNwZlwiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3h2K3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm14bWxcIixcInhodm1sXCIsXCJ4dm1sXCIsXCJ4dm1cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi95YW5nXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieWFuZ1wiXVxuICB9LFxuICBcImFwcGxpY2F0aW9uL3lpbit4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ5aW5cIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi96aXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ6aXBcIl1cbiAgfSxcbiAgXCJhcHBsaWNhdGlvbi96bGliXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvLzFkLWludGVybGVhdmVkLXBhcml0eWZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby8zMmthZHBjbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby8zZ3BwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiM2dwcFwiXVxuICB9LFxuICBcImF1ZGlvLzNncHAyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2FjM1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9hZHBjbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYWRwXCJdXG4gIH0sXG4gIFwiYXVkaW8vYW1yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2Ftci13YlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9hbXItd2IrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2FwdHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vYXNjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2F0cmFjLWFkdmFuY2VkLWxvc3NsZXNzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2F0cmFjLXhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vYXRyYWMzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2Jhc2ljXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXVcIixcInNuZFwiXVxuICB9LFxuICBcImF1ZGlvL2J2MTZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vYnYzMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9jbGVhcm1vZGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vY25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZGF0MTJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZGxzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2Rzci1lczIwMTEwOFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9kc3ItZXMyMDIwNTBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZHNyLWVzMjAyMjExXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2Rzci1lczIwMjIxMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9kdlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9kdmk0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2VhYzNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZW5jYXBydHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZXZyY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjLXFjcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjMFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjYjBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZXZyY2IxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2V2cmNud1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnJjbncwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2V2cmNudzFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZXZyY3diXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2V2cmN3YjBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZXZyY3diMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9ldnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZndkcmVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2c3MTEtMFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzE5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2c3MjJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZzcyMjFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZzcyM1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzI2LTE2XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2c3MjYtMjRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZzcyNi0zMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzI2LTQwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2c3MjhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZzcyOVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzI5MVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzI5ZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nNzI5ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nc21cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vZ3NtLWVmclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9nc20taHItMDhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vaWxiY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9pcC1tcl92Mi41XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2lzYWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhdWRpby9sMTZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vbDIwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL2wyNFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJhdWRpby9sOFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9scGNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vbWlkaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWlkXCIsXCJtaWRpXCIsXCJrYXJcIixcInJtaVwiXVxuICB9LFxuICBcImF1ZGlvL21vYmlsZS14bWZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vbXA0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibTRhXCIsXCJtcDRhXCJdXG4gIH0sXG4gIFwiYXVkaW8vbXA0YS1sYXRtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL21wYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9tcGEtcm9idXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL21wZWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtcGdhXCIsXCJtcDJcIixcIm1wMmFcIixcIm1wM1wiLFwibTJhXCIsXCJtM2FcIl1cbiAgfSxcbiAgXCJhdWRpby9tcGVnNC1nZW5lcmljXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL211c2VwYWNrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwiYXVkaW8vb2dnXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2dhXCIsXCJvZ2dcIixcInNweFwiXVxuICB9LFxuICBcImF1ZGlvL29wdXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcGFyaXR5ZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3BjbWFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcGNtYS13YlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9wY211XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3BjbXUtd2JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcHJzLnNpZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9xY2VscFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9yYXB0b3JmZWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcmVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3J0cC1lbmMtYWVzY20xMjhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcnRwLW1pZGlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcnRwbG9vcGJhY2tcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vcnR4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3MzbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiczNtXCJdXG4gIH0sXG4gIFwiYXVkaW8vc2lsa1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2lsXCJdXG4gIH0sXG4gIFwiYXVkaW8vc212XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3Ntdi1xY3BcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vc212MFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby9zcC1taWRpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3NwZWV4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3QxNDBjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3QzOFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby90ZWxlcGhvbmUtZXZlbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdG9uZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby91ZW1jbGlwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3VscGZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92ZHZpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3Ztci13YlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92bmQuM2dwcC5pdWZwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC40c2JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmF1ZGlva296XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5jZWxwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5jaXNjby5uc2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmNtbGVzLnJhZGlvLWV2ZW50c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92bmQuY25zLmFucDFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmNucy5pbmYxXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kZWNlLmF1ZGlvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widXZhXCIsXCJ1dnZhXCJdXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmRpZ2l0YWwtd2luZHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJlb2xcIl1cbiAgfSxcbiAgXCJhdWRpby92bmQuZGxuYS5hZHRzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5oZWFhYy4xXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5oZWFhYy4yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5tbHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmRvbGJ5Lm1wc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92bmQuZG9sYnkucGwyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5wbDJ4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5wbDJ6XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kb2xieS5wdWxzZS4xXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5kcmFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkcmFcIl1cbiAgfSxcbiAgXCJhdWRpby92bmQuZHRzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZHRzXCJdXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmR0cy5oZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImR0c2hkXCJdXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmR2Yi5maWxlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5ldmVyYWQucGxqXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5obnMuYXVkaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLmx1Y2VudC52b2ljZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImx2cFwiXVxuICB9LFxuICBcImF1ZGlvL3ZuZC5tcy1wbGF5cmVhZHkubWVkaWEucHlhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHlhXCJdXG4gIH0sXG4gIFwiYXVkaW8vdm5kLm5va2lhLm1vYmlsZS14bWZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLm5vcnRlbC52YmtcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLm51ZXJhLmVjZWxwNDgwMFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVjZWxwNDgwMFwiXVxuICB9LFxuICBcImF1ZGlvL3ZuZC5udWVyYS5lY2VscDc0NzBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJlY2VscDc0NzBcIl1cbiAgfSxcbiAgXCJhdWRpby92bmQubnVlcmEuZWNlbHA5NjAwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZWNlbHA5NjAwXCJdXG4gIH0sXG4gIFwiYXVkaW8vdm5kLm9jdGVsLnNiY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92bmQucWNlbHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiYXVkaW8vdm5kLnJoZXRvcmV4LjMya2FkcGNtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC5yaXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyaXBcIl1cbiAgfSxcbiAgXCJhdWRpby92bmQucm4tcmVhbGF1ZGlvXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZVxuICB9LFxuICBcImF1ZGlvL3ZuZC5zZWFsZWRtZWRpYS5zb2Z0c2VhbC5tcGVnXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImF1ZGlvL3ZuZC52bXguY3ZzZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby92bmQud2F2ZVwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJhdWRpby92b3JiaXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwiYXVkaW8vdm9yYmlzLWNvbmZpZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJhdWRpby93YXZcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3YXZcIl1cbiAgfSxcbiAgXCJhdWRpby93YXZlXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid2F2XCJdXG4gIH0sXG4gIFwiYXVkaW8vd2VibVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid2ViYVwiXVxuICB9LFxuICBcImF1ZGlvL3gtYWFjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhYWNcIl1cbiAgfSxcbiAgXCJhdWRpby94LWFpZmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImFpZlwiLFwiYWlmZlwiLFwiYWlmY1wiXVxuICB9LFxuICBcImF1ZGlvL3gtY2FmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjYWZcIl1cbiAgfSxcbiAgXCJhdWRpby94LWZsYWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZsYWNcIl1cbiAgfSxcbiAgXCJhdWRpby94LW00YVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJuZ2lueFwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtNGFcIl1cbiAgfSxcbiAgXCJhdWRpby94LW1hdHJvc2thXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJta2FcIl1cbiAgfSxcbiAgXCJhdWRpby94LW1wZWd1cmxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm0zdVwiXVxuICB9LFxuICBcImF1ZGlvL3gtbXMtd2F4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3YXhcIl1cbiAgfSxcbiAgXCJhdWRpby94LW1zLXdtYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid21hXCJdXG4gIH0sXG4gIFwiYXVkaW8veC1wbi1yZWFsYXVkaW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJhbVwiLFwicmFcIl1cbiAgfSxcbiAgXCJhdWRpby94LXBuLXJlYWxhdWRpby1wbHVnaW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJtcFwiXVxuICB9LFxuICBcImF1ZGlvL3gtcmVhbGF1ZGlvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcIm5naW54XCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJhXCJdXG4gIH0sXG4gIFwiYXVkaW8veC10dGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJhdWRpby94LXdhdlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid2F2XCJdXG4gIH0sXG4gIFwiYXVkaW8veG1cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhtXCJdXG4gIH0sXG4gIFwiY2hlbWljYWwveC1jZHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNkeFwiXVxuICB9LFxuICBcImNoZW1pY2FsL3gtY2lmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjaWZcIl1cbiAgfSxcbiAgXCJjaGVtaWNhbC94LWNtZGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNtZGZcIl1cbiAgfSxcbiAgXCJjaGVtaWNhbC94LWNtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY21sXCJdXG4gIH0sXG4gIFwiY2hlbWljYWwveC1jc21sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjc21sXCJdXG4gIH0sXG4gIFwiY2hlbWljYWwveC1wZGJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJjaGVtaWNhbC94LXh5elwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieHl6XCJdXG4gIH0sXG4gIFwiZm9udC9vcGVudHlwZVwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib3RmXCJdXG4gIH0sXG4gIFwiaW1hZ2UvYm1wXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJtcFwiXVxuICB9LFxuICBcImltYWdlL2NnbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNnbVwiXVxuICB9LFxuICBcImltYWdlL2ZpdHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2UvZzNmYXhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJnM1wiXVxuICB9LFxuICBcImltYWdlL2dpZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdpZlwiXVxuICB9LFxuICBcImltYWdlL2llZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImllZlwiXVxuICB9LFxuICBcImltYWdlL2pwMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS9qcGVnXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wianBlZ1wiLFwianBnXCIsXCJqcGVcIl1cbiAgfSxcbiAgXCJpbWFnZS9qcG1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2UvanB4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL2t0eFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImt0eFwiXVxuICB9LFxuICBcImltYWdlL25hcGxwc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS9wanBlZ1wiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJpbWFnZS9wbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwbmdcIl1cbiAgfSxcbiAgXCJpbWFnZS9wcnMuYnRpZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJ0aWZcIl1cbiAgfSxcbiAgXCJpbWFnZS9wcnMucHRpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3B3Zy1yYXN0ZXJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvc2dpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzZ2lcIl1cbiAgfSxcbiAgXCJpbWFnZS9zdmcreG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzdmdcIixcInN2Z3pcIl1cbiAgfSxcbiAgXCJpbWFnZS90MzhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2UvdGlmZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRpZmZcIixcInRpZlwiXVxuICB9LFxuICBcImltYWdlL3RpZmYtZnhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmFkb2JlLnBob3Rvc2hvcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicHNkXCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmFpcnppcC5hY2NlbGVyYXRvci5henZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmNucy5pbmYyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3ZuZC5kZWNlLmdyYXBoaWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1dmlcIixcInV2dmlcIixcInV2Z1wiLFwidXZ2Z1wiXVxuICB9LFxuICBcImltYWdlL3ZuZC5kanZ1XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZGp2dVwiLFwiZGp2XCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmR2Yi5zdWJ0aXRsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN1YlwiXVxuICB9LFxuICBcImltYWdlL3ZuZC5kd2dcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkd2dcIl1cbiAgfSxcbiAgXCJpbWFnZS92bmQuZHhmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZHhmXCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmZhc3RiaWRzaGVldFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZic1wiXVxuICB9LFxuICBcImltYWdlL3ZuZC5mcHhcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmcHhcIl1cbiAgfSxcbiAgXCJpbWFnZS92bmQuZnN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZnN0XCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtbW1yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibW1yXCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmZ1aml4ZXJveC5lZG1pY3MtcmxjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicmxjXCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLmdsb2JhbGdyYXBoaWNzLnBnYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS92bmQubWljcm9zb2Z0Lmljb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLm1peFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS92bmQubW96aWxsYS5hcG5nXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3ZuZC5tcy1tb2RpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWRpXCJdXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLm1zLXBob3RvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3ZHBcIl1cbiAgfSxcbiAgXCJpbWFnZS92bmQubmV0LWZweFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm5weFwiXVxuICB9LFxuICBcImltYWdlL3ZuZC5yYWRpYW5jZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS92bmQuc2VhbGVkLnBuZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS92bmQuc2VhbGVkbWVkaWEuc29mdHNlYWwuZ2lmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3ZuZC5zZWFsZWRtZWRpYS5zb2Z0c2VhbC5qcGdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLnN2ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJpbWFnZS92bmQudGVuY2VudC50YXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwiaW1hZ2Uvdm5kLnZhbHZlLnNvdXJjZS50ZXh0dXJlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3ZuZC53YXAud2JtcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndibXBcIl1cbiAgfSxcbiAgXCJpbWFnZS92bmQueGlmZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInhpZlwiXVxuICB9LFxuICBcImltYWdlL3ZuZC56YnJ1c2gucGN4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcImltYWdlL3dlYnBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndlYnBcIl1cbiAgfSxcbiAgXCJpbWFnZS94LTNkc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiM2RzXCJdXG4gIH0sXG4gIFwiaW1hZ2UveC1jbXUtcmFzdGVyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJyYXNcIl1cbiAgfSxcbiAgXCJpbWFnZS94LWNteFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiY214XCJdXG4gIH0sXG4gIFwiaW1hZ2UveC1mcmVlaGFuZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmhcIixcImZoY1wiLFwiZmg0XCIsXCJmaDVcIixcImZoN1wiXVxuICB9LFxuICBcImltYWdlL3gtaWNvblwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpY29cIl1cbiAgfSxcbiAgXCJpbWFnZS94LWpuZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJuZ2lueFwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqbmdcIl1cbiAgfSxcbiAgXCJpbWFnZS94LW1yc2lkLWltYWdlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzaWRcIl1cbiAgfSxcbiAgXCJpbWFnZS94LW1zLWJtcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJuZ2lueFwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImJtcFwiXVxuICB9LFxuICBcImltYWdlL3gtcGN4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwY3hcIl1cbiAgfSxcbiAgXCJpbWFnZS94LXBpY3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBpY1wiLFwicGN0XCJdXG4gIH0sXG4gIFwiaW1hZ2UveC1wb3J0YWJsZS1hbnltYXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBubVwiXVxuICB9LFxuICBcImltYWdlL3gtcG9ydGFibGUtYml0bWFwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwYm1cIl1cbiAgfSxcbiAgXCJpbWFnZS94LXBvcnRhYmxlLWdyYXltYXBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBnbVwiXVxuICB9LFxuICBcImltYWdlL3gtcG9ydGFibGUtcGl4bWFwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwcG1cIl1cbiAgfSxcbiAgXCJpbWFnZS94LXJnYlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicmdiXCJdXG4gIH0sXG4gIFwiaW1hZ2UveC10Z2FcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRnYVwiXVxuICB9LFxuICBcImltYWdlL3gteGJpdG1hcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wieGJtXCJdXG4gIH0sXG4gIFwiaW1hZ2UveC14Y2ZcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwiaW1hZ2UveC14cGl4bWFwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4cG1cIl1cbiAgfSxcbiAgXCJpbWFnZS94LXh3aW5kb3dkdW1wXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4d2RcIl1cbiAgfSxcbiAgXCJtZXNzYWdlL2NwaW1cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibWVzc2FnZS9kZWxpdmVyeS1zdGF0dXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibWVzc2FnZS9kaXNwb3NpdGlvbi1ub3RpZmljYXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibWVzc2FnZS9leHRlcm5hbC1ib2R5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2UvZmVlZGJhY2stcmVwb3J0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2UvZ2xvYmFsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2UvZ2xvYmFsLWRlbGl2ZXJ5LXN0YXR1c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtZXNzYWdlL2dsb2JhbC1kaXNwb3NpdGlvbi1ub3RpZmljYXRpb25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibWVzc2FnZS9nbG9iYWwtaGVhZGVyc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtZXNzYWdlL2h0dHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwibWVzc2FnZS9pbWRuK3htbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcIm1lc3NhZ2UvbmV3c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtZXNzYWdlL3BhcnRpYWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwibWVzc2FnZS9yZmM4MjJcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImVtbFwiLFwibWltZVwiXVxuICB9LFxuICBcIm1lc3NhZ2Uvcy1odHRwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2Uvc2lwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2Uvc2lwZnJhZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtZXNzYWdlL3RyYWNraW5nLXN0YXR1c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtZXNzYWdlL3ZuZC5zaS5zaW1wXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1lc3NhZ2Uvdm5kLndmYS53c2NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibW9kZWwvaWdlc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImlnc1wiLFwiaWdlc1wiXVxuICB9LFxuICBcIm1vZGVsL21lc2hcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJtc2hcIixcIm1lc2hcIixcInNpbG9cIl1cbiAgfSxcbiAgXCJtb2RlbC92bmQuY29sbGFkYSt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkYWVcIl1cbiAgfSxcbiAgXCJtb2RlbC92bmQuZHdmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZHdmXCJdXG4gIH0sXG4gIFwibW9kZWwvdm5kLmZsYXRsYW5kLjNkbWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibW9kZWwvdm5kLmdkbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImdkbFwiXVxuICB9LFxuICBcIm1vZGVsL3ZuZC5ncy1nZGxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJtb2RlbC92bmQuZ3MuZ2RsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1vZGVsL3ZuZC5ndHdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJndHdcIl1cbiAgfSxcbiAgXCJtb2RlbC92bmQubW9tbCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibW9kZWwvdm5kLm10c1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm10c1wiXVxuICB9LFxuICBcIm1vZGVsL3ZuZC5vcGVuZ2V4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1vZGVsL3ZuZC5wYXJhc29saWQudHJhbnNtaXQuYmluYXJ5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1vZGVsL3ZuZC5wYXJhc29saWQudHJhbnNtaXQudGV4dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtb2RlbC92bmQucm9zZXR0ZS5hbm5vdGF0ZWQtZGF0YS1tb2RlbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtb2RlbC92bmQudmFsdmUuc291cmNlLmNvbXBpbGVkLW1hcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtb2RlbC92bmQudnR1XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widnR1XCJdXG4gIH0sXG4gIFwibW9kZWwvdnJtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndybFwiLFwidnJtbFwiXVxuICB9LFxuICBcIm1vZGVsL3gzZCtiaW5hcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIngzZGJcIixcIngzZGJ6XCJdXG4gIH0sXG4gIFwibW9kZWwveDNkK2Zhc3RpbmZvc2V0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm1vZGVsL3gzZCt2cm1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4M2R2XCIsXCJ4M2R2elwiXVxuICB9LFxuICBcIm1vZGVsL3gzZCt4bWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIngzZFwiLFwieDNkelwiXVxuICB9LFxuICBcIm1vZGVsL3gzZC12cm1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm11bHRpcGFydC9hbHRlcm5hdGl2ZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJtdWx0aXBhcnQvYXBwbGVkb3VibGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibXVsdGlwYXJ0L2J5dGVyYW5nZXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibXVsdGlwYXJ0L2RpZ2VzdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtdWx0aXBhcnQvZW5jcnlwdGVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZVxuICB9LFxuICBcIm11bHRpcGFydC9mb3JtLWRhdGFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwibXVsdGlwYXJ0L2hlYWRlci1zZXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibXVsdGlwYXJ0L21peGVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZVxuICB9LFxuICBcIm11bHRpcGFydC9wYXJhbGxlbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJtdWx0aXBhcnQvcmVsYXRlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2VcbiAgfSxcbiAgXCJtdWx0aXBhcnQvcmVwb3J0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcIm11bHRpcGFydC9zaWduZWRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlXG4gIH0sXG4gIFwibXVsdGlwYXJ0L3ZvaWNlLW1lc3NhZ2VcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwibXVsdGlwYXJ0L3gtbWl4ZWQtcmVwbGFjZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0LzFkLWludGVybGVhdmVkLXBhcml0eWZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L2NhY2hlLW1hbmlmZXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhcHBjYWNoZVwiLFwibWFuaWZlc3RcIl1cbiAgfSxcbiAgXCJ0ZXh0L2NhbGVuZGFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaWNzXCIsXCJpZmJcIl1cbiAgfSxcbiAgXCJ0ZXh0L2NhbGVuZGVyXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwidGV4dC9jbWRcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfSxcbiAgXCJ0ZXh0L2NvZmZlZXNjcmlwdFwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNvZmZlZVwiLFwibGl0Y29mZmVlXCJdXG4gIH0sXG4gIFwidGV4dC9jc3NcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNzc1wiXVxuICB9LFxuICBcInRleHQvY3N2XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJjc3ZcIl1cbiAgfSxcbiAgXCJ0ZXh0L2Nzdi1zY2hlbWFcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9kaXJlY3RvcnlcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9kbnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9lY21hc2NyaXB0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvZW5jYXBydHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9lbnJpY2hlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L2Z3ZHJlZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L2dyYW1tYXItcmVmLWxpc3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9oanNvblwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcImhqc29uXCJdXG4gIH0sXG4gIFwidGV4dC9odG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJodG1sXCIsXCJodG1cIixcInNodG1sXCJdXG4gIH0sXG4gIFwidGV4dC9qYWRlXCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiamFkZVwiXVxuICB9LFxuICBcInRleHQvamF2YXNjcmlwdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcInRleHQvamNyLWNuZFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L2pzeFwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wianN4XCJdXG4gIH0sXG4gIFwidGV4dC9sZXNzXCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibGVzc1wiXVxuICB9LFxuICBcInRleHQvbWFya2Rvd25cIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9tYXRobWxcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibW1sXCJdXG4gIH0sXG4gIFwidGV4dC9taXphclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L24zXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJuM1wiXVxuICB9LFxuICBcInRleHQvcGFyYW1ldGVyc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3Bhcml0eWZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3BsYWluXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0eHRcIixcInRleHRcIixcImNvbmZcIixcImRlZlwiLFwibGlzdFwiLFwibG9nXCIsXCJpblwiLFwiaW5pXCJdXG4gIH0sXG4gIFwidGV4dC9wcm92ZW5hbmNlLW5vdGF0aW9uXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvcHJzLmZhbGxlbnN0ZWluLnJzdFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3Bycy5saW5lcy50YWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkc2NcIl1cbiAgfSxcbiAgXCJ0ZXh0L3Bycy5wcm9wLmxvZ2ljXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvcmFwdG9yZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvcmVkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvcmZjODIyLWhlYWRlcnNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC9yaWNodGV4dFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicnR4XCJdXG4gIH0sXG4gIFwidGV4dC9ydGZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInJ0ZlwiXVxuICB9LFxuICBcInRleHQvcnRwLWVuYy1hZXNjbTEyOFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3J0cGxvb3BiYWNrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvcnR4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvc2dtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNnbWxcIixcInNnbVwiXVxuICB9LFxuICBcInRleHQvc2xpbVwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNsaW1cIixcInNsbVwiXVxuICB9LFxuICBcInRleHQvc3R5bHVzXCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic3R5bHVzXCIsXCJzdHlsXCJdXG4gIH0sXG4gIFwidGV4dC90MTQwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInRzdlwiXVxuICB9LFxuICBcInRleHQvdHJvZmZcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0XCIsXCJ0clwiLFwicm9mZlwiLFwibWFuXCIsXCJtZVwiLFwibXNcIl1cbiAgfSxcbiAgXCJ0ZXh0L3R1cnRsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInR0bFwiXVxuICB9LFxuICBcInRleHQvdWxwZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdXJpLWxpc3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInVyaVwiLFwidXJpc1wiLFwidXJsc1wiXVxuICB9LFxuICBcInRleHQvdmNhcmRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInZjYXJkXCJdXG4gIH0sXG4gIFwidGV4dC92bmQuYVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3ZuZC5hYmNcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQuY3VybFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImN1cmxcIl1cbiAgfSxcbiAgXCJ0ZXh0L3ZuZC5jdXJsLmRjdXJsXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJkY3VybFwiXVxuICB9LFxuICBcInRleHQvdm5kLmN1cmwubWN1cmxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1jdXJsXCJdXG4gIH0sXG4gIFwidGV4dC92bmQuY3VybC5zY3VybFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic2N1cmxcIl1cbiAgfSxcbiAgXCJ0ZXh0L3ZuZC5kZWJpYW4uY29weXJpZ2h0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLmRtY2xpZW50c2NyaXB0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLmR2Yi5zdWJ0aXRsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInN1YlwiXVxuICB9LFxuICBcInRleHQvdm5kLmVzbWVydGVjLnRoZW1lLWRlc2NyaXB0b3JcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQuZmx5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmx5XCJdXG4gIH0sXG4gIFwidGV4dC92bmQuZm1pLmZsZXhzdG9yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmx4XCJdXG4gIH0sXG4gIFwidGV4dC92bmQuZ3JhcGh2aXpcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJndlwiXVxuICB9LFxuICBcInRleHQvdm5kLmluM2QuM2RtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIjNkbWxcIl1cbiAgfSxcbiAgXCJ0ZXh0L3ZuZC5pbjNkLnNwb3RcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzcG90XCJdXG4gIH0sXG4gIFwidGV4dC92bmQuaXB0Yy5uZXdzbWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQuaXB0Yy5uaXRmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLmxhdGV4LXpcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQubW90b3JvbGEucmVmbGV4XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLm1zLW1lZGlhcGFja2FnZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3ZuZC5uZXQycGhvbmUuY29tbWNlbnRlci5jb21tYW5kXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLnJhZGlzeXMubXNtbC1iYXNpYy1sYXlvdXRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQuc2kudXJpY2F0YWxvZ3VlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLnN1bi5qMm1lLmFwcC1kZXNjcmlwdG9yXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiamFkXCJdXG4gIH0sXG4gIFwidGV4dC92bmQudHJvbGx0ZWNoLmxpbmd1aXN0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQvdm5kLndhcC5zaVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCJcbiAgfSxcbiAgXCJ0ZXh0L3ZuZC53YXAuc2xcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiXG4gIH0sXG4gIFwidGV4dC92bmQud2FwLndtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJpYW5hXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIndtbFwiXVxuICB9LFxuICBcInRleHQvdm5kLndhcC53bWxzY3JpcHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiaWFuYVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3bWxzXCJdXG4gIH0sXG4gIFwidGV4dC92dHRcIjoge1xuICAgIFwiY2hhcnNldFwiOiBcIlVURi04XCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1widnR0XCJdXG4gIH0sXG4gIFwidGV4dC94LWFzbVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wic1wiLFwiYXNtXCJdXG4gIH0sXG4gIFwidGV4dC94LWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImNcIixcImNjXCIsXCJjeHhcIixcImNwcFwiLFwiaFwiLFwiaGhcIixcImRpY1wiXVxuICB9LFxuICBcInRleHQveC1jb21wb25lbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwibmdpbnhcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaHRjXCJdXG4gIH0sXG4gIFwidGV4dC94LWZvcnRyYW5cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZcIixcImZvclwiLFwiZjc3XCIsXCJmOTBcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtZ3d0LXJwY1wiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZVxuICB9LFxuICBcInRleHQveC1oYW5kbGViYXJzLXRlbXBsYXRlXCI6IHtcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaGJzXCJdXG4gIH0sXG4gIFwidGV4dC94LWphdmEtc291cmNlXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqYXZhXCJdXG4gIH0sXG4gIFwidGV4dC94LWpxdWVyeS10bXBsXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwidGV4dC94LWx1YVwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcImx1YVwiXVxuICB9LFxuICBcInRleHQveC1tYXJrZG93blwiOiB7XG4gICAgXCJjb21wcmVzc2libGVcIjogdHJ1ZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWFya2Rvd25cIixcIm1kXCIsXCJta2RcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtbmZvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJuZm9cIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtb3BtbFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib3BtbFwiXVxuICB9LFxuICBcInRleHQveC1wYXNjYWxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInBcIixcInBhc1wiXVxuICB9LFxuICBcInRleHQveC1wcm9jZXNzaW5nXCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJwZGVcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtc2Fzc1wiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNhc3NcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtc2Nzc1wiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNjc3NcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtc2V0ZXh0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJldHhcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtc2Z2XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJzZnZcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtc3VzZS15bXBcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInltcFwiXVxuICB9LFxuICBcInRleHQveC11dWVuY29kZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widXVcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtdmNhbGVuZGFyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2Y3NcIl1cbiAgfSxcbiAgXCJ0ZXh0L3gtdmNhcmRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInZjZlwiXVxuICB9LFxuICBcInRleHQveG1sXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ4bWxcIl1cbiAgfSxcbiAgXCJ0ZXh0L3htbC1leHRlcm5hbC1wYXJzZWQtZW50aXR5XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImlhbmFcIlxuICB9LFxuICBcInRleHQveWFtbFwiOiB7XG4gICAgXCJleHRlbnNpb25zXCI6IFtcInlhbWxcIixcInltbFwiXVxuICB9LFxuICBcInZpZGVvLzFkLWludGVybGVhdmVkLXBhcml0eWZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvLzNncHBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIjNncFwiLFwiM2dwcFwiXVxuICB9LFxuICBcInZpZGVvLzNncHAtdHRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby8zZ3BwMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiM2cyXCJdXG4gIH0sXG4gIFwidmlkZW8vYm1wZWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9idDY1NlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL2NlbGJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9kdlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL2VuY2FwcnRwXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vaDI2MVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiaDI2MVwiXVxuICB9LFxuICBcInZpZGVvL2gyNjNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImgyNjNcIl1cbiAgfSxcbiAgXCJ2aWRlby9oMjYzLTE5OThcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9oMjYzLTIwMDBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9oMjY0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJoMjY0XCJdXG4gIH0sXG4gIFwidmlkZW8vaDI2NC1yY2RvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vaDI2NC1zdmNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9oMjY1XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vaXNvLnNlZ21lbnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9qcGVnXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJqcGd2XCJdXG4gIH0sXG4gIFwidmlkZW8vanBlZzIwMDBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9qcG1cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImpwbVwiLFwianBnbVwiXVxuICB9LFxuICBcInZpZGVvL21qMlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibWoyXCIsXCJtanAyXCJdXG4gIH0sXG4gIFwidmlkZW8vbXAxc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL21wMnBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9tcDJ0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ0c1wiXVxuICB9LFxuICBcInZpZGVvL21wNFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wibXA0XCIsXCJtcDR2XCIsXCJtcGc0XCJdXG4gIH0sXG4gIFwidmlkZW8vbXA0di1lc1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL21wZWdcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1wZWdcIixcIm1wZ1wiLFwibXBlXCIsXCJtMXZcIixcIm0ydlwiXVxuICB9LFxuICBcInZpZGVvL21wZWc0LWdlbmVyaWNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9tcHZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9udlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL29nZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wib2d2XCJdXG4gIH0sXG4gIFwidmlkZW8vcGFyaXR5ZmVjXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vcG9pbnRlclwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3F1aWNrdGltZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wicXRcIixcIm1vdlwiXVxuICB9LFxuICBcInZpZGVvL3JhcHRvcmZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3Jhd1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3J0cC1lbmMtYWVzY20xMjhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby9ydHBsb29wYmFja1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3J0eFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3NtcHRlMjkybVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3VscGZlY1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZjMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5jY3R2XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLmRlY2UuaGRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInV2aFwiLFwidXZ2aFwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC5kZWNlLm1vYmlsZVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widXZtXCIsXCJ1dnZtXCJdXG4gIH0sXG4gIFwidmlkZW8vdm5kLmRlY2UubXA0XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLmRlY2UucGRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInV2cFwiLFwidXZ2cFwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC5kZWNlLnNkXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ1dnNcIixcInV2dnNcIl1cbiAgfSxcbiAgXCJ2aWRlby92bmQuZGVjZS52aWRlb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1widXZ2XCIsXCJ1dnZ2XCJdXG4gIH0sXG4gIFwidmlkZW8vdm5kLmRpcmVjdHYubXBlZ1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5kaXJlY3R2Lm1wZWctdHRzXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLmRsbmEubXBlZy10dHNcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuZHZiLmZpbGVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImR2YlwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC5mdnRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImZ2dFwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC5obnMudmlkZW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuaXB0dmZvcnVtLjFkcGFyaXR5ZmVjLTEwMTBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuaXB0dmZvcnVtLjFkcGFyaXR5ZmVjLTIwMDVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuaXB0dmZvcnVtLjJkcGFyaXR5ZmVjLTEwMTBcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuaXB0dmZvcnVtLjJkcGFyaXR5ZmVjLTIwMDVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuaXB0dmZvcnVtLnR0c2F2Y1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5pcHR2Zm9ydW0udHRzbXBlZzJcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQubW90b3JvbGEudmlkZW9cIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQubW90b3JvbGEudmlkZW9wXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLm1wZWd1cmxcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm14dVwiLFwibTR1XCJdXG4gIH0sXG4gIFwidmlkZW8vdm5kLm1zLXBsYXlyZWFkeS5tZWRpYS5weXZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInB5dlwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC5ub2tpYS5pbnRlcmxlYXZlZC1tdWx0aW1lZGlhXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLm5va2lhLnZpZGVvdm9pcFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5vYmplY3R2aWRlb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5yYWRnYW1ldHRvb2xzLmJpbmtcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQucmFkZ2FtZXR0b29scy5zbWFja2VyXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiXG4gIH0sXG4gIFwidmlkZW8vdm5kLnNlYWxlZC5tcGVnMVwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5zZWFsZWQubXBlZzRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQuc2VhbGVkLnN3ZlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIlxuICB9LFxuICBcInZpZGVvL3ZuZC5zZWFsZWRtZWRpYS5zb2Z0c2VhbC5tb3ZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby92bmQudXZ2dS5tcDRcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInV2dVwiLFwidXZ2dVwiXVxuICB9LFxuICBcInZpZGVvL3ZuZC52aXZvXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2aXZcIl1cbiAgfSxcbiAgXCJ2aWRlby92cDhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCJcbiAgfSxcbiAgXCJ2aWRlby93ZWJtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3ZWJtXCJdXG4gIH0sXG4gIFwidmlkZW8veC1mNHZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcImY0dlwiXVxuICB9LFxuICBcInZpZGVvL3gtZmxpXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJmbGlcIl1cbiAgfSxcbiAgXCJ2aWRlby94LWZsdlwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImNvbXByZXNzaWJsZVwiOiBmYWxzZSxcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiZmx2XCJdXG4gIH0sXG4gIFwidmlkZW8veC1tNHZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm00dlwiXVxuICB9LFxuICBcInZpZGVvL3gtbWF0cm9za2FcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJjb21wcmVzc2libGVcIjogZmFsc2UsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1rdlwiLFwibWszZFwiLFwibWtzXCJdXG4gIH0sXG4gIFwidmlkZW8veC1tbmdcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1uZ1wiXVxuICB9LFxuICBcInZpZGVvL3gtbXMtYXNmXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJhc2ZcIixcImFzeFwiXVxuICB9LFxuICBcInZpZGVvL3gtbXMtdm9iXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ2b2JcIl1cbiAgfSxcbiAgXCJ2aWRlby94LW1zLXdtXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3bVwiXVxuICB9LFxuICBcInZpZGVvL3gtbXMtd212XCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiY29tcHJlc3NpYmxlXCI6IGZhbHNlLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJ3bXZcIl1cbiAgfSxcbiAgXCJ2aWRlby94LW1zLXdteFwiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wid214XCJdXG4gIH0sXG4gIFwidmlkZW8veC1tcy13dnhcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInd2eFwiXVxuICB9LFxuICBcInZpZGVvL3gtbXN2aWRlb1wiOiB7XG4gICAgXCJzb3VyY2VcIjogXCJhcGFjaGVcIixcbiAgICBcImV4dGVuc2lvbnNcIjogW1wiYXZpXCJdXG4gIH0sXG4gIFwidmlkZW8veC1zZ2ktbW92aWVcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcIm1vdmllXCJdXG4gIH0sXG4gIFwidmlkZW8veC1zbXZcIjoge1xuICAgIFwic291cmNlXCI6IFwiYXBhY2hlXCIsXG4gICAgXCJleHRlbnNpb25zXCI6IFtcInNtdlwiXVxuICB9LFxuICBcIngtY29uZmVyZW5jZS94LWNvb2x0YWxrXCI6IHtcbiAgICBcInNvdXJjZVwiOiBcImFwYWNoZVwiLFxuICAgIFwiZXh0ZW5zaW9uc1wiOiBbXCJpY2VcIl1cbiAgfSxcbiAgXCJ4LXNoYWRlci94LWZyYWdtZW50XCI6IHtcbiAgICBcImNvbXByZXNzaWJsZVwiOiB0cnVlXG4gIH0sXG4gIFwieC1zaGFkZXIveC12ZXJ0ZXhcIjoge1xuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWVcbiAgfVxufVxuIiwiLyohXG4gKiBtaW1lLWRiXG4gKiBDb3B5cmlnaHQoYykgMjAxNCBKb25hdGhhbiBPbmdcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RiLmpzb24nKVxuIiwiLyoqXG4qIENyZWF0ZSBhbiBldmVudCBlbWl0dGVyIHdpdGggbmFtZXNwYWNlc1xuKiBAbmFtZSBjcmVhdGVOYW1lc3BhY2VFbWl0dGVyXG4qIEBleGFtcGxlXG4qIHZhciBlbWl0dGVyID0gcmVxdWlyZSgnLi9pbmRleCcpKClcbipcbiogZW1pdHRlci5vbignKicsIGZ1bmN0aW9uICgpIHtcbiogICBjb25zb2xlLmxvZygnYWxsIGV2ZW50cyBlbWl0dGVkJywgdGhpcy5ldmVudClcbiogfSlcbipcbiogZW1pdHRlci5vbignZXhhbXBsZScsIGZ1bmN0aW9uICgpIHtcbiogICBjb25zb2xlLmxvZygnZXhhbXBsZSBldmVudCBlbWl0dGVkJylcbiogfSlcbiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZU5hbWVzcGFjZUVtaXR0ZXIgKCkge1xuICB2YXIgZW1pdHRlciA9IHsgX2Zuczoge30gfVxuXG4gIC8qKlxuICAqIEVtaXQgYW4gZXZlbnQuIE9wdGlvbmFsbHkgbmFtZXNwYWNlIHRoZSBldmVudC4gU2VwYXJhdGUgdGhlIG5hbWVzcGFjZSBhbmQgZXZlbnQgd2l0aCBhIGA6YFxuICAqIEBuYW1lIGVtaXRcbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQg4oCTIHRoZSBuYW1lIG9mIHRoZSBldmVudCwgd2l0aCBvcHRpb25hbCBuYW1lc3BhY2VcbiAgKiBAcGFyYW0gey4uLip9IGRhdGEg4oCTIGRhdGEgdmFyaWFibGVzIHRoYXQgd2lsbCBiZSBwYXNzZWQgYXMgYXJndW1lbnRzIHRvIHRoZSBldmVudCBsaXN0ZW5lclxuICAqIEBleGFtcGxlXG4gICogZW1pdHRlci5lbWl0KCdleGFtcGxlJylcbiAgKiBlbWl0dGVyLmVtaXQoJ2RlbW86dGVzdCcpXG4gICogZW1pdHRlci5lbWl0KCdkYXRhJywgeyBleGFtcGxlOiB0cnVlfSwgJ2Egc3RyaW5nJywgMSlcbiAgKi9cbiAgZW1pdHRlci5lbWl0ID0gZnVuY3Rpb24gZW1pdCAoZXZlbnQpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgIHZhciBuYW1lc3BhY2VkID0gbmFtZXNwYWNlcyhldmVudClcbiAgICBpZiAodGhpcy5fZm5zW2V2ZW50XSkgZW1pdEFsbChldmVudCwgdGhpcy5fZm5zW2V2ZW50XSwgYXJncylcbiAgICBpZiAobmFtZXNwYWNlZCkgZW1pdEFsbChldmVudCwgbmFtZXNwYWNlZCwgYXJncylcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSBlbiBldmVudCBsaXN0ZW5lci5cbiAgKiBAbmFtZSBvblxuICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICogQGV4YW1wbGVcbiAgKiBlbWl0dGVyLm9uKCdleGFtcGxlJywgZnVuY3Rpb24gKCkge30pXG4gICogZW1pdHRlci5vbignZGVtbycsIGZ1bmN0aW9uICgpIHt9KVxuICAqL1xuICBlbWl0dGVyLm9uID0gZnVuY3Rpb24gb24gKGV2ZW50LCBmbikge1xuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHsgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayByZXF1aXJlZCcpIH1cbiAgICAodGhpcy5fZm5zW2V2ZW50XSA9IHRoaXMuX2Zuc1tldmVudF0gfHwgW10pLnB1c2goZm4pXG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgZW4gZXZlbnQgbGlzdGVuZXIgdGhhdCBmaXJlcyBvbmNlLlxuICAqIEBuYW1lIG9uY2VcbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAqIEBleGFtcGxlXG4gICogZW1pdHRlci5vbmNlKCdleGFtcGxlJywgZnVuY3Rpb24gKCkge30pXG4gICogZW1pdHRlci5vbmNlKCdkZW1vJywgZnVuY3Rpb24gKCkge30pXG4gICovXG4gIGVtaXR0ZXIub25jZSA9IGZ1bmN0aW9uIG9uY2UgKGV2ZW50LCBmbikge1xuICAgIGZ1bmN0aW9uIG9uZSAoKSB7XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICBlbWl0dGVyLm9mZihldmVudCwgb25lKVxuICAgIH1cbiAgICB0aGlzLm9uKGV2ZW50LCBvbmUpXG4gIH1cblxuICAvKipcbiAgKiBTdG9wIGxpc3RlbmluZyB0byBhbiBldmVudC4gU3RvcCBhbGwgbGlzdGVuZXJzIG9uIGFuIGV2ZW50IGJ5IG9ubHkgcGFzc2luZyB0aGUgZXZlbnQgbmFtZS4gU3RvcCBhIHNpbmdsZSBsaXN0ZW5lciBieSBwYXNzaW5nIHRoYXQgZXZlbnQgaGFuZGxlciBhcyBhIGNhbGxiYWNrLlxuICAqIFlvdSBtdXN0IGJlIGV4cGxpY2l0IGFib3V0IHdoYXQgd2lsbCBiZSB1bnN1YnNjcmliZWQ6IGBlbWl0dGVyLm9mZignZGVtbycpYCB3aWxsIHVuc3Vic2NyaWJlIGFuIGBlbWl0dGVyLm9uKCdkZW1vJylgIGxpc3RlbmVyLCBcbiAgKiBgZW1pdHRlci5vZmYoJ2RlbW86ZXhhbXBsZScpYCB3aWxsIHVuc3Vic2NyaWJlIGFuIGBlbWl0dGVyLm9uKCdkZW1vOmV4YW1wbGUnKWAgbGlzdGVuZXJcbiAgKiBAbmFtZSBvZmZcbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbZm5dIOKAkyB0aGUgc3BlY2lmaWMgaGFuZGxlclxuICAqIEBleGFtcGxlXG4gICogZW1pdHRlci5vZmYoJ2V4YW1wbGUnKVxuICAqIGVtaXR0ZXIub2ZmKCdkZW1vJywgZnVuY3Rpb24gKCkge30pXG4gICovXG4gIGVtaXR0ZXIub2ZmID0gZnVuY3Rpb24gb2ZmIChldmVudCwgZm4pIHtcbiAgICB2YXIga2VlcCA9IFtdXG5cbiAgICBpZiAoZXZlbnQgJiYgZm4pIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fZm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLl9mbnNbaV0gIT09IGZuKSB7XG4gICAgICAgICAga2VlcC5wdXNoKHRoaXMuX2Zuc1tpXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGtlZXAubGVuZ3RoID8gdGhpcy5fZm5zW2V2ZW50XSA9IGtlZXAgOiBkZWxldGUgdGhpcy5fZm5zW2V2ZW50XVxuICB9XG5cbiAgZnVuY3Rpb24gbmFtZXNwYWNlcyAoZSkge1xuICAgIHZhciBvdXQgPSBbXVxuICAgIHZhciBhcmdzID0gZS5zcGxpdCgnOicpXG4gICAgdmFyIGZucyA9IGVtaXR0ZXIuX2Zuc1xuICAgIE9iamVjdC5rZXlzKGZucykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBpZiAoa2V5ID09PSAnKicpIG91dCA9IG91dC5jb25jYXQoZm5zW2tleV0pXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDIgJiYgYXJnc1swXSA9PT0ga2V5KSBvdXQgPSBvdXQuY29uY2F0KGZuc1trZXldKVxuICAgIH0pXG4gICAgcmV0dXJuIG91dFxuICB9XG5cbiAgZnVuY3Rpb24gZW1pdEFsbCAoZSwgZm5zLCBhcmdzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghZm5zW2ldKSBicmVha1xuICAgICAgZm5zW2ldLmV2ZW50ID0gZVxuICAgICAgZm5zW2ldLmFwcGx5KGZuc1tpXSwgYXJncylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZW1pdHRlclxufVxuIiwiKGZ1bmN0aW9uKHNlbGYpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChzZWxmLmZldGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBzZWFyY2hQYXJhbXM6ICdVUkxTZWFyY2hQYXJhbXMnIGluIHNlbGYsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIHNlbGYgJiYgJ2l0ZXJhdG9yJyBpbiBTeW1ib2wsXG4gICAgYmxvYjogJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiYgJ0Jsb2InIGluIHNlbGYgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gICAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgIHZhciBpdGVyYXRvciA9IHtcbiAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpXG4gICAgICAgIHJldHVybiB7ZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICBpdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvclxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpdGVyYXRvclxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIGxpc3QgPSB0aGlzLm1hcFtuYW1lXVxuICAgIGlmICghbGlzdCkge1xuICAgICAgbGlzdCA9IFtdXG4gICAgICB0aGlzLm1hcFtuYW1lXSA9IGxpc3RcbiAgICB9XG4gICAgbGlzdC5wdXNoKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICAgIHJldHVybiB2YWx1ZXMgPyB2YWx1ZXNbMF0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldIHx8IFtdXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gW25vcm1hbGl6ZVZhbHVlKHZhbHVlKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMubWFwKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMubWFwW25hbWVdLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgbmFtZSwgdGhpcylcbiAgICAgIH0sIHRoaXMpXG4gICAgfSwgdGhpcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkgeyBpdGVtcy5wdXNoKG5hbWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHsgaXRlbXMucHVzaCh2YWx1ZSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXNcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJiBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5LnRvU3RyaW5nKClcbiAgICAgIH0gZWxzZSBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIC8vIE9ubHkgc3VwcG9ydCBBcnJheUJ1ZmZlcnMgZm9yIFBPU1QgbWV0aG9kLlxuICAgICAgICAvLyBSZWNlaXZpbmcgQXJyYXlCdWZmZXJzIGhhcHBlbnMgdmlhIEJsb2JzLCBpbnN0ZWFkLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnN1cHBvcnRlZCBCb2R5SW5pdCB0eXBlJylcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsIHRoaXMuX2JvZHlCbG9iLnR5cGUpXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQgOiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG4gICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpKSB7XG4gICAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICAgIH1cbiAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgICB9XG4gICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXJsID0gaW5wdXRcbiAgICB9XG5cbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdvbWl0J1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KVxuICB9XG5cbiAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGJvZHkudHJpbSgpLnNwbGl0KCcmJykuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm9ybVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGVycyh4aHIpIHtcbiAgICB2YXIgaGVhZCA9IG5ldyBIZWFkZXJzKClcbiAgICB2YXIgcGFpcnMgPSAoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKS50cmltKCkuc3BsaXQoJ1xcbicpXG4gICAgcGFpcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHZhciBzcGxpdCA9IGhlYWRlci50cmltKCkuc3BsaXQoJzonKVxuICAgICAgdmFyIGtleSA9IHNwbGl0LnNoaWZ0KCkudHJpbSgpXG4gICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc6JykudHJpbSgpXG4gICAgICBoZWFkLmFwcGVuZChrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgcmV0dXJuIGhlYWRcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuICBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1c1xuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgICB0aGlzLnN0YXR1c1RleHQgPSBvcHRpb25zLnN0YXR1c1RleHRcbiAgICB0aGlzLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzID8gb3B0aW9ucy5oZWFkZXJzIDogbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cbiAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICB1cmw6IHRoaXMudXJsXG4gICAgfSlcbiAgfVxuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfVxuXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnNcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdFxuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2VcblxuICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdFxuICAgICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpICYmICFpbml0KSB7XG4gICAgICAgIHJlcXVlc3QgPSBpbnB1dFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgICAgZnVuY3Rpb24gcmVzcG9uc2VVUkwoKSB7XG4gICAgICAgIGlmICgncmVzcG9uc2VVUkwnIGluIHhocikge1xuICAgICAgICAgIHJldHVybiB4aHIucmVzcG9uc2VVUkxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIHNlY3VyaXR5IHdhcm5pbmdzIG9uIGdldFJlc3BvbnNlSGVhZGVyIHdoZW4gbm90IGFsbG93ZWQgYnkgQ09SU1xuICAgICAgICBpZiAoL15YLVJlcXVlc3QtVVJMOi9tLnRlc3QoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSkge1xuICAgICAgICAgIHJldHVybiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMoeGhyKSxcbiAgICAgICAgICB1cmw6IHJlc3BvbnNlVVJMKClcbiAgICAgICAgfVxuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gICAgfSlcbiAgfVxuICBzZWxmLmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxufSkodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuIiwidmFyIGJlbCA9IHJlcXVpcmUoJ2JlbCcpIC8vIHR1cm5zIHRlbXBsYXRlIHRhZyBpbnRvIERPTSBlbGVtZW50c1xudmFyIG1vcnBoZG9tID0gcmVxdWlyZSgnbW9ycGhkb20nKSAvLyBlZmZpY2llbnRseSBkaWZmcyArIG1vcnBocyB0d28gRE9NIGVsZW1lbnRzXG52YXIgZGVmYXVsdEV2ZW50cyA9IHJlcXVpcmUoJy4vdXBkYXRlLWV2ZW50cy5qcycpIC8vIGRlZmF1bHQgZXZlbnRzIHRvIGJlIGNvcGllZCB3aGVuIGRvbSBlbGVtZW50cyB1cGRhdGVcblxubW9kdWxlLmV4cG9ydHMgPSBiZWxcblxuLy8gVE9ETyBtb3ZlIHRoaXMgKyBkZWZhdWx0RXZlbnRzIHRvIGEgbmV3IG1vZHVsZSBvbmNlIHdlIHJlY2VpdmUgbW9yZSBmZWVkYmFja1xubW9kdWxlLmV4cG9ydHMudXBkYXRlID0gZnVuY3Rpb24gKGZyb21Ob2RlLCB0b05vZGUsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cbiAgaWYgKG9wdHMuZXZlbnRzICE9PSBmYWxzZSkge1xuICAgIGlmICghb3B0cy5vbkJlZm9yZUVsVXBkYXRlZCkgb3B0cy5vbkJlZm9yZUVsVXBkYXRlZCA9IGNvcGllclxuICB9XG5cbiAgcmV0dXJuIG1vcnBoZG9tKGZyb21Ob2RlLCB0b05vZGUsIG9wdHMpXG5cbiAgLy8gbW9ycGhkb20gb25seSBjb3BpZXMgYXR0cmlidXRlcy4gd2UgZGVjaWRlZCB3ZSBhbHNvIHdhbnRlZCB0byBjb3B5IGV2ZW50c1xuICAvLyB0aGF0IGNhbiBiZSBzZXQgdmlhIGF0dHJpYnV0ZXNcbiAgZnVuY3Rpb24gY29waWVyIChmLCB0KSB7XG4gICAgLy8gY29weSBldmVudHM6XG4gICAgdmFyIGV2ZW50cyA9IG9wdHMuZXZlbnRzIHx8IGRlZmF1bHRFdmVudHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGV2ID0gZXZlbnRzW2ldXG4gICAgICBpZiAodFtldl0pIHsgLy8gaWYgbmV3IGVsZW1lbnQgaGFzIGEgd2hpdGVsaXN0ZWQgYXR0cmlidXRlXG4gICAgICAgIGZbZXZdID0gdFtldl0gLy8gdXBkYXRlIGV4aXN0aW5nIGVsZW1lbnRcbiAgICAgIH0gZWxzZSBpZiAoZltldl0pIHsgLy8gaWYgZXhpc3RpbmcgZWxlbWVudCBoYXMgaXQgYW5kIG5ldyBvbmUgZG9lc250XG4gICAgICAgIGZbZXZdID0gdW5kZWZpbmVkIC8vIHJlbW92ZSBpdCBmcm9tIGV4aXN0aW5nIGVsZW1lbnRcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gY29weSB2YWx1ZXMgZm9yIGZvcm0gZWxlbWVudHNcbiAgICBpZiAoKGYubm9kZU5hbWUgPT09ICdJTlBVVCcgJiYgZi50eXBlICE9PSAnZmlsZScpIHx8IGYubm9kZU5hbWUgPT09ICdTRUxFQ1QnKSB7XG4gICAgICBpZiAodC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwpIHQudmFsdWUgPSBmLnZhbHVlXG4gICAgfSBlbHNlIGlmIChmLm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICBpZiAodC5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwpIGYudmFsdWUgPSB0LnZhbHVlXG4gICAgfVxuICB9XG59XG4iLCJ2YXIgZG9jdW1lbnQgPSByZXF1aXJlKCdnbG9iYWwvZG9jdW1lbnQnKVxyXG52YXIgaHlwZXJ4ID0gcmVxdWlyZSgnaHlwZXJ4JylcclxudmFyIG9ubG9hZCA9IHJlcXVpcmUoJ29uLWxvYWQnKVxyXG5cclxudmFyIFNWR05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ1xyXG52YXIgWExJTktOUyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJ1xyXG5cclxudmFyIEJPT0xfUFJPUFMgPSB7XHJcbiAgYXV0b2ZvY3VzOiAxLFxyXG4gIGNoZWNrZWQ6IDEsXHJcbiAgZGVmYXVsdGNoZWNrZWQ6IDEsXHJcbiAgZGlzYWJsZWQ6IDEsXHJcbiAgZm9ybW5vdmFsaWRhdGU6IDEsXHJcbiAgaW5kZXRlcm1pbmF0ZTogMSxcclxuICByZWFkb25seTogMSxcclxuICByZXF1aXJlZDogMSxcclxuICBzZWxlY3RlZDogMSxcclxuICB3aWxsdmFsaWRhdGU6IDFcclxufVxyXG52YXIgU1ZHX1RBR1MgPSBbXHJcbiAgJ3N2ZycsXHJcbiAgJ2FsdEdseXBoJywgJ2FsdEdseXBoRGVmJywgJ2FsdEdseXBoSXRlbScsICdhbmltYXRlJywgJ2FuaW1hdGVDb2xvcicsXHJcbiAgJ2FuaW1hdGVNb3Rpb24nLCAnYW5pbWF0ZVRyYW5zZm9ybScsICdjaXJjbGUnLCAnY2xpcFBhdGgnLCAnY29sb3ItcHJvZmlsZScsXHJcbiAgJ2N1cnNvcicsICdkZWZzJywgJ2Rlc2MnLCAnZWxsaXBzZScsICdmZUJsZW5kJywgJ2ZlQ29sb3JNYXRyaXgnLFxyXG4gICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLFxyXG4gICdmZURpc3BsYWNlbWVudE1hcCcsICdmZURpc3RhbnRMaWdodCcsICdmZUZsb29kJywgJ2ZlRnVuY0EnLCAnZmVGdW5jQicsXHJcbiAgJ2ZlRnVuY0cnLCAnZmVGdW5jUicsICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2UnLCAnZmVNZXJnZU5vZGUnLFxyXG4gICdmZU1vcnBob2xvZ3knLCAnZmVPZmZzZXQnLCAnZmVQb2ludExpZ2h0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsXHJcbiAgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsICdmZVR1cmJ1bGVuY2UnLCAnZmlsdGVyJywgJ2ZvbnQnLCAnZm9udC1mYWNlJyxcclxuICAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2Utc3JjJywgJ2ZvbnQtZmFjZS11cmknLFxyXG4gICdmb3JlaWduT2JqZWN0JywgJ2cnLCAnZ2x5cGgnLCAnZ2x5cGhSZWYnLCAnaGtlcm4nLCAnaW1hZ2UnLCAnbGluZScsXHJcbiAgJ2xpbmVhckdyYWRpZW50JywgJ21hcmtlcicsICdtYXNrJywgJ21ldGFkYXRhJywgJ21pc3NpbmctZ2x5cGgnLCAnbXBhdGgnLFxyXG4gICdwYXRoJywgJ3BhdHRlcm4nLCAncG9seWdvbicsICdwb2x5bGluZScsICdyYWRpYWxHcmFkaWVudCcsICdyZWN0JyxcclxuICAnc2V0JywgJ3N0b3AnLCAnc3dpdGNoJywgJ3N5bWJvbCcsICd0ZXh0JywgJ3RleHRQYXRoJywgJ3RpdGxlJywgJ3RyZWYnLFxyXG4gICd0c3BhbicsICd1c2UnLCAndmlldycsICd2a2VybidcclxuXVxyXG5cclxuZnVuY3Rpb24gYmVsQ3JlYXRlRWxlbWVudCAodGFnLCBwcm9wcywgY2hpbGRyZW4pIHtcclxuICB2YXIgZWxcclxuXHJcbiAgLy8gSWYgYW4gc3ZnIHRhZywgaXQgbmVlZHMgYSBuYW1lc3BhY2VcclxuICBpZiAoU1ZHX1RBR1MuaW5kZXhPZih0YWcpICE9PSAtMSkge1xyXG4gICAgcHJvcHMubmFtZXNwYWNlID0gU1ZHTlNcclxuICB9XHJcblxyXG4gIC8vIElmIHdlIGFyZSB1c2luZyBhIG5hbWVzcGFjZVxyXG4gIHZhciBucyA9IGZhbHNlXHJcbiAgaWYgKHByb3BzLm5hbWVzcGFjZSkge1xyXG4gICAgbnMgPSBwcm9wcy5uYW1lc3BhY2VcclxuICAgIGRlbGV0ZSBwcm9wcy5uYW1lc3BhY2VcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSB0aGUgZWxlbWVudFxyXG4gIGlmIChucykge1xyXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIHRhZylcclxuICB9IGVsc2Uge1xyXG4gICAgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZylcclxuICB9XHJcblxyXG4gIC8vIElmIGFkZGluZyBvbmxvYWQgZXZlbnRzXHJcbiAgaWYgKHByb3BzLm9ubG9hZCB8fCBwcm9wcy5vbnVubG9hZCkge1xyXG4gICAgdmFyIGxvYWQgPSBwcm9wcy5vbmxvYWQgfHwgZnVuY3Rpb24gKCkge31cclxuICAgIHZhciB1bmxvYWQgPSBwcm9wcy5vbnVubG9hZCB8fCBmdW5jdGlvbiAoKSB7fVxyXG4gICAgb25sb2FkKGVsLCBmdW5jdGlvbiBiZWxPbmxvYWQgKCkge1xyXG4gICAgICBsb2FkKGVsKVxyXG4gICAgfSwgZnVuY3Rpb24gYmVsT251bmxvYWQgKCkge1xyXG4gICAgICB1bmxvYWQoZWwpXHJcbiAgICB9LFxyXG4gICAgLy8gV2UgaGF2ZSB0byB1c2Ugbm9uLXN0YW5kYXJkIGBjYWxsZXJgIHRvIGZpbmQgd2hvIGludm9rZXMgYGJlbENyZWF0ZUVsZW1lbnRgXHJcbiAgICBiZWxDcmVhdGVFbGVtZW50LmNhbGxlci5jYWxsZXIuY2FsbGVyKVxyXG4gICAgZGVsZXRlIHByb3BzLm9ubG9hZFxyXG4gICAgZGVsZXRlIHByb3BzLm9udW5sb2FkXHJcbiAgfVxyXG5cclxuICAvLyBDcmVhdGUgdGhlIHByb3BlcnRpZXNcclxuICBmb3IgKHZhciBwIGluIHByb3BzKSB7XHJcbiAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocCkpIHtcclxuICAgICAgdmFyIGtleSA9IHAudG9Mb3dlckNhc2UoKVxyXG4gICAgICB2YXIgdmFsID0gcHJvcHNbcF1cclxuICAgICAgLy8gTm9ybWFsaXplIGNsYXNzTmFtZVxyXG4gICAgICBpZiAoa2V5ID09PSAnY2xhc3NuYW1lJykge1xyXG4gICAgICAgIGtleSA9ICdjbGFzcydcclxuICAgICAgICBwID0gJ2NsYXNzJ1xyXG4gICAgICB9XHJcbiAgICAgIC8vIFRoZSBmb3IgYXR0cmlidXRlIGdldHMgdHJhbnNmb3JtZWQgdG8gaHRtbEZvciwgYnV0IHdlIGp1c3Qgc2V0IGFzIGZvclxyXG4gICAgICBpZiAocCA9PT0gJ2h0bWxGb3InKSB7XHJcbiAgICAgICAgcCA9ICdmb3InXHJcbiAgICAgIH1cclxuICAgICAgLy8gSWYgYSBwcm9wZXJ0eSBpcyBib29sZWFuLCBzZXQgaXRzZWxmIHRvIHRoZSBrZXlcclxuICAgICAgaWYgKEJPT0xfUFJPUFNba2V5XSkge1xyXG4gICAgICAgIGlmICh2YWwgPT09ICd0cnVlJykgdmFsID0ga2V5XHJcbiAgICAgICAgZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSBjb250aW51ZVxyXG4gICAgICB9XHJcbiAgICAgIC8vIElmIGEgcHJvcGVydHkgcHJlZmVycyBiZWluZyBzZXQgZGlyZWN0bHkgdnMgc2V0QXR0cmlidXRlXHJcbiAgICAgIGlmIChrZXkuc2xpY2UoMCwgMikgPT09ICdvbicpIHtcclxuICAgICAgICBlbFtwXSA9IHZhbFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChucykge1xyXG4gICAgICAgICAgaWYgKHAgPT09ICd4bGluazpocmVmJykge1xyXG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhYTElOS05TLCBwLCB2YWwpXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGVOUyhudWxsLCBwLCB2YWwpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShwLCB2YWwpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhcHBlbmRDaGlsZCAoY2hpbGRzKSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY2hpbGRzKSkgcmV0dXJuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgbm9kZSA9IGNoaWxkc1tpXVxyXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkge1xyXG4gICAgICAgIGFwcGVuZENoaWxkKG5vZGUpXHJcbiAgICAgICAgY29udGludWVcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiBub2RlID09PSAnbnVtYmVyJyB8fFxyXG4gICAgICAgIHR5cGVvZiBub2RlID09PSAnYm9vbGVhbicgfHxcclxuICAgICAgICBub2RlIGluc3RhbmNlb2YgRGF0ZSB8fFxyXG4gICAgICAgIG5vZGUgaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuICAgICAgICBub2RlID0gbm9kZS50b1N0cmluZygpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBpZiAoZWwubGFzdENoaWxkICYmIGVsLmxhc3RDaGlsZC5ub2RlTmFtZSA9PT0gJyN0ZXh0Jykge1xyXG4gICAgICAgICAgZWwubGFzdENoaWxkLm5vZGVWYWx1ZSArPSBub2RlXHJcbiAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobm9kZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5vZGUgJiYgbm9kZS5ub2RlVHlwZSkge1xyXG4gICAgICAgIGVsLmFwcGVuZENoaWxkKG5vZGUpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgYXBwZW5kQ2hpbGQoY2hpbGRyZW4pXHJcblxyXG4gIHJldHVybiBlbFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGh5cGVyeChiZWxDcmVhdGVFbGVtZW50KVxyXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVFbGVtZW50ID0gYmVsQ3JlYXRlRWxlbWVudFxyXG4iLCJ2YXIgdG9wTGV2ZWwgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6XG4gICAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fVxudmFyIG1pbkRvYyA9IHJlcXVpcmUoJ21pbi1kb2N1bWVudCcpO1xuXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZG9jdW1lbnQ7XG59IGVsc2Uge1xuICAgIHZhciBkb2NjeSA9IHRvcExldmVsWydfX0dMT0JBTF9ET0NVTUVOVF9DQUNIRUA0J107XG5cbiAgICBpZiAoIWRvY2N5KSB7XG4gICAgICAgIGRvY2N5ID0gdG9wTGV2ZWxbJ19fR0xPQkFMX0RPQ1VNRU5UX0NBQ0hFQDQnXSA9IG1pbkRvYztcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGRvY2N5O1xufVxuIiwiaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzZWxmO1xufSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHt9O1xufVxuIiwidmFyIGF0dHJUb1Byb3AgPSByZXF1aXJlKCdoeXBlcnNjcmlwdC1hdHRyaWJ1dGUtdG8tcHJvcGVydHknKVxuXG52YXIgVkFSID0gMCwgVEVYVCA9IDEsIE9QRU4gPSAyLCBDTE9TRSA9IDMsIEFUVFIgPSA0XG52YXIgQVRUUl9LRVkgPSA1LCBBVFRSX0tFWV9XID0gNlxudmFyIEFUVFJfVkFMVUVfVyA9IDcsIEFUVFJfVkFMVUUgPSA4XG52YXIgQVRUUl9WQUxVRV9TUSA9IDksIEFUVFJfVkFMVUVfRFEgPSAxMFxudmFyIEFUVFJfRVEgPSAxMSwgQVRUUl9CUkVBSyA9IDEyXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGgsIG9wdHMpIHtcbiAgaCA9IGF0dHJUb1Byb3AoaClcbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cbiAgdmFyIGNvbmNhdCA9IG9wdHMuY29uY2F0IHx8IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIFN0cmluZyhhKSArIFN0cmluZyhiKVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChzdHJpbmdzKSB7XG4gICAgdmFyIHN0YXRlID0gVEVYVCwgcmVnID0gJydcbiAgICB2YXIgYXJnbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBwYXJ0cyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChpIDwgYXJnbGVuIC0gMSkge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2krMV1cbiAgICAgICAgdmFyIHAgPSBwYXJzZShzdHJpbmdzW2ldKVxuICAgICAgICB2YXIgeHN0YXRlID0gc3RhdGVcbiAgICAgICAgaWYgKHhzdGF0ZSA9PT0gQVRUUl9WQUxVRV9EUSkgeHN0YXRlID0gQVRUUl9WQUxVRVxuICAgICAgICBpZiAoeHN0YXRlID09PSBBVFRSX1ZBTFVFX1NRKSB4c3RhdGUgPSBBVFRSX1ZBTFVFXG4gICAgICAgIGlmICh4c3RhdGUgPT09IEFUVFJfVkFMVUVfVykgeHN0YXRlID0gQVRUUl9WQUxVRVxuICAgICAgICBpZiAoeHN0YXRlID09PSBBVFRSKSB4c3RhdGUgPSBBVFRSX0tFWVxuICAgICAgICBwLnB1c2goWyBWQVIsIHhzdGF0ZSwgYXJnIF0pXG4gICAgICAgIHBhcnRzLnB1c2guYXBwbHkocGFydHMsIHApXG4gICAgICB9IGVsc2UgcGFydHMucHVzaC5hcHBseShwYXJ0cywgcGFyc2Uoc3RyaW5nc1tpXSkpXG4gICAgfVxuXG4gICAgdmFyIHRyZWUgPSBbbnVsbCx7fSxbXV1cbiAgICB2YXIgc3RhY2sgPSBbW3RyZWUsLTFdXVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjdXIgPSBzdGFja1tzdGFjay5sZW5ndGgtMV1bMF1cbiAgICAgIHZhciBwID0gcGFydHNbaV0sIHMgPSBwWzBdXG4gICAgICBpZiAocyA9PT0gT1BFTiAmJiAvXlxcLy8udGVzdChwWzFdKSkge1xuICAgICAgICB2YXIgaXggPSBzdGFja1tzdGFjay5sZW5ndGgtMV1bMV1cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgIHN0YWNrW3N0YWNrLmxlbmd0aC0xXVswXVsyXVtpeF0gPSBoKFxuICAgICAgICAgICAgY3VyWzBdLCBjdXJbMV0sIGN1clsyXS5sZW5ndGggPyBjdXJbMl0gOiB1bmRlZmluZWRcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocyA9PT0gT1BFTikge1xuICAgICAgICB2YXIgYyA9IFtwWzFdLHt9LFtdXVxuICAgICAgICBjdXJbMl0ucHVzaChjKVxuICAgICAgICBzdGFjay5wdXNoKFtjLGN1clsyXS5sZW5ndGgtMV0pXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IEFUVFJfS0VZIHx8IChzID09PSBWQVIgJiYgcFsxXSA9PT0gQVRUUl9LRVkpKSB7XG4gICAgICAgIHZhciBrZXkgPSAnJ1xuICAgICAgICB2YXIgY29weUtleVxuICAgICAgICBmb3IgKDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHBhcnRzW2ldWzBdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAga2V5ID0gY29uY2F0KGtleSwgcGFydHNbaV1bMV0pXG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tpXVswXSA9PT0gVkFSICYmIHBhcnRzW2ldWzFdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJ0c1tpXVsyXSA9PT0gJ29iamVjdCcgJiYgIWtleSkge1xuICAgICAgICAgICAgICBmb3IgKGNvcHlLZXkgaW4gcGFydHNbaV1bMl0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFydHNbaV1bMl0uaGFzT3duUHJvcGVydHkoY29weUtleSkgJiYgIWN1clsxXVtjb3B5S2V5XSkge1xuICAgICAgICAgICAgICAgICAgY3VyWzFdW2NvcHlLZXldID0gcGFydHNbaV1bMl1bY29weUtleV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGtleSA9IGNvbmNhdChrZXksIHBhcnRzW2ldWzJdKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBicmVha1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0c1tpXVswXSA9PT0gQVRUUl9FUSkgaSsrXG4gICAgICAgIHZhciBqID0gaVxuICAgICAgICBmb3IgKDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHBhcnRzW2ldWzBdID09PSBBVFRSX1ZBTFVFIHx8IHBhcnRzW2ldWzBdID09PSBBVFRSX0tFWSkge1xuICAgICAgICAgICAgaWYgKCFjdXJbMV1ba2V5XSkgY3VyWzFdW2tleV0gPSBzdHJmbihwYXJ0c1tpXVsxXSlcbiAgICAgICAgICAgIGVsc2UgY3VyWzFdW2tleV0gPSBjb25jYXQoY3VyWzFdW2tleV0sIHBhcnRzW2ldWzFdKVxuICAgICAgICAgIH0gZWxzZSBpZiAocGFydHNbaV1bMF0gPT09IFZBUlxuICAgICAgICAgICYmIChwYXJ0c1tpXVsxXSA9PT0gQVRUUl9WQUxVRSB8fCBwYXJ0c1tpXVsxXSA9PT0gQVRUUl9LRVkpKSB7XG4gICAgICAgICAgICBpZiAoIWN1clsxXVtrZXldKSBjdXJbMV1ba2V5XSA9IHN0cmZuKHBhcnRzW2ldWzJdKVxuICAgICAgICAgICAgZWxzZSBjdXJbMV1ba2V5XSA9IGNvbmNhdChjdXJbMV1ba2V5XSwgcGFydHNbaV1bMl0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChrZXkubGVuZ3RoICYmICFjdXJbMV1ba2V5XSAmJiBpID09PSBqXG4gICAgICAgICAgICAmJiAocGFydHNbaV1bMF0gPT09IENMT1NFIHx8IHBhcnRzW2ldWzBdID09PSBBVFRSX0JSRUFLKSkge1xuICAgICAgICAgICAgICAvLyBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmZyYXN0cnVjdHVyZS5odG1sI2Jvb2xlYW4tYXR0cmlidXRlc1xuICAgICAgICAgICAgICAvLyBlbXB0eSBzdHJpbmcgaXMgZmFsc3ksIG5vdCB3ZWxsIGJlaGF2ZWQgdmFsdWUgaW4gYnJvd3NlclxuICAgICAgICAgICAgICBjdXJbMV1ba2V5XSA9IGtleS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBBVFRSX0tFWSkge1xuICAgICAgICBjdXJbMV1bcFsxXV0gPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IFZBUiAmJiBwWzFdID09PSBBVFRSX0tFWSkge1xuICAgICAgICBjdXJbMV1bcFsyXV0gPSB0cnVlXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IENMT1NFKSB7XG4gICAgICAgIGlmIChzZWxmQ2xvc2luZyhjdXJbMF0pICYmIHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBpeCA9IHN0YWNrW3N0YWNrLmxlbmd0aC0xXVsxXVxuICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgc3RhY2tbc3RhY2subGVuZ3RoLTFdWzBdWzJdW2l4XSA9IGgoXG4gICAgICAgICAgICBjdXJbMF0sIGN1clsxXSwgY3VyWzJdLmxlbmd0aCA/IGN1clsyXSA6IHVuZGVmaW5lZFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBWQVIgJiYgcFsxXSA9PT0gVEVYVCkge1xuICAgICAgICBpZiAocFsyXSA9PT0gdW5kZWZpbmVkIHx8IHBbMl0gPT09IG51bGwpIHBbMl0gPSAnJ1xuICAgICAgICBlbHNlIGlmICghcFsyXSkgcFsyXSA9IGNvbmNhdCgnJywgcFsyXSlcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocFsyXVswXSkpIHtcbiAgICAgICAgICBjdXJbMl0ucHVzaC5hcHBseShjdXJbMl0sIHBbMl0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VyWzJdLnB1c2gocFsyXSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChzID09PSBURVhUKSB7XG4gICAgICAgIGN1clsyXS5wdXNoKHBbMV0pXG4gICAgICB9IGVsc2UgaWYgKHMgPT09IEFUVFJfRVEgfHwgcyA9PT0gQVRUUl9CUkVBSykge1xuICAgICAgICAvLyBuby1vcFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmhhbmRsZWQ6ICcgKyBzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0cmVlWzJdLmxlbmd0aCA+IDEgJiYgL15cXHMqJC8udGVzdCh0cmVlWzJdWzBdKSkge1xuICAgICAgdHJlZVsyXS5zaGlmdCgpXG4gICAgfVxuXG4gICAgaWYgKHRyZWVbMl0ubGVuZ3RoID4gMlxuICAgIHx8ICh0cmVlWzJdLmxlbmd0aCA9PT0gMiAmJiAvXFxTLy50ZXN0KHRyZWVbMl1bMV0pKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnbXVsdGlwbGUgcm9vdCBlbGVtZW50cyBtdXN0IGJlIHdyYXBwZWQgaW4gYW4gZW5jbG9zaW5nIHRhZydcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodHJlZVsyXVswXSkgJiYgdHlwZW9mIHRyZWVbMl1bMF1bMF0gPT09ICdzdHJpbmcnXG4gICAgJiYgQXJyYXkuaXNBcnJheSh0cmVlWzJdWzBdWzJdKSkge1xuICAgICAgdHJlZVsyXVswXSA9IGgodHJlZVsyXVswXVswXSwgdHJlZVsyXVswXVsxXSwgdHJlZVsyXVswXVsyXSlcbiAgICB9XG4gICAgcmV0dXJuIHRyZWVbMl1bMF1cblxuICAgIGZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgICAgIHZhciByZXMgPSBbXVxuICAgICAgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX1cpIHN0YXRlID0gQVRUUlxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGMgPSBzdHIuY2hhckF0KGkpXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gVEVYVCAmJiBjID09PSAnPCcpIHtcbiAgICAgICAgICBpZiAocmVnLmxlbmd0aCkgcmVzLnB1c2goW1RFWFQsIHJlZ10pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IE9QRU5cbiAgICAgICAgfSBlbHNlIGlmIChjID09PSAnPicgJiYgIXF1b3Qoc3RhdGUpKSB7XG4gICAgICAgICAgaWYgKHN0YXRlID09PSBPUEVOKSB7XG4gICAgICAgICAgICByZXMucHVzaChbT1BFTixyZWddKVxuICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfS0VZKSB7XG4gICAgICAgICAgICByZXMucHVzaChbQVRUUl9LRVkscmVnXSlcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFICYmIHJlZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZ10pXG4gICAgICAgICAgfVxuICAgICAgICAgIHJlcy5wdXNoKFtDTE9TRV0pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IFRFWFRcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gVEVYVCkge1xuICAgICAgICAgIHJlZyArPSBjXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IE9QRU4gJiYgL1xccy8udGVzdChjKSkge1xuICAgICAgICAgIHJlcy5wdXNoKFtPUEVOLCByZWddKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBBVFRSXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IE9QRU4pIHtcbiAgICAgICAgICByZWcgKz0gY1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSICYmIC9bXFx3LV0vLnRlc3QoYykpIHtcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJfS0VZXG4gICAgICAgICAgcmVnID0gY1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSICYmIC9cXHMvLnRlc3QoYykpIHtcbiAgICAgICAgICBpZiAocmVnLmxlbmd0aCkgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfQlJFQUtdKVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX0tFWSAmJiAvXFxzLy50ZXN0KGMpKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJfS0VZX1dcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkgJiYgYyA9PT0gJz0nKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10sW0FUVFJfRVFdKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFX1dcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkpIHtcbiAgICAgICAgICByZWcgKz0gY1xuICAgICAgICB9IGVsc2UgaWYgKChzdGF0ZSA9PT0gQVRUUl9LRVlfVyB8fCBzdGF0ZSA9PT0gQVRUUikgJiYgYyA9PT0gJz0nKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfRVFdKVxuICAgICAgICAgIHN0YXRlID0gQVRUUl9WQUxVRV9XXG4gICAgICAgIH0gZWxzZSBpZiAoKHN0YXRlID09PSBBVFRSX0tFWV9XIHx8IHN0YXRlID09PSBBVFRSKSAmJiAhL1xccy8udGVzdChjKSkge1xuICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX0JSRUFLXSlcbiAgICAgICAgICBpZiAoL1tcXHctXS8udGVzdChjKSkge1xuICAgICAgICAgICAgcmVnICs9IGNcbiAgICAgICAgICAgIHN0YXRlID0gQVRUUl9LRVlcbiAgICAgICAgICB9IGVsc2Ugc3RhdGUgPSBBVFRSXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfVyAmJiBjID09PSAnXCInKSB7XG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFX0RRXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfVyAmJiBjID09PSBcIidcIikge1xuICAgICAgICAgIHN0YXRlID0gQVRUUl9WQUxVRV9TUVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX0RRICYmIGMgPT09ICdcIicpIHtcbiAgICAgICAgICByZXMucHVzaChbQVRUUl9WQUxVRSxyZWddLFtBVFRSX0JSRUFLXSlcbiAgICAgICAgICByZWcgPSAnJ1xuICAgICAgICAgIHN0YXRlID0gQVRUUlxuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX1NRICYmIGMgPT09IFwiJ1wiKSB7XG4gICAgICAgICAgcmVzLnB1c2goW0FUVFJfVkFMVUUscmVnXSxbQVRUUl9CUkVBS10pXG4gICAgICAgICAgcmVnID0gJydcbiAgICAgICAgICBzdGF0ZSA9IEFUVFJcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9WQUxVRV9XICYmICEvXFxzLy50ZXN0KGMpKSB7XG4gICAgICAgICAgc3RhdGUgPSBBVFRSX1ZBTFVFXG4gICAgICAgICAgaS0tXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUUgJiYgL1xccy8udGVzdChjKSkge1xuICAgICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZ10sW0FUVFJfQlJFQUtdKVxuICAgICAgICAgIHJlZyA9ICcnXG4gICAgICAgICAgc3RhdGUgPSBBVFRSXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUUgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfU1FcbiAgICAgICAgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfRFEpIHtcbiAgICAgICAgICByZWcgKz0gY1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3RhdGUgPT09IFRFWFQgJiYgcmVnLmxlbmd0aCkge1xuICAgICAgICByZXMucHVzaChbVEVYVCxyZWddKVxuICAgICAgICByZWcgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9WQUxVRSAmJiByZWcubGVuZ3RoKSB7XG4gICAgICAgIHJlcy5wdXNoKFtBVFRSX1ZBTFVFLHJlZ10pXG4gICAgICAgIHJlZyA9ICcnXG4gICAgICB9IGVsc2UgaWYgKHN0YXRlID09PSBBVFRSX1ZBTFVFX0RRICYmIHJlZy5sZW5ndGgpIHtcbiAgICAgICAgcmVzLnB1c2goW0FUVFJfVkFMVUUscmVnXSlcbiAgICAgICAgcmVnID0gJydcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IEFUVFJfVkFMVUVfU1EgJiYgcmVnLmxlbmd0aCkge1xuICAgICAgICByZXMucHVzaChbQVRUUl9WQUxVRSxyZWddKVxuICAgICAgICByZWcgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gQVRUUl9LRVkpIHtcbiAgICAgICAgcmVzLnB1c2goW0FUVFJfS0VZLHJlZ10pXG4gICAgICAgIHJlZyA9ICcnXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RyZm4gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09ICdmdW5jdGlvbicpIHJldHVybiB4XG4gICAgZWxzZSBpZiAodHlwZW9mIHggPT09ICdzdHJpbmcnKSByZXR1cm4geFxuICAgIGVsc2UgaWYgKHggJiYgdHlwZW9mIHggPT09ICdvYmplY3QnKSByZXR1cm4geFxuICAgIGVsc2UgcmV0dXJuIGNvbmNhdCgnJywgeClcbiAgfVxufVxuXG5mdW5jdGlvbiBxdW90IChzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUgPT09IEFUVFJfVkFMVUVfU1EgfHwgc3RhdGUgPT09IEFUVFJfVkFMVUVfRFFcbn1cblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbmZ1bmN0aW9uIGhhcyAob2JqLCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG9iaiwga2V5KSB9XG5cbnZhciBjbG9zZVJFID0gUmVnRXhwKCdeKCcgKyBbXG4gICdhcmVhJywgJ2Jhc2UnLCAnYmFzZWZvbnQnLCAnYmdzb3VuZCcsICdicicsICdjb2wnLCAnY29tbWFuZCcsICdlbWJlZCcsXG4gICdmcmFtZScsICdocicsICdpbWcnLCAnaW5wdXQnLCAnaXNpbmRleCcsICdrZXlnZW4nLCAnbGluaycsICdtZXRhJywgJ3BhcmFtJyxcbiAgJ3NvdXJjZScsICd0cmFjaycsICd3YnInLFxuICAvLyBTVkcgVEFHU1xuICAnYW5pbWF0ZScsICdhbmltYXRlVHJhbnNmb3JtJywgJ2NpcmNsZScsICdjdXJzb3InLCAnZGVzYycsICdlbGxpcHNlJyxcbiAgJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvc2l0ZScsXG4gICdmZUNvbnZvbHZlTWF0cml4JywgJ2ZlRGlmZnVzZUxpZ2h0aW5nJywgJ2ZlRGlzcGxhY2VtZW50TWFwJyxcbiAgJ2ZlRGlzdGFudExpZ2h0JywgJ2ZlRmxvb2QnLCAnZmVGdW5jQScsICdmZUZ1bmNCJywgJ2ZlRnVuY0cnLCAnZmVGdW5jUicsXG4gICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2VOb2RlJywgJ2ZlTW9ycGhvbG9neScsXG4gICdmZU9mZnNldCcsICdmZVBvaW50TGlnaHQnLCAnZmVTcGVjdWxhckxpZ2h0aW5nJywgJ2ZlU3BvdExpZ2h0JywgJ2ZlVGlsZScsXG4gICdmZVR1cmJ1bGVuY2UnLCAnZm9udC1mYWNlLWZvcm1hdCcsICdmb250LWZhY2UtbmFtZScsICdmb250LWZhY2UtdXJpJyxcbiAgJ2dseXBoJywgJ2dseXBoUmVmJywgJ2hrZXJuJywgJ2ltYWdlJywgJ2xpbmUnLCAnbWlzc2luZy1nbHlwaCcsICdtcGF0aCcsXG4gICdwYXRoJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmVjdCcsICdzZXQnLCAnc3RvcCcsICd0cmVmJywgJ3VzZScsICd2aWV3JyxcbiAgJ3ZrZXJuJ1xuXS5qb2luKCd8JykgKyAnKSg/OltcXC4jXVthLXpBLVowLTlcXHUwMDdGLVxcdUZGRkZfOi1dKykqJCcpXG5mdW5jdGlvbiBzZWxmQ2xvc2luZyAodGFnKSB7IHJldHVybiBjbG9zZVJFLnRlc3QodGFnKSB9XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGF0dHJpYnV0ZVRvUHJvcGVydHlcblxudmFyIHRyYW5zZm9ybSA9IHtcbiAgJ2NsYXNzJzogJ2NsYXNzTmFtZScsXG4gICdmb3InOiAnaHRtbEZvcicsXG4gICdodHRwLWVxdWl2JzogJ2h0dHBFcXVpdidcbn1cblxuZnVuY3Rpb24gYXR0cmlidXRlVG9Qcm9wZXJ0eSAoaCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHRhZ05hbWUsIGF0dHJzLCBjaGlsZHJlbikge1xuICAgIGZvciAodmFyIGF0dHIgaW4gYXR0cnMpIHtcbiAgICAgIGlmIChhdHRyIGluIHRyYW5zZm9ybSkge1xuICAgICAgICBhdHRyc1t0cmFuc2Zvcm1bYXR0cl1dID0gYXR0cnNbYXR0cl1cbiAgICAgICAgZGVsZXRlIGF0dHJzW2F0dHJdXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoKHRhZ05hbWUsIGF0dHJzLCBjaGlsZHJlbilcbiAgfVxufVxuIiwiLyogZ2xvYmFsIE11dGF0aW9uT2JzZXJ2ZXIgKi9cbnZhciBkb2N1bWVudCA9IHJlcXVpcmUoJ2dsb2JhbC9kb2N1bWVudCcpXG52YXIgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpXG52YXIgd2F0Y2ggPSBPYmplY3QuY3JlYXRlKG51bGwpXG52YXIgS0VZX0lEID0gJ29ubG9hZGlkJyArIChuZXcgRGF0ZSgpICUgOWU2KS50b1N0cmluZygzNilcbnZhciBLRVlfQVRUUiA9ICdkYXRhLScgKyBLRVlfSURcbnZhciBJTkRFWCA9IDBcblxuaWYgKHdpbmRvdyAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcikge1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAobXV0YXRpb25zKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHdhdGNoKS5sZW5ndGggPCAxKSByZXR1cm5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11dGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKG11dGF0aW9uc1tpXS5hdHRyaWJ1dGVOYW1lID09PSBLRVlfQVRUUikge1xuICAgICAgICBlYWNoQXR0cihtdXRhdGlvbnNbaV0sIHR1cm5vbiwgdHVybm9mZilcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGVhY2hNdXRhdGlvbihtdXRhdGlvbnNbaV0ucmVtb3ZlZE5vZGVzLCB0dXJub2ZmKVxuICAgICAgZWFjaE11dGF0aW9uKG11dGF0aW9uc1tpXS5hZGRlZE5vZGVzLCB0dXJub24pXG4gICAgfVxuICB9KVxuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZSxcbiAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiB0cnVlLFxuICAgIGF0dHJpYnV0ZUZpbHRlcjogW0tFWV9BVFRSXVxuICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9ubG9hZCAoZWwsIG9uLCBvZmYsIGNhbGxlcikge1xuICBvbiA9IG9uIHx8IGZ1bmN0aW9uICgpIHt9XG4gIG9mZiA9IG9mZiB8fCBmdW5jdGlvbiAoKSB7fVxuICBlbC5zZXRBdHRyaWJ1dGUoS0VZX0FUVFIsICdvJyArIElOREVYKVxuICB3YXRjaFsnbycgKyBJTkRFWF0gPSBbb24sIG9mZiwgMCwgY2FsbGVyIHx8IG9ubG9hZC5jYWxsZXJdXG4gIElOREVYICs9IDFcbiAgcmV0dXJuIGVsXG59XG5cbmZ1bmN0aW9uIHR1cm5vbiAoaW5kZXgsIGVsKSB7XG4gIGlmICh3YXRjaFtpbmRleF1bMF0gJiYgd2F0Y2hbaW5kZXhdWzJdID09PSAwKSB7XG4gICAgd2F0Y2hbaW5kZXhdWzBdKGVsKVxuICAgIHdhdGNoW2luZGV4XVsyXSA9IDFcbiAgfVxufVxuXG5mdW5jdGlvbiB0dXJub2ZmIChpbmRleCwgZWwpIHtcbiAgaWYgKHdhdGNoW2luZGV4XVsxXSAmJiB3YXRjaFtpbmRleF1bMl0gPT09IDEpIHtcbiAgICB3YXRjaFtpbmRleF1bMV0oZWwpXG4gICAgd2F0Y2hbaW5kZXhdWzJdID0gMFxuICB9XG59XG5cbmZ1bmN0aW9uIGVhY2hBdHRyIChtdXRhdGlvbiwgb24sIG9mZikge1xuICB2YXIgbmV3VmFsdWUgPSBtdXRhdGlvbi50YXJnZXQuZ2V0QXR0cmlidXRlKEtFWV9BVFRSKVxuICBpZiAoc2FtZU9yaWdpbihtdXRhdGlvbi5vbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgd2F0Y2hbbmV3VmFsdWVdID0gd2F0Y2hbbXV0YXRpb24ub2xkVmFsdWVdXG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKHdhdGNoW211dGF0aW9uLm9sZFZhbHVlXSkge1xuICAgIG9mZihtdXRhdGlvbi5vbGRWYWx1ZSwgbXV0YXRpb24udGFyZ2V0KVxuICB9XG4gIGlmICh3YXRjaFtuZXdWYWx1ZV0pIHtcbiAgICBvbihuZXdWYWx1ZSwgbXV0YXRpb24udGFyZ2V0KVxuICB9XG59XG5cbmZ1bmN0aW9uIHNhbWVPcmlnaW4gKG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICBpZiAoIW9sZFZhbHVlIHx8ICFuZXdWYWx1ZSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB3YXRjaFtvbGRWYWx1ZV1bM10gPT09IHdhdGNoW25ld1ZhbHVlXVszXVxufVxuXG5mdW5jdGlvbiBlYWNoTXV0YXRpb24gKG5vZGVzLCBmbikge1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHdhdGNoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLmdldEF0dHJpYnV0ZSAmJiBub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoS0VZX0FUVFIpKSB7XG4gICAgICB2YXIgb25sb2FkaWQgPSBub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoS0VZX0FUVFIpXG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKG9ubG9hZGlkID09PSBrKSB7XG4gICAgICAgICAgZm4oaywgbm9kZXNbaV0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIGlmIChub2Rlc1tpXS5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGVhY2hNdXRhdGlvbihub2Rlc1tpXS5jaGlsZE5vZGVzLCBmbilcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIENyZWF0ZSBhIHJhbmdlIG9iamVjdCBmb3IgZWZmaWNlbnRseSByZW5kZXJpbmcgc3RyaW5ncyB0byBlbGVtZW50cy5cbnZhciByYW5nZTtcblxudmFyIGRvYyA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQ7XG5cbnZhciB0ZXN0RWwgPSBkb2MgP1xuICAgIGRvYy5ib2R5IHx8IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKSA6XG4gICAge307XG5cbnZhciBOU19YSFRNTCA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sJztcblxudmFyIEVMRU1FTlRfTk9ERSA9IDE7XG52YXIgVEVYVF9OT0RFID0gMztcbnZhciBDT01NRU5UX05PREUgPSA4O1xuXG4vLyBGaXhlcyA8aHR0cHM6Ly9naXRodWIuY29tL3BhdHJpY2stc3RlZWxlLWlkZW0vbW9ycGhkb20vaXNzdWVzLzMyPlxuLy8gKElFNysgc3VwcG9ydCkgPD1JRTcgZG9lcyBub3Qgc3VwcG9ydCBlbC5oYXNBdHRyaWJ1dGUobmFtZSlcbnZhciBoYXNBdHRyaWJ1dGVOUztcblxuaWYgKHRlc3RFbC5oYXNBdHRyaWJ1dGVOUykge1xuICAgIGhhc0F0dHJpYnV0ZU5TID0gZnVuY3Rpb24oZWwsIG5hbWVzcGFjZVVSSSwgbmFtZSkge1xuICAgICAgICByZXR1cm4gZWwuaGFzQXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBuYW1lKTtcbiAgICB9O1xufSBlbHNlIGlmICh0ZXN0RWwuaGFzQXR0cmlidXRlKSB7XG4gICAgaGFzQXR0cmlidXRlTlMgPSBmdW5jdGlvbihlbCwgbmFtZXNwYWNlVVJJLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBlbC5oYXNBdHRyaWJ1dGUobmFtZSk7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgaGFzQXR0cmlidXRlTlMgPSBmdW5jdGlvbihlbCwgbmFtZXNwYWNlVVJJLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiAhIWVsLmdldEF0dHJpYnV0ZU5vZGUobmFtZSk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdG9FbGVtZW50KHN0cikge1xuICAgIGlmICghcmFuZ2UgJiYgZG9jLmNyZWF0ZVJhbmdlKSB7XG4gICAgICAgIHJhbmdlID0gZG9jLmNyZWF0ZVJhbmdlKCk7XG4gICAgICAgIHJhbmdlLnNlbGVjdE5vZGUoZG9jLmJvZHkpO1xuICAgIH1cblxuICAgIHZhciBmcmFnbWVudDtcbiAgICBpZiAocmFuZ2UgJiYgcmFuZ2UuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KSB7XG4gICAgICAgIGZyYWdtZW50ID0gcmFuZ2UuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KHN0cik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZnJhZ21lbnQgPSBkb2MuY3JlYXRlRWxlbWVudCgnYm9keScpO1xuICAgICAgICBmcmFnbWVudC5pbm5lckhUTUwgPSBzdHI7XG4gICAgfVxuICAgIHJldHVybiBmcmFnbWVudC5jaGlsZE5vZGVzWzBdO1xufVxuXG5mdW5jdGlvbiBzeW5jQm9vbGVhbkF0dHJQcm9wKGZyb21FbCwgdG9FbCwgbmFtZSkge1xuICAgIGlmIChmcm9tRWxbbmFtZV0gIT09IHRvRWxbbmFtZV0pIHtcbiAgICAgICAgZnJvbUVsW25hbWVdID0gdG9FbFtuYW1lXTtcbiAgICAgICAgaWYgKGZyb21FbFtuYW1lXSkge1xuICAgICAgICAgICAgZnJvbUVsLnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmcm9tRWwucmVtb3ZlQXR0cmlidXRlKG5hbWUsICcnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxudmFyIHNwZWNpYWxFbEhhbmRsZXJzID0ge1xuICAgIC8qKlxuICAgICAqIE5lZWRlZCBmb3IgSUUuIEFwcGFyZW50bHkgSUUgZG9lc24ndCB0aGluayB0aGF0IFwic2VsZWN0ZWRcIiBpcyBhblxuICAgICAqIGF0dHJpYnV0ZSB3aGVuIHJlYWRpbmcgb3ZlciB0aGUgYXR0cmlidXRlcyB1c2luZyBzZWxlY3RFbC5hdHRyaWJ1dGVzXG4gICAgICovXG4gICAgT1BUSU9OOiBmdW5jdGlvbihmcm9tRWwsIHRvRWwpIHtcbiAgICAgICAgc3luY0Jvb2xlYW5BdHRyUHJvcChmcm9tRWwsIHRvRWwsICdzZWxlY3RlZCcpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogVGhlIFwidmFsdWVcIiBhdHRyaWJ1dGUgaXMgc3BlY2lhbCBmb3IgdGhlIDxpbnB1dD4gZWxlbWVudCBzaW5jZSBpdCBzZXRzXG4gICAgICogdGhlIGluaXRpYWwgdmFsdWUuIENoYW5naW5nIHRoZSBcInZhbHVlXCIgYXR0cmlidXRlIHdpdGhvdXQgY2hhbmdpbmcgdGhlXG4gICAgICogXCJ2YWx1ZVwiIHByb3BlcnR5IHdpbGwgaGF2ZSBubyBlZmZlY3Qgc2luY2UgaXQgaXMgb25seSB1c2VkIHRvIHRoZSBzZXQgdGhlXG4gICAgICogaW5pdGlhbCB2YWx1ZS4gIFNpbWlsYXIgZm9yIHRoZSBcImNoZWNrZWRcIiBhdHRyaWJ1dGUsIGFuZCBcImRpc2FibGVkXCIuXG4gICAgICovXG4gICAgSU5QVVQ6IGZ1bmN0aW9uKGZyb21FbCwgdG9FbCkge1xuICAgICAgICBzeW5jQm9vbGVhbkF0dHJQcm9wKGZyb21FbCwgdG9FbCwgJ2NoZWNrZWQnKTtcbiAgICAgICAgc3luY0Jvb2xlYW5BdHRyUHJvcChmcm9tRWwsIHRvRWwsICdkaXNhYmxlZCcpO1xuXG4gICAgICAgIGlmIChmcm9tRWwudmFsdWUgIT09IHRvRWwudmFsdWUpIHtcbiAgICAgICAgICAgIGZyb21FbC52YWx1ZSA9IHRvRWwudmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhhc0F0dHJpYnV0ZU5TKHRvRWwsIG51bGwsICd2YWx1ZScpKSB7XG4gICAgICAgICAgICBmcm9tRWwucmVtb3ZlQXR0cmlidXRlKCd2YWx1ZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIFRFWFRBUkVBOiBmdW5jdGlvbihmcm9tRWwsIHRvRWwpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0gdG9FbC52YWx1ZTtcbiAgICAgICAgaWYgKGZyb21FbC52YWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGZyb21FbC52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZyb21FbC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICBmcm9tRWwuZmlyc3RDaGlsZC5ub2RlVmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0d28gbm9kZSdzIG5hbWVzIGFyZSB0aGUgc2FtZS5cbiAqXG4gKiBOT1RFOiBXZSBkb24ndCBib3RoZXIgY2hlY2tpbmcgYG5hbWVzcGFjZVVSSWAgYmVjYXVzZSB5b3Ugd2lsbCBuZXZlciBmaW5kIHR3byBIVE1MIGVsZW1lbnRzIHdpdGggdGhlIHNhbWVcbiAqICAgICAgIG5vZGVOYW1lIGFuZCBkaWZmZXJlbnQgbmFtZXNwYWNlIFVSSXMuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBhXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGIgVGhlIHRhcmdldCBlbGVtZW50XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBjb21wYXJlTm9kZU5hbWVzKGZyb21FbCwgdG9FbCkge1xuICAgIHZhciBmcm9tTm9kZU5hbWUgPSBmcm9tRWwubm9kZU5hbWU7XG4gICAgdmFyIHRvTm9kZU5hbWUgPSB0b0VsLm5vZGVOYW1lO1xuXG4gICAgaWYgKGZyb21Ob2RlTmFtZSA9PT0gdG9Ob2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodG9FbC5hY3R1YWxpemUgJiZcbiAgICAgICAgZnJvbU5vZGVOYW1lLmNoYXJDb2RlQXQoMCkgPCA5MSAmJiAvKiBmcm9tIHRhZyBuYW1lIGlzIHVwcGVyIGNhc2UgKi9cbiAgICAgICAgdG9Ob2RlTmFtZS5jaGFyQ29kZUF0KDApID4gOTAgLyogdGFyZ2V0IHRhZyBuYW1lIGlzIGxvd2VyIGNhc2UgKi8pIHtcbiAgICAgICAgLy8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgdmlydHVhbCBET00gbm9kZSB0aGVuIHdlIG1heSBuZWVkIHRvIG5vcm1hbGl6ZSB0aGUgdGFnIG5hbWVcbiAgICAgICAgLy8gYmVmb3JlIGNvbXBhcmluZy4gTm9ybWFsIEhUTUwgZWxlbWVudHMgdGhhdCBhcmUgaW4gdGhlIFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiXG4gICAgICAgIC8vIGFyZSBjb252ZXJ0ZWQgdG8gdXBwZXIgY2FzZVxuICAgICAgICByZXR1cm4gZnJvbU5vZGVOYW1lID09PSB0b05vZGVOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gZWxlbWVudCwgb3B0aW9uYWxseSB3aXRoIGEga25vd24gbmFtZXNwYWNlIFVSSS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgZWxlbWVudCBuYW1lLCBlLmcuICdkaXYnIG9yICdzdmcnXG4gKiBAcGFyYW0ge3N0cmluZ30gW25hbWVzcGFjZVVSSV0gdGhlIGVsZW1lbnQncyBuYW1lc3BhY2UgVVJJLCBpLmUuIHRoZSB2YWx1ZSBvZlxuICogaXRzIGB4bWxuc2AgYXR0cmlidXRlIG9yIGl0cyBpbmZlcnJlZCBuYW1lc3BhY2UuXG4gKlxuICogQHJldHVybiB7RWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWUsIG5hbWVzcGFjZVVSSSkge1xuICAgIHJldHVybiAhbmFtZXNwYWNlVVJJIHx8IG5hbWVzcGFjZVVSSSA9PT0gTlNfWEhUTUwgP1xuICAgICAgICBkb2MuY3JlYXRlRWxlbWVudChuYW1lKSA6XG4gICAgICAgIGRvYy5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBuYW1lKTtcbn1cblxuLyoqXG4gKiBMb29wIG92ZXIgYWxsIG9mIHRoZSBhdHRyaWJ1dGVzIG9uIHRoZSB0YXJnZXQgbm9kZSBhbmQgbWFrZSBzdXJlIHRoZSBvcmlnaW5hbFxuICogRE9NIG5vZGUgaGFzIHRoZSBzYW1lIGF0dHJpYnV0ZXMuIElmIGFuIGF0dHJpYnV0ZSBmb3VuZCBvbiB0aGUgb3JpZ2luYWwgbm9kZVxuICogaXMgbm90IG9uIHRoZSBuZXcgbm9kZSB0aGVuIHJlbW92ZSBpdCBmcm9tIHRoZSBvcmlnaW5hbCBub2RlLlxuICpcbiAqIEBwYXJhbSAge0VsZW1lbnR9IGZyb21Ob2RlXG4gKiBAcGFyYW0gIHtFbGVtZW50fSB0b05vZGVcbiAqL1xuZnVuY3Rpb24gbW9ycGhBdHRycyhmcm9tTm9kZSwgdG9Ob2RlKSB7XG4gICAgdmFyIGF0dHJzID0gdG9Ob2RlLmF0dHJpYnV0ZXM7XG4gICAgdmFyIGk7XG4gICAgdmFyIGF0dHI7XG4gICAgdmFyIGF0dHJOYW1lO1xuICAgIHZhciBhdHRyTmFtZXNwYWNlVVJJO1xuICAgIHZhciBhdHRyVmFsdWU7XG4gICAgdmFyIGZyb21WYWx1ZTtcblxuICAgIGlmICh0b05vZGUuYXNzaWduQXR0cmlidXRlcykge1xuICAgICAgICB0b05vZGUuYXNzaWduQXR0cmlidXRlcyhmcm9tTm9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gYXR0cnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGF0dHIgPSBhdHRyc1tpXTtcbiAgICAgICAgICAgIGF0dHJOYW1lID0gYXR0ci5uYW1lO1xuICAgICAgICAgICAgYXR0ck5hbWVzcGFjZVVSSSA9IGF0dHIubmFtZXNwYWNlVVJJO1xuICAgICAgICAgICAgYXR0clZhbHVlID0gYXR0ci52YWx1ZTtcblxuICAgICAgICAgICAgaWYgKGF0dHJOYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgICAgICAgICBhdHRyTmFtZSA9IGF0dHIubG9jYWxOYW1lIHx8IGF0dHJOYW1lO1xuICAgICAgICAgICAgICAgIGZyb21WYWx1ZSA9IGZyb21Ob2RlLmdldEF0dHJpYnV0ZU5TKGF0dHJOYW1lc3BhY2VVUkksIGF0dHJOYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmIChmcm9tVmFsdWUgIT09IGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tTm9kZS5zZXRBdHRyaWJ1dGVOUyhhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyb21WYWx1ZSA9IGZyb21Ob2RlLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZnJvbVZhbHVlICE9PSBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbU5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbnkgZXh0cmEgYXR0cmlidXRlcyBmb3VuZCBvbiB0aGUgb3JpZ2luYWwgRE9NIGVsZW1lbnQgdGhhdFxuICAgIC8vIHdlcmVuJ3QgZm91bmQgb24gdGhlIHRhcmdldCBlbGVtZW50LlxuICAgIGF0dHJzID0gZnJvbU5vZGUuYXR0cmlidXRlcztcblxuICAgIGZvciAoaSA9IGF0dHJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIGF0dHIgPSBhdHRyc1tpXTtcbiAgICAgICAgaWYgKGF0dHIuc3BlY2lmaWVkICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgYXR0ck5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgICBhdHRyTmFtZXNwYWNlVVJJID0gYXR0ci5uYW1lc3BhY2VVUkk7XG5cbiAgICAgICAgICAgIGlmIChhdHRyTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgICAgICAgICAgYXR0ck5hbWUgPSBhdHRyLmxvY2FsTmFtZSB8fCBhdHRyTmFtZTtcblxuICAgICAgICAgICAgICAgIGlmICghaGFzQXR0cmlidXRlTlModG9Ob2RlLCBhdHRyTmFtZXNwYWNlVVJJLCBhdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbU5vZGUucmVtb3ZlQXR0cmlidXRlTlMoYXR0ck5hbWVzcGFjZVVSSSwgYXR0ck5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNBdHRyaWJ1dGVOUyh0b05vZGUsIG51bGwsIGF0dHJOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tTm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBDb3BpZXMgdGhlIGNoaWxkcmVuIG9mIG9uZSBET00gZWxlbWVudCB0byBhbm90aGVyIERPTSBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIG1vdmVDaGlsZHJlbihmcm9tRWwsIHRvRWwpIHtcbiAgICB2YXIgY3VyQ2hpbGQgPSBmcm9tRWwuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAoY3VyQ2hpbGQpIHtcbiAgICAgICAgdmFyIG5leHRDaGlsZCA9IGN1ckNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICB0b0VsLmFwcGVuZENoaWxkKGN1ckNoaWxkKTtcbiAgICAgICAgY3VyQ2hpbGQgPSBuZXh0Q2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiB0b0VsO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0R2V0Tm9kZUtleShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUuaWQ7XG59XG5cbmZ1bmN0aW9uIG1vcnBoZG9tKGZyb21Ob2RlLCB0b05vZGUsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdG9Ob2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoZnJvbU5vZGUubm9kZU5hbWUgPT09ICcjZG9jdW1lbnQnIHx8IGZyb21Ob2RlLm5vZGVOYW1lID09PSAnSFRNTCcpIHtcbiAgICAgICAgICAgIHZhciB0b05vZGVIdG1sID0gdG9Ob2RlO1xuICAgICAgICAgICAgdG9Ob2RlID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2h0bWwnKTtcbiAgICAgICAgICAgIHRvTm9kZS5pbm5lckhUTUwgPSB0b05vZGVIdG1sO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9Ob2RlID0gdG9FbGVtZW50KHRvTm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZ2V0Tm9kZUtleSA9IG9wdGlvbnMuZ2V0Tm9kZUtleSB8fCBkZWZhdWx0R2V0Tm9kZUtleTtcbiAgICB2YXIgb25CZWZvcmVOb2RlQWRkZWQgPSBvcHRpb25zLm9uQmVmb3JlTm9kZUFkZGVkIHx8IG5vb3A7XG4gICAgdmFyIG9uTm9kZUFkZGVkID0gb3B0aW9ucy5vbk5vZGVBZGRlZCB8fCBub29wO1xuICAgIHZhciBvbkJlZm9yZUVsVXBkYXRlZCA9IG9wdGlvbnMub25CZWZvcmVFbFVwZGF0ZWQgfHwgbm9vcDtcbiAgICB2YXIgb25FbFVwZGF0ZWQgPSBvcHRpb25zLm9uRWxVcGRhdGVkIHx8IG5vb3A7XG4gICAgdmFyIG9uQmVmb3JlTm9kZURpc2NhcmRlZCA9IG9wdGlvbnMub25CZWZvcmVOb2RlRGlzY2FyZGVkIHx8IG5vb3A7XG4gICAgdmFyIG9uTm9kZURpc2NhcmRlZCA9IG9wdGlvbnMub25Ob2RlRGlzY2FyZGVkIHx8IG5vb3A7XG4gICAgdmFyIG9uQmVmb3JlRWxDaGlsZHJlblVwZGF0ZWQgPSBvcHRpb25zLm9uQmVmb3JlRWxDaGlsZHJlblVwZGF0ZWQgfHwgbm9vcDtcbiAgICB2YXIgY2hpbGRyZW5Pbmx5ID0gb3B0aW9ucy5jaGlsZHJlbk9ubHkgPT09IHRydWU7XG5cbiAgICAvLyBUaGlzIG9iamVjdCBpcyB1c2VkIGFzIGEgbG9va3VwIHRvIHF1aWNrbHkgZmluZCBhbGwga2V5ZWQgZWxlbWVudHMgaW4gdGhlIG9yaWdpbmFsIERPTSB0cmVlLlxuICAgIHZhciBmcm9tTm9kZXNMb29rdXAgPSB7fTtcbiAgICB2YXIga2V5ZWRSZW1vdmFsTGlzdDtcblxuICAgIGZ1bmN0aW9uIGFkZEtleWVkUmVtb3ZhbChrZXkpIHtcbiAgICAgICAgaWYgKGtleWVkUmVtb3ZhbExpc3QpIHtcbiAgICAgICAgICAgIGtleWVkUmVtb3ZhbExpc3QucHVzaChrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ZWRSZW1vdmFsTGlzdCA9IFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2Fsa0Rpc2NhcmRlZENoaWxkTm9kZXMobm9kZSwgc2tpcEtleWVkTm9kZXMpIHtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgdmFyIGN1ckNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgICAgd2hpbGUgKGN1ckNoaWxkKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNraXBLZXllZE5vZGVzICYmIChrZXkgPSBnZXROb2RlS2V5KGN1ckNoaWxkKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIGtleWVkIG5vZGVzIHRoZW4gd2UgYWRkIHRoZSBrZXlcbiAgICAgICAgICAgICAgICAgICAgLy8gdG8gYSBsaXN0IHNvIHRoYXQgaXQgY2FuIGJlIGhhbmRsZWQgYXQgdGhlIHZlcnkgZW5kLlxuICAgICAgICAgICAgICAgICAgICBhZGRLZXllZFJlbW92YWwoa2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IHJlcG9ydCB0aGUgbm9kZSBhcyBkaXNjYXJkZWQgaWYgaXQgaXMgbm90IGtleWVkLiBXZSBkbyB0aGlzIGJlY2F1c2VcbiAgICAgICAgICAgICAgICAgICAgLy8gYXQgdGhlIGVuZCB3ZSBsb29wIHRocm91Z2ggYWxsIGtleWVkIGVsZW1lbnRzIHRoYXQgd2VyZSB1bm1hdGNoZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHRoZW4gZGlzY2FyZCB0aGVtIGluIG9uZSBmaW5hbCBwYXNzLlxuICAgICAgICAgICAgICAgICAgICBvbk5vZGVEaXNjYXJkZWQoY3VyQ2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyQ2hpbGQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2Fsa0Rpc2NhcmRlZENoaWxkTm9kZXMoY3VyQ2hpbGQsIHNraXBLZXllZE5vZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1ckNoaWxkID0gY3VyQ2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgRE9NIG5vZGUgb3V0IG9mIHRoZSBvcmlnaW5hbCBET01cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge05vZGV9IG5vZGUgVGhlIG5vZGUgdG8gcmVtb3ZlXG4gICAgICogQHBhcmFtICB7Tm9kZX0gcGFyZW50Tm9kZSBUaGUgbm9kZXMgcGFyZW50XG4gICAgICogQHBhcmFtICB7Qm9vbGVhbn0gc2tpcEtleWVkTm9kZXMgSWYgdHJ1ZSB0aGVuIGVsZW1lbnRzIHdpdGgga2V5cyB3aWxsIGJlIHNraXBwZWQgYW5kIG5vdCBkaXNjYXJkZWQuXG4gICAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlbW92ZU5vZGUobm9kZSwgcGFyZW50Tm9kZSwgc2tpcEtleWVkTm9kZXMpIHtcbiAgICAgICAgaWYgKG9uQmVmb3JlTm9kZURpc2NhcmRlZChub2RlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgb25Ob2RlRGlzY2FyZGVkKG5vZGUpO1xuICAgICAgICB3YWxrRGlzY2FyZGVkQ2hpbGROb2Rlcyhub2RlLCBza2lwS2V5ZWROb2Rlcyk7XG4gICAgfVxuXG4gICAgLy8gLy8gVHJlZVdhbGtlciBpbXBsZW1lbnRhdGlvbiBpcyBubyBmYXN0ZXIsIGJ1dCBrZWVwaW5nIHRoaXMgYXJvdW5kIGluIGNhc2UgdGhpcyBjaGFuZ2VzIGluIHRoZSBmdXR1cmVcbiAgICAvLyBmdW5jdGlvbiBpbmRleFRyZWUocm9vdCkge1xuICAgIC8vICAgICB2YXIgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoXG4gICAgLy8gICAgICAgICByb290LFxuICAgIC8vICAgICAgICAgTm9kZUZpbHRlci5TSE9XX0VMRU1FTlQpO1xuICAgIC8vXG4gICAgLy8gICAgIHZhciBlbDtcbiAgICAvLyAgICAgd2hpbGUoKGVsID0gdHJlZVdhbGtlci5uZXh0Tm9kZSgpKSkge1xuICAgIC8vICAgICAgICAgdmFyIGtleSA9IGdldE5vZGVLZXkoZWwpO1xuICAgIC8vICAgICAgICAgaWYgKGtleSkge1xuICAgIC8vICAgICAgICAgICAgIGZyb21Ob2Rlc0xvb2t1cFtrZXldID0gZWw7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyAvLyBOb2RlSXRlcmF0b3IgaW1wbGVtZW50YXRpb24gaXMgbm8gZmFzdGVyLCBidXQga2VlcGluZyB0aGlzIGFyb3VuZCBpbiBjYXNlIHRoaXMgY2hhbmdlcyBpbiB0aGUgZnV0dXJlXG4gICAgLy9cbiAgICAvLyBmdW5jdGlvbiBpbmRleFRyZWUobm9kZSkge1xuICAgIC8vICAgICB2YXIgbm9kZUl0ZXJhdG9yID0gZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yKG5vZGUsIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5UKTtcbiAgICAvLyAgICAgdmFyIGVsO1xuICAgIC8vICAgICB3aGlsZSgoZWwgPSBub2RlSXRlcmF0b3IubmV4dE5vZGUoKSkpIHtcbiAgICAvLyAgICAgICAgIHZhciBrZXkgPSBnZXROb2RlS2V5KGVsKTtcbiAgICAvLyAgICAgICAgIGlmIChrZXkpIHtcbiAgICAvLyAgICAgICAgICAgICBmcm9tTm9kZXNMb29rdXBba2V5XSA9IGVsO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgZnVuY3Rpb24gaW5kZXhUcmVlKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgdmFyIGN1ckNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgICAgd2hpbGUgKGN1ckNoaWxkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGdldE5vZGVLZXkoY3VyQ2hpbGQpO1xuICAgICAgICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbU5vZGVzTG9va3VwW2tleV0gPSBjdXJDaGlsZDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBXYWxrIHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICAgICAgaW5kZXhUcmVlKGN1ckNoaWxkKTtcblxuICAgICAgICAgICAgICAgIGN1ckNoaWxkID0gY3VyQ2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbmRleFRyZWUoZnJvbU5vZGUpO1xuXG4gICAgZnVuY3Rpb24gaGFuZGxlTm9kZUFkZGVkKGVsKSB7XG4gICAgICAgIG9uTm9kZUFkZGVkKGVsKTtcblxuICAgICAgICB2YXIgY3VyQ2hpbGQgPSBlbC5maXJzdENoaWxkO1xuICAgICAgICB3aGlsZSAoY3VyQ2hpbGQpIHtcbiAgICAgICAgICAgIHZhciBuZXh0U2libGluZyA9IGN1ckNoaWxkLm5leHRTaWJsaW5nO1xuXG4gICAgICAgICAgICB2YXIga2V5ID0gZ2V0Tm9kZUtleShjdXJDaGlsZCk7XG4gICAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVubWF0Y2hlZEZyb21FbCA9IGZyb21Ob2Rlc0xvb2t1cFtrZXldO1xuICAgICAgICAgICAgICAgIGlmICh1bm1hdGNoZWRGcm9tRWwgJiYgY29tcGFyZU5vZGVOYW1lcyhjdXJDaGlsZCwgdW5tYXRjaGVkRnJvbUVsKSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJDaGlsZC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh1bm1hdGNoZWRGcm9tRWwsIGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgbW9ycGhFbCh1bm1hdGNoZWRGcm9tRWwsIGN1ckNoaWxkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGhhbmRsZU5vZGVBZGRlZChjdXJDaGlsZCk7XG4gICAgICAgICAgICBjdXJDaGlsZCA9IG5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9ycGhFbChmcm9tRWwsIHRvRWwsIGNoaWxkcmVuT25seSkge1xuICAgICAgICB2YXIgdG9FbEtleSA9IGdldE5vZGVLZXkodG9FbCk7XG4gICAgICAgIHZhciBjdXJGcm9tTm9kZUtleTtcblxuICAgICAgICBpZiAodG9FbEtleSkge1xuICAgICAgICAgICAgLy8gSWYgYW4gZWxlbWVudCB3aXRoIGFuIElEIGlzIGJlaW5nIG1vcnBoZWQgdGhlbiBpdCBpcyB3aWxsIGJlIGluIHRoZSBmaW5hbFxuICAgICAgICAgICAgLy8gRE9NIHNvIGNsZWFyIGl0IG91dCBvZiB0aGUgc2F2ZWQgZWxlbWVudHMgY29sbGVjdGlvblxuICAgICAgICAgICAgZGVsZXRlIGZyb21Ob2Rlc0xvb2t1cFt0b0VsS2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b05vZGUuaXNTYW1lTm9kZSAmJiB0b05vZGUuaXNTYW1lTm9kZShmcm9tTm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hpbGRyZW5Pbmx5KSB7XG4gICAgICAgICAgICBpZiAob25CZWZvcmVFbFVwZGF0ZWQoZnJvbUVsLCB0b0VsKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1vcnBoQXR0cnMoZnJvbUVsLCB0b0VsKTtcbiAgICAgICAgICAgIG9uRWxVcGRhdGVkKGZyb21FbCk7XG5cbiAgICAgICAgICAgIGlmIChvbkJlZm9yZUVsQ2hpbGRyZW5VcGRhdGVkKGZyb21FbCwgdG9FbCkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZyb21FbC5ub2RlTmFtZSAhPT0gJ1RFWFRBUkVBJykge1xuICAgICAgICAgICAgdmFyIGN1clRvTm9kZUNoaWxkID0gdG9FbC5maXJzdENoaWxkO1xuICAgICAgICAgICAgdmFyIGN1ckZyb21Ob2RlQ2hpbGQgPSBmcm9tRWwuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgIHZhciBjdXJUb05vZGVLZXk7XG5cbiAgICAgICAgICAgIHZhciBmcm9tTmV4dFNpYmxpbmc7XG4gICAgICAgICAgICB2YXIgdG9OZXh0U2libGluZztcbiAgICAgICAgICAgIHZhciBtYXRjaGluZ0Zyb21FbDtcblxuICAgICAgICAgICAgb3V0ZXI6IHdoaWxlIChjdXJUb05vZGVDaGlsZCkge1xuICAgICAgICAgICAgICAgIHRvTmV4dFNpYmxpbmcgPSBjdXJUb05vZGVDaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBjdXJUb05vZGVLZXkgPSBnZXROb2RlS2V5KGN1clRvTm9kZUNoaWxkKTtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChjdXJGcm9tTm9kZUNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21OZXh0U2libGluZyA9IGN1ckZyb21Ob2RlQ2hpbGQubmV4dFNpYmxpbmc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1clRvTm9kZUNoaWxkLmlzU2FtZU5vZGUgJiYgY3VyVG9Ob2RlQ2hpbGQuaXNTYW1lTm9kZShjdXJGcm9tTm9kZUNoaWxkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyVG9Ob2RlQ2hpbGQgPSB0b05leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZCA9IGZyb21OZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVLZXkgPSBnZXROb2RlS2V5KGN1ckZyb21Ob2RlQ2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJGcm9tTm9kZVR5cGUgPSBjdXJGcm9tTm9kZUNoaWxkLm5vZGVUeXBlO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0NvbXBhdGlibGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1ckZyb21Ob2RlVHlwZSA9PT0gY3VyVG9Ob2RlQ2hpbGQubm9kZVR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJGcm9tTm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJvdGggbm9kZXMgYmVpbmcgY29tcGFyZWQgYXJlIEVsZW1lbnQgbm9kZXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJUb05vZGVLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHRhcmdldCBub2RlIGhhcyBhIGtleSBzbyB3ZSB3YW50IHRvIG1hdGNoIGl0IHVwIHdpdGggdGhlIGNvcnJlY3QgZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgb3JpZ2luYWwgRE9NIHRyZWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1clRvTm9kZUtleSAhPT0gY3VyRnJvbU5vZGVLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBjdXJyZW50IGVsZW1lbnQgaW4gdGhlIG9yaWdpbmFsIERPTSB0cmVlIGRvZXMgbm90IGhhdmUgYSBtYXRjaGluZyBrZXkgc29cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxldCdzIGNoZWNrIG91ciBsb29rdXAgdG8gc2VlIGlmIHRoZXJlIGlzIGEgbWF0Y2hpbmcgZWxlbWVudCBpbiB0aGUgb3JpZ2luYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERPTSB0cmVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG1hdGNoaW5nRnJvbUVsID0gZnJvbU5vZGVzTG9va3VwW2N1clRvTm9kZUtleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1ckZyb21Ob2RlQ2hpbGQubmV4dFNpYmxpbmcgPT09IG1hdGNoaW5nRnJvbUVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNwZWNpYWwgY2FzZSBmb3Igc2luZ2xlIGVsZW1lbnQgcmVtb3ZhbHMuIFRvIGF2b2lkIHJlbW92aW5nIHRoZSBvcmlnaW5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBET00gbm9kZSBvdXQgb2YgdGhlIHRyZWUgKHNpbmNlIHRoYXQgY2FuIGJyZWFrIENTUyB0cmFuc2l0aW9ucywgZXRjLiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIHdpbGwgaW5zdGVhZCBkaXNjYXJkIHRoZSBjdXJyZW50IG5vZGUgYW5kIHdhaXQgdW50aWwgdGhlIG5leHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIHRvIHByb3Blcmx5IG1hdGNoIHVwIHRoZSBrZXllZCB0YXJnZXQgZWxlbWVudCB3aXRoIGl0cyBtYXRjaGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbGVtZW50IGluIHRoZSBvcmlnaW5hbCB0cmVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29tcGF0aWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGZvdW5kIGEgbWF0Y2hpbmcga2V5ZWQgZWxlbWVudCBzb21ld2hlcmUgaW4gdGhlIG9yaWdpbmFsIERPTSB0cmVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMZXQncyBtb3ZpbmcgdGhlIG9yaWdpbmFsIERPTSBub2RlIGludG8gdGhlIGN1cnJlbnQgcG9zaXRpb24gYW5kIG1vcnBoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0LlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5PVEU6IFdlIHVzZSBpbnNlcnRCZWZvcmUgaW5zdGVhZCBvZiByZXBsYWNlQ2hpbGQgYmVjYXVzZSB3ZSB3YW50IHRvIGdvIHRocm91Z2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGByZW1vdmVOb2RlKClgIGZ1bmN0aW9uIGZvciB0aGUgbm9kZSB0aGF0IGlzIGJlaW5nIGRpc2NhcmRlZCBzbyB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbCBsaWZlY3ljbGUgaG9va3MgYXJlIGNvcnJlY3RseSBpbnZva2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21FbC5pbnNlcnRCZWZvcmUobWF0Y2hpbmdGcm9tRWwsIGN1ckZyb21Ob2RlQ2hpbGQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJGcm9tTm9kZUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luY2UgdGhlIG5vZGUgaXMga2V5ZWQgaXQgbWlnaHQgYmUgbWF0Y2hlZCB1cCBsYXRlciBzbyB3ZSBkZWZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFjdHVhbCByZW1vdmFsIHRvIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRLZXllZFJlbW92YWwoY3VyRnJvbU5vZGVLZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogd2Ugc2tpcCBuZXN0ZWQga2V5ZWQgbm9kZXMgZnJvbSBiZWluZyByZW1vdmVkIHNpbmNlIHRoZXJlIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICBzdGlsbCBhIGNoYW5jZSB0aGV5IHdpbGwgYmUgbWF0Y2hlZCB1cCBsYXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShjdXJGcm9tTm9kZUNoaWxkLCBmcm9tRWwsIHRydWUgLyogc2tpcCBrZXllZCBub2RlcyAqLyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmV4dFNpYmxpbmcgPSBjdXJGcm9tTm9kZUNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkID0gbWF0Y2hpbmdGcm9tRWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbm9kZXMgYXJlIG5vdCBjb21wYXRpYmxlIHNpbmNlIHRoZSBcInRvXCIgbm9kZSBoYXMgYSBrZXkgYW5kIHRoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgbm8gbWF0Y2hpbmcga2V5ZWQgbm9kZSBpbiB0aGUgc291cmNlIHRyZWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBhdGlibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyRnJvbU5vZGVLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG9yaWdpbmFsIGhhcyBhIGtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBhdGlibGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBhdGlibGUgPSBpc0NvbXBhdGlibGUgIT09IGZhbHNlICYmIGNvbXBhcmVOb2RlTmFtZXMoY3VyRnJvbU5vZGVDaGlsZCwgY3VyVG9Ob2RlQ2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbXBhdGlibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgZm91bmQgY29tcGF0aWJsZSBET00gZWxlbWVudHMgc28gdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IFwiZnJvbVwiIG5vZGUgdG8gbWF0Y2ggdGhlIGN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGFyZ2V0IERPTSBub2RlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3JwaEVsKGN1ckZyb21Ob2RlQ2hpbGQsIGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VyRnJvbU5vZGVUeXBlID09PSBURVhUX05PREUgfHwgY3VyRnJvbU5vZGVUeXBlID09IENPTU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJvdGggbm9kZXMgYmVpbmcgY29tcGFyZWQgYXJlIFRleHQgb3IgQ29tbWVudCBub2Rlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ29tcGF0aWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2ltcGx5IHVwZGF0ZSBub2RlVmFsdWUgb24gdGhlIG9yaWdpbmFsIG5vZGUgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgdGhlIHRleHQgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkLm5vZGVWYWx1ZSA9IGN1clRvTm9kZUNoaWxkLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbXBhdGlibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgYm90aCB0aGUgXCJ0b1wiIGNoaWxkIGFuZCB0aGUgXCJmcm9tXCIgY2hpbGQgc2luY2Ugd2UgZm91bmQgYSBtYXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VyVG9Ob2RlQ2hpbGQgPSB0b05leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyRnJvbU5vZGVDaGlsZCA9IGZyb21OZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gY29tcGF0aWJsZSBtYXRjaCBzbyByZW1vdmUgdGhlIG9sZCBub2RlIGZyb20gdGhlIERPTSBhbmQgY29udGludWUgdHJ5aW5nIHRvIGZpbmQgYVxuICAgICAgICAgICAgICAgICAgICAvLyBtYXRjaCBpbiB0aGUgb3JpZ2luYWwgRE9NLiBIb3dldmVyLCB3ZSBvbmx5IGRvIHRoaXMgaWYgdGhlIGZyb20gbm9kZSBpcyBub3Qga2V5ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luY2UgaXQgaXMgcG9zc2libGUgdGhhdCBhIGtleWVkIG5vZGUgbWlnaHQgbWF0Y2ggdXAgd2l0aCBhIG5vZGUgc29tZXdoZXJlIGVsc2UgaW4gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHRhcmdldCB0cmVlIGFuZCB3ZSBkb24ndCB3YW50IHRvIGRpc2NhcmQgaXQganVzdCB5ZXQgc2luY2UgaXQgc3RpbGwgbWlnaHQgZmluZCBhXG4gICAgICAgICAgICAgICAgICAgIC8vIGhvbWUgaW4gdGhlIGZpbmFsIERPTSB0cmVlLiBBZnRlciBldmVyeXRoaW5nIGlzIGRvbmUgd2Ugd2lsbCByZW1vdmUgYW55IGtleWVkIG5vZGVzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgZGlkbid0IGZpbmQgYSBob21lXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJGcm9tTm9kZUtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luY2UgdGhlIG5vZGUgaXMga2V5ZWQgaXQgbWlnaHQgYmUgbWF0Y2hlZCB1cCBsYXRlciBzbyB3ZSBkZWZlclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFjdHVhbCByZW1vdmFsIHRvIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRLZXllZFJlbW92YWwoY3VyRnJvbU5vZGVLZXkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogd2Ugc2tpcCBuZXN0ZWQga2V5ZWQgbm9kZXMgZnJvbSBiZWluZyByZW1vdmVkIHNpbmNlIHRoZXJlIGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICBzdGlsbCBhIGNoYW5jZSB0aGV5IHdpbGwgYmUgbWF0Y2hlZCB1cCBsYXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTm9kZShjdXJGcm9tTm9kZUNoaWxkLCBmcm9tRWwsIHRydWUgLyogc2tpcCBrZXllZCBub2RlcyAqLyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkID0gZnJvbU5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGdvdCB0aGlzIGZhciB0aGVuIHdlIGRpZCBub3QgZmluZCBhIGNhbmRpZGF0ZSBtYXRjaCBmb3JcbiAgICAgICAgICAgICAgICAvLyBvdXIgXCJ0byBub2RlXCIgYW5kIHdlIGV4aGF1c3RlZCBhbGwgb2YgdGhlIGNoaWxkcmVuIFwiZnJvbVwiXG4gICAgICAgICAgICAgICAgLy8gbm9kZXMuIFRoZXJlZm9yZSwgd2Ugd2lsbCBqdXN0IGFwcGVuZCB0aGUgY3VycmVudCBcInRvXCIgbm9kZVxuICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBlbmRcbiAgICAgICAgICAgICAgICBpZiAoY3VyVG9Ob2RlS2V5ICYmIChtYXRjaGluZ0Zyb21FbCA9IGZyb21Ob2Rlc0xvb2t1cFtjdXJUb05vZGVLZXldKSAmJiBjb21wYXJlTm9kZU5hbWVzKG1hdGNoaW5nRnJvbUVsLCBjdXJUb05vZGVDaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbUVsLmFwcGVuZENoaWxkKG1hdGNoaW5nRnJvbUVsKTtcbiAgICAgICAgICAgICAgICAgICAgbW9ycGhFbChtYXRjaGluZ0Zyb21FbCwgY3VyVG9Ob2RlQ2hpbGQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbkJlZm9yZU5vZGVBZGRlZFJlc3VsdCA9IG9uQmVmb3JlTm9kZUFkZGVkKGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uQmVmb3JlTm9kZUFkZGVkUmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9uQmVmb3JlTm9kZUFkZGVkUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VyVG9Ob2RlQ2hpbGQgPSBvbkJlZm9yZU5vZGVBZGRlZFJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1clRvTm9kZUNoaWxkLmFjdHVhbGl6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1clRvTm9kZUNoaWxkID0gY3VyVG9Ob2RlQ2hpbGQuYWN0dWFsaXplKGZyb21FbC5vd25lckRvY3VtZW50IHx8IGRvYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tRWwuYXBwZW5kQ2hpbGQoY3VyVG9Ob2RlQ2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTm9kZUFkZGVkKGN1clRvTm9kZUNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1clRvTm9kZUNoaWxkID0gdG9OZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkID0gZnJvbU5leHRTaWJsaW5nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIHByb2Nlc3NlZCBhbGwgb2YgdGhlIFwidG8gbm9kZXNcIi4gSWYgY3VyRnJvbU5vZGVDaGlsZCBpc1xuICAgICAgICAgICAgLy8gbm9uLW51bGwgdGhlbiB3ZSBzdGlsbCBoYXZlIHNvbWUgZnJvbSBub2RlcyBsZWZ0IG92ZXIgdGhhdCBuZWVkXG4gICAgICAgICAgICAvLyB0byBiZSByZW1vdmVkXG4gICAgICAgICAgICB3aGlsZSAoY3VyRnJvbU5vZGVDaGlsZCkge1xuICAgICAgICAgICAgICAgIGZyb21OZXh0U2libGluZyA9IGN1ckZyb21Ob2RlQ2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgaWYgKChjdXJGcm9tTm9kZUtleSA9IGdldE5vZGVLZXkoY3VyRnJvbU5vZGVDaGlsZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHRoZSBub2RlIGlzIGtleWVkIGl0IG1pZ2h0IGJlIG1hdGNoZWQgdXAgbGF0ZXIgc28gd2UgZGVmZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGFjdHVhbCByZW1vdmFsIHRvIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgIGFkZEtleWVkUmVtb3ZhbChjdXJGcm9tTm9kZUtleSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogd2Ugc2tpcCBuZXN0ZWQga2V5ZWQgbm9kZXMgZnJvbSBiZWluZyByZW1vdmVkIHNpbmNlIHRoZXJlIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgIHN0aWxsIGEgY2hhbmNlIHRoZXkgd2lsbCBiZSBtYXRjaGVkIHVwIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUoY3VyRnJvbU5vZGVDaGlsZCwgZnJvbUVsLCB0cnVlIC8qIHNraXAga2V5ZWQgbm9kZXMgKi8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJGcm9tTm9kZUNoaWxkID0gZnJvbU5leHRTaWJsaW5nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNwZWNpYWxFbEhhbmRsZXIgPSBzcGVjaWFsRWxIYW5kbGVyc1tmcm9tRWwubm9kZU5hbWVdO1xuICAgICAgICBpZiAoc3BlY2lhbEVsSGFuZGxlcikge1xuICAgICAgICAgICAgc3BlY2lhbEVsSGFuZGxlcihmcm9tRWwsIHRvRWwpO1xuICAgICAgICB9XG4gICAgfSAvLyBFTkQ6IG1vcnBoRWwoLi4uKVxuXG4gICAgdmFyIG1vcnBoZWROb2RlID0gZnJvbU5vZGU7XG4gICAgdmFyIG1vcnBoZWROb2RlVHlwZSA9IG1vcnBoZWROb2RlLm5vZGVUeXBlO1xuICAgIHZhciB0b05vZGVUeXBlID0gdG9Ob2RlLm5vZGVUeXBlO1xuXG4gICAgaWYgKCFjaGlsZHJlbk9ubHkpIHtcbiAgICAgICAgLy8gSGFuZGxlIHRoZSBjYXNlIHdoZXJlIHdlIGFyZSBnaXZlbiB0d28gRE9NIG5vZGVzIHRoYXQgYXJlIG5vdFxuICAgICAgICAvLyBjb21wYXRpYmxlIChlLmcuIDxkaXY+IC0tPiA8c3Bhbj4gb3IgPGRpdj4gLS0+IFRFWFQpXG4gICAgICAgIGlmIChtb3JwaGVkTm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgaWYgKHRvTm9kZVR5cGUgPT09IEVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgIGlmICghY29tcGFyZU5vZGVOYW1lcyhmcm9tTm9kZSwgdG9Ob2RlKSkge1xuICAgICAgICAgICAgICAgICAgICBvbk5vZGVEaXNjYXJkZWQoZnJvbU5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBtb3JwaGVkTm9kZSA9IG1vdmVDaGlsZHJlbihmcm9tTm9kZSwgY3JlYXRlRWxlbWVudE5TKHRvTm9kZS5ub2RlTmFtZSwgdG9Ob2RlLm5hbWVzcGFjZVVSSSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gR29pbmcgZnJvbSBhbiBlbGVtZW50IG5vZGUgdG8gYSB0ZXh0IG5vZGVcbiAgICAgICAgICAgICAgICBtb3JwaGVkTm9kZSA9IHRvTm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChtb3JwaGVkTm9kZVR5cGUgPT09IFRFWFRfTk9ERSB8fCBtb3JwaGVkTm9kZVR5cGUgPT09IENPTU1FTlRfTk9ERSkgeyAvLyBUZXh0IG9yIGNvbW1lbnQgbm9kZVxuICAgICAgICAgICAgaWYgKHRvTm9kZVR5cGUgPT09IG1vcnBoZWROb2RlVHlwZSkge1xuICAgICAgICAgICAgICAgIG1vcnBoZWROb2RlLm5vZGVWYWx1ZSA9IHRvTm9kZS5ub2RlVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vcnBoZWROb2RlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBUZXh0IG5vZGUgdG8gc29tZXRoaW5nIGVsc2VcbiAgICAgICAgICAgICAgICBtb3JwaGVkTm9kZSA9IHRvTm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtb3JwaGVkTm9kZSA9PT0gdG9Ob2RlKSB7XG4gICAgICAgIC8vIFRoZSBcInRvIG5vZGVcIiB3YXMgbm90IGNvbXBhdGlibGUgd2l0aCB0aGUgXCJmcm9tIG5vZGVcIiBzbyB3ZSBoYWQgdG9cbiAgICAgICAgLy8gdG9zcyBvdXQgdGhlIFwiZnJvbSBub2RlXCIgYW5kIHVzZSB0aGUgXCJ0byBub2RlXCJcbiAgICAgICAgb25Ob2RlRGlzY2FyZGVkKGZyb21Ob2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtb3JwaEVsKG1vcnBoZWROb2RlLCB0b05vZGUsIGNoaWxkcmVuT25seSk7XG5cbiAgICAgICAgLy8gV2Ugbm93IG5lZWQgdG8gbG9vcCBvdmVyIGFueSBrZXllZCBub2RlcyB0aGF0IG1pZ2h0IG5lZWQgdG8gYmVcbiAgICAgICAgLy8gcmVtb3ZlZC4gV2Ugb25seSBkbyB0aGUgcmVtb3ZhbCBpZiB3ZSBrbm93IHRoYXQgdGhlIGtleWVkIG5vZGVcbiAgICAgICAgLy8gbmV2ZXIgZm91bmQgYSBtYXRjaC4gV2hlbiBhIGtleWVkIG5vZGUgaXMgbWF0Y2hlZCB1cCB3ZSByZW1vdmVcbiAgICAgICAgLy8gaXQgb3V0IG9mIGZyb21Ob2Rlc0xvb2t1cCBhbmQgd2UgdXNlIGZyb21Ob2Rlc0xvb2t1cCB0byBkZXRlcm1pbmVcbiAgICAgICAgLy8gaWYgYSBrZXllZCBub2RlIGhhcyBiZWVuIG1hdGNoZWQgdXAgb3Igbm90XG4gICAgICAgIGlmIChrZXllZFJlbW92YWxMaXN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1rZXllZFJlbW92YWxMaXN0Lmxlbmd0aDsgaTxsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlbFRvUmVtb3ZlID0gZnJvbU5vZGVzTG9va3VwW2tleWVkUmVtb3ZhbExpc3RbaV1dO1xuICAgICAgICAgICAgICAgIGlmIChlbFRvUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZU5vZGUoZWxUb1JlbW92ZSwgZWxUb1JlbW92ZS5wYXJlbnROb2RlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFjaGlsZHJlbk9ubHkgJiYgbW9ycGhlZE5vZGUgIT09IGZyb21Ob2RlICYmIGZyb21Ob2RlLnBhcmVudE5vZGUpIHtcbiAgICAgICAgaWYgKG1vcnBoZWROb2RlLmFjdHVhbGl6ZSkge1xuICAgICAgICAgICAgbW9ycGhlZE5vZGUgPSBtb3JwaGVkTm9kZS5hY3R1YWxpemUoZnJvbU5vZGUub3duZXJEb2N1bWVudCB8fCBkb2MpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIGhhZCB0byBzd2FwIG91dCB0aGUgZnJvbSBub2RlIHdpdGggYSBuZXcgbm9kZSBiZWNhdXNlIHRoZSBvbGRcbiAgICAgICAgLy8gbm9kZSB3YXMgbm90IGNvbXBhdGlibGUgd2l0aCB0aGUgdGFyZ2V0IG5vZGUgdGhlbiB3ZSBuZWVkIHRvXG4gICAgICAgIC8vIHJlcGxhY2UgdGhlIG9sZCBET00gbm9kZSBpbiB0aGUgb3JpZ2luYWwgRE9NIHRyZWUuIFRoaXMgaXMgb25seVxuICAgICAgICAvLyBwb3NzaWJsZSBpZiB0aGUgb3JpZ2luYWwgRE9NIG5vZGUgd2FzIHBhcnQgb2YgYSBET00gdHJlZSB3aGljaFxuICAgICAgICAvLyB3ZSBrbm93IGlzIHRoZSBjYXNlIGlmIGl0IGhhcyBhIHBhcmVudCBub2RlLlxuICAgICAgICBmcm9tTm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChtb3JwaGVkTm9kZSwgZnJvbU5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBtb3JwaGVkTm9kZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtb3JwaGRvbTtcbiIsIm1vZHVsZS5leHBvcnRzID0gW1xuICAvLyBhdHRyaWJ1dGUgZXZlbnRzIChjYW4gYmUgc2V0IHdpdGggYXR0cmlidXRlcylcbiAgJ29uY2xpY2snLFxuICAnb25kYmxjbGljaycsXG4gICdvbm1vdXNlZG93bicsXG4gICdvbm1vdXNldXAnLFxuICAnb25tb3VzZW92ZXInLFxuICAnb25tb3VzZW1vdmUnLFxuICAnb25tb3VzZW91dCcsXG4gICdvbmRyYWdzdGFydCcsXG4gICdvbmRyYWcnLFxuICAnb25kcmFnZW50ZXInLFxuICAnb25kcmFnbGVhdmUnLFxuICAnb25kcmFnb3ZlcicsXG4gICdvbmRyb3AnLFxuICAnb25kcmFnZW5kJyxcbiAgJ29ua2V5ZG93bicsXG4gICdvbmtleXByZXNzJyxcbiAgJ29ua2V5dXAnLFxuICAnb251bmxvYWQnLFxuICAnb25hYm9ydCcsXG4gICdvbmVycm9yJyxcbiAgJ29ucmVzaXplJyxcbiAgJ29uc2Nyb2xsJyxcbiAgJ29uc2VsZWN0JyxcbiAgJ29uY2hhbmdlJyxcbiAgJ29uc3VibWl0JyxcbiAgJ29ucmVzZXQnLFxuICAnb25mb2N1cycsXG4gICdvbmJsdXInLFxuICAnb25pbnB1dCcsXG4gIC8vIG90aGVyIGNvbW1vbiBldmVudHNcbiAgJ29uY29udGV4dG1lbnUnLFxuICAnb25mb2N1c2luJyxcbiAgJ29uZm9jdXNvdXQnXG5dXG4iLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vY29yZS9VdGlscydcbmltcG9ydCBUcmFuc2xhdG9yIGZyb20gJy4uL2NvcmUvVHJhbnNsYXRvcidcbmltcG9ydCBlZSBmcm9tICduYW1lc3BhY2UtZW1pdHRlcidcbi8vIGltcG9ydCBkZWVwRnJlZXplIGZyb20gJ2RlZXAtZnJlZXplLXN0cmljdCdcbmltcG9ydCBVcHB5U29ja2V0IGZyb20gJy4vVXBweVNvY2tldCdcbmltcG9ydCBlbl9VUyBmcm9tICcuLi9sb2NhbGVzL2VuX1VTJ1xuLy8gaW1wb3J0IHRocm90dGxlIGZyb20gJ3Rocm90dGxlLWRlYm91bmNlL3Rocm90dGxlJ1xuXG4vKipcbiAqIE1haW4gVXBweSBjb3JlXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9wdHMgZ2VuZXJhbCBvcHRpb25zLCBsaWtlIGxvY2FsZXMsIHRvIHNob3cgbW9kYWwgb3Igbm90IHRvIHNob3dcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29yZSB7XG4gIGNvbnN0cnVjdG9yIChvcHRzKSB7XG4gICAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgLy8gbG9hZCBFbmdsaXNoIGFzIHRoZSBkZWZhdWx0IGxvY2FsZXNcbiAgICAgIGxvY2FsZXM6IGVuX1VTLFxuICAgICAgYXV0b1Byb2NlZWQ6IHRydWUsXG4gICAgICBkZWJ1ZzogZmFsc2VcbiAgICB9XG5cbiAgICAvLyBNZXJnZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgb25lcyBzZXQgYnkgdXNlclxuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRzKVxuXG4gICAgLy8gRGljdGF0ZXMgaW4gd2hhdCBvcmRlciBkaWZmZXJlbnQgcGx1Z2luIHR5cGVzIGFyZSByYW46XG4gICAgdGhpcy50eXBlcyA9IFsgJ3ByZXNldHRlcicsICdvcmNoZXN0cmF0b3InLCAncHJvZ3Jlc3NpbmRpY2F0b3InLFxuICAgICAgICAgICAgICAgICAgICAnYWNxdWlyZXInLCAnbW9kaWZpZXInLCAndXBsb2FkZXInLCAncHJlc2VudGVyJywgJ2RlYnVnZ2VyJ11cblxuICAgIHRoaXMudHlwZSA9ICdjb3JlJ1xuXG4gICAgLy8gQ29udGFpbmVyIGZvciBkaWZmZXJlbnQgdHlwZXMgb2YgcGx1Z2luc1xuICAgIHRoaXMucGx1Z2lucyA9IHt9XG5cbiAgICB0aGlzLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcih7bG9jYWxlczogdGhpcy5vcHRzLmxvY2FsZXN9KVxuICAgIHRoaXMuaTE4biA9IHRoaXMudHJhbnNsYXRvci50cmFuc2xhdGUuYmluZCh0aGlzLnRyYW5zbGF0b3IpXG4gICAgdGhpcy5nZXRTdGF0ZSA9IHRoaXMuZ2V0U3RhdGUuYmluZCh0aGlzKVxuICAgIHRoaXMudXBkYXRlTWV0YSA9IHRoaXMudXBkYXRlTWV0YS5iaW5kKHRoaXMpXG4gICAgdGhpcy5pbml0U29ja2V0ID0gdGhpcy5pbml0U29ja2V0LmJpbmQodGhpcylcbiAgICB0aGlzLmxvZyA9IHRoaXMubG9nLmJpbmQodGhpcylcbiAgICB0aGlzLmFkZEZpbGUgPSB0aGlzLmFkZEZpbGUuYmluZCh0aGlzKVxuXG4gICAgdGhpcy5idXMgPSB0aGlzLmVtaXR0ZXIgPSBlZSgpXG4gICAgdGhpcy5vbiA9IHRoaXMuYnVzLm9uLmJpbmQodGhpcy5idXMpXG4gICAgdGhpcy5lbWl0ID0gdGhpcy5idXMuZW1pdC5iaW5kKHRoaXMuYnVzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGZpbGVzOiB7fSxcbiAgICAgIGNhcGFiaWxpdGllczoge30sXG4gICAgICB0b3RhbFByb2dyZXNzOiAwXG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0cy5kZWJ1Zykge1xuICAgICAgLy8gZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZ1xuICAgICAgZ2xvYmFsLlVwcHlTdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICAgIGdsb2JhbC51cHB5TG9nID0gJydcbiAgICAgIGdsb2JhbC5VcHB5QWRkRmlsZSA9IHRoaXMuYWRkRmlsZS5iaW5kKHRoaXMpXG4gICAgICBnbG9iYWwuX1VwcHkgPSB0aGlzXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb24gYWxsIHBsdWdpbnMgYW5kIHJ1biBgdXBkYXRlYCBvbiB0aGVtLiBDYWxsZWQgZWFjaCB0aW1lIHdoZW4gc3RhdGUgY2hhbmdlc1xuICAgKlxuICAgKi9cbiAgdXBkYXRlQWxsIChzdGF0ZSkge1xuICAgIE9iamVjdC5rZXlzKHRoaXMucGx1Z2lucykuZm9yRWFjaCgocGx1Z2luVHlwZSkgPT4ge1xuICAgICAgdGhpcy5wbHVnaW5zW3BsdWdpblR5cGVdLmZvckVhY2goKHBsdWdpbikgPT4ge1xuICAgICAgICBwbHVnaW4udXBkYXRlKHN0YXRlKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgc3RhdGVcbiAgICpcbiAgICogQHBhcmFtIHtuZXdTdGF0ZX0gb2JqZWN0XG4gICAqL1xuICBzZXRTdGF0ZSAoc3RhdGVVcGRhdGUpIHtcbiAgICBjb25zdCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuc3RhdGUsIHN0YXRlVXBkYXRlKVxuICAgIHRoaXMuZW1pdCgnY29yZTpzdGF0ZS11cGRhdGUnLCB0aGlzLnN0YXRlLCBuZXdTdGF0ZSwgc3RhdGVVcGRhdGUpXG5cbiAgICB0aGlzLnN0YXRlID0gbmV3U3RhdGVcbiAgICB0aGlzLnVwZGF0ZUFsbCh0aGlzLnN0YXRlKVxuXG4gICAgLy8gdGhpcy5sb2coJ1VwZGF0aW5nIHN0YXRlIHdpdGg6ICcpXG4gICAgLy8gdGhpcy5sb2cobmV3U3RhdGUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBjdXJyZW50IHN0YXRlXG4gICAqXG4gICAqL1xuICBnZXRTdGF0ZSAoKSB7XG4gICAgLy8gcmV0dXJuIGRlZXBGcmVlemUodGhpcy5zdGF0ZSlcbiAgICByZXR1cm4gdGhpcy5zdGF0ZVxuICB9XG5cbiAgdXBkYXRlTWV0YSAoZGF0YSwgZmlsZUlEKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IG5ld01ldGEgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXS5tZXRhLCBkYXRhKVxuICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVJRF0sIHtcbiAgICAgIG1ldGE6IG5ld01ldGFcbiAgICB9KVxuICAgIHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB1cGRhdGVkRmlsZXN9KVxuICB9XG5cbiAgYWRkRmlsZSAoZmlsZSkge1xuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuc3RhdGUuZmlsZXMpXG5cbiAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGUubmFtZSB8fCAnbm9uYW1lJ1xuICAgIGNvbnN0IGZpbGVUeXBlID0gVXRpbHMuZ2V0RmlsZVR5cGUoZmlsZSkgPyBVdGlscy5nZXRGaWxlVHlwZShmaWxlKS5zcGxpdCgnLycpIDogWycnLCAnJ11cbiAgICBjb25zdCBmaWxlVHlwZUdlbmVyYWwgPSBmaWxlVHlwZVswXVxuICAgIGNvbnN0IGZpbGVUeXBlU3BlY2lmaWMgPSBmaWxlVHlwZVsxXVxuICAgIGNvbnN0IGZpbGVFeHRlbnNpb24gPSBVdGlscy5nZXRGaWxlTmFtZUFuZEV4dGVuc2lvbihmaWxlTmFtZSlbMV1cbiAgICBjb25zdCBpc1JlbW90ZSA9IGZpbGUuaXNSZW1vdGUgfHwgZmFsc2VcblxuICAgIGNvbnN0IGZpbGVJRCA9IFV0aWxzLmdlbmVyYXRlRmlsZUlEKGZpbGVOYW1lKVxuXG4gICAgY29uc3QgbmV3RmlsZSA9IHtcbiAgICAgIHNvdXJjZTogZmlsZS5zb3VyY2UgfHwgJycsXG4gICAgICBpZDogZmlsZUlELFxuICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICBleHRlbnNpb246IGZpbGVFeHRlbnNpb24gfHwgJycsXG4gICAgICBtZXRhOiB7XG4gICAgICAgIG5hbWU6IGZpbGVOYW1lXG4gICAgICB9LFxuICAgICAgdHlwZToge1xuICAgICAgICBnZW5lcmFsOiBmaWxlVHlwZUdlbmVyYWwsXG4gICAgICAgIHNwZWNpZmljOiBmaWxlVHlwZVNwZWNpZmljXG4gICAgICB9LFxuICAgICAgZGF0YTogZmlsZS5kYXRhLFxuICAgICAgcHJvZ3Jlc3M6IHtcbiAgICAgICAgcGVyY2VudGFnZTogMCxcbiAgICAgICAgdXBsb2FkQ29tcGxldGU6IGZhbHNlLFxuICAgICAgICB1cGxvYWRTdGFydGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHNpemU6IGZpbGUuZGF0YS5zaXplIHx8IDAsXG4gICAgICBpc1JlbW90ZTogaXNSZW1vdGUsXG4gICAgICByZW1vdGU6IGZpbGUucmVtb3RlIHx8ICcnXG4gICAgfVxuXG4gICAgdXBkYXRlZEZpbGVzW2ZpbGVJRF0gPSBuZXdGaWxlXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHVwZGF0ZWRGaWxlc30pXG5cbiAgICB0aGlzLmJ1cy5lbWl0KCdmaWxlLWFkZGVkJywgZmlsZUlEKVxuICAgIHRoaXMubG9nKGBBZGRlZCBmaWxlOiAke2ZpbGVOYW1lfSwgJHtmaWxlSUR9YClcblxuICAgIGlmIChmaWxlVHlwZUdlbmVyYWwgPT09ICdpbWFnZScgJiYgIWlzUmVtb3RlKSB7XG4gICAgICB0aGlzLmFkZFRodW1ibmFpbChuZXdGaWxlLmlkKVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdHMuYXV0b1Byb2NlZWQpIHtcbiAgICAgIHRoaXMuYnVzLmVtaXQoJ2NvcmU6dXBsb2FkJylcbiAgICB9XG4gIH1cblxuICByZW1vdmVGaWxlIChmaWxlSUQpIHtcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgZGVsZXRlIHVwZGF0ZWRGaWxlc1tmaWxlSURdXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHVwZGF0ZWRGaWxlc30pXG4gIH1cblxuICBhZGRUaHVtYm5haWwgKGZpbGVJRCkge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmdldFN0YXRlKCkuZmlsZXNbZmlsZUlEXVxuXG4gICAgVXRpbHMucmVhZEZpbGUoZmlsZS5kYXRhKVxuICAgICAgLnRoZW4oKGltZ0RhdGFVUkkpID0+IFV0aWxzLmNyZWF0ZUltYWdlVGh1bWJuYWlsKGltZ0RhdGFVUkksIDIwMCkpXG4gICAgICAudGhlbigodGh1bWJuYWlsKSA9PiB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcbiAgICAgICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXSwge1xuICAgICAgICAgIHByZXZpZXc6IHRodW1ibmFpbFxuICAgICAgICB9KVxuICAgICAgICB1cGRhdGVkRmlsZXNbZmlsZUlEXSA9IHVwZGF0ZWRGaWxlXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB1cGRhdGVkRmlsZXN9KVxuICAgICAgfSlcbiAgfVxuXG4gIHN0YXJ0VXBsb2FkICgpIHtcbiAgICB0aGlzLmVtaXQoJ2NvcmU6dXBsb2FkJylcbiAgfVxuXG4gIGNhbGN1bGF0ZVByb2dyZXNzIChkYXRhKSB7XG4gICAgY29uc3QgZmlsZUlEID0gZGF0YS5pZFxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcbiAgICBpZiAoIXVwZGF0ZWRGaWxlc1tmaWxlSURdKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdUcnlpbmcgdG8gc2V0IHByb2dyZXNzIGZvciBhIGZpbGUgdGhhdOKAmXMgbm90IHdpdGggdXMgYW55bW9yZTogJywgZmlsZUlEKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXSxcbiAgICAgIE9iamVjdC5hc3NpZ24oe30sIHtcbiAgICAgICAgcHJvZ3Jlc3M6IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLnByb2dyZXNzLCB7XG4gICAgICAgICAgYnl0ZXNVcGxvYWRlZDogZGF0YS5ieXRlc1VwbG9hZGVkLFxuICAgICAgICAgIGJ5dGVzVG90YWw6IGRhdGEuYnl0ZXNUb3RhbCxcbiAgICAgICAgICBwZXJjZW50YWdlOiBNYXRoLnJvdW5kKChkYXRhLmJ5dGVzVXBsb2FkZWQgLyBkYXRhLmJ5dGVzVG90YWwgKiAxMDApLnRvRml4ZWQoMikpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgKSlcbiAgICB1cGRhdGVkRmlsZXNbZGF0YS5pZF0gPSB1cGRhdGVkRmlsZVxuXG4gICAgLy8gY2FsY3VsYXRlIHRvdGFsIHByb2dyZXNzLCB1c2luZyB0aGUgbnVtYmVyIG9mIGZpbGVzIGN1cnJlbnRseSB1cGxvYWRpbmcsXG4gICAgLy8gbXVsdGlwbGllZCBieSAxMDAgYW5kIHRoZSBzdW1tIG9mIGluZGl2aWR1YWwgcHJvZ3Jlc3Mgb2YgZWFjaCBmaWxlXG4gICAgY29uc3QgaW5Qcm9ncmVzcyA9IE9iamVjdC5rZXlzKHVwZGF0ZWRGaWxlcykuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICByZXR1cm4gdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnVwbG9hZFN0YXJ0ZWRcbiAgICB9KVxuICAgIGNvbnN0IHByb2dyZXNzTWF4ID0gaW5Qcm9ncmVzcy5sZW5ndGggKiAxMDBcbiAgICBsZXQgcHJvZ3Jlc3NBbGwgPSAwXG4gICAgaW5Qcm9ncmVzcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICBwcm9ncmVzc0FsbCA9IHByb2dyZXNzQWxsICsgdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnBlcmNlbnRhZ2VcbiAgICB9KVxuXG4gICAgY29uc3QgdG90YWxQcm9ncmVzcyA9IE1hdGgucm91bmQoKHByb2dyZXNzQWxsICogMTAwIC8gcHJvZ3Jlc3NNYXgpLnRvRml4ZWQoMikpXG5cbiAgICAvLyBpZiAodG90YWxQcm9ncmVzcyA9PT0gMTAwKSB7XG4gICAgLy8gICBjb25zdCBjb21wbGV0ZUZpbGVzID0gT2JqZWN0LmtleXModXBkYXRlZEZpbGVzKS5maWx0ZXIoKGZpbGUpID0+IHtcbiAgICAvLyAgICAgLy8gdGhpcyBzaG91bGQgYmUgYHVwbG9hZENvbXBsZXRlYFxuICAgIC8vICAgICByZXR1cm4gdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnBlcmNlbnRhZ2UgPT09IDEwMFxuICAgIC8vICAgfSlcbiAgICAvLyAgIHRoaXMuZW1pdCgnY29yZTpzdWNjZXNzJywgY29tcGxldGVGaWxlcy5sZW5ndGgpXG4gICAgLy8gfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICB0b3RhbFByb2dyZXNzOiB0b3RhbFByb2dyZXNzLFxuICAgICAgZmlsZXM6IHVwZGF0ZWRGaWxlc1xuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGxpc3RlbmVycyBmb3IgYWxsIGdsb2JhbCBhY3Rpb25zLCBsaWtlOlxuICAgKiBgZmlsZS1hZGRgLCBgZmlsZS1yZW1vdmVgLCBgdXBsb2FkLXByb2dyZXNzYCwgYHJlc2V0YFxuICAgKlxuICAgKi9cbiAgYWN0aW9ucyAoKSB7XG4gICAgLy8gdGhpcy5idXMub24oJyonLCAocGF5bG9hZCkgPT4ge1xuICAgIC8vICAgY29uc29sZS5sb2coJ2VtaXR0ZWQ6ICcsIHRoaXMuZXZlbnQpXG4gICAgLy8gICBjb25zb2xlLmxvZygnd2l0aCBwYXlsb2FkOiAnLCBwYXlsb2FkKVxuICAgIC8vIH0pXG5cbiAgICAvLyBjb25zdCBidXMgPSB0aGlzLmJ1c1xuXG4gICAgdGhpcy5vbignY29yZTpmaWxlLWFkZCcsIChkYXRhKSA9PiB7XG4gICAgICB0aGlzLmFkZEZpbGUoZGF0YSlcbiAgICB9KVxuXG4gICAgLy8gYHJlbW92ZS1maWxlYCByZW1vdmVzIGEgZmlsZSBmcm9tIGBzdGF0ZS5maWxlc2AsIGZvciBleGFtcGxlIHdoZW5cbiAgICAvLyBhIHVzZXIgZGVjaWRlcyBub3QgdG8gdXBsb2FkIHBhcnRpY3VsYXIgZmlsZSBhbmQgY2xpY2tzIGEgYnV0dG9uIHRvIHJlbW92ZSBpdFxuICAgIHRoaXMub24oJ2NvcmU6ZmlsZS1yZW1vdmUnLCAoZmlsZUlEKSA9PiB7XG4gICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZUlEKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdjb3JlOnVwbG9hZC1zdGFydGVkJywgKGZpbGVJRCwgdXBsb2FkKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgICBjb25zdCB1cGRhdGVkRmlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLFxuICAgICAgICBPYmplY3QuYXNzaWduKHt9LCB7XG4gICAgICAgICAgcHJvZ3Jlc3M6IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLnByb2dyZXNzLCB7XG4gICAgICAgICAgICB1cGxvYWRTdGFydGVkOiBEYXRlLm5vdygpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgKSlcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gdXBkYXRlZEZpbGVcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7ZmlsZXM6IHVwZGF0ZWRGaWxlc30pXG4gICAgfSlcblxuICAgIC8vIGNvbnN0IHRocm90dGxlZENhbGN1bGF0ZVByb2dyZXNzID0gdGhyb3R0bGUoMTAwMCwgKGRhdGEpID0+IHRoaXMuY2FsY3VsYXRlUHJvZ3Jlc3MoZGF0YSkpXG5cbiAgICB0aGlzLm9uKCdjb3JlOnVwbG9hZC1wcm9ncmVzcycsIChkYXRhKSA9PiB7XG4gICAgICB0aGlzLmNhbGN1bGF0ZVByb2dyZXNzKGRhdGEpXG4gICAgICAvLyB0aHJvdHRsZWRDYWxjdWxhdGVQcm9ncmVzcyhkYXRhKVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdjb3JlOnVwbG9hZC1zdWNjZXNzJywgKGZpbGVJRCwgdXBsb2FkVVJMKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgICBjb25zdCB1cGRhdGVkRmlsZSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXS5wcm9ncmVzcywge1xuICAgICAgICAgIHVwbG9hZENvbXBsZXRlOiB0cnVlXG4gICAgICAgIH0pLFxuICAgICAgICB1cGxvYWRVUkw6IHVwbG9hZFVSTFxuICAgICAgfSlcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gdXBkYXRlZEZpbGVcblxuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5nZXRTdGF0ZSgpLnRvdGFsUHJvZ3Jlc3MpXG5cbiAgICAgIGlmICh0aGlzLmdldFN0YXRlKCkudG90YWxQcm9ncmVzcyA9PT0gMTAwKSB7XG4gICAgICAgIGNvbnN0IGNvbXBsZXRlRmlsZXMgPSBPYmplY3Qua2V5cyh1cGRhdGVkRmlsZXMpLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgICAgIC8vIHRoaXMgc2hvdWxkIGJlIGB1cGxvYWRDb21wbGV0ZWBcbiAgICAgICAgICByZXR1cm4gdXBkYXRlZEZpbGVzW2ZpbGVdLnByb2dyZXNzLnVwbG9hZENvbXBsZXRlXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMuZW1pdCgnY29yZTpzdWNjZXNzJywgY29tcGxldGVGaWxlcy5sZW5ndGgpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBmaWxlczogdXBkYXRlZEZpbGVzXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdjb3JlOnVwZGF0ZS1tZXRhJywgKGRhdGEsIGZpbGVJRCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVNZXRhKGRhdGEsIGZpbGVJRClcbiAgICB9KVxuXG4gICAgLy8gc2hvdyBpbmZvcm1lciBpZiBvZmZsaW5lXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgKCkgPT4gdGhpcy5pc09ubGluZSh0cnVlKSlcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgKCkgPT4gdGhpcy5pc09ubGluZShmYWxzZSkpXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuaXNPbmxpbmUoKSwgMzAwMClcbiAgICB9XG4gIH1cblxuICBpc09ubGluZSAoc3RhdHVzKSB7XG4gICAgY29uc3Qgb25saW5lID0gc3RhdHVzIHx8IHdpbmRvdy5uYXZpZ2F0b3Iub25MaW5lXG4gICAgaWYgKCFvbmxpbmUpIHtcbiAgICAgIHRoaXMuZW1pdCgnaXMtb2ZmbGluZScpXG4gICAgICB0aGlzLmVtaXQoJ2luZm9ybWVyJywgJ05vIGludGVybmV0IGNvbm5lY3Rpb24nLCAnZXJyb3InLCAwKVxuICAgICAgdGhpcy53YXNPZmZsaW5lID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVtaXQoJ2lzLW9ubGluZScpXG4gICAgICBpZiAodGhpcy53YXNPZmZsaW5lKSB7XG4gICAgICAgIHRoaXMuZW1pdCgnaW5mb3JtZXInLCAnQ29ubmVjdGVkIScsICdzdWNjZXNzJywgMzAwMClcbiAgICAgICAgdGhpcy53YXNPZmZsaW5lID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBwbHVnaW4gd2l0aCBDb3JlXG4gKlxuICogQHBhcmFtIHtDbGFzc30gUGx1Z2luIG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgb2JqZWN0IHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gUGx1Z2luIGxhdGVyXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNlbGYgZm9yIGNoYWluaW5nXG4gKi9cbiAgdXNlIChQbHVnaW4sIG9wdHMpIHtcbiAgICAvLyBQcmVwYXJlIHByb3BzIHRvIHBhc3MgdG8gcGx1Z2luc1xuICAgIGNvbnN0IHByb3BzID0ge1xuICAgICAgZ2V0U3RhdGU6IHRoaXMuZ2V0U3RhdGUuYmluZCh0aGlzKSxcbiAgICAgIHNldFN0YXRlOiB0aGlzLnNldFN0YXRlLmJpbmQodGhpcyksXG4gICAgICB1cGRhdGVNZXRhOiB0aGlzLnVwZGF0ZU1ldGEuYmluZCh0aGlzKSxcbiAgICAgIGFkZEZpbGU6IHRoaXMuYWRkRmlsZS5iaW5kKHRoaXMpLFxuICAgICAgaTE4bjogdGhpcy5pMThuLmJpbmQodGhpcyksXG4gICAgICBidXM6IHRoaXMuZWUsXG4gICAgICBsb2c6IHRoaXMubG9nLmJpbmQodGhpcylcbiAgICB9XG4gICAgLy8gSW5zdGFudGlhdGVcbiAgICBjb25zdCBwbHVnaW4gPSBuZXcgUGx1Z2luKHRoaXMsIG9wdHMsIHByb3BzKVxuICAgIGNvbnN0IHBsdWdpbk5hbWUgPSBwbHVnaW4uaWRcbiAgICB0aGlzLnBsdWdpbnNbcGx1Z2luLnR5cGVdID0gdGhpcy5wbHVnaW5zW3BsdWdpbi50eXBlXSB8fCBbXVxuXG4gICAgaWYgKCFwbHVnaW5OYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdXIgcGx1Z2luIG11c3QgaGF2ZSBhIG5hbWUnKVxuICAgIH1cblxuICAgIGlmICghcGx1Z2luLnR5cGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignWW91ciBwbHVnaW4gbXVzdCBoYXZlIGEgdHlwZScpXG4gICAgfVxuXG4gICAgbGV0IGV4aXN0c1BsdWdpbkFscmVhZHkgPSB0aGlzLmdldFBsdWdpbihwbHVnaW5OYW1lKVxuICAgIGlmIChleGlzdHNQbHVnaW5BbHJlYWR5KSB7XG4gICAgICBsZXQgbXNnID0gYEFscmVhZHkgZm91bmQgYSBwbHVnaW4gbmFtZWQgJyR7ZXhpc3RzUGx1Z2luQWxyZWFkeS5uYW1lfScuXG4gICAgICAgIFRyaWVkIHRvIHVzZTogJyR7cGx1Z2luTmFtZX0nLlxuICAgICAgICBVcHB5IGlzIGN1cnJlbnRseSBsaW1pdGVkIHRvIHJ1bm5pbmcgb25lIG9mIGV2ZXJ5IHBsdWdpbi5cbiAgICAgICAgU2hhcmUgeW91ciB1c2UgY2FzZSB3aXRoIHVzIG92ZXIgYXRcbiAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL3RyYW5zbG9hZGl0L3VwcHkvaXNzdWVzL1xuICAgICAgICBpZiB5b3Ugd2FudCB1cyB0byByZWNvbnNpZGVyLmBcbiAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpXG4gICAgfVxuXG4gICAgdGhpcy5wbHVnaW5zW3BsdWdpbi50eXBlXS5wdXNoKHBsdWdpbilcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuLyoqXG4gKiBGaW5kIG9uZSBQbHVnaW4gYnkgbmFtZVxuICpcbiAqIEBwYXJhbSBzdHJpbmcgbmFtZSBkZXNjcmlwdGlvblxuICovXG4gIGdldFBsdWdpbiAobmFtZSkge1xuICAgIGxldCBmb3VuZFBsdWdpbiA9IGZhbHNlXG4gICAgdGhpcy5pdGVyYXRlUGx1Z2lucygocGx1Z2luKSA9PiB7XG4gICAgICBjb25zdCBwbHVnaW5OYW1lID0gcGx1Z2luLmlkXG4gICAgICBpZiAocGx1Z2luTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICBmb3VuZFBsdWdpbiA9IHBsdWdpblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3VuZFBsdWdpblxuICB9XG5cbi8qKlxuICogSXRlcmF0ZSB0aHJvdWdoIGFsbCBgdXNlYGQgcGx1Z2luc1xuICpcbiAqIEBwYXJhbSBmdW5jdGlvbiBtZXRob2QgZGVzY3JpcHRpb25cbiAqL1xuICBpdGVyYXRlUGx1Z2lucyAobWV0aG9kKSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5wbHVnaW5zKS5mb3JFYWNoKChwbHVnaW5UeXBlKSA9PiB7XG4gICAgICB0aGlzLnBsdWdpbnNbcGx1Z2luVHlwZV0uZm9yRWFjaChtZXRob2QpXG4gICAgfSlcbiAgfVxuXG4vKipcbiAqIExvZ3Mgc3R1ZmYgdG8gY29uc29sZSwgb25seSBpZiBgZGVidWdgIGlzIHNldCB0byB0cnVlLiBTaWxlbnQgaW4gcHJvZHVjdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd8T2JqZWN0fSB0byBsb2dcbiAqL1xuICBsb2cgKG1zZywgdHlwZSkge1xuICAgIGlmICghdGhpcy5vcHRzLmRlYnVnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKG1zZyA9PT0gYCR7bXNnfWApIHtcbiAgICAgIGNvbnNvbGUubG9nKGBMT0c6ICR7bXNnfWApXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZGlyKG1zZylcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgY29uc29sZS5lcnJvcihgTE9HOiAke21zZ31gKVxuICAgIH1cblxuICAgIGdsb2JhbC51cHB5TG9nID0gZ2xvYmFsLnVwcHlMb2cgKyAnXFxuJyArICdERUJVRyBMT0c6ICcgKyBtc2dcbiAgfVxuXG4gIGluaXRTb2NrZXQgKG9wdHMpIHtcbiAgICBpZiAoIXRoaXMuc29ja2V0KSB7XG4gICAgICB0aGlzLnNvY2tldCA9IG5ldyBVcHB5U29ja2V0KG9wdHMpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc29ja2V0XG4gIH1cblxuICBpbnN0YWxsQWxsICgpIHtcbiAgICBPYmplY3Qua2V5cyh0aGlzLnBsdWdpbnMpLmZvckVhY2goKHBsdWdpblR5cGUpID0+IHtcbiAgICAgIHRoaXMucGx1Z2luc1twbHVnaW5UeXBlXS5mb3JFYWNoKChwbHVnaW4pID0+IHtcbiAgICAgICAgcGx1Z2luLmluc3RhbGwoKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgYWN0aW9ucywgaW5zdGFsbHMgYWxsIHBsdWdpbnMgKGJ5IGl0ZXJhdGluZyBvbiB0aGVtIGFuZCBjYWxsaW5nIGBpbnN0YWxsYCksIHNldHMgb3B0aW9uc1xuICpcbiAqIChJbiB0aGUgcGFzdCB3YXMgdXNlZCB0byBydW4gYSB3YXRlcmZhbGwgb2YgcnVuVHlwZSBwbHVnaW4gcGFja3MsIGxpa2Ugc286XG4gKiBBbGwgcHJlc2V0ZXJzKGRhdGEpIC0tPiBBbGwgYWNxdWlyZXJzKGRhdGEpIC0tPiBBbGwgdXBsb2FkZXJzKGRhdGEpIC0tPiBkb25lKVxuICovXG4gIHJ1biAoKSB7XG4gICAgdGhpcy5sb2coJ0NvcmUgaXMgcnVuLCBpbml0aWFsaXppbmcgYWN0aW9ucywgaW5zdGFsbGluZyBwbHVnaW5zLi4uJylcblxuICAgIC8vIHNldEludGVydmFsKCgpID0+IHtcbiAgICAvLyAgIHRoaXMudXBkYXRlQWxsKHRoaXMuc3RhdGUpXG4gICAgLy8gfSwgMTAwMClcblxuICAgIHRoaXMuYWN0aW9ucygpXG5cbiAgICAvLyBGb3JzZSBzZXQgYGF1dG9Qcm9jZWVkYCBvcHRpb24gdG8gZmFsc2UgaWYgdGhlcmUgYXJlIG11bHRpcGxlIHNlbGVjdG9yIFBsdWdpbnMgYWN0aXZlXG4gICAgLy8gaWYgKHRoaXMucGx1Z2lucy5hY3F1aXJlciAmJiB0aGlzLnBsdWdpbnMuYWNxdWlyZXIubGVuZ3RoID4gMSkge1xuICAgIC8vICAgdGhpcy5vcHRzLmF1dG9Qcm9jZWVkID0gZmFsc2VcbiAgICAvLyB9XG5cbiAgICAvLyBJbnN0YWxsIGFsbCBwbHVnaW5zXG4gICAgdGhpcy5pbnN0YWxsQWxsKClcblxuICAgIHJldHVyblxuICB9XG59XG4iLCJpbXBvcnQgZW5fVVMgZnJvbSAnLi4vbG9jYWxlcy9lbl9VUydcblxuLyoqXG4gKiBUcmFuc2xhdGVzIHN0cmluZ3Mgd2l0aCBpbnRlcnBvbGF0aW9uICYgcGx1cmFsaXphdGlvbiBzdXBwb3J0LkV4dGVuc2libGUgd2l0aCBjdXN0b20gZGljdGlvbmFyaWVzXG4gKiBhbmQgcGx1cmFsaXphdGlvbiBmdW5jdGlvbnMuXG4gKlxuICogQm9ycm93cyBoZWF2aWx5IGZyb20gYW5kIGluc3BpcmVkIGJ5IFBvbHlnbG90IGh0dHBzOi8vZ2l0aHViLmNvbS9haXJibmIvcG9seWdsb3QuanMsXG4gKiBiYXNpY2FsbHkgYSBzdHJpcHBlZC1kb3duIHZlcnNpb24gb2YgaXQuIERpZmZlcmVuY2VzOiBwbHVyYWxpemF0aW9uIGZ1bmN0aW9ucyBhcmUgbm90IGhhcmRjb2RlZFxuICogYW5kIGNhbiBiZSBlYXNpbHkgYWRkZWQgYW1vbmcgd2l0aCBkaWN0aW9uYXJpZXMsIG5lc3RlZCBvYmplY3RzIGFyZSB1c2VkIGZvciBwbHVyYWxpemF0aW9uXG4gKiBhcyBvcHBvc2VkIHRvIGB8fHx8YCBkZWxpbWV0ZXJcbiAqXG4gKiBVc2FnZSBleGFtcGxlOiBgdHJhbnNsYXRvci50cmFuc2xhdGUoJ2ZpbGVzX2Nob3NlbicsIHtzbWFydF9jb3VudDogM30pYFxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyYW5zbGF0b3Ige1xuICBjb25zdHJ1Y3RvciAob3B0cykge1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgbG9jYWxlczogZW5fVVNcbiAgICB9XG4gICAgdGhpcy5vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdHMpXG4gICAgdGhpcy5sb2NhbGVzID0gdGhpcy5vcHRzLmxvY2FsZXNcbiAgICB0aGlzLmxvY2FsZXMuc3RyaW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGVuX1VTLnN0cmluZ3MsIHRoaXMub3B0cy5sb2NhbGVzLnN0cmluZ3MpXG4gIH1cblxuLyoqXG4gKiBUYWtlcyBhIHN0cmluZyB3aXRoIHBsYWNlaG9sZGVyIHZhcmlhYmxlcyBsaWtlIGAle3NtYXJ0X2NvdW50fSBmaWxlIHNlbGVjdGVkYFxuICogYW5kIHJlcGxhY2VzIGl0IHdpdGggdmFsdWVzIGZyb20gb3B0aW9ucyBge3NtYXJ0X2NvdW50OiA1fWBcbiAqXG4gKiBAbGljZW5zZSBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAqIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2FpcmJuYi9wb2x5Z2xvdC5qcy9ibG9iL21hc3Rlci9saWIvcG9seWdsb3QuanMjTDI5OVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwaHJhc2UgdGhhdCBuZWVkcyBpbnRlcnBvbGF0aW9uLCB3aXRoIHBsYWNlaG9sZGVyc1xuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgd2l0aCB2YWx1ZXMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gcmVwbGFjZSBwbGFjZWhvbGRlcnNcbiAqIEByZXR1cm4ge3N0cmluZ30gaW50ZXJwb2xhdGVkXG4gKi9cbiAgaW50ZXJwb2xhdGUgKHBocmFzZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2VcbiAgICBjb25zdCBkb2xsYXJSZWdleCA9IC9cXCQvZ1xuICAgIGNvbnN0IGRvbGxhckJpbGxzWWFsbCA9ICckJCQkJ1xuXG4gICAgZm9yIChsZXQgYXJnIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChhcmcgIT09ICdfJyAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KGFyZykpIHtcbiAgICAgICAgLy8gRW5zdXJlIHJlcGxhY2VtZW50IHZhbHVlIGlzIGVzY2FwZWQgdG8gcHJldmVudCBzcGVjaWFsICQtcHJlZml4ZWRcbiAgICAgICAgLy8gcmVnZXggcmVwbGFjZSB0b2tlbnMuIHRoZSBcIiQkJCRcIiBpcyBuZWVkZWQgYmVjYXVzZSBlYWNoIFwiJFwiIG5lZWRzIHRvXG4gICAgICAgIC8vIGJlIGVzY2FwZWQgd2l0aCBcIiRcIiBpdHNlbGYsIGFuZCB3ZSBuZWVkIHR3byBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dC5cbiAgICAgICAgdmFyIHJlcGxhY2VtZW50ID0gb3B0aW9uc1thcmddXG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlLmNhbGwob3B0aW9uc1thcmddLCBkb2xsYXJSZWdleCwgZG9sbGFyQmlsbHNZYWxsKVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGNyZWF0ZSBhIG5ldyBgUmVnRXhwYCBlYWNoIHRpbWUgaW5zdGVhZCBvZiB1c2luZyBhIG1vcmUtZWZmaWNpZW50XG4gICAgICAgIC8vIHN0cmluZyByZXBsYWNlIHNvIHRoYXQgdGhlIHNhbWUgYXJndW1lbnQgY2FuIGJlIHJlcGxhY2VkIG11bHRpcGxlIHRpbWVzXG4gICAgICAgIC8vIGluIHRoZSBzYW1lIHBocmFzZS5cbiAgICAgICAgcGhyYXNlID0gcmVwbGFjZS5jYWxsKHBocmFzZSwgbmV3IFJlZ0V4cCgnJVxcXFx7JyArIGFyZyArICdcXFxcfScsICdnJyksIHJlcGxhY2VtZW50KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGhyYXNlXG4gIH1cblxuLyoqXG4gKiBQdWJsaWMgdHJhbnNsYXRlIG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHdpdGggdmFsdWVzIHRoYXQgd2lsbCBiZSB1c2VkIGxhdGVyIHRvIHJlcGxhY2UgcGxhY2Vob2xkZXJzIGluIHN0cmluZ1xuICogQHJldHVybiB7c3RyaW5nfSB0cmFuc2xhdGVkIChhbmQgaW50ZXJwb2xhdGVkKVxuICovXG4gIHRyYW5zbGF0ZSAoa2V5LCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5zbWFydF9jb3VudCkge1xuICAgICAgdmFyIHBsdXJhbCA9IHRoaXMubG9jYWxlcy5wbHVyYWxpemUob3B0aW9ucy5zbWFydF9jb3VudClcbiAgICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMub3B0cy5sb2NhbGVzLnN0cmluZ3Nba2V5XVtwbHVyYWxdLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMub3B0cy5sb2NhbGVzLnN0cmluZ3Nba2V5XSwgb3B0aW9ucylcbiAgfVxufVxuIiwiaW1wb3J0IGVlIGZyb20gJ25hbWVzcGFjZS1lbWl0dGVyJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVcHB5U29ja2V0IHtcbiAgY29uc3RydWN0b3IgKG9wdHMpIHtcbiAgICB0aGlzLnF1ZXVlZCA9IFtdXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldChvcHRzLnRhcmdldClcbiAgICB0aGlzLmVtaXR0ZXIgPSBlZSgpXG5cbiAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSB0cnVlXG5cbiAgICAgIHdoaWxlICh0aGlzLnF1ZXVlZC5sZW5ndGggPiAwICYmIHRoaXMuaXNPcGVuKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5xdWV1ZWRbMF1cbiAgICAgICAgdGhpcy5zZW5kKGZpcnN0LmFjdGlvbiwgZmlyc3QucGF5bG9hZClcbiAgICAgICAgdGhpcy5xdWV1ZWQgPSB0aGlzLnF1ZXVlZC5zbGljZSgxKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuX2hhbmRsZU1lc3NhZ2UgPSB0aGlzLl9oYW5kbGVNZXNzYWdlLmJpbmQodGhpcylcblxuICAgIHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IHRoaXMuX2hhbmRsZU1lc3NhZ2VcblxuICAgIHRoaXMuY2xvc2UgPSB0aGlzLmNsb3NlLmJpbmQodGhpcylcbiAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKVxuICAgIHRoaXMub24gPSB0aGlzLm9uLmJpbmQodGhpcylcbiAgICB0aGlzLm9uY2UgPSB0aGlzLm9uY2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc2VuZCA9IHRoaXMuc2VuZC5iaW5kKHRoaXMpXG4gIH1cblxuICBjbG9zZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0LmNsb3NlKClcbiAgfVxuXG4gIHNlbmQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIC8vIGF0dGFjaCB1dWlkXG5cbiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICB0aGlzLnF1ZXVlZC5wdXNoKHthY3Rpb24sIHBheWxvYWR9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICBhY3Rpb24sXG4gICAgICBwYXlsb2FkXG4gICAgfSkpXG4gIH1cblxuICBvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgdGhpcy5lbWl0dGVyLm9uKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIGVtaXQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KGFjdGlvbiwgcGF5bG9hZClcbiAgfVxuXG4gIG9uY2UgKGFjdGlvbiwgaGFuZGxlcikge1xuICAgIHRoaXMuZW1pdHRlci5vbmNlKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIF9oYW5kbGVNZXNzYWdlIChlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGUuZGF0YSlcbiAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmFjdGlvbiwgbWVzc2FnZS5wYXlsb2FkKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IG1pbWUgZnJvbSAnbWltZS10eXBlcydcbi8vIGltcG9ydCBwaWNhIGZyb20gJ3BpY2EnXG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIG9mIHNtYWxsIHV0aWxpdHkgZnVuY3Rpb25zIHRoYXQgaGVscCB3aXRoIGRvbSBtYW5pcHVsYXRpb24sIGFkZGluZyBsaXN0ZW5lcnMsXG4gKiBwcm9taXNlcyBhbmQgb3RoZXIgZ29vZCB0aGluZ3MuXG4gKlxuICogQG1vZHVsZSBVdGlsc1xuICovXG5cbi8qKlxuICogU2hhbGxvdyBmbGF0dGVuIG5lc3RlZCBhcnJheXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuIChhcnIpIHtcbiAgcmV0dXJuIFtdLmNvbmNhdC5hcHBseShbXSwgYXJyKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUb3VjaERldmljZSAoKSB7XG4gIHJldHVybiAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgLy8gd29ya3Mgb24gbW9zdCBicm93c2Vyc1xuICAgICAgICAgIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyAgIC8vIHdvcmtzIG9uIElFMTAvMTEgYW5kIFN1cmZhY2Vcbn1cblxuLyoqXG4gKiBTaG9ydGVyIGFuZCBmYXN0IHdheSB0byBzZWxlY3QgYSBzaW5nbGUgbm9kZSBpbiB0aGUgRE9NXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IHNlbGVjdG9yIC0gdW5pcXVlIGRvbSBzZWxlY3RvclxuICogQHBhcmFtICAgeyBPYmplY3QgfSBjdHggLSBET00gbm9kZSB3aGVyZSB0aGUgdGFyZ2V0IG9mIG91ciBzZWFyY2ggd2lsbCBpcyBsb2NhdGVkXG4gKiBAcmV0dXJucyB7IE9iamVjdCB9IGRvbSBub2RlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkIChzZWxlY3RvciwgY3R4KSB7XG4gIHJldHVybiAoY3R4IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxufVxuXG4vKipcbiAqIFNob3J0ZXIgYW5kIGZhc3Qgd2F5IHRvIHNlbGVjdCBtdWx0aXBsZSBub2RlcyBpbiB0aGUgRE9NXG4gKiBAcGFyYW0gICB7IFN0cmluZ3xBcnJheSB9IHNlbGVjdG9yIC0gRE9NIHNlbGVjdG9yIG9yIG5vZGVzIGxpc3RcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gY3R4IC0gRE9NIG5vZGUgd2hlcmUgdGhlIHRhcmdldHMgb2Ygb3VyIHNlYXJjaCB3aWxsIGlzIGxvY2F0ZWRcbiAqIEByZXR1cm5zIHsgT2JqZWN0IH0gZG9tIG5vZGVzIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiAkJCAoc2VsZWN0b3IsIGN0eCkge1xuICB2YXIgZWxzXG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgZWxzID0gKGN0eCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcilcbiAgfSBlbHNlIHtcbiAgICBlbHMgPSBzZWxlY3RvclxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbHMpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRydW5jYXRlU3RyaW5nIChzdHIsIGxlbmd0aCkge1xuICBpZiAoc3RyLmxlbmd0aCA+IGxlbmd0aCkge1xuICAgIHJldHVybiBzdHIuc3Vic3RyKDAsIGxlbmd0aCAvIDIpICsgJy4uLicgKyBzdHIuc3Vic3RyKHN0ci5sZW5ndGggLSBsZW5ndGggLyA0LCBzdHIubGVuZ3RoKVxuICB9XG4gIHJldHVybiBzdHJcblxuICAvLyBtb3JlIHByZWNpc2UgdmVyc2lvbiBpZiBuZWVkZWRcbiAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODMxNTgzXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWNvbmRzVG9UaW1lIChyYXdTZWNvbmRzKSB7XG4gIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihyYXdTZWNvbmRzIC8gMzYwMCkgJSAyNFxuICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihyYXdTZWNvbmRzIC8gNjApICUgNjBcbiAgY29uc3Qgc2Vjb25kcyA9IE1hdGguZmxvb3IocmF3U2Vjb25kcyAlIDYwKVxuXG4gIHJldHVybiB7IGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIH1cbn1cblxuLyoqXG4gKiBQYXJ0aXRpb24gYXJyYXkgYnkgYSBncm91cGluZyBmdW5jdGlvbi5cbiAqIEBwYXJhbSAge1t0eXBlXX0gYXJyYXkgICAgICBJbnB1dCBhcnJheVxuICogQHBhcmFtICB7W3R5cGVdfSBncm91cGluZ0ZuIEdyb3VwaW5nIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgQXJyYXkgb2YgYXJyYXlzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncm91cEJ5IChhcnJheSwgZ3JvdXBpbmdGbikge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKChyZXN1bHQsIGl0ZW0pID0+IHtcbiAgICBsZXQga2V5ID0gZ3JvdXBpbmdGbihpdGVtKVxuICAgIGxldCB4cyA9IHJlc3VsdC5nZXQoa2V5KSB8fCBbXVxuICAgIHhzLnB1c2goaXRlbSlcbiAgICByZXN1bHQuc2V0KGtleSwgeHMpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LCBuZXcgTWFwKCkpXG59XG5cbi8qKlxuICogVGVzdHMgaWYgZXZlcnkgYXJyYXkgZWxlbWVudCBwYXNzZXMgcHJlZGljYXRlXG4gKiBAcGFyYW0gIHtBcnJheX0gIGFycmF5ICAgICAgIElucHV0IGFycmF5XG4gKiBAcGFyYW0gIHtPYmplY3R9IHByZWRpY2F0ZUZuIFByZWRpY2F0ZVxuICogQHJldHVybiB7Ym9vbH0gICAgICAgICAgICAgICBFdmVyeSBlbGVtZW50IHBhc3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV2ZXJ5IChhcnJheSwgcHJlZGljYXRlRm4pIHtcbiAgcmV0dXJuIGFycmF5LnJlZHVjZSgocmVzdWx0LCBpdGVtKSA9PiB7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBwcmVkaWNhdGVGbihpdGVtKVxuICB9LCB0cnVlKVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGxpc3QgaW50byBhcnJheVxuKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0FycmF5IChsaXN0KSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChsaXN0IHx8IFtdLCAwKVxufVxuXG4vKipcbiAqIFRha2VzIGEgZmlsZU5hbWUgYW5kIHR1cm5zIGl0IGludG8gZmlsZUlELCBieSBjb252ZXJ0aW5nIHRvIGxvd2VyY2FzZSxcbiAqIHJlbW92aW5nIGV4dHJhIGNoYXJhY3RlcnMgYW5kIGFkZGluZyB1bml4IHRpbWVzdGFtcFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlTmFtZVxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRmlsZUlEIChmaWxlTmFtZSkge1xuICBsZXQgZmlsZUlEID0gZmlsZU5hbWUudG9Mb3dlckNhc2UoKVxuICBmaWxlSUQgPSBmaWxlSUQucmVwbGFjZSgvW15BLVowLTldL2lnLCAnJylcbiAgZmlsZUlEID0gZmlsZUlEICsgRGF0ZS5ub3coKVxuICByZXR1cm4gZmlsZUlEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbmQgKC4uLm9ianMpIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24uYXBwbHkodGhpcywgW3t9XS5jb25jYXQob2JqcykpXG59XG5cbi8qKlxuICogVGFrZXMgZnVuY3Rpb24gb3IgY2xhc3MsIHJldHVybnMgaXRzIG5hbWUuXG4gKiBCZWNhdXNlIElFIGRvZXNu4oCZdCBzdXBwb3J0IGBjb25zdHJ1Y3Rvci5uYW1lYC5cbiAqIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2Rma2F5ZS82Mzg0NDM5LCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNTcxNDQ0NVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBmbiDigJQgZnVuY3Rpb25cbiAqXG4gKi9cbi8vIGZ1bmN0aW9uIGdldEZuTmFtZSAoZm4pIHtcbi8vICAgdmFyIGYgPSB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbidcbi8vICAgdmFyIHMgPSBmICYmICgoZm4ubmFtZSAmJiBbJycsIGZuLm5hbWVdKSB8fCBmbi50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvbiAoW15cXChdKykvKSlcbi8vICAgcmV0dXJuICghZiAmJiAnbm90IGEgZnVuY3Rpb24nKSB8fCAocyAmJiBzWzFdIHx8ICdhbm9ueW1vdXMnKVxuLy8gfVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcG9ydGlvbmFsSW1hZ2VIZWlnaHQgKGltZywgbmV3V2lkdGgpIHtcbiAgdmFyIGFzcGVjdCA9IGltZy53aWR0aCAvIGltZy5oZWlnaHRcbiAgdmFyIG5ld0hlaWdodCA9IE1hdGgucm91bmQobmV3V2lkdGggLyBhc3BlY3QpXG4gIHJldHVybiBuZXdIZWlnaHRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVUeXBlIChmaWxlKSB7XG4gIGlmIChmaWxlLnR5cGUpIHtcbiAgICByZXR1cm4gZmlsZS50eXBlXG4gIH1cbiAgcmV0dXJuIG1pbWUubG9va3VwKGZpbGUubmFtZSlcbn1cblxuLy8gcmV0dXJucyBbZmlsZU5hbWUsIGZpbGVFeHRdXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRFeHRlbnNpb24gKGZ1bGxGaWxlTmFtZSkge1xuICB2YXIgcmUgPSAvKD86XFwuKFteLl0rKSk/JC9cbiAgdmFyIGZpbGVFeHQgPSByZS5leGVjKGZ1bGxGaWxlTmFtZSlbMV1cbiAgdmFyIGZpbGVOYW1lID0gZnVsbEZpbGVOYW1lLnJlcGxhY2UoJy4nICsgZmlsZUV4dCwgJycpXG4gIHJldHVybiBbZmlsZU5hbWUsIGZpbGVFeHRdXG59XG5cbi8qKlxuICogUmVhZHMgZmlsZSBhcyBkYXRhIFVSSSBmcm9tIGZpbGUgb2JqZWN0LFxuICogdGhlIG9uZSB5b3UgZ2V0IGZyb20gaW5wdXRbdHlwZT1maWxlXSBvciBkcmFnICYgZHJvcC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZmlsZSBvYmplY3RcbiAqIEByZXR1cm4ge1Byb21pc2V9IGRhdGFVUkwgb2YgdGhlIGZpbGVcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZSAoZmlsZU9iaikge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChldikge1xuICAgICAgcmV0dXJuIHJlc29sdmUoZXYudGFyZ2V0LnJlc3VsdClcbiAgICB9KVxuICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGVPYmopXG5cbiAgICAvLyBmdW5jdGlvbiB3b3JrZXJTY3JpcHQgKCkge1xuICAgIC8vICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGUpID0+IHtcbiAgICAvLyAgICAgY29uc3QgZmlsZSA9IGUuZGF0YS5maWxlXG4gICAgLy8gICAgIHRyeSB7XG4gICAgLy8gICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXJTeW5jKClcbiAgICAvLyAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgLy8gICAgICAgICBmaWxlOiByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKVxuICAgIC8vICAgICAgIH0pXG4gICAgLy8gICAgIH0gY2F0Y2ggKGVycikge1xuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKGVycilcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfSlcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyBjb25zdCB3b3JrZXIgPSBtYWtlV29ya2VyKHdvcmtlclNjcmlwdClcbiAgICAvLyB3b3JrZXIucG9zdE1lc3NhZ2Uoe2ZpbGU6IGZpbGVPYmp9KVxuICAgIC8vIHdvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGUpID0+IHtcbiAgICAvLyAgIGNvbnN0IGZpbGVEYXRhVVJMID0gZS5kYXRhLmZpbGVcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdGSUxFIF8gREFUQSBfIFVSTCcpXG4gICAgLy8gICByZXR1cm4gcmVzb2x2ZShmaWxlRGF0YVVSTClcbiAgICAvLyB9KVxuICB9KVxufVxuXG4vKipcbiAqIFJlc2l6ZXMgYW4gaW1hZ2UgdG8gc3BlY2lmaWVkIHdpZHRoIGFuZCBwcm9wb3J0aW9uYWwgaGVpZ2h0LCB1c2luZyBjYW52YXNcbiAqIFNlZSBodHRwczovL2Rhdmlkd2Fsc2gubmFtZS9yZXNpemUtaW1hZ2UtY2FudmFzLFxuICogaHR0cDovL2JhYmFsYW4uY29tL3Jlc2l6aW5nLWltYWdlcy13aXRoLWphdmFzY3JpcHQvXG4gKiBAVE9ETyBzZWUgaWYgd2UgbmVlZCBodHRwczovL2dpdGh1Yi5jb20vc3RvbWl0YS9pb3MtaW1hZ2VmaWxlLW1lZ2FwaXhlbCBmb3IgaU9TXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IERhdGEgVVJJIG9mIHRoZSBvcmlnaW5hbCBpbWFnZVxuICogQHBhcmFtIHtTdHJpbmd9IHdpZHRoIG9mIHRoZSByZXN1bHRpbmcgaW1hZ2VcbiAqIEByZXR1cm4ge1N0cmluZ30gRGF0YSBVUkkgb2YgdGhlIHJlc2l6ZWQgaW1hZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUltYWdlVGh1bWJuYWlsIChpbWdEYXRhVVJJLCBuZXdXaWR0aCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpXG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdJbWFnZVdpZHRoID0gbmV3V2lkdGhcbiAgICAgIGNvbnN0IG5ld0ltYWdlSGVpZ2h0ID0gZ2V0UHJvcG9ydGlvbmFsSW1hZ2VIZWlnaHQoaW1nLCBuZXdJbWFnZVdpZHRoKVxuXG4gICAgICAvLyBjcmVhdGUgYW4gb2ZmLXNjcmVlbiBjYW52YXNcbiAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXG4gICAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuXG4gICAgICAvLyBzZXQgaXRzIGRpbWVuc2lvbiB0byB0YXJnZXQgc2l6ZVxuICAgICAgY2FudmFzLndpZHRoID0gbmV3SW1hZ2VXaWR0aFxuICAgICAgY2FudmFzLmhlaWdodCA9IG5ld0ltYWdlSGVpZ2h0XG5cbiAgICAgIC8vIGRyYXcgc291cmNlIGltYWdlIGludG8gdGhlIG9mZi1zY3JlZW4gY2FudmFzOlxuICAgICAgLy8gY3R4LmNsZWFyUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KVxuICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIG5ld0ltYWdlV2lkdGgsIG5ld0ltYWdlSGVpZ2h0KVxuXG4gICAgICAvLyBwaWNhLnJlc2l6ZUNhbnZhcyhpbWcsIGNhbnZhcywgKGVycikgPT4ge1xuICAgICAgLy8gICBpZiAoZXJyKSBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAvLyAgIGNvbnN0IHRodW1ibmFpbCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpXG4gICAgICAvLyAgIHJldHVybiByZXNvbHZlKHRodW1ibmFpbClcbiAgICAgIC8vIH0pXG5cbiAgICAgIC8vIGVuY29kZSBpbWFnZSB0byBkYXRhLXVyaSB3aXRoIGJhc2U2NCB2ZXJzaW9uIG9mIGNvbXByZXNzZWQgaW1hZ2VcbiAgICAgIC8vIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnLCBxdWFsaXR5KTsgIC8vIHF1YWxpdHkgPSBbMC4wLCAxLjBdXG4gICAgICBjb25zdCB0aHVtYm5haWwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKVxuICAgICAgcmV0dXJuIHJlc29sdmUodGh1bWJuYWlsKVxuICAgIH0pXG4gICAgaW1nLnNyYyA9IGltZ0RhdGFVUklcbiAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRhdGFVUkl0b0Jsb2IgKGRhdGFVUkksIG9wdHMsIHRvRmlsZSkge1xuICAvLyBnZXQgdGhlIGJhc2U2NCBkYXRhXG4gIHZhciBkYXRhID0gZGF0YVVSSS5zcGxpdCgnLCcpWzFdXG5cbiAgLy8gdXNlciBtYXkgcHJvdmlkZSBtaW1lIHR5cGUsIGlmIG5vdCBnZXQgaXQgZnJvbSBkYXRhIFVSSVxuICB2YXIgbWltZVR5cGUgPSBvcHRzLm1pbWVUeXBlIHx8IGRhdGFVUkkuc3BsaXQoJywnKVswXS5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF1cblxuICAvLyBkZWZhdWx0IHRvIHBsYWluL3RleHQgaWYgZGF0YSBVUkkgaGFzIG5vIG1pbWVUeXBlXG4gIGlmIChtaW1lVHlwZSA9PSBudWxsKSB7XG4gICAgbWltZVR5cGUgPSAncGxhaW4vdGV4dCdcbiAgfVxuXG4gIHZhciBiaW5hcnkgPSBhdG9iKGRhdGEpXG4gIHZhciBhcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgYXJyYXkucHVzaChiaW5hcnkuY2hhckNvZGVBdChpKSlcbiAgfVxuXG4gIC8vIENvbnZlcnQgdG8gYSBGaWxlP1xuICBpZiAodG9GaWxlKSB7XG4gICAgcmV0dXJuIG5ldyBGaWxlKFtuZXcgVWludDhBcnJheShhcnJheSldLCBvcHRzLm5hbWUgfHwgJycsIHt0eXBlOiBtaW1lVHlwZX0pXG4gIH1cblxuICByZXR1cm4gbmV3IEJsb2IoW25ldyBVaW50OEFycmF5KGFycmF5KV0sIHt0eXBlOiBtaW1lVHlwZX0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkYXRhVVJJdG9GaWxlIChkYXRhVVJJLCBvcHRzKSB7XG4gIHJldHVybiBkYXRhVVJJdG9CbG9iKGRhdGFVUkksIG9wdHMsIHRydWUpXG59XG5cbi8qKlxuICogQ29waWVzIHRleHQgdG8gY2xpcGJvYXJkIGJ5IGNyZWF0aW5nIGFuIGFsbW9zdCBpbnZpc2libGUgdGV4dGFyZWEsXG4gKiBhZGRpbmcgdGV4dCB0aGVyZSwgdGhlbiBydW5uaW5nIGV4ZWNDb21tYW5kKCdjb3B5JykuXG4gKiBGYWxscyBiYWNrIHRvIHByb21wdCgpIHdoZW4gdGhlIGVhc3kgd2F5IGZhaWxzIChoZWxsbywgU2FmYXJpISlcbiAqIEZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzA4MTAzMjJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dFRvQ29weVxuICogQHBhcmFtIHtTdHJpbmd9IGZhbGxiYWNrU3RyaW5nXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29weVRvQ2xpcGJvYXJkICh0ZXh0VG9Db3B5LCBmYWxsYmFja1N0cmluZykge1xuICBmYWxsYmFja1N0cmluZyA9IGZhbGxiYWNrU3RyaW5nIHx8ICdDb3B5IHRoZSBVUkwgYmVsb3cnXG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCB0ZXh0QXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJylcbiAgICB0ZXh0QXJlYS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywge1xuICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgd2lkdGg6ICcyZW0nLFxuICAgICAgaGVpZ2h0OiAnMmVtJyxcbiAgICAgIHBhZGRpbmc6IDAsXG4gICAgICBib3JkZXI6ICdub25lJyxcbiAgICAgIG91dGxpbmU6ICdub25lJyxcbiAgICAgIGJveFNoYWRvdzogJ25vbmUnLFxuICAgICAgYmFja2dyb3VuZDogJ3RyYW5zcGFyZW50J1xuICAgIH0pXG5cbiAgICB0ZXh0QXJlYS52YWx1ZSA9IHRleHRUb0NvcHlcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRleHRBcmVhKVxuICAgIHRleHRBcmVhLnNlbGVjdCgpXG5cbiAgICBjb25zdCBtYWdpY0NvcHlGYWlsZWQgPSAoZXJyKSA9PiB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRBcmVhKVxuICAgICAgd2luZG93LnByb21wdChmYWxsYmFja1N0cmluZywgdGV4dFRvQ29weSlcbiAgICAgIHJldHVybiByZWplY3QoJ09vcHMsIHVuYWJsZSB0byBjb3B5IGRpc3BsYXllZCBmYWxsYmFjayBwcm9tcHQ6ICcgKyBlcnIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpXG4gICAgICBpZiAoIXN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgcmV0dXJuIG1hZ2ljQ29weUZhaWxlZCgnY29weSBjb21tYW5kIHVuYXZhaWxhYmxlJylcbiAgICAgIH1cbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGV4dEFyZWEpXG4gICAgICByZXR1cm4gcmVzb2x2ZSgpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRBcmVhKVxuICAgICAgcmV0dXJuIG1hZ2ljQ29weUZhaWxlZChlcnIpXG4gICAgfVxuICB9KVxufVxuXG4vLyBleHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5saW5lV29ya2VyICh3b3JrZXJGdW5jdGlvbikge1xuLy8gICBsZXQgY29kZSA9IHdvcmtlckZ1bmN0aW9uLnRvU3RyaW5nKClcbi8vICAgY29kZSA9IGNvZGUuc3Vic3RyaW5nKGNvZGUuaW5kZXhPZigneycpICsgMSwgY29kZS5sYXN0SW5kZXhPZignfScpKVxuLy9cbi8vICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtjb2RlXSwge3R5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J30pXG4vLyAgIGNvbnN0IHdvcmtlciA9IG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSlcbi8vXG4vLyAgIHJldHVybiB3b3JrZXJcbi8vIH1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VXb3JrZXIgKHNjcmlwdCkge1xuICB2YXIgVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMXG4gIHZhciBCbG9iID0gd2luZG93LkJsb2JcbiAgdmFyIFdvcmtlciA9IHdpbmRvdy5Xb3JrZXJcblxuICBpZiAoIVVSTCB8fCAhQmxvYiB8fCAhV29ya2VyIHx8ICFzY3JpcHQpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgbGV0IGNvZGUgPSBzY3JpcHQudG9TdHJpbmcoKVxuICBjb2RlID0gY29kZS5zdWJzdHJpbmcoY29kZS5pbmRleE9mKCd7JykgKyAxLCBjb2RlLmxhc3RJbmRleE9mKCd9JykpXG5cbiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbY29kZV0pXG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpXG4gIHJldHVybiB3b3JrZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNwZWVkIChmaWxlUHJvZ3Jlc3MpIHtcbiAgaWYgKCFmaWxlUHJvZ3Jlc3MuYnl0ZXNVcGxvYWRlZCkgcmV0dXJuIDBcblxuICBjb25zdCB0aW1lRWxhcHNlZCA9IChuZXcgRGF0ZSgpKSAtIGZpbGVQcm9ncmVzcy51cGxvYWRTdGFydGVkXG4gIGNvbnN0IHVwbG9hZFNwZWVkID0gZmlsZVByb2dyZXNzLmJ5dGVzVXBsb2FkZWQgLyAodGltZUVsYXBzZWQgLyAxMDAwKVxuICByZXR1cm4gdXBsb2FkU3BlZWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVUQSAoZmlsZVByb2dyZXNzKSB7XG4gIGlmICghZmlsZVByb2dyZXNzLmJ5dGVzVXBsb2FkZWQpIHJldHVybiAwXG5cbiAgY29uc3QgdXBsb2FkU3BlZWQgPSBnZXRTcGVlZChmaWxlUHJvZ3Jlc3MpXG4gIGNvbnN0IGJ5dGVzUmVtYWluaW5nID0gZmlsZVByb2dyZXNzLmJ5dGVzVG90YWwgLSBmaWxlUHJvZ3Jlc3MuYnl0ZXNVcGxvYWRlZFxuICBjb25zdCBzZWNvbmRzUmVtYWluaW5nID0gTWF0aC5yb3VuZChieXRlc1JlbWFpbmluZyAvIHVwbG9hZFNwZWVkICogMTApIC8gMTBcblxuICByZXR1cm4gc2Vjb25kc1JlbWFpbmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJldHR5RVRBIChzZWNvbmRzKSB7XG4gIGNvbnN0IHRpbWUgPSBzZWNvbmRzVG9UaW1lKHNlY29uZHMpXG5cbiAgLy8gT25seSBkaXNwbGF5IGhvdXJzIGFuZCBtaW51dGVzIGlmIHRoZXkgYXJlIGdyZWF0ZXIgdGhhbiAwIGJ1dCBhbHdheXNcbiAgLy8gZGlzcGxheSBtaW51dGVzIGlmIGhvdXJzIGlzIGJlaW5nIGRpc3BsYXllZFxuICBjb25zdCBob3Vyc1N0ciA9IHRpbWUuaG91cnMgPyB0aW1lLmhvdXJzICsgJ2gnIDogJydcbiAgY29uc3QgbWludXRlc1N0ciA9ICh0aW1lLmhvdXJzIHx8IHRpbWUubWludXRlcykgPyB0aW1lLm1pbnV0ZXMgKyAnbScgOiAnJ1xuICBjb25zdCBzZWNvbmRzU3RyID0gdGltZS5zZWNvbmRzICsgJ3MnXG5cbiAgcmV0dXJuIGAke2hvdXJzU3RyfSAke21pbnV0ZXNTdHJ9ICR7c2Vjb25kc1N0cn1gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlQ2FjaGluZ0Z1bmN0aW9uICgpIHtcbiAgbGV0IGNhY2hlZEVsID0gbnVsbFxuICBsZXQgbGFzdFVwZGF0ZSA9IERhdGUubm93KClcblxuICByZXR1cm4gZnVuY3Rpb24gY2FjaGVFbGVtZW50IChlbCwgdGltZSkge1xuICAgIGlmIChEYXRlLm5vdygpIC0gbGFzdFVwZGF0ZSA8IHRpbWUpIHtcbiAgICAgIHJldHVybiBjYWNoZWRFbFxuICAgIH1cblxuICAgIGNhY2hlZEVsID0gZWxcbiAgICBsYXN0VXBkYXRlID0gRGF0ZS5ub3coKVxuXG4gICAgcmV0dXJuIGVsXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBnZW5lcmF0ZUZpbGVJRCxcbiAgdG9BcnJheSxcbiAgZXZlcnksXG4gIGZsYXR0ZW4sXG4gIGdyb3VwQnksXG4gICQsXG4gICQkLFxuICBleHRlbmQsXG4gIHJlYWRGaWxlLFxuICBjcmVhdGVJbWFnZVRodW1ibmFpbCxcbiAgZ2V0UHJvcG9ydGlvbmFsSW1hZ2VIZWlnaHQsXG4gIGlzVG91Y2hEZXZpY2UsXG4gIGdldEZpbGVOYW1lQW5kRXh0ZW5zaW9uLFxuICB0cnVuY2F0ZVN0cmluZyxcbiAgZ2V0RmlsZVR5cGUsXG4gIHNlY29uZHNUb1RpbWUsXG4gIGRhdGFVUkl0b0Jsb2IsXG4gIGRhdGFVUkl0b0ZpbGUsXG4gIGdldFNwZWVkLFxuICBnZXRFVEEsXG4gIG1ha2VXb3JrZXIsXG4gIG1ha2VDYWNoaW5nRnVuY3Rpb25cbn1cbiIsImltcG9ydCB5byBmcm9tICd5by15bydcbmV4cG9ydCBkZWZhdWx0IHlvXG4iLCJjb25zdCBlbl9VUyA9IHt9XG5cbmVuX1VTLnN0cmluZ3MgPSB7XG4gIGNob29zZUZpbGU6ICdDaG9vc2UgYSBmaWxlJyxcbiAgeW91SGF2ZUNob3NlbjogJ1lvdSBoYXZlIGNob3NlbjogJXtmaWxlTmFtZX0nLFxuICBvckRyYWdEcm9wOiAnb3IgZHJhZyBpdCBoZXJlJyxcbiAgZmlsZXNDaG9zZW46IHtcbiAgICAwOiAnJXtzbWFydF9jb3VudH0gZmlsZSBzZWxlY3RlZCcsXG4gICAgMTogJyV7c21hcnRfY291bnR9IGZpbGVzIHNlbGVjdGVkJ1xuICB9LFxuICBmaWxlc1VwbG9hZGVkOiB7XG4gICAgMDogJyV7c21hcnRfY291bnR9IGZpbGUgdXBsb2FkZWQnLFxuICAgIDE6ICcle3NtYXJ0X2NvdW50fSBmaWxlcyB1cGxvYWRlZCdcbiAgfSxcbiAgZmlsZXM6IHtcbiAgICAwOiAnJXtzbWFydF9jb3VudH0gZmlsZScsXG4gICAgMTogJyV7c21hcnRfY291bnR9IGZpbGVzJ1xuICB9LFxuICB1cGxvYWRGaWxlczoge1xuICAgIDA6ICdVcGxvYWQgJXtzbWFydF9jb3VudH0gZmlsZScsXG4gICAgMTogJ1VwbG9hZCAle3NtYXJ0X2NvdW50fSBmaWxlcydcbiAgfSxcbiAgc2VsZWN0VG9VcGxvYWQ6ICdTZWxlY3QgZmlsZXMgdG8gdXBsb2FkJyxcbiAgY2xvc2VNb2RhbDogJ0Nsb3NlIE1vZGFsJyxcbiAgdXBsb2FkOiAnVXBsb2FkJyxcbiAgaW1wb3J0RnJvbTogJ0ltcG9ydCBmaWxlcyBmcm9tJyxcbiAgZGFzaGJvYXJkV2luZG93VGl0bGU6ICdVcHB5IERhc2hib2FyZCBXaW5kb3cgKFByZXNzIGVzY2FwZSB0byBjbG9zZSknLFxuICBkYXNoYm9hcmRUaXRsZTogJ1VwcHkgRGFzaGJvYXJkJyxcbiAgY29weUxpbmtUb0NsaXBib2FyZFN1Y2Nlc3M6ICdMaW5rIGNvcGllZCB0byBjbGlwYm9hcmQuJyxcbiAgY29weUxpbmtUb0NsaXBib2FyZEZhbGxiYWNrOiAnQ29weSB0aGUgVVJMIGJlbG93JyxcbiAgZG9uZTogJ0RvbmUnLFxuICBsb2NhbERpc2s6ICdMb2NhbCBEaXNrJyxcbiAgZHJvcFBhc3RlSW1wb3J0OiAnRHJvcCBmaWxlcyBoZXJlLCBwYXN0ZSBvciBpbXBvcnQgZnJvbSBvbmUgb2YgdGhlIGxvY2F0aW9ucyBhYm92ZScsXG4gIGZpbGVQcm9ncmVzczogJ0ZpbGUgcHJvZ3Jlc3M6IHVwbG9hZCBzcGVlZCBhbmQgRVRBJyxcbiAgbnVtYmVyT2ZTZWxlY3RlZEZpbGVzOiAnTnVtYmVyIG9mIHNlbGVjdGVkIGZpbGVzJyxcbiAgdXBsb2FkQWxsTmV3RmlsZXM6ICdVcGxvYWQgYWxsIG5ldyBmaWxlcydcbn1cblxuZW5fVVMucGx1cmFsaXplID0gZnVuY3Rpb24gKG4pIHtcbiAgaWYgKG4gPT09IDEpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIHJldHVybiAxXG59XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LlVwcHkgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5VcHB5LmxvY2FsZXMuZW5fVVMgPSBlbl9VU1xufVxuXG5leHBvcnQgZGVmYXVsdCBlbl9VU1xuIiwiaW1wb3J0IGh0bWwgZnJvbSAnLi4vLi4vY29yZS9odG1sJ1xuXG5leHBvcnQgZGVmYXVsdCAocHJvcHMpID0+IHtcbiAgY29uc3QgZGVtb0xpbmsgPSBwcm9wcy5kZW1vID8gaHRtbGA8YSBvbmNsaWNrPSR7cHJvcHMuaGFuZGxlRGVtb0F1dGh9PlByb2NlZWQgd2l0aCBEZW1vIEFjY291bnQ8L2E+YCA6IG51bGxcbiAgcmV0dXJuIGh0bWxgXG4gICAgPGRpdiBjbGFzcz1cIlVwcHlHb29nbGVEcml2ZS1hdXRoZW50aWNhdGVcIj5cbiAgICAgIDxoMT5Zb3UgbmVlZCB0byBhdXRoZW50aWNhdGUgd2l0aCBHb29nbGUgYmVmb3JlIHNlbGVjdGluZyBmaWxlcy48L2gxPlxuICAgICAgPGEgaHJlZj0ke3Byb3BzLmxpbmt9PkF1dGhlbnRpY2F0ZTwvYT5cbiAgICAgICR7ZGVtb0xpbmt9XG4gICAgPC9kaXY+XG4gIGBcbn1cbiIsImltcG9ydCBodG1sIGZyb20gJy4uLy4uL2NvcmUvaHRtbCdcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gIHJldHVybiBodG1sYFxuICAgIDxkaXY+XG4gICAgICA8c3Bhbj5cbiAgICAgICAgU29tZXRoaW5nIHdlbnQgd3JvbmcuICBQcm9iYWJseSBvdXIgZmF1bHQuICR7cHJvcHMuZXJyb3J9XG4gICAgICA8L3NwYW4+XG4gICAgPC9kaXY+XG4gIGBcbn1cbiIsImltcG9ydCBVdGlscyBmcm9tICcuLi8uLi9jb3JlL1V0aWxzJ1xuaW1wb3J0IFBsdWdpbiBmcm9tICcuLi9QbHVnaW4nXG5pbXBvcnQgJ3doYXR3Zy1mZXRjaCdcbmltcG9ydCBodG1sIGZyb20gJy4uLy4uL2NvcmUvaHRtbCdcblxuaW1wb3J0IFByb3ZpZGVyIGZyb20gJy4uLy4uL3VwcHktYmFzZS9zcmMvcGx1Z2lucy9Qcm92aWRlcidcblxuaW1wb3J0IEF1dGhWaWV3IGZyb20gJy4vQXV0aFZpZXcnXG5pbXBvcnQgQnJvd3NlciBmcm9tICcuL25ldy9Ccm93c2VyJ1xuaW1wb3J0IEVycm9yVmlldyBmcm9tICcuL0Vycm9yJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHb29nbGUgZXh0ZW5kcyBQbHVnaW4ge1xuICBjb25zdHJ1Y3RvciAoY29yZSwgb3B0cykge1xuICAgIHN1cGVyKGNvcmUsIG9wdHMpXG4gICAgdGhpcy50eXBlID0gJ2FjcXVpcmVyJ1xuICAgIHRoaXMuaWQgPSAnR29vZ2xlRHJpdmUnXG4gICAgdGhpcy50aXRsZSA9ICdHb29nbGUgRHJpdmUnXG4gICAgdGhpcy5pY29uID0gaHRtbGBcbiAgICAgIDxzdmcgY2xhc3M9XCJVcHB5SWNvbiBVcHB5TW9kYWxUYWItaWNvblwiIHdpZHRoPVwiMjhcIiBoZWlnaHQ9XCIyOFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIj5cbiAgICAgICAgPHBhdGggZD1cIk0yLjk1NSAxNC45M2wyLjY2Ny00LjYySDE2bC0yLjY2NyA0LjYySDIuOTU1em0yLjM3OC00LjYybC0yLjY2NiA0LjYyTDAgMTAuMzFsNS4xOS04Ljk5IDIuNjY2IDQuNjItMi41MjMgNC4zN3ptMTAuNTIzLS4yNWgtNS4zMzNsLTUuMTktOC45OWg1LjMzNGw1LjE5IDguOTl6XCIvPlxuICAgICAgPC9zdmc+XG4gICAgYFxuXG4gICAgdGhpcy5Hb29nbGVEcml2ZSA9IG5ldyBQcm92aWRlcih7XG4gICAgICBob3N0OiB0aGlzLm9wdHMuaG9zdCxcbiAgICAgIHByb3ZpZGVyOiAnZHJpdmUnXG4gICAgfSlcblxuICAgIHRoaXMuZmlsZXMgPSBbXVxuXG4gICAgLy8gdGhpcy5jb3JlLnNvY2tldC5vbignJylcbiAgICAvLyBMb2dpY1xuICAgIHRoaXMuYWRkRmlsZSA9IHRoaXMuYWRkRmlsZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5maWx0ZXJJdGVtcyA9IHRoaXMuZmlsdGVySXRlbXMuYmluZCh0aGlzKVxuICAgIHRoaXMuZmlsdGVyUXVlcnkgPSB0aGlzLmZpbHRlclF1ZXJ5LmJpbmQodGhpcylcbiAgICB0aGlzLmdldEZvbGRlciA9IHRoaXMuZ2V0Rm9sZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLmdldE5leHRGb2xkZXIgPSB0aGlzLmdldE5leHRGb2xkZXIuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlUm93Q2xpY2sgPSB0aGlzLmhhbmRsZVJvd0NsaWNrLmJpbmQodGhpcylcbiAgICB0aGlzLmxvZ291dCA9IHRoaXMubG9nb3V0LmJpbmQodGhpcylcbiAgICB0aGlzLmhhbmRsZURlbW9BdXRoID0gdGhpcy5oYW5kbGVEZW1vQXV0aC5iaW5kKHRoaXMpXG4gICAgdGhpcy5zb3J0QnlUaXRsZSA9IHRoaXMuc29ydEJ5VGl0bGUuYmluZCh0aGlzKVxuICAgIHRoaXMuc29ydEJ5RGF0ZSA9IHRoaXMuc29ydEJ5RGF0ZS5iaW5kKHRoaXMpXG5cbiAgICAvLyBWaXN1YWxcbiAgICB0aGlzLnJlbmRlciA9IHRoaXMucmVuZGVyLmJpbmQodGhpcylcblxuICAgIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHt9XG5cbiAgICAvLyBtZXJnZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgb25lcyBzZXQgYnkgdXNlclxuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRzKVxuICB9XG5cbiAgaW5zdGFsbCAoKSB7XG4gICAgLy8gU2V0IGRlZmF1bHQgc3RhdGUgZm9yIEdvb2dsZSBEcml2ZVxuICAgIHRoaXMuY29yZS5zZXRTdGF0ZSh7XG4gICAgICBnb29nbGVEcml2ZToge1xuICAgICAgICBhdXRoZW50aWNhdGVkOiBmYWxzZSxcbiAgICAgICAgZmlsZXM6IFtdLFxuICAgICAgICBmb2xkZXJzOiBbXSxcbiAgICAgICAgZGlyZWN0b3JpZXM6IFt7XG4gICAgICAgICAgdGl0bGU6ICdNeSBEcml2ZScsXG4gICAgICAgICAgaWQ6ICdyb290J1xuICAgICAgICB9XSxcbiAgICAgICAgYWN0aXZlUm93OiAtMSxcbiAgICAgICAgZmlsdGVySW5wdXQ6ICcnXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMub3B0cy50YXJnZXRcbiAgICBjb25zdCBwbHVnaW4gPSB0aGlzXG4gICAgdGhpcy50YXJnZXQgPSB0aGlzLm1vdW50KHRhcmdldCwgcGx1Z2luKVxuXG4gICAgdGhpcy5jaGVja0F1dGhlbnRpY2F0aW9uKClcbiAgICAgIC50aGVuKChhdXRoZW50aWNhdGVkKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUoe2F1dGhlbnRpY2F0ZWR9KVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdhcmUgd2UgYXV0aGVudGljYXRlZD8nKVxuICAgICAgICBjb25zb2xlLmxvZyhhdXRoZW50aWNhdGVkKVxuXG4gICAgICAgIGlmIChhdXRoZW50aWNhdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Rm9sZGVyKCdyb290JylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhdXRoZW50aWNhdGVkXG4gICAgICB9KVxuICAgICAgLnRoZW4oKG5ld1N0YXRlKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUobmV3U3RhdGUpXG4gICAgICB9KVxuXG4gICAgcmV0dXJuXG4gIH1cblxuICBmb2N1cyAoKSB7XG4gIH1cblxuICAvKipcbiAgICogTGl0dGxlIHNob3J0aGFuZCB0byB1cGRhdGUgdGhlIHN0YXRlIHdpdGggbXkgbmV3IHN0YXRlXG4gICAqL1xuICB1cGRhdGVTdGF0ZSAobmV3U3RhdGUpIHtcbiAgICBjb25zdCB7c3RhdGV9ID0gdGhpcy5jb3JlXG4gICAgY29uc3QgZ29vZ2xlRHJpdmUgPSBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5nb29nbGVEcml2ZSwgbmV3U3RhdGUpXG5cbiAgICB0aGlzLmNvcmUuc2V0U3RhdGUoe2dvb2dsZURyaXZlfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0byBzZWUgaWYgdGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICogQHJldHVybiB7UHJvbWlzZX0gYXV0aGVudGljYXRpb24gc3RhdHVzXG4gICAqL1xuICBjaGVja0F1dGhlbnRpY2F0aW9uICgpIHtcbiAgICByZXR1cm4gZmV0Y2goYCR7dGhpcy5vcHRzLmhvc3R9L2RyaXZlL2F1dGhgLCB7XG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgY29uc29sZS5sb2cocmVzLnN0YXR1cylcbiAgICAgIGlmIChyZXMuc3RhdHVzIDwgMjAwIHx8IHJlcy5zdGF0dXMgPiAzMDApIHtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh7XG4gICAgICAgICAgYXV0aGVudGljYXRlZDogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IHRydWVcbiAgICAgICAgfSlcbiAgICAgICAgbGV0IGVycm9yID0gbmV3IEVycm9yKHJlcy5zdGF0dXNUZXh0KVxuICAgICAgICBlcnJvci5yZXNwb25zZSA9IHJlc1xuICAgICAgICB0aHJvdyBlcnJvclxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgIH0pXG4gICAgLnRoZW4oKGRhdGEpID0+IGRhdGEuYXV0aGVudGljYXRlZClcbiAgICAuY2F0Y2goKGVycikgPT4gZXJyKVxuICB9XG5cbiAgLyoqXG4gICAqIEJhc2VkIG9uIGZvbGRlciBJRCwgZmV0Y2ggYSBuZXcgZm9sZGVyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gaWQgRm9sZGVyIGlkXG4gICAqIEByZXR1cm4ge1Byb21pc2V9ICAgRm9sZGVycy9maWxlcyBpbiBmb2xkZXJcbiAgICovXG4gIGdldEZvbGRlciAoaWQgPSAncm9vdCcpIHtcbiAgICByZXR1cm4gdGhpcy5Hb29nbGVEcml2ZS5saXN0KGlkKVxuICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAvLyBsZXQgcmVzdWx0ID0gVXRpbHMuZ3JvdXBCeShkYXRhLml0ZW1zLCAoaXRlbSkgPT4gaXRlbS5taW1lVHlwZSlcbiAgICAgICAgbGV0IGZvbGRlcnMgPSBbXVxuICAgICAgICBsZXQgZmlsZXMgPSBbXVxuICAgICAgICByZXMuaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgIGlmIChpdGVtLm1pbWVUeXBlID09PSAnYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLmZvbGRlcicpIHtcbiAgICAgICAgICAgIGZvbGRlcnMucHVzaChpdGVtKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlcy5wdXNoKGl0ZW0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGZvbGRlcnMsXG4gICAgICAgICAgZmlsZXNcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHJldHVybiBlcnJcbiAgICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBuZXcgZm9sZGVyIGFuZCBhZGRzIHRvIGJyZWFkY3J1bWIgbmF2XG4gICAqIEBwYXJhbSAge1N0cmluZ30gaWQgICAgRm9sZGVyIGlkXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdGl0bGUgRm9sZGVyIHRpdGxlXG4gICAqL1xuICBnZXROZXh0Rm9sZGVyIChpZCwgdGl0bGUpIHtcbiAgICB0aGlzLmdldEZvbGRlcihpZClcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb3JlLmdldFN0YXRlKCkuZ29vZ2xlRHJpdmVcblxuICAgICAgICBjb25zdCBpbmRleCA9IHN0YXRlLmRpcmVjdG9yaWVzLmZpbmRJbmRleCgoZGlyKSA9PiBpZCA9PT0gZGlyLmlkKVxuICAgICAgICBsZXQgdXBkYXRlZERpcmVjdG9yaWVzXG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIHVwZGF0ZWREaXJlY3RvcmllcyA9IHN0YXRlLmRpcmVjdG9yaWVzLnNsaWNlKDAsIGluZGV4ICsgMSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cGRhdGVkRGlyZWN0b3JpZXMgPSBzdGF0ZS5kaXJlY3Rvcmllcy5jb25jYXQoW3tcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgdGl0bGVcbiAgICAgICAgICB9XSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlU3RhdGUoVXRpbHMuZXh0ZW5kKGRhdGEsIHtcbiAgICAgICAgICBkaXJlY3RvcmllczogdXBkYXRlZERpcmVjdG9yaWVzXG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgfVxuXG4gIGFkZEZpbGUgKGZpbGUpIHtcbiAgICBjb25zdCB0YWdGaWxlID0ge1xuICAgICAgc291cmNlOiB0aGlzLmlkLFxuICAgICAgZGF0YTogZmlsZSxcbiAgICAgIG5hbWU6IGZpbGUudGl0bGUsXG4gICAgICB0eXBlOiBmaWxlLm1pbWVUeXBlLFxuICAgICAgaXNSZW1vdGU6IHRydWUsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGZpbGVJZDogZmlsZS5pZFxuICAgICAgfSxcbiAgICAgIHJlbW90ZToge1xuICAgICAgICBob3N0OiB0aGlzLm9wdHMuaG9zdCxcbiAgICAgICAgdXJsOiBgJHt0aGlzLm9wdHMuaG9zdH0vZHJpdmUvZ2V0LyR7ZmlsZS5pZH1gLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgZmlsZUlkOiBmaWxlLmlkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5sb2coJ2FkZGluZyBmaWxlJylcbiAgICB0aGlzLmNvcmUuZW1pdHRlci5lbWl0KCdjb3JlOmZpbGUtYWRkJywgdGFnRmlsZSlcbiAgfVxuXG4gIGhhbmRsZUVycm9yIChyZXNwb25zZSkge1xuICAgIHRoaXMuY2hlY2tBdXRoZW50aWNhdGlvbigpXG4gICAgICAudGhlbigoYXV0aGVudGljYXRlZCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKHthdXRoZW50aWNhdGVkfSlcbiAgICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBzZXNzaW9uIHRva2VuIG9uIGNsaWVudCBzaWRlLlxuICAgKi9cbiAgbG9nb3V0ICgpIHtcbiAgICB0aGlzLkdvb2dsZURyaXZlLmxvZ291dChsb2NhdGlvbi5ocmVmKVxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdvaycpXG4gICAgICAgICAgY29uc3QgbmV3U3RhdGUgPSB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGZpbGVzOiBbXSxcbiAgICAgICAgICAgIGZvbGRlcnM6IFtdLFxuICAgICAgICAgICAgZGlyZWN0b3JpZXM6IFt7XG4gICAgICAgICAgICAgIHRpdGxlOiAnTXkgRHJpdmUnLFxuICAgICAgICAgICAgICBpZDogJ3Jvb3QnXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMudXBkYXRlU3RhdGUobmV3U3RhdGUpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gIH1cblxuICBnZXRGaWxlVHlwZSAoZmlsZSkge1xuICAgIGNvbnN0IGZpbGVUeXBlcyA9IHtcbiAgICAgICdhcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWFwcHMuZm9sZGVyJzogJ0ZvbGRlcicsXG4gICAgICAnYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLmRvY3VtZW50JzogJ0dvb2dsZSBEb2NzJyxcbiAgICAgICdhcHBsaWNhdGlvbi92bmQuZ29vZ2xlLWFwcHMuc3ByZWFkc2hlZXQnOiAnR29vZ2xlIFNoZWV0cycsXG4gICAgICAnYXBwbGljYXRpb24vdm5kLmdvb2dsZS1hcHBzLnByZXNlbnRhdGlvbic6ICdHb29nbGUgU2xpZGVzJyxcbiAgICAgICdpbWFnZS9qcGVnJzogJ0pQRUcgSW1hZ2UnLFxuICAgICAgJ2ltYWdlL3BuZyc6ICdQTkcgSW1hZ2UnXG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbGVUeXBlc1tmaWxlLm1pbWVUeXBlXSA/IGZpbGVUeXBlc1tmaWxlLm1pbWVUeXBlXSA6IGZpbGUuZmlsZUV4dGVuc2lvbi50b1VwcGVyQ2FzZSgpXG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBzZXQgYWN0aXZlIGZpbGUvZm9sZGVyLlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IGZpbGUgICBBY3RpdmUgZmlsZS9mb2xkZXJcbiAgICovXG4gIGhhbmRsZVJvd0NsaWNrIChmaWxlSWQpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuY29yZS5nZXRTdGF0ZSgpLmdvb2dsZURyaXZlXG4gICAgY29uc3QgbmV3U3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSwge1xuICAgICAgYWN0aXZlUm93OiBmaWxlSWRcbiAgICB9KVxuXG4gICAgdGhpcy51cGRhdGVTdGF0ZShuZXdTdGF0ZSlcbiAgfVxuXG4gIGZpbHRlclF1ZXJ5IChlKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLmNvcmUuZ2V0U3RhdGUoKS5nb29nbGVEcml2ZVxuICAgIHRoaXMudXBkYXRlU3RhdGUoT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUsIHtcbiAgICAgIGZpbHRlcklucHV0OiBlLnRhcmdldC52YWx1ZVxuICAgIH0pKVxuICB9XG5cbiAgZmlsdGVySXRlbXMgKGl0ZW1zKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLmNvcmUuZ2V0U3RhdGUoKS5nb29nbGVEcml2ZVxuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoKGZvbGRlcikgPT4ge1xuICAgICAgcmV0dXJuIGZvbGRlci50aXRsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc3RhdGUuZmlsdGVySW5wdXQudG9Mb3dlckNhc2UoKSkgIT09IC0xXG4gICAgfSlcbiAgfVxuXG4gIHNvcnRCeVRpdGxlICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29yZS5nZXRTdGF0ZSgpLmdvb2dsZURyaXZlKVxuICAgIGNvbnN0IHtmaWxlcywgZm9sZGVycywgc29ydGluZ30gPSBzdGF0ZVxuXG4gICAgbGV0IHNvcnRlZEZpbGVzID0gZmlsZXMuc29ydCgoZmlsZUEsIGZpbGVCKSA9PiB7XG4gICAgICBpZiAoc29ydGluZyA9PT0gJ3RpdGxlRGVzY2VuZGluZycpIHtcbiAgICAgICAgcmV0dXJuIGZpbGVCLnRpdGxlLmxvY2FsZUNvbXBhcmUoZmlsZUEudGl0bGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsZUEudGl0bGUubG9jYWxlQ29tcGFyZShmaWxlQi50aXRsZSlcbiAgICB9KVxuXG4gICAgbGV0IHNvcnRlZEZvbGRlcnMgPSBmb2xkZXJzLnNvcnQoKGZvbGRlckEsIGZvbGRlckIpID0+IHtcbiAgICAgIGlmIChzb3J0aW5nID09PSAndGl0bGVEZXNjZW5kaW5nJykge1xuICAgICAgICByZXR1cm4gZm9sZGVyQi50aXRsZS5sb2NhbGVDb21wYXJlKGZvbGRlckEudGl0bGUpXG4gICAgICB9XG4gICAgICByZXR1cm4gZm9sZGVyQS50aXRsZS5sb2NhbGVDb21wYXJlKGZvbGRlckIudGl0bGUpXG4gICAgfSlcblxuICAgIHRoaXMudXBkYXRlU3RhdGUoT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUsIHtcbiAgICAgIGZpbGVzOiBzb3J0ZWRGaWxlcyxcbiAgICAgIGZvbGRlcnM6IHNvcnRlZEZvbGRlcnMsXG4gICAgICBzb3J0aW5nOiAoc29ydGluZyA9PT0gJ3RpdGxlRGVzY2VuZGluZycpID8gJ3RpdGxlQXNjZW5kaW5nJyA6ICd0aXRsZURlc2NlbmRpbmcnXG4gICAgfSkpXG4gIH1cblxuICBzb3J0QnlEYXRlICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29yZS5nZXRTdGF0ZSgpLmdvb2dsZURyaXZlKVxuICAgIGNvbnN0IHtmaWxlcywgZm9sZGVycywgc29ydGluZ30gPSBzdGF0ZVxuXG4gICAgbGV0IHNvcnRlZEZpbGVzID0gZmlsZXMuc29ydCgoZmlsZUEsIGZpbGVCKSA9PiB7XG4gICAgICBsZXQgYSA9IG5ldyBEYXRlKGZpbGVBLm1vZGlmaWVkQnlNZURhdGUpXG4gICAgICBsZXQgYiA9IG5ldyBEYXRlKGZpbGVCLm1vZGlmaWVkQnlNZURhdGUpXG5cbiAgICAgIGlmIChzb3J0aW5nID09PSAnZGF0ZURlc2NlbmRpbmcnKSB7XG4gICAgICAgIHJldHVybiBhID4gYiA/IC0xIDogYSA8IGIgPyAxIDogMFxuICAgICAgfVxuICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwXG4gICAgfSlcblxuICAgIGxldCBzb3J0ZWRGb2xkZXJzID0gZm9sZGVycy5zb3J0KChmb2xkZXJBLCBmb2xkZXJCKSA9PiB7XG4gICAgICBsZXQgYSA9IG5ldyBEYXRlKGZvbGRlckEubW9kaWZpZWRCeU1lRGF0ZSlcbiAgICAgIGxldCBiID0gbmV3IERhdGUoZm9sZGVyQi5tb2RpZmllZEJ5TWVEYXRlKVxuXG4gICAgICBpZiAoc29ydGluZyA9PT0gJ2RhdGVEZXNjZW5kaW5nJykge1xuICAgICAgICByZXR1cm4gYSA+IGIgPyAtMSA6IGEgPCBiID8gMSA6IDBcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IGEgPCBiID8gLTEgOiAwXG4gICAgfSlcblxuICAgIHRoaXMudXBkYXRlU3RhdGUoT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUsIHtcbiAgICAgIGZpbGVzOiBzb3J0ZWRGaWxlcyxcbiAgICAgIGZvbGRlcnM6IHNvcnRlZEZvbGRlcnMsXG4gICAgICBzb3J0aW5nOiAoc29ydGluZyA9PT0gJ2RhdGVEZXNjZW5kaW5nJykgPyAnZGF0ZUFzY2VuZGluZycgOiAnZGF0ZURlc2NlbmRpbmcnXG4gICAgfSkpXG4gIH1cblxuICBoYW5kbGVEZW1vQXV0aCAoKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLmNvcmUuZ2V0U3RhdGUoKS5nb29nbGVEcml2ZVxuICAgIHRoaXMudXBkYXRlU3RhdGUoe30sIHN0YXRlLCB7XG4gICAgICBhdXRoZW50aWNhdGVkOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoc3RhdGUpIHtcbiAgICBjb25zdCB7IGF1dGhlbnRpY2F0ZWQsIGVycm9yIH0gPSBzdGF0ZS5nb29nbGVEcml2ZVxuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXR1cm4gRXJyb3JWaWV3KHsgZXJyb3I6IGVycm9yIH0pXG4gICAgfVxuXG4gICAgaWYgKCFhdXRoZW50aWNhdGVkKSB7XG4gICAgICBjb25zdCBhdXRoU3RhdGUgPSBidG9hKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcmVkaXJlY3Q6IGxvY2F0aW9uLmhyZWYuc3BsaXQoJyMnKVswXVxuICAgICAgfSkpXG5cbiAgICAgIGNvbnN0IGxpbmsgPSBgJHt0aGlzLm9wdHMuaG9zdH0vY29ubmVjdC9nb29nbGU/c3RhdGU9JHthdXRoU3RhdGV9YFxuXG4gICAgICByZXR1cm4gQXV0aFZpZXcoe1xuICAgICAgICBsaW5rOiBsaW5rLFxuICAgICAgICBkZW1vOiB0aGlzLm9wdHMuZGVtbyxcbiAgICAgICAgaGFuZGxlRGVtb0F1dGg6IHRoaXMuaGFuZGxlRGVtb0F1dGhcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgYnJvd3NlclByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuZ29vZ2xlRHJpdmUsIHtcbiAgICAgIGdldE5leHRGb2xkZXI6IHRoaXMuZ2V0TmV4dEZvbGRlcixcbiAgICAgIGdldEZvbGRlcjogdGhpcy5nZXRGb2xkZXIsXG4gICAgICBhZGRGaWxlOiB0aGlzLmFkZEZpbGUsXG4gICAgICBmaWx0ZXJJdGVtczogdGhpcy5maWx0ZXJJdGVtcyxcbiAgICAgIGZpbHRlclF1ZXJ5OiB0aGlzLmZpbHRlclF1ZXJ5LFxuICAgICAgaGFuZGxlUm93Q2xpY2s6IHRoaXMuaGFuZGxlUm93Q2xpY2ssXG4gICAgICBzb3J0QnlUaXRsZTogdGhpcy5zb3J0QnlUaXRsZSxcbiAgICAgIHNvcnRCeURhdGU6IHRoaXMuc29ydEJ5RGF0ZSxcbiAgICAgIGxvZ291dDogdGhpcy5sb2dvdXQsXG4gICAgICBkZW1vOiB0aGlzLm9wdHMuZGVtb1xuICAgIH0pXG5cbiAgICByZXR1cm4gQnJvd3Nlcihicm93c2VyUHJvcHMpXG4gIH1cbn1cbiIsImltcG9ydCBodG1sIGZyb20gJy4uLy4uLy4uL2NvcmUvaHRtbCdcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gIHJldHVybiBodG1sYFxuICAgIDxsaT5cbiAgICAgIDxidXR0b24gb25jbGljaz0ke3Byb3BzLmdldE5leHRGb2xkZXJ9PiR7cHJvcHMudGl0bGV9PC9idXR0b24+XG4gICAgPC9saT5cbiAgYFxufVxuIiwiaW1wb3J0IGh0bWwgZnJvbSAnLi4vLi4vLi4vY29yZS9odG1sJ1xuaW1wb3J0IEJyZWFkY3J1bWIgZnJvbSAnLi9CcmVhZGNydW1iJ1xuXG5leHBvcnQgZGVmYXVsdCAocHJvcHMpID0+IHtcbiAgcmV0dXJuIGh0bWxgXG4gICAgPHVsIGNsYXNzPVwiVXBweUdvb2dsZURyaXZlLWJyZWFkY3J1bWJzXCI+XG4gICAgICAke1xuICAgICAgICBwcm9wcy5kaXJlY3Rvcmllcy5tYXAoKGRpcmVjdG9yeSkgPT4ge1xuICAgICAgICAgIHJldHVybiBCcmVhZGNydW1iKHtcbiAgICAgICAgICAgIGdldE5leHRGb2xkZXI6ICgpID0+IHByb3BzLmdldE5leHRGb2xkZXIoZGlyZWN0b3J5LmlkLCBkaXJlY3RvcnkudGl0bGUpLFxuICAgICAgICAgICAgdGl0bGU6IGRpcmVjdG9yeS50aXRsZVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgPC91bD5cbiAgYFxufVxuIiwiaW1wb3J0IGh0bWwgZnJvbSAnLi4vLi4vLi4vY29yZS9odG1sJ1xuaW1wb3J0IEJyZWFkY3J1bWJzIGZyb20gJy4vQnJlYWRjcnVtYnMnXG5pbXBvcnQgVGFibGUgZnJvbSAnLi9UYWJsZSdcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gIGxldCBmaWx0ZXJlZEZvbGRlcnMgPSBwcm9wcy5mb2xkZXJzXG4gIGxldCBmaWx0ZXJlZEZpbGVzID0gcHJvcHMuZmlsZXNcblxuICBpZiAocHJvcHMuZmlsdGVySW5wdXQgIT09ICcnKSB7XG4gICAgZmlsdGVyZWRGb2xkZXJzID0gcHJvcHMuZmlsdGVySXRlbXMocHJvcHMuZm9sZGVycylcbiAgICBmaWx0ZXJlZEZpbGVzID0gcHJvcHMuZmlsdGVySXRlbXMocHJvcHMuZmlsZXMpXG4gIH1cblxuICByZXR1cm4gaHRtbGBcbiAgICA8ZGl2IGNsYXNzPVwiQnJvd3NlclwiPlxuICAgICAgPGhlYWRlcj5cbiAgICAgICAgPGlucHV0XG4gICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgIGNsYXNzPVwiQnJvd3Nlci1zZWFyY2hcIlxuICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIERyaXZlXCJcbiAgICAgICAgICBvbmtleXVwPSR7cHJvcHMuZmlsdGVyUXVlcnl9XG4gICAgICAgICAgdmFsdWU9JHtwcm9wcy5maWx0ZXJJbnB1dH0vPlxuICAgICAgPC9oZWFkZXI+XG4gICAgICA8ZGl2IGNsYXNzPVwiQnJvd3Nlci1zdWJIZWFkZXJcIj5cbiAgICAgICAgJHtCcmVhZGNydW1icyh7XG4gICAgICAgICAgZ2V0TmV4dEZvbGRlcjogcHJvcHMuZ2V0TmV4dEZvbGRlcixcbiAgICAgICAgICBkaXJlY3RvcmllczogcHJvcHMuZGlyZWN0b3JpZXNcbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJCcm93c2VyLWJvZHlcIj5cbiAgICAgICAgPG1haW4gY2xhc3M9XCJCcm93c2VyLWNvbnRlbnRcIj5cbiAgICAgICAgICAke1RhYmxlKHtcbiAgICAgICAgICAgIGNvbHVtbnM6IFt7XG4gICAgICAgICAgICAgIG5hbWU6ICdOYW1lJyxcbiAgICAgICAgICAgICAga2V5OiAndGl0bGUnXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIGZvbGRlcnM6IGZpbHRlcmVkRm9sZGVycyxcbiAgICAgICAgICAgIGZpbGVzOiBmaWx0ZXJlZEZpbGVzLFxuICAgICAgICAgICAgYWN0aXZlUm93OiBwcm9wcy5hY3RpdmVSb3csXG4gICAgICAgICAgICBzb3J0QnlUaXRsZTogcHJvcHMuc29ydEJ5VGl0bGUsXG4gICAgICAgICAgICBzb3J0QnlEYXRlOiBwcm9wcy5zb3J0QnlEYXRlLFxuICAgICAgICAgICAgaGFuZGxlUm93Q2xpY2s6IHByb3BzLmhhbmRsZVJvd0NsaWNrLFxuICAgICAgICAgICAgaGFuZGxlRmlsZURvdWJsZUNsaWNrOiBwcm9wcy5hZGRGaWxlLFxuICAgICAgICAgICAgaGFuZGxlRm9sZGVyRG91YmxlQ2xpY2s6IHByb3BzLmdldE5leHRGb2xkZXJcbiAgICAgICAgICB9KX1cbiAgICAgICAgPC9tYWluPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIGBcbn1cbiIsImltcG9ydCBodG1sIGZyb20gJy4uLy4uLy4uL2NvcmUvaHRtbCdcbmltcG9ydCBSb3cgZnJvbSAnLi9UYWJsZVJvdydcblxuZXhwb3J0IGRlZmF1bHQgKHByb3BzKSA9PiB7XG4gIGNvbnN0IGhlYWRlcnMgPSBwcm9wcy5jb2x1bW5zLm1hcCgoY29sdW1uKSA9PiB7XG4gICAgcmV0dXJuIGh0bWxgXG4gICAgICA8dGggY2xhc3M9XCJCcm93c2VyVGFibGUtaGVhZGVyQ29sdW1uIEJyb3dzZXJUYWJsZS1jb2x1bW5cIiBvbmNsaWNrPSR7cHJvcHMuc29ydEJ5VGl0bGV9PlxuICAgICAgICAke2NvbHVtbi5uYW1lfVxuICAgICAgPC90aD5cbiAgICBgXG4gIH0pXG5cbiAgcmV0dXJuIGh0bWxgXG4gICAgPHRhYmxlIGNsYXNzPVwiQnJvd3NlclRhYmxlXCI+XG4gICAgICA8dGhlYWQgY2xhc3M9XCJCcm93c2VyVGFibGUtaGVhZGVyXCI+XG4gICAgICAgIDx0cj5cbiAgICAgICAgICAke2hlYWRlcnN9XG4gICAgICAgIDwvdHI+XG4gICAgICA8L3RoZWFkPlxuICAgICAgPHRib2R5PlxuICAgICAgICAke3Byb3BzLmZvbGRlcnMubWFwKChmb2xkZXIpID0+IHtcbiAgICAgICAgICByZXR1cm4gUm93KHtcbiAgICAgICAgICAgIHRpdGxlOiBmb2xkZXIudGl0bGUsXG4gICAgICAgICAgICBhY3RpdmU6IHByb3BzLmFjdGl2ZVJvdyA9PT0gZm9sZGVyLmlkLFxuICAgICAgICAgICAgaWNvbkxpbms6IGZvbGRlci5pY29uTGluayxcbiAgICAgICAgICAgIG1vZGlmaWVkQnlNZURhdGU6IGZvbGRlci5tb2RpZmllZEJ5TWVEYXRlLFxuICAgICAgICAgICAgaGFuZGxlQ2xpY2s6ICgpID0+IHByb3BzLmhhbmRsZVJvd0NsaWNrKGZvbGRlci5pZCksXG4gICAgICAgICAgICBoYW5kbGVEb3VibGVDbGljazogKCkgPT4gcHJvcHMuaGFuZGxlRm9sZGVyRG91YmxlQ2xpY2soZm9sZGVyLmlkLCBmb2xkZXIudGl0bGUpLFxuICAgICAgICAgICAgY29sdW1uczogcHJvcHMuY29sdW1uc1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pfVxuICAgICAgICAke3Byb3BzLmZpbGVzLm1hcCgoZmlsZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBSb3coe1xuICAgICAgICAgICAgdGl0bGU6IGZpbGUudGl0bGUsXG4gICAgICAgICAgICBhY3RpdmU6IHByb3BzLmFjdGl2ZVJvdyA9PT0gZmlsZS5pZCxcbiAgICAgICAgICAgIGljb25MaW5rOiBmaWxlLmljb25MaW5rLFxuICAgICAgICAgICAgbW9kaWZpZWRCeU1lRGF0ZTogZmlsZS5tb2RpZmllZEJ5TWVEYXRlLFxuICAgICAgICAgICAgaGFuZGxlQ2xpY2s6ICgpID0+IHByb3BzLmhhbmRsZVJvd0NsaWNrKGZpbGUuaWQpLFxuICAgICAgICAgICAgaGFuZGxlRG91YmxlQ2xpY2s6ICgpID0+IHByb3BzLmhhbmRsZUZpbGVEb3VibGVDbGljayhmaWxlKSxcbiAgICAgICAgICAgIGNvbHVtbnM6IHByb3BzLmNvbHVtbnMsXG4gICAgICAgICAgICBvd25lcjogJ0pvZSBNYW1hJ1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pfVxuICAgICAgPC90Ym9keT5cbiAgICA8L3RhYmxlPlxuICBgXG59XG4iLCJpbXBvcnQgaHRtbCBmcm9tICcuLi8uLi8uLi9jb3JlL2h0bWwnXG5cbmV4cG9ydCBkZWZhdWx0IChwcm9wcykgPT4ge1xuICByZXR1cm4gaHRtbGBcbiAgICA8dGQgY2xhc3M9XCJCcm93c2VyVGFibGUtcm93Q29sdW1uIEJyb3dzZXJUYWJsZS1jb2x1bW5cIj5cbiAgICAgIDxpbWcgc3JjPSR7cHJvcHMuaWNvbkxpbmt9Lz4gJHtwcm9wcy52YWx1ZX1cbiAgICA8L3RkPlxuICBgXG59XG4iLCJpbXBvcnQgaHRtbCBmcm9tICcuLi8uLi8uLi9jb3JlL2h0bWwnXG5pbXBvcnQgQ29sdW1uIGZyb20gJy4vVGFibGVDb2x1bW4nXG5cbmV4cG9ydCBkZWZhdWx0IChwcm9wcykgPT4ge1xuICBjb25zdCBjbGFzc2VzID0gcHJvcHMuYWN0aXZlID8gJ0Jyb3dzZXJUYWJsZS1yb3cgaXMtYWN0aXZlJyA6ICdCcm93c2VyVGFibGUtcm93J1xuICByZXR1cm4gaHRtbGBcbiAgICA8dHIgb25jbGljaz0ke3Byb3BzLmhhbmRsZUNsaWNrfSBvbmRibGNsaWNrPSR7cHJvcHMuaGFuZGxlRG91YmxlQ2xpY2t9IGNsYXNzPSR7Y2xhc3Nlc30+XG4gICAgICAke0NvbHVtbih7XG4gICAgICAgIGljb25MaW5rOiBwcm9wcy5pY29uTGluayxcbiAgICAgICAgdmFsdWU6IHByb3BzLnRpdGxlIHx8ICcnXG4gICAgICB9KX1cbiAgICA8L3RyPlxuICBgXG59XG4iLCJpbXBvcnQgeW8gZnJvbSAneW8teW8nXG5cbi8qKlxuICogQm9pbGVycGxhdGUgdGhhdCBhbGwgUGx1Z2lucyBzaGFyZSAtIGFuZCBzaG91bGQgbm90IGJlIHVzZWRcbiAqIGRpcmVjdGx5LiBJdCBhbHNvIHNob3dzIHdoaWNoIG1ldGhvZHMgZmluYWwgcGx1Z2lucyBzaG91bGQgaW1wbGVtZW50L292ZXJyaWRlLFxuICogdGhpcyBkZWNpZGluZyBvbiBzdHJ1Y3R1cmUuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG1haW4gVXBweSBjb3JlIG9iamVjdFxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCB3aXRoIHBsdWdpbiBvcHRpb25zXG4gKiBAcmV0dXJuIHthcnJheSB8IHN0cmluZ30gZmlsZXMgb3Igc3VjY2Vzcy9mYWlsIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGx1Z2luIHtcblxuICBjb25zdHJ1Y3RvciAoY29yZSwgb3B0cykge1xuICAgIHRoaXMuY29yZSA9IGNvcmVcbiAgICB0aGlzLm9wdHMgPSBvcHRzIHx8IHt9XG4gICAgdGhpcy50eXBlID0gJ25vbmUnXG5cbiAgICAvLyBjbGVhciBldmVyeXRoaW5nIGluc2lkZSB0aGUgdGFyZ2V0IHNlbGVjdG9yXG4gICAgdGhpcy5vcHRzLnJlcGxhY2VUYXJnZXRDb250ZW50ID09PSB0aGlzLm9wdHMucmVwbGFjZVRhcmdldENvbnRlbnQgfHwgdHJ1ZVxuXG4gICAgdGhpcy51cGRhdGUgPSB0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5tb3VudCA9IHRoaXMubW91bnQuYmluZCh0aGlzKVxuICAgIHRoaXMuZm9jdXMgPSB0aGlzLmZvY3VzLmJpbmQodGhpcylcbiAgICB0aGlzLmluc3RhbGwgPSB0aGlzLmluc3RhbGwuYmluZCh0aGlzKVxuICB9XG5cbiAgdXBkYXRlIChzdGF0ZSkge1xuICAgIGlmICh0eXBlb2YgdGhpcy5lbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IG5ld0VsID0gdGhpcy5yZW5kZXIoc3RhdGUpXG4gICAgeW8udXBkYXRlKHRoaXMuZWwsIG5ld0VsKVxuXG4gICAgLy8gb3B0aW1pemVzIHBlcmZvcm1hbmNlP1xuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgLy8gICBjb25zdCBuZXdFbCA9IHRoaXMucmVuZGVyKHN0YXRlKVxuICAgIC8vICAgeW8udXBkYXRlKHRoaXMuZWwsIG5ld0VsKVxuICAgIC8vIH0pXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgc3VwcGxpZWQgYHRhcmdldGAgaXMgYSBgc3RyaW5nYCBvciBhbiBgb2JqZWN0YC5cbiAgICogSWYgaXTigJlzIGFuIG9iamVjdCDigJQgdGFyZ2V0IGlzIGEgcGx1Z2luLCBhbmQgd2Ugc2VhcmNoIGBwbHVnaW5zYFxuICAgKiBmb3IgYSBwbHVnaW4gd2l0aCBzYW1lIG5hbWUgYW5kIHJldHVybiBpdHMgdGFyZ2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHRhcmdldFxuICAgKlxuICAgKi9cbiAgbW91bnQgKHRhcmdldCwgcGx1Z2luKSB7XG4gICAgY29uc3QgY2FsbGVyUGx1Z2luTmFtZSA9IHBsdWdpbi5pZFxuXG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmNvcmUubG9nKGBJbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX0gdG8gJHt0YXJnZXR9YClcblxuICAgICAgLy8gY2xlYXIgZXZlcnl0aGluZyBpbnNpZGUgdGhlIHRhcmdldCBjb250YWluZXJcbiAgICAgIGlmICh0aGlzLm9wdHMucmVwbGFjZVRhcmdldENvbnRlbnQpIHtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpLmlubmVySFRNTCA9ICcnXG4gICAgICB9XG5cbiAgICAgIHRoaXMuZWwgPSBwbHVnaW4ucmVuZGVyKHRoaXMuY29yZS5zdGF0ZSlcbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KS5hcHBlbmRDaGlsZCh0aGlzLmVsKVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IGlzIGluc3RhbnRpYXRpbmcgdGhlIHBsdWdpbiByZWFsbHkgdGhlIHdheSB0byByb2xsXG4gICAgICAvLyBqdXN0IHRvIGdldCB0aGUgcGx1Z2luIG5hbWU/XG4gICAgICBjb25zdCBUYXJnZXQgPSB0YXJnZXRcbiAgICAgIGNvbnN0IHRhcmdldFBsdWdpbk5hbWUgPSBuZXcgVGFyZ2V0KCkuaWRcblxuICAgICAgdGhpcy5jb3JlLmxvZyhgSW5zdGFsbGluZyAke2NhbGxlclBsdWdpbk5hbWV9IHRvICR7dGFyZ2V0UGx1Z2luTmFtZX1gKVxuXG4gICAgICBjb25zdCB0YXJnZXRQbHVnaW4gPSB0aGlzLmNvcmUuZ2V0UGx1Z2luKHRhcmdldFBsdWdpbk5hbWUpXG4gICAgICBjb25zdCBzZWxlY3RvclRhcmdldCA9IHRhcmdldFBsdWdpbi5hZGRUYXJnZXQocGx1Z2luKVxuXG4gICAgICByZXR1cm4gc2VsZWN0b3JUYXJnZXRcbiAgICB9XG4gIH1cblxuICBmb2N1cyAoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpbnN0YWxsICgpIHtcbiAgICByZXR1cm5cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IF9nZXROYW1lID0gKGlkKSA9PiB7XG4gIHJldHVybiBpZC5zcGxpdCgnLScpLm1hcCgocykgPT4gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSkpLmpvaW4oJyAnKVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm92aWRlciB7XG4gIGNvbnN0cnVjdG9yIChvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gb3B0c1xuICAgIHRoaXMucHJvdmlkZXIgPSBvcHRzLnByb3ZpZGVyXG4gICAgdGhpcy5pZCA9IHRoaXMucHJvdmlkZXJcbiAgICB0aGlzLm5hbWUgPSB0aGlzLm9wdHMubmFtZSB8fCBfZ2V0TmFtZSh0aGlzLmlkKVxuICB9XG5cbiAgYXV0aCAoKSB7XG4gICAgcmV0dXJuIGZldGNoKGAke3RoaXMub3B0cy5ob3N0fS8ke3RoaXMucHJvdmlkZXJ9L2F1dGhvcml6ZWAsIHtcbiAgICAgIG1ldGhvZDogJ2dldCcsXG4gICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uLmpzb24nXG4gICAgICB9XG4gICAgfSlcbiAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICByZXR1cm4gcmVzLmpzb24oKVxuICAgICAgLnRoZW4oKHBheWxvYWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHBheWxvYWQuaXNBdXRoZW50aWNhdGVkXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBsaXN0IChkaXJlY3RvcnkgPSAncm9vdCcpIHtcbiAgICByZXR1cm4gZmV0Y2goYCR7dGhpcy5vcHRzLmhvc3R9LyR7dGhpcy5wcm92aWRlcn0vbGlzdC8ke2RpcmVjdG9yeX1gLCB7XG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgfVxuXG4gIGxvZ291dCAocmVkaXJlY3QgPSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgcmV0dXJuIGZldGNoKGAke3RoaXMub3B0cy5ob3N0fS8ke3RoaXMucHJvdmlkZXJ9L2xvZ291dD9yZWRpcmVjdD0ke3JlZGlyZWN0fWAsIHtcbiAgICAgIG1ldGhvZDogJ2dldCcsXG4gICAgICBjcmVkZW50aWFsczogJ2luY2x1ZGUnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuIiwiIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaW1wb3J0IFVwcHkgZnJvbSAnLi4vLi4vLi4vLi4vc3JjL2NvcmUvQ29yZS5qcydcbmltcG9ydCBHb29nbGVEcml2ZSBmcm9tICcuLi8uLi8uLi8uLi9zcmMvcGx1Z2lucy9Hb29nbGVEcml2ZSdcbmltcG9ydCB7IFVQUFlfU0VSVkVSIH0gZnJvbSAnLi4vZW52J1xuXG5jb25zdCB1cHB5ID0gbmV3IFVwcHkoe2RlYnVnOiB0cnVlLCBhdXRvUHJvY2VlZDogZmFsc2V9KVxudXBweVxuICAudXNlKEdvb2dsZURyaXZlLCB7IHRhcmdldDogJyNHb29nbGVEcml2ZUNvbnRhaW5lcicsIGhvc3Q6IFVQUFlfU0VSVkVSIH0pXG4gIC5ydW4oKVxuIiwibGV0IHVwcHlTZXJ2ZXJFbmRwb2ludCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMjAnXG5cbmlmIChsb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ3VwcHkuaW8nKSB7XG4gIHVwcHlTZXJ2ZXJFbmRwb2ludCA9ICcvL3NlcnZlci51cHB5LmlvJ1xufVxuXG4vLyB1cHB5U2VydmVyRW5kcG9pbnQgPSAnaHR0cDovL3NlcnZlci51cHB5LmlvOjMwMjAnXG5leHBvcnQgY29uc3QgVVBQWV9TRVJWRVIgPSB1cHB5U2VydmVyRW5kcG9pbnRcbiJdfQ==
