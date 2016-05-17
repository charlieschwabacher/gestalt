'use strict';

var RegClient = require('silent-npm-registry-client');
var Os = require('os');
var Semver = require('semver');

var options = {
  registry: 'https://registry.npmjs.org/',
  cache: Os.tmpDir() + '/nodesecurity'
};

var client = new RegClient(options);


var getPackageJson = function (module, cb) {

  console.error('The getPackageJson method is deprecated');
  client.get(options.registry + module.name, {}, function (err, pkg) {

    if (err) {
      return cb(err);
    }

    if (pkg.time && pkg.time.unpublished) {
      var error = new Error('404 - Unpublished module');
      error.code = 'E404';
      error.pkgid = module.name;

      return cb(error);
    }

    // try to get a version
    var version = Semver.maxSatisfying(Object.keys(pkg.versions), module.version);

    // check dist tags if none found
    if (!version) {
      version = pkg['dist-tags'] && pkg['dist-tags'].latest;
    }

    var doc;
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

  var _parseModule = function (module, path, name) {

    var moduleName = (name || module.name) + '@' + module.version;
    if (results[moduleName]) {
      results[moduleName].paths.push(path.concat([moduleName]));
    }
    else {
      results[moduleName] = {
        name: name || module.name,
        version: module.version,
        paths: [path.concat([moduleName])]
      };
    }

    var children = Object.keys(module.dependencies || {});
    for (var i = 0, il = children.length; i < il; ++i) {
      var child = children[i];
      _parseModule(module.dependencies[child], path.concat([moduleName]), child);
    }
  };

  _parseModule(shrinkwrap, []);

  return cb(null, results);
};

module.exports = {
  getPackageJson: getPackageJson,
  getShrinkwrapDependencies: getShrinkwrapDependencies
};
