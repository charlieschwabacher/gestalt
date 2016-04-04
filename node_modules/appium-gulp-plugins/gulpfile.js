"use strict";

var gulp = require('gulp'),
    Transpiler = require('./index').Transpiler,
    mocha = require('gulp-mocha'),
    spawnWatcher = require('./index').spawnWatcher.use(gulp),
    boilerplate = require('./index').boilerplate.use(gulp),
    _ = require('lodash'),
    Q = require('q'),
    exec = Q.denodeify(require('child_process').exec),
    glob = Q.denodeify(require('glob')),
    assert = require('assert');

var argv = require('yargs').count('flow').argv;

boilerplate({
  transpile: true,
  jscs: false,
  files: ["index.js", "lib/**/*.js", "test/**/*.js", "!test/fixtures/**","!test/generated/**"],
  test: {
    files: ['test/**/*-specs.js', '!test/fixtures']
  },
  coverage: {
    files: ['test/**/*-specs.js', '!test/fixtures'],
    verbose: true
  },
  buildName: "Appium Gulp Plugins",
  extraDefaultTasks: ['e2e-test', 'test-transpile-lots-of-files', 'coverage'],
});

gulp.task('transpile-es7-fixtures', ['clean'] , function () {
  var transpiler = new Transpiler(argv.flow ? {flow: true} : null);
  return gulp.src('test/fixtures/es7/**/*.js')
    .pipe(transpiler.stream())
    .on('error', spawnWatcher.handleError)
    .pipe(gulp.dest('build'));
});

gulp.task('generate-lots-of-files', function () {
  return exec('rm -rf test/generated/es7 build/generated').then(function () {
    return exec('mkdir -p test/generated/es7');
  }).then(function () {
    return Q.all(
      _.times(24).map(function (i) {
        return exec('cp test/fixtures/es7/lib/a.es7.js test/generated/es7/a' +
                    (i + 1)  +'.es7.js');
      }));
  });
});

gulp.task('transpile-lots-of-files',['generate-lots-of-files'], function () {
  var transpiler = new Transpiler(argv.flow ? {flow: true} : null);
  return gulp.src('test/generated/es7/**/*.js')
    .pipe(transpiler.stream())
    .on('error', spawnWatcher.handleError)
    .pipe(gulp.dest('build/generated'));
});

gulp.task('test-transpile-lots-of-files',['transpile-lots-of-files'], function () {
  var numOfFiles;
  return glob('test/generated/es7/**/*.js').then(function (files) {
    numOfFiles = files.length;
    assert(numOfFiles > 16);
    return glob('build/generated/*.js');
  }).then(function (files) {
    assert(files.length === numOfFiles);
    return glob('build/generated/*.es7.js');
  }).then(function (files) {
    assert(files.length === 0);
  });
});

gulp.task('test-es7-mocha', ['transpile-es7-fixtures'] , function () {
  return gulp.src('build/test/a-specs.js')
    .pipe(mocha())
    .on('error', spawnWatcher.handleError);
});

gulp.task('test-es7-mocha-throw', ['transpile-es7-fixtures'] , function () {
  return gulp.src('build/test/a-throw-specs.js')
    .pipe(mocha())
    .on('error', spawnWatcher.handleError);
});
