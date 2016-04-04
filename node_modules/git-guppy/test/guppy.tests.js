/* jshint expr: true */
/* global beforeEach, describe, it */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var proxy = require('proxyquire');
chai.use(require('sinon-chai'));

var timesCalled = 0;
var nextStub = sinon.stub();
var pipeStub = sinon.stub();
pipeStub.returns({ pipe: pipeStub });
pipeStub.callsArgWith(0, {
  // because Sinon's .onCall() method caused .return() to act buggy
  get path () {
    return (timesCalled++ === 4 || timesCalled === 6) ? 'untracked' : 'path';
  }
}, nextStub);

var gulpSrcStub = sinon.stub()
  .returns({
    pipe: pipeStub
  });
var gulp = {
  src: gulpSrcStub
};

function mapThru(fn) { return fn; }

var execSyncStub = sinon.stub();
execSyncStub.withArgs('git diff --cached --name-only --diff-filter=ACM')
  .returns({ output: 'index.js\ntest.js' });
execSyncStub.withArgs('git ls-files -s path')
  .returns({ output: 'some hash' });
execSyncStub.withArgs('git ls-files -s untracked')
  .returns({ output: '' });
execSyncStub.withArgs('git cat-file blob hash')
  .returns({ output: 'file\ncontents' });

var guppy;

