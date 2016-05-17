'use strict';

var GulpUtil = require('gulp-util');
var Nsp = require('nsp');
var PLUGIN_NAME = require('./package.json').name;

var rsGulp = function (params, callback) {

  var payload = {};
  var formatter = Nsp.formatters.default;

  if (params.package) {
    payload.package = params.package;
  }

  if (params.shrinkwrap) {
    payload.shrinkwrap = params.shrinkwrap;
  }

  // Enable builds behind the HTTP_PROXY
  if (params.proxy) {
    payload.proxy = params.proxy;
  }

  if (params.output) {
    if (Nsp.formatters.hasOwnProperty(params.output)) {
      formatter = Nsp.formatters[params.output];
    }
    else {
      GulpUtil.log('Invalid formatter specified in options. Must be one of ' + Object.keys(Nsp.formatters).join(', ') + '\nUsing default formatter');
    }
  }

  Nsp.check(payload, function (err, data) {

    var output = formatter(err, data);
    var pluginErr = new GulpUtil.PluginError(PLUGIN_NAME, output);

    if (err) {
      if (params.stopOnError === false) {
        GulpUtil.log(output);
        return callback();
      }
      return callback(pluginErr);
    }

    if (params.stopOnError === false || data && data.length === 0) {
      GulpUtil.log(output);
      return callback();
    }

    if (data.length > 0) {
      return callback(pluginErr);
    }

  });

};

module.exports = rsGulp;
