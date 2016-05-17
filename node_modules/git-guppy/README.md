# git-guppy [![NPM version](https://badge.fury.io/js/git-guppy.svg)](http://badge.fury.io/js/git-guppy) [![Build Status](https://travis-ci.org/therealklanni/git-guppy.svg?branch=master)](https://travis-ci.org/therealklanni/git-guppy) [![codecov.io](http://codecov.io/github/therealklanni/git-guppy/coverage.svg?branch=master)](http://codecov.io/github/therealklanni/git-guppy?branch=master) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/therealklanni/git-guppy?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

![guppy](guppy.png)

> Simple git-hook integration for your gulp workflows.

guppy streamlines and extends your git-hooks by integrating them with your
[gulp](http://gulpjs.com) workflow. This enables you to have **gulp tasks that
run when triggered by a git-hook**, which means you can do cool things like
abort a commit if your tests are failing. Git-hooks can now be managed through
[npm](https://npmjs.org), allowing them to automatically be installed and
updated. And because they integrate with gulp, it's easy to modify the workflow
and even combine hooks with your other gulp tasks.

guppy leverages these powerful existing systems as its backbone, allowing guppy
(and therefore your git-hooks) to remain as simple and lightweight as possible
through interfaces you're already familiar with.

A git-hook that lint-checks your code and makes sure your unit tests pass before
committing could be as simple as

```js
gulp.task('pre-commit', ['lint', 'unit']);
```

## Install

```bash
npm i git-guppy --save-dev
```

## Usage

### Git integration

*Automatic!*

The actual scripts that git will run to trigger guppy's hooks will be automatically
installed to your `.git/hooks/` directory. These are just a wrapper for invoking
the gulp tasks that guppy registers.

Typically, a workflow can be added to your gulp tasks via a *guppy-hook*. A
guppy-hook is like a git-hook preconfigured for specific gulp workflows.

You can install *guppy-hooks* via `npm` just like any other package. For every valid
git-hook name, there exists a "guppy-[hookname]" package that automatically installs
the related hook to your `.git/hooks` dir, e.g. "guppy-pre-commit" or "guppy-post-update".
Just add the guppy-hook you need as a dev-dependency in your project.

Search ["guppy-hook" on npm](https://www.npmjs.com/search?q=guppy-hook) to find all
guppy-hook packages. Or run `npm search guppy-hook` from the commandline.

### gulp integration

> :warning: **Stop!** If you are using a guppy-hook package, refer to the
documentation for that package. You do not need the steps below unless you are
adding custom guppy integration to your gulpfile or authoring your own guppy-hook
package.

guppy exposes a few simple methods to help you superpower your git-hooks with
gulp tasks.

Before you dive in, initialize guppy by passing in your gulp reference:

```js
var gulp = require('gulp');
var guppy = require('git-guppy')(gulp);
```

Then simply define some gulp tasks in your `gulpfile.js` whose names match
whichever git-hooks you want to be triggerable by git.

```js
gulp.task('pre-commit', function () {
  // see below
});
```

*Note: if you are working directly with guppy rather than installing a guppy-hook
you will need to manually install the associated git-hooks using the
[guppy-cli](https://github.com/therealklanni/guppy-cli) commandline tool.*

#### guppy.src(*hookName*)

> Supported hooks: `applypatch-msg`, `commit-msg`, `pre-applypatch`, `pre-commit`,
`prepare-commit-msg`

Pass in the name of the desired git-hook and get back the related filenames.
This allows you to work with the source file directly, for example to modify a
commit-msg programmatically or lint changed files.

*Note for pre-commit and pre-applypatch this will give you the ***working-copy***,
not the indexed (staged) changes. If you want the indexed changes, use
`guppy.stream()` instead.*

```js
// contrived example
gulp.task('pre-commit', function () {
  return gulp.src(guppy.src('pre-commit'))
    .pipe(gulpFilter(['*.js']))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});
```

#### guppy.src(*hookName[, fn]*)

> Supported hooks: all

If you pass the optional `fn` argument, it will be passed to `gulp.task()` as the
task callback, but the first argument will be the related filenames (or `null`,
if none) and a second optional argument may also be supplied (when applicable)
with any additional arguments received from the git-hook as an array. gulp will
provide its callback as the last argument.

```js
// less contrived example
gulp.task('pre-commit', guppy.src('pre-commit', function (filesBeingCommitted) {
  return gulp.src(filesBeingCommitted)
    .pipe(gulpFilter(['*.js']))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
}));

// another contrived example
gulp.task('pre-push', guppy.src('pre-push', function (files, extra, cb) {
  var branch = execSync('git rev-parse --abbrev-ref HEAD');

  if (branch === 'master') {
    cb('Don\'t push master!')
  } else {
    cb();
  }
}));
```

#### guppy.stream(*hookName[, options]*)

> Supported hooks: `applypatch-msg`, `commit-msg`, `pre-applypatch`, `pre-commit`,
`prepare-commit-msg`

Pass in the name of the git-hook to produce a stream of the related files.
You can pass options as a second argument, please refer to the [docs for gulp.src](https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulpsrcglobs-options)
for more information on available options.

*Note that depending on the git-hook, you may be acting on files that differ from
your working copy, such as those staged for commit (as with 'pre-commit' for
example), rather than the working copy. If you need to act on the working-copy
files, use `guppy.src()` instead.*

```js
gulp.task('pre-commit', function () {
  return guppy.stream('pre-commit')
    .pipe(gulpFilter(['*.js']))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'));
});
```

#### Additional notes

For many git-hooks there are no files associated, so for those it makes sense
to only add other gulp tasks as dependencies to invoke a workflow, however some
will still receive some arguments (passed in by `guppy.src()` when used as a
callback) for more advanced use cases.

```js
gulp.task('post-checkout', ['lint']);
```

## Writing guppy-hooks

*stay tuned*

For details on what arguments each git-hook receives and what result a non-zero
exit status would have, check the [git-scm docs](https://git-scm.com/docs/githooks).

## Author

**Kevin Lanni**

+ [github/therealklanni](https://github.com/therealklanni)
+ [twitter/therealklanni](http://twitter.com/therealklanni)

## License

MIT © Kevin Lanni
![](https://ga-beacon.appspot.com/UA-62782014-1/git-guppy/1.0?pixel)
