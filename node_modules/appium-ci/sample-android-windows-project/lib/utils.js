import Q from 'q';
import cp from 'child_process';

let exec = Q.denodeify(cp.exec);

export default {
  exec: exec
};
