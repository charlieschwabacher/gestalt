// transpile:mocha

import { iosTools } from '../..';
import utils from '../../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import sinon from 'sinon';

chai.should();
chai.use(chaiAsPromised);

describe('ios tools', () => {
  before(async () => {
    let _exec = utils.exec;
    let _spawn = utils.spawn;

    sinon.stub(utils, "exec", function () {
      return _exec('echo bob');
    });
    sinon.stub(utils, "spawn", function () {
      return _spawn('echo', ['1']);
    });
  });

  it('spawn as user',async () => {
    let proc = await iosTools.spawnAsUser('bob', 'ls', ['-l']);
    proc.kill();
  });

  it('spawn as current user',async () => {
    let proc = await iosTools.spawnAsUser('ls', ['-l']);
    proc.kill();
  });

  it('set simulator scale',async () => {
    await iosTools.setIosSimulatorScale();
  });

  it('set configure xCode',async () => {
    await iosTools.configureXcode('6.1.1');
  });

  it('reset simulators',async () => {
    await iosTools.resetSims();
  });

  it('kill all',async () => {
    await iosTools.killAll();
    await iosTools.killAll('ls');
    await iosTools.killAll(['ls', 'echo']);
  });

  after(async () => {
    utils.exec.restore();
    utils.spawn.restore();
   });

});

