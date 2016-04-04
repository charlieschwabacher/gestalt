import chai from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import { getLogger } from '../lib/logger';
chai.should();

function setupWriters () {
  return {'stdout': sinon.spy(process.stdout, 'write'),
          'stderr': sinon.spy(process.stderr, 'write')};
}

function getDynamicLogger (testingMode, forceLogs, prefix=null) {
  process.env._TESTING = testingMode ? '1' : '0';
  process.env._FORCE_LOGS = forceLogs ? '1' : '0';
  return getLogger(prefix);
}

function restoreWriters (writers) {
  for (let w of _.values(writers)) {
    w.restore();
  }
}

function assertOutputContains (writers, output) {
  let someoneHadOutput = false;
  let matchOutput = sinon.match(function (value) {
    return value && value.indexOf(output) >= 0;
  }, "matchOutput");

  for (let w of _.values(writers)) {
    if (w.calledWith) {
      someoneHadOutput = w.calledWithMatch(matchOutput);
      if (someoneHadOutput) break;
    }
  }
  if (!someoneHadOutput) {
    throw new Error("Expected someone to have been called with: '" + output + "'");
  }
}

function assertOutputDoesntContain (writers, output) {
  for (let w of _.values(writers)) {
    _.flatten(w.args).should.not.contain(output);
  }
}

export { setupWriters, restoreWriters, assertOutputContains,
         assertOutputDoesntContain, getDynamicLogger };
