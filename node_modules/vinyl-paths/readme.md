# vinyl-paths [![Build Status](https://travis-ci.org/sindresorhus/vinyl-paths.svg?branch=master)](https://travis-ci.org/sindresorhus/vinyl-paths)

> Get the file paths in a [vinyl](https://github.com/wearefractal/vinyl) stream

Useful when you need to use the file paths from a gulp pipeline in Promise-returning node module.

Simply pass a promise-returning function such as `del` and `vinyl-paths` will provide each path in the stream as the first argument.


## Install

```
$ npm install --save vinyl-paths
```


## Usage

```js
// gulpfile.js
var gulp = require('gulp');
var stripDebug = require('gulp-strip-debug');
var del = require('del');
var vinylPaths = require('vinyl-paths');

// log file paths in the stream
gulp.task('log', function () {
	return gulp.src('app/*')
		.pipe(stripDebug())
		.pipe(vinylPaths(function (paths) {
			console.log('Paths:', paths);
			return Promise.resolve();
		}));
});

// delete files in the stream
gulp.task('delete', function () {
	return gulp.src('app/*')
		.pipe(stripDebug())
		.pipe(vinylPaths(del));
});

// or if you need to use the paths after the pipeline
gulp.task('delete2', function () {
	return new Promise(function (resolve, reject) {
		var vp = vinylPaths();

		gulp.src('app/*')
			.pipe(vp)
			.pipe(gulp.dest('dist'))
			.on('end', function () {
				del(vp.paths).then(resolve).catch(reject);
			});
	});
});
```

*You should only use a vanilla node module like this if you're already using other plugins in the pipeline, otherwise just use the module directly as `gulp.src` is costly. Remember that gulp tasks can return Promises as well as streams!*


## API

### vinylPaths([callback])

The optionally supplied callback will get a file path for every file and is expected to return a Promise. An array of the file paths so far is available as a `paths` property on the stream.

#### callback(path)


## Related

- [gulp-revert-path](https://github.com/sindresorhus/gulp-revert-path) - Revert the previous `file.path` change


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
