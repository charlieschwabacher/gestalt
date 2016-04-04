"use strict";

var clear = require('clear'),
    spawn = require('child_process').spawn,
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    Q = require('q'),
    notifier = require('node-notifier'),
    moment = require('moment'),
    _ = require('lodash'),
    path = require('path');

var exitOnError = false;
var clearTerminal = true;

var notify = function (subtitle, message) {
    if (process.argv.indexOf('--no-notif') >= 0) return;
    try {
      var build = process.env.APPIUM_NOTIF_BUILD_NAME || 'Appium';
      notifier.notify({
          'title': build,
          subtitle: subtitle + '  ' + moment().format('h:mm:ss'),
          'message': message
      });
    } catch (ign) {
      console.warn('notifier: ', '[' + build + ']', message);
    }
};

var notifyOK = notify.bind(null,'Build success!', 'All Good!');

module.exports = {
  use: function (_gulp) {
    gulp = _gulp;
    return this;
  },

  clear: function (_clearTerminal) {
    clearTerminal = _clearTerminal;
    return this;
  },

  handleError: function (err) {
    gutil.log(gutil.colors.red(err));
    var code = /\u001b\[(\d+(;\d+)*)?m/g;
    var notifErr = ('' + err).replace(code, '');
    notify('Build failure!', notifErr);
    if (exitOnError) {
      process.exit(1);
    }
  },
  configure: function (taskName, filePattern, watchFn) {
    var subtaskName = '_' + taskName;

    var isRespawn = process.argv.indexOf('--respawn') > 0;
    gulp.task(subtaskName, function () {
      exitOnError = true;
      gulp.watch(filePattern, function () {
        if (clearTerminal) clear();
        return watchFn().then(notifyOK);
      });
      gulp.watch(['gulpfile.js'], function () {
        process.exit(0);
      });

      if (!isRespawn) {
        Q.delay(500).then(function () {
          watchFn().then(notifyOK);
        });
      }
    });

    gulp.task(taskName, function () {
      if (clearTerminal) clear();
      var spawnWatch = function (respawn) {
        var args = [subtaskName];
        if (process.argv.indexOf('--no-notif') >= 0) args.push('--no-notif');
        if (respawn) args.push('--respawn');
        args = args.concat(_.chain(process.argv).tail(2).filter(function (arg) {
          if (/gulp$/.test(arg)) return false;
          return ([taskName, subtaskName, '--no-notif', '--respawn'].indexOf(arg) < 0);
        }).value());
        var proc = spawn(path.resolve('.','node_modules','.bin', 'gulp'), args, {stdio: 'inherit'});
        proc.on('close', function (code) {
          spawnWatch(code !== 0);
        });
      };
      spawnWatch();
    });
  }
};

