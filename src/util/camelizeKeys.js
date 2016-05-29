// @flow

import {camel} from 'change-case';

export default function camelizeKeys(obj: Object): Object {
  return Object.keys(obj).reduce((memo, key) => {
    memo[camel(key)] = obj[key];
    return memo;
  }, {});
}
