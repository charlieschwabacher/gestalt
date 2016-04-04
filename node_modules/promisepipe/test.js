/*global it, describe, beforeEach */

var stream = require("stream");
var fs = require("fs");
var assert = require("assert");
var util = require("util");

var promisePipe = require("./index");

var INPUT = __dirname + "/fixtures/input.txt";
var OUTPUT = __dirname + "/fixtures/output.txt";

function Upcase(){
    stream.Transform.call(this);
}

util.inherits(Upcase, stream.Transform);

Upcase.prototype._transform = function(chunk, encoding, cb) {
    if (/X/.test(chunk.toString())) {
        cb(new Error("X is not allowed"));
    }

    this.push(chunk.toString().toUpperCase());
    cb();
};

describe("promisePipe", function() {

    beforeEach(function(done) {
        fs.unlink(OUTPUT, function(err) {
            done();
        });
    });

    it("can do basic piping", function(done) {
        var input = fs.createReadStream(INPUT);
        var output = fs.createWriteStream(OUTPUT);

        promisePipe(input, output).done(function(pipeChain) {

            assert.equal(input, pipeChain[0], "Resolved promise passes stream pipe chain back");
            assert.equal(output, pipeChain[1]);

            fs.readFile(OUTPUT, function(err, data) {
                if (err) {
                    return done(err);
                }

                assert.equal(data.toString().trim(), "foobar");
                done();
            });
        });
    });

    ["stdout", "stderr"].forEach(function(stdio) {
        it("can pipe to " + stdio, function(done) {
            var input = fs.createReadStream(INPUT);
            promisePipe(input, process[stdio]).done(function() {
                done();
            });
        });
    });

    it("can handle errors from source", function(done) {
        var input = fs.createReadStream("bad");
        var output = fs.createWriteStream(OUTPUT);

        promisePipe(input, output).fail(function(err) {
            assert(err);
            assert.equal(err.originalError.code, "ENOENT");
            assert.equal(err.source, input);
            done();
        });
    });

    it("can handle errors from target", function(done) {
        var input = fs.createReadStream(INPUT);
        var output = fs.createWriteStream("/bad");

        promisePipe(input, output).fail(function(err) {
            assert(err);
            assert.equal(err.originalError.code, "EACCES");
            done();
        });
    });

    it("can pipe via transforms", function(done) {
        var input = fs.createReadStream(INPUT);
        var output = fs.createWriteStream(OUTPUT);

        promisePipe(input, new Upcase(), output).done(function() {
            fs.readFile(OUTPUT, function(err, data) {
                if (err) {
                    return done(err);
                }

                assert.equal(data.toString().trim(), "FOOBAR");
                done();
            });
        });
        
    });

    it("can handle errors from transforms", function(done) {
        var input = fs.createReadStream(INPUT + ".x");
        var output = fs.createWriteStream(OUTPUT);

        promisePipe(input, new Upcase(), output).fail(function(err) {
            assert(err);
            assert.equal(err.originalError.message, "X is not allowed");
            done();
        });
    });

});

