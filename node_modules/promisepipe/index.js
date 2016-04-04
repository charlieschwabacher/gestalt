
var Q = require("q");


function promiseFromStreams(streams) {
    return Q.all(streams.map(function(stream) {
        return Q.promise(function(resolve, reject) {

            // process.stdout and process.stderr are not closed or ended
            // after piping like other streams. So we must resolve them
            // manually.
            if (stream === process.stdout || stream === process.stderr) {
                return resolve();
            }

            stream.on("error", function(streamErr) {
                var err = new Error(streamErr.message);
                err.source = stream;
                err.originalError = streamErr;
                reject(err);
            });

            // This event fires when no more data will be provided.
            stream.on("end", resolve);

            // Emitted when the underlying resource (for example, the backing file
            // descriptor) has been closed. Not all streams will emit this.
            stream.on("close", resolve);

            // When the end() method has been called, and all data has been flushed
            // to the underlying system, this event is emitted.
            stream.on("finish", resolve);
        });
    }));
}

function promisePipe() {
    var streams = Array.prototype.slice.call(arguments);

    var promise = promiseFromStreams(streams).then(function() {
        return Q(streams);
    });

    var streamsStack = Array.prototype.slice.call(arguments);
    var current = streamsStack.shift();
    var next;
    while (next = streamsStack.shift()) {
        current.pipe(next);
        current = next;
    }

    return promise;
}

promisePipe.justPromise = promiseFromStreams;

module.exports = promisePipe;
