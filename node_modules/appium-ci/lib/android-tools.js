import B from 'bluebird';
import stream from 'stream';
import fs from 'fs';
import split from 'split';
import os from 'os';
import utils from './utils';
import _ from 'lodash';
import { getLogger } from 'appium-logger';

let log = {
  emu: getLogger('android-emu')
};

const DEFAULT_OPTS = {
  initWait: 15000,
  maxWait: 300000,
  pool: 5000,
};

let  androidTools = {
  killAll: async (processes) => {
    processes = processes || ['emulator'];
    processes = _.flatten([processes]);
    for(let p of processes) {
      let cmd = process.platform.match(/^win/) ? 'powershell -Command "Stop-Process -Name *' + p + '*"' :
        'sudo pkill -f ' + p;
      console.log('killing process with command:' + cmd);
      await utils.exec(cmd).catch(() => {});
    }
  }
};

export { androidTools };

export class Emulator {
  constructor(avd, opts={}) {
    this.opts = _.clone(opts);
    _.defaults(this.opts, DEFAULT_OPTS);
    this.avd = avd;
  }

  start () {
    let out = new stream.PassThrough();
    out.pipe(split())
      .on('data', (line) => {
        log.emu.info(line);
      });
    out.pipe(fs.createWriteStream('emulator.log'));
    let emuBin = os.platform() === 'linux' ? 'emulator64-x86' : 'emulator';
    let emuArgs = [
      '-avd', this.avd,
      '-no-snapshot-load', '-no-snapshot-save',
      '-no-audio', '-netfast'
    ];
    if (os.platform() === 'linux') {
      emuArgs = emuArgs.concat([
        '-qemu', '-m', '512', '-enable-kvm'
      ]);
    }
    log.emu.info('executing', emuBin, emuArgs.join(' '));
    this.child = utils.spawn(emuBin, emuArgs);
    this.child.stdout.pipe(out);
    this.child.stderr.pipe(out);
  }

  async waitTillReady() {
    let startMs = Date.now();
    let timeoutPromise, emuStarted, emuErrored;

    // one cancellable promise monitor the proc events for abnormal termination
    let procPromise = new B.Promise((resolve, reject) => {
      this.child.on('error', (err) => {
        emuErrored = true;
        reject('Emulator didn\'t start properly, error:', err);
      });
      this.child.on('close', () => {
        if (!emuStarted) {
            emuErrored = true;
            reject('Emulator closed too early, see emu logs for errors.');
        }
      });
    }).cancellable().catch(B.Promise.CancellationError, () => {});

    let _waitForEmu = async (waitMs) => {
      waitMs = waitMs || this.opts.pool;

      // wait
      if (waitMs > 0) {
        log.emu.info('Waiting ' + waitMs +  ' ms for emu...');
        timeoutPromise = new B.Promise(() => {}).timeout(waitMs); // cancellable
        await timeoutPromise.then(_waitForEmu)
            .catch(B.Promise.TimeoutError, () => {})
            .catch(B.Promise.CancellationError, () => {});
      }

      // recursion end conditions
      if (emuErrored) {
        throw new Error('emulator errored');
      }
      if (Date.now() - startMs > this.opts.maxWait) {
        throw new Error('Emulator did not show up');
      }

      // retrieve emulator status
      let stdout;
      try {
        [stdout] = await utils.exec('adb shell getprop sys.boot_completed');
       } catch(err) {
          if (err.toString().match(/device not found/)) {
            // there might be something wrong with the adb server
            log.emu.warn('Device not found, it should be there, killing adb server.');
            return utils.exec('adb kill-server')
              .then(() => { return _waitForEmu(); });
          }else if (err.toString().match(/device offline/)) {
            // that's ok,just wait
            return _waitForEmu();
          } else {
            throw(err);
          }
       }

       // check emulator status
       if (stdout && stdout.trim() === '1') {
         log.emu.info('emulator started');
         emuStarted = true;
       } else {
         await _waitForEmu();
       }
    };

    // wait for first promise
    await B.race([_waitForEmu(this.opts.initWait), procPromise])
      .finally(() => {
        // cancel outstanding promises so that they do not hang the node process
        timeoutPromise.cancel();
        procPromise.cancel();
    });

  }

  stop() {
    if (this.child) {
      this.child.kill();
    }
  }
}

