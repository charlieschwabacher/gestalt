import npmlog from 'npmlog';

const npmLevels = ['silly', 'verbose', 'debug', 'info', 'http', 'warn', 'error'];
let mockLog = {};
for (let l of npmLevels) {
  mockLog[l] = () => {};
}

export function patchLogger(logger) {
  if (!logger.debug) {
    logger.addLevel('debug', 1000, { fg: 'blue', bg: 'black' }, 'dbug');
  }
}

function _getLogger () {
  const testingMode = parseInt(process.env._TESTING, 10) === 1;
  const forceLogMode = parseInt(process.env._FORCE_LOGS, 10) === 1;
  const usingGlobalLog = !!global._global_npmlog;
  let logger = (testingMode && !forceLogMode) ? mockLog :
    (global._global_npmlog || npmlog);
  patchLogger(logger);
  return [logger, usingGlobalLog];
}

export function getLogger(prefix = null) {
  let [logger, usingGlobalLog] = _getLogger();
  let wrappedLogger = {unwrap: () => { return logger;} };
  Object.defineProperty(wrappedLogger, 'level', {
    get: function () { return logger.level; },
    set: function (newValue) { logger.level = newValue; },
    enumerable: true,
    configurable: true
  });
  for(let k of npmLevels) {
    wrappedLogger[k] = logger[k].bind(logger, prefix);
  }
  wrappedLogger.errorAndThrow = function (err) {
    if (!(err instanceof Error)) {
      err = new Error(err);
    }
    this.error(err);
    throw err;
  };
  if (!usingGlobalLog) {
    // if we're not using a global log specified from some top-level package,
    // set the log level to a default of verbose. Otherwise, let the top-level
    // package set the log level
    wrappedLogger.level = 'verbose';
  }
  wrappedLogger.levels = npmLevels;
  return wrappedLogger;
}

const log = getLogger();

export default log;
