// transpile:mocha

import {listDevices} from '../..';
import utils from '../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import sinon from 'sinon';

chai.should();
chai.use(chaiAsPromised);

describe('list devices', () => {
  before(() => {
    sinon.stub(utils, 'exec', () => {
      return ['List of devices attached \n' +
             'emulator-5554\tdevice\n\n', null];
    });
  });
  after(() => {
    utils.exec.restore();
  });
  it('should-work',async () => {
    let res = await listDevices();
    res.should.have.length(1);
    res[0].should.include('emulator');
  });
});

