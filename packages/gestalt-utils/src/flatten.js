// @flow
export default function flatten<T>(array: Array<Array<T>>): Array<T> {
  return array.reduce((memo, arr) => memo.concat(arr), []);
}
