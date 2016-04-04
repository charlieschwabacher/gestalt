"use strict";

var gulp = require('gulp'),
    _ = require('lodash'),
    boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

var argv = require('yargs').argv;

var e2eFiles = _(argv).pick('android', 'ios').map(function (v, k) {
  return '${testDir}/e2e/' + k + '/*-e2e-specs.js';
}).value();

boilerplate({
  build: 'appium-ci',
  jscs: false,
  e2eTest: {
    files: e2eFiles
  }
});
