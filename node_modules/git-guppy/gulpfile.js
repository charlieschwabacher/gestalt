var gulp = require('gulp');
var guppy = require('./')(gulp);
var stylish = require('jshint-stylish');
var $ = require('gulp-load-plugins')();

gulp.task('test', ['lint', 'unit']);

gulp.task('unit', function (cb) {
  gulp.src(['index.js', 'lib/*.js'])
    .pipe($.istanbul())
    .pipe($.istanbul.hookRequire())
    .on('finish', function () {
      gulp.src('test/guppy.tests.js', { read: false })
        .pipe($.mocha())
        .pipe($.istanbul.writeReports())
        .on('end', cb);
    });
});

gulp.task('lint', function () {
  return gulp.src(['*.js', 'lib/*.js'])
    .pipe($.filter(['*.js']))
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish))
    .pipe($.jshint.reporter('fail'));
});

// run unit tests, then lint only the indexed changes
gulp.task('pre-commit', ['unit'], function () {
  return guppy.stream('pre-commit')
    .pipe($.filter(['*.js']))
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish))
    .pipe($.jshint.reporter('fail'));
});