describe('guppy', function () {
  var testCount = 0;

  beforeEach(function () {
    if (testCount++ === 5) {
      // simulate no HOOK_ARGS for at least one test that doesn't expect them
      delete process.env.HOOK_ARGS;
    } else {
      process.env.HOOK_ARGS = 'extra\u263aextra';
    }

    guppy = proxy('../', {
      './lib/get-hook': proxy('../lib/get-hook', {
        'shelljs': { exec: execSyncStub },
        'map-stream': mapThru
      })
    })(gulp);

    sinon.spy(guppy, 'src');
    sinon.spy(guppy, 'stream');
    execSyncStub.reset();
  });

  describe('guppy.src(hook)', function () {
    it('returns an array of filenames', function () {
      var files = guppy.src('pre-commit');

      expect(files).to.eql(['index.js', 'test.js']);
    });

    describe('invalid hook name', function () {
      it('throws an exception "Invalid hook name: invalid-hook-name"', function () {
        try { guppy.src('invalid-hook-name'); }
        catch (e) { expect(guppy.src.threw()).to.be.true; }
        expect(guppy.src.exceptions[0].message).to.equal('Invalid hook name: invalid-hook-name');
      });
    });

    describe('incompatible hooks', function () {
      it('throws an exception "Hook has no source files..."', function () {
        try { guppy.src('pre-auto-gc'); }
        catch (e) { expect(guppy.src.threw()).to.be.true; }
        expect(guppy.src.exceptions[0].message)
          .to.equal('Hook has no source files, use guppy.src() as a callback: pre-auto-gc');
      });
    });
  });

  describe('guppy.src(hook, fn)', function () {
    describe('applypatch-msg', function () {
      it('returns fn bound with filename', function (done) {
        guppy.src('applypatch-msg', function (file, cb) {
          expect(file).to.equal('extra');
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('commit-msg', function () {
      it('returns fn bound with filename', function (done) {
        guppy.src('commit-msg', function (file, cb) {
          expect(file).to.equal('extra');
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-applypatch', function () {
      it('returns fn bound with null', function (done) {
        guppy.src('post-applypatch', function (isNull, cb) {
          expect(isNull).to.be.null;
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-checkout', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('post-checkout', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-commit', function () {
      it('returns fn bound with null', function (done) {
        guppy.src('post-commit', function (isNull, cb) {
          expect(isNull).to.be.null;
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-merge', function () {
      it('returns fn bound with null and extra', function (done) {
        guppy.src('post-merge', function (isNull, extra, cb) {
          expect(extra).to.equal('extra');
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-receive', function () {
      it('returns fn bound with null', function (done) {
        guppy.src('post-receive', function (isNull, cb) {
          expect(isNull).to.be.null;
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-rewrite', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('post-rewrite', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('post-update', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('post-update', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-applypatch', function () {
      it('returns fn bound with file array', function (done) {
        guppy.src('pre-applypatch', function (files, cb) {
          expect(files).to.eql(['index.js', 'test.js']);
          expect(cb).to.equal('gulp done callback');

          expect(execSyncStub).to.have.been.calledWith('git diff --cached --name-only --diff-filter=ACM');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-auto-gc', function () {
      it('returns fn bound with null', function (done) {
        guppy.src('pre-auto-gc', function (isNull, cb) {
          expect(isNull).to.be.null;
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-commit', function () {
      it('returns fn bound with file array', function (done) {
        guppy.src('pre-commit', function (files, cb) {
          expect(files).to.eql(['index.js', 'test.js']);
          expect(cb).to.equal('gulp done callback');

          expect(execSyncStub).to.have.been.calledWith('git diff --cached --name-only --diff-filter=ACM');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-push', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('pre-push', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-receive', function () {
      it('returns fn bound with null', function (done) {
        guppy.src('pre-receive', function (isNull, cb) {
          expect(isNull).to.be.null;
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('pre-rebase', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('pre-rebase', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('prepare-commit-msg', function () {
      it('returns fn bound with filename and [extra]', function (done) {
        guppy.src('prepare-commit-msg', function (file, extra, cb) {
          expect(file).to.equal('extra');
          expect(extra).to.eql(['extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('update', function () {
      it('returns fn bound with null and [extra,extra]', function (done) {
        guppy.src('update', function (isNull, extra, cb) {
          expect(isNull).to.be.null;
          expect(extra).to.eql(['extra', 'extra']);
          expect(cb).to.equal('gulp done callback');

          done();
        })('gulp done callback');

        expect(guppy.src).to.have.returned(sinon.match.func);
      });
    });

    describe('invalid-hook-name', function () {
      it('throws an exception "Invalid hook name: invalid-hook-name"', function () {
        try { guppy.src('invalid-hook-name'); }
        catch (e) { expect(guppy.src.threw()).to.be.true; }
        expect(guppy.src.exceptions[0].message).to.equal('Invalid hook name: invalid-hook-name');
      });
    });
  });

  describe('guppy.stream(hook)', function () {
    describe('applypatch-msg', function () {
      it('returns a vinyl stream from a file', function (done) {
        var stream = guppy.stream('applypatch-msg');

        expect(gulp.src).to.have.been.calledWith('extra');
        expect(guppy.stream).to.have.returned(sinon.match.object);
        expect(guppy.stream.returnValues[0].pipe).to.be.defined;

        stream
          .pipe(function (file) {
            expect(file.path).to.equal('path');
            expect(execSyncStub).to.not.have.been.called;
            done();
          });
      });
    });

    describe('commit-msg', function () {
      it('returns a vinyl stream from a file', function (done) {
        var stream = guppy.stream('commit-msg');

        expect(gulp.src).to.have.been.calledWith('extra');
        expect(guppy.stream).to.have.returned(sinon.match.object);
        expect(guppy.stream.returnValues[0].pipe).to.be.defined;

        stream
          .pipe(function (file) {
            expect(file.path).to.equal('path');
            expect(execSyncStub).to.not.have.been.called;
            done();
          });
      });
    });

    describe('pre-commit', function () {
      it('returns a vinyl stream from indexed changes', function (done) {
        var stream = guppy.stream('pre-commit');

        expect(guppy.stream).to.have.returned(sinon.match.object);
        expect(guppy.stream.returnValues[0].pipe).to.be.defined;

        stream
          .pipe(function (file) {
            expect(file.path).to.equal('path');
            expect(Buffer.isBuffer(file.contents)).to.be.true;
            expect(file.contents.toString()).to.equal('file\ncontents');
            expect(execSyncStub).to.have.been.calledWith('git ls-files -s path');
            expect(execSyncStub).to.have.been.calledWith('git cat-file blob hash');
            done();
          });
      });
    });

    describe('pre-commit untracked file', function () {
      it('returns a vinyl stream from working copy', function (done) {
        var stream = guppy.stream('pre-commit');

        expect(guppy.stream).to.have.returned(sinon.match.object);
        expect(guppy.stream.returnValues[0].pipe).to.be.defined;

        stream
          .pipe(function (file) {
            expect(file.path).to.equal('untracked');
            done();
          });
      });
    });

    describe('guppy.stream with options', function () {
      it('should pass options to gulp.src', function () {
        var options = { base: './' };
        guppy.stream('pre-commit', options );

        expect(gulpSrcStub).to.have.been.calledWith(['index.js', 'test.js'], options);
      });
    });

    describe('prepare-commit-msg', function () {
      it('returns a vinyl stream from a file', function (done) {
        var stream = guppy.stream('prepare-commit-msg');

        expect(gulp.src).to.have.been.calledWith('extra');
        expect(guppy.stream).to.have.returned(sinon.match.object);
        expect(guppy.stream.returnValues[0].pipe).to.be.defined;

        stream
          .pipe(function (file) {
            expect(file.path).to.equal('path');
            expect(execSyncStub).to.not.have.been.called;
            done();
          });
      });
    });

    describe('post-applypatch', function () {
      it('throws an exception "Hook not streamable"', function () {
        try { guppy.stream('post-applypatch'); }
        catch (e) { expect(guppy.stream.threw()).to.be.true; }
        expect(guppy.stream.exceptions[0].message).to.equal('Hook not streamable: post-applypatch');
      });
    });

  });
});
