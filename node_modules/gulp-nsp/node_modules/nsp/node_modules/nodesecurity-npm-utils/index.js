'use strict';

var RegClient = require('silent-npm-registry-client');
var os = require('os');
var semver = require('semver');

var options = {
  registry: 'https://registry.npmjs.org/',
  cache: os.tmpDir() + '/nodesecurity'
};

var client = new RegClient(options);


var getPackageJson = function (module, cb) {

  client.get(options.registry + module.name, {}, function (err, pkg) {

    var doc;
    var error;
    var version;

    if (err) {
      return cb(err);
    }

    if (pkg.time && pkg.time.unpublished) {
      error = new Error('404 - Unpublished module');
      error.code = 'E404';
      error.pkgid = module.name;

      return cb(error);
    }

    // try to get a version
    version = semver.maxSatisfying(Object.keys(pkg.versions), module.version);

    // check dist tags if none found
    if (!version) {
      version = pkg['dist-tags'] && pkg['dist-tags'].latest;
    }

    if (pkg.versions) {
      doc = pkg.versions[version];
    }

    if (!doc) {
      error = new Error('404 - Unknown module');
      error.code = 'E404';
      error.pkgid = module.name;

      return cb(error);
    }

    cb(null, doc);
  });
};

var getShrinkwrapDependencies = function (shrinkwrap, cb) {

  var results = {};

  var _parseModule = function (module, parents, name) {

    var moduleName = (name || module.name) + '@' + module.version;
    var children = Object.keys(module.dependencies || {}).concat(Object.keys(module.devDependencies || {}));

    if (results[moduleName]) {
      results[moduleName].parents = results[moduleName].parents.concat(parents);
    }
    else {
      results[moduleName] = {
        name: name || module.name,
        version: module.version,
        parents: parents,
        children: children,
        source: 'npm'
      };
    }

    for (var i = 0, il = children.length; i < il; ++i) {
      var child = children[i];
      _parseModule(module.dependencies[child], [moduleName], child);
    }
  };

  _parseModule(shrinkwrap, []);

  return cb(null, results);
};

module.exports = {
  getPackageJson: getPackageJson,
  getShrinkwrapDependencies: getShrinkwrapDependencies
};
