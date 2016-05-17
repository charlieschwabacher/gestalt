# gulp-nsp

# Installation

To install the gulp-nsp module into your project simply run

```bash
npm install gulp-nsp --save
```

# Usage

Then in your gulpfile, add the following task.

```javascript
var gulpNSP = require('gulp-nsp');

//To check your project
gulp.task('nsp', function (cb) {
  gulpNSP({package: __dirname + '/package.json'}, cb);
});
```

```javascript
//If you're using a shrinkwrap file, pass both the shrinkwrap and the package.json
gulp.task('nsp', function (cb) {
  gulpNSP({
    shrinkwrap: __dirname + '/npm-shrinkwrap.json',
    package: __dirname + '/package.json'
  }, cb);
});
```

## Options

### stopOnError
If you don't want to stop your gulp flow if some vulnerabilities have been found use the stopOnError option:

```javascript
gulp.task('nsp', function (cb) {
  gulpNSP({
    package: __dirname + '/package.json',
    stopOnError: false
  }, cb);
});
```

### output
If you want to use an alternative output formatter provided by nsp use the output option.

```javascript
gulp.task('nsp', function (cb) {
  gulpNSP({
    package: __dirname + '/package.json',
    output: 'summary'
  }, cb);
});
```

### proxy
If you want to use a proxy you can configure it via this option.


```javascript
gulp.task('nsp', function (cb) {
  gulpNSP({
    package: __dirname + '/package.json',
    proxy: 'http://127.0.0.1:8080'
  }, cb);
});
```

### Exceptions
The Node Security CLI supports adding exceptions. These are advisories that you have evaluated and personally deemed unimportant for your project. Instructions are available on the [nsp cli repository](https://github.com/nodesecurity/nsp#exceptions).
