// @flow

export default function group<T>(
  list: Array<T>,
  keyFn: (item: T) => string
): {[key: string]: T[]} {
  return list.reduce((map, item) => {
    const key = keyFn(item);
    const arr = map[key] = map[key] || [];
    arr.push(item);
    return map;
  }, {});
}
