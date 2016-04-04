var SpammyRegClient = require('npm-registry-client');
var inherits = require('util').inherits;
var xtend = require('xtend');

module.exports = RegClient;

function noop () {}

var log = {
  error: noop, warn: noop, info: noop, verbose: noop,
  silly: noop, http: noop, pause: noop, resume: noop
};

function RegClient (opts) {
  if (!opts) opts = {};
  opts.log = xtend(log, opts.log || {});
  SpammyRegClient.call(this, opts);
}

inherits(RegClient, SpammyRegClient);
