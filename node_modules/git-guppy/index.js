'use strict';

var getHook = require('./lib/get-hook');

module.exports = function (gulp) {
  return {
    stream: function (name, options) {
      var hook = getHook(name);

      if (!hook.stream) {
        throw new Error('Hook not streamable: ' + name);
      }

      return hook.stream(gulp, options);
    },
    src: function (name, fn) {
      var hook = getHook(name);

      if (fn && typeof fn === 'function') {
        if (hook.extra) {
          return fn.bind(fn, hook.src, hook.extra);
        } else {
          return fn.bind(fn, hook.src);
        }
      } else if (!hook.src) {
        throw new Error('Hook has no source files, use guppy.src() as a callback: ' + name);
      }

      return hook.src;
    }
  };
};
