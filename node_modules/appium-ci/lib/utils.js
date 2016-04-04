import B from 'bluebird';
import cp from 'child_process';

let utils = {
  spawn: cp.spawn,
  exec: B.promisify(cp.exec)
};

export default utils;
