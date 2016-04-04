appium-gulp-plugins
===================

Custom plugins used accross appium modules

## status

[![Build Status](https://travis-ci.org/appium/appium-gulp-plugins.svg?branch=master)](https://travis-ci.org/appium/appium-gulp-plugins)

## boilerplate plugin

This plugin sets up all the other typical plugins we use with a simple
configuration object.

### usage

Basically just set up the `boilerplate` plugin as follows:

```js
var gulp = require('gulp'),
    boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

boilerplate({build: "My Project Name"});
```

You can pass a lot of options to configure `boilerplate`. Here are the options
along with their defaults (from `lib/boilerplate.js`):

```js
var DEFAULT_OPTS = {
  files: ["*.js", "lib/**/*.js", "test/**/*.js", "!gulpfile.js"],
  transpile: true,
  transpileOut: "build",
  babelOpts: {},
  linkBabelRuntime: true,
  jscs: true,
  jshint: true,
  watch: true,
  test: true,
  testFiles: null,
  testReporter: 'nyan',
  testTimeout: 8000,
  buildName: null,
  extraPrepublishTasks: [],
  preCommitTasks: ['jshint', 'once']
};
```

As you can see, it defaults to transpiling with Babel, running jshint and jscs,
running tests, and with the default task being `gulp watch`.

## transpile plugin

Babel compilation, sourcemaps and file renaming functionality in
one plugin. `.es7.js` and `.es6.js` files will be automatically renamed to `.js
files`. The necessary sourcemaps, comments and imports are also
automatically added.

### usage

1/ Configure gulp as below:

``` js
var gulp = require('gulp'),
Transpiler = require('appium-gulp-plugins').Transpiler;

gulp.task('transpile', function () {
  var transpiler = new Transpiler();
  // babel options are configurable in transpiler.babelOpts

  return gulp.src('test/fixtures/es7/**/*.js')
    .pipe(transpiler.stream())
    .pipe(gulp.dest('build'));
});
```

2/ in your code you need to mark the main and mocha files as below:

- main: add `// transpile:main` at the beginning of the file ([example here](https://github.com/appium/appium-gulp-plugins/blob/master/test/fixtures/es7/lib/run.es7.js)) .
- mocha: add `// transpile:mocha` at the beginning of the file ([example here](https://github.com/appium/appium-gulp-plugins/blob/master/test/fixtures/es7/test/a-specs.es7.js))

Regular lib files do not need any extra comments.

### Type assertions

Type assertions are not yet supported, but if you use Flow you can pass in an
option to the traspiler:

```js
var transpiler = new Transpiler({flow: true});
```

This will leave the type annotations un-stripped. You may specify type in your
code like in the following:

```js
// The regular way
let a = function (t:string, n:number):string {return 'let's type code.'};

// Within comments
let a = function (ti/*:string*/, n/*:number*/)/*:string*/ {return 'let's type code.'};
```

## watch plugin

There are some issues with Gulp 3.x error handling which cause the default
gulp-watch to hang. This plugin is a small hack which solves that by respawning
the whole process on error. This should not be needed in gulp 4.0.

Files in the `/test` directory that are named `.*-specs.js` are run. Tests which end in `.*-e2e-specs.js` are *not* run when watching. To run end-to-end tests, run `gulp e2e-test`.

### usage

```
var gulp = require('gulp'),
    spawnWatcher = require('./index').spawnWatcher.use(gulp);

spawnWatcher.configure('watch', ['lib/**/*.js','test/**/*.js','!test/fixtures'], function () {
  // this is the watch action
  return runSequence('test');
});
```

The test function in `spawnWatcher.configure` should return a promise.

### error handling

The spawn needs to catch error as soon as they happen. To do so use the
`spawnWatcher.handleError` method, for instance:

```js
// add error handling where needed
gulp.task('transpile', function () {
  return gulp.src('test/es7/**/*.js')
    .pipe(transpile())
    .on('error', spawnWatcher.handleError)
    .pipe(gulp.dest('build'));
});

gulp.task('test', ['transpile'] , function () {
  return gulp.src('build/test/a-specs.js')
    .pipe(mocha())
    .on('error', spawnWatcher.handleError);
});
```

### clear terminal

Terminal is cleared by default. To avoid that call:

```js
spawnWatcher.clear(false);
```

### notification

Native notification is enabled by default. To disable it use the
`--no-notif` option.

### collate logging and tests
Set the environment variable `_FORCE_LOGS`

### Git pre-commit hooks

The package uses [git-guppy](https://www.npmjs.com/package/git-guppy) to install pre-commit hooks. By default it runs, on a commit, the `jshint` and `once` tasks. Setting the `preCommitTasks` boilerplate option changes the tasks which will be done.

## hacking this package

### watch

```
npm run watch
```

### test

```
npm test
```
