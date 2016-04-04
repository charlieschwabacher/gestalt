import path from 'path';
import utils from './utils';
import _ from 'lodash';
import B from 'bluebird';
import { getLogger } from 'appium-logger';

const log = getLogger('ios-tools');

const SIDE_DISK = '/Volumes/SIDE';
const SIDE_SIMS = path.resolve(SIDE_DISK, 'sims');

function killAll(processes=['instruments', 'simulator']) {
  processes = _.flatten([processes]);
  let seq = _(processes).map((p) => {
    return () => {
      return utils.exec('sudo pkill -f ' + p).catch(() => {});
    };
  }).value();
  return B.reduce(seq, function(_, fn) { return fn(); }, null);
}

function spawnAsUser (user, cmd, args) {
  log.info('running spawnAsUser', user, cmd, args);
  return utils.exec(
    "ps -axj | grep loginwindow | awk \"/^" + user + " / {print \\$2;exit}\""
  ).spread(function (stdout) {
    var userPid = stdout.trim();
    return utils.spawn(
      "sudo",
      [ 'launchctl', 'bsexec', userPid,'sudo', '-u']
        .concat([user, cmd]).concat(args),
      { detached: false });
  });
}

function spawnAsCurrentUser (cmd, args) {
  log.info('running spawnAsCurrentUser', cmd, args);
  return utils.exec('whoami').spread(function (stdout) {
    var currentUser = stdout.trim();
    return spawnAsUser(currentUser, cmd, args);
  });
}


function setIosSimulatorScale() {
  log.info('setting simulator scale');
  return utils.exec(
    'defaults write com.apple.iphonesimulator SimulatorWindowLastScale 0.5'
  );
}

function configureXcode (xCodeVersion) {
  log.info('configuring xCode', xCodeVersion);
  var bin = path.resolve(SIDE_SIMS, 'configure.sh');
  return utils.exec(bin + ' ' + xCodeVersion);
}

function resetSims () {
  log.info('resetting simulators');
  var bin = path.resolve(SIDE_SIMS, 'reset-sims.sh');
  return utils.exec(bin);
}

export default {
  spawnAsUser,
  spawnAsCurrentUser,
  setIosSimulatorScale: setIosSimulatorScale,
  configureXcode: configureXcode,
  resetSims: resetSims,
  killAll: killAll,
};
