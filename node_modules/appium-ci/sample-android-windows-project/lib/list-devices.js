import _ from 'lodash';
import utils from './utils';

async function listDevices() {
  let [stdout] = await utils.exec('adb devices');
  var lines = stdout.match(/^.*([\n\r]+|$)/gm);
  return _(lines).filter((l) => {
    return !((l.trim().length === 0) ||
      l.match(/List of devices attached/));
  }).map((l) => {
    return l.trim().split('\t')[0];
  })
  .value();
}

export default listDevices;
