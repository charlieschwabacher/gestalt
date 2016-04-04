'use strict';
var through = require('through2');

module.exports = function (userCb) {
	var stream = through.obj(function (file, enc, cb) {
		this.paths.push(file.path);

		if (userCb) {
			userCb(file.path).then(function () {
				cb(null, file);
			}).catch(cb);
		} else {
			cb(null, file);
		}
	});

	stream.paths = [];

	return stream;
};
