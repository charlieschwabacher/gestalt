// @flow

export default function keyMap<T>(
  list: Array<T>,
  keyFn: (item: T) => string
): {[key: string]: T} {
  return list.reduce((map, item) => ((map[keyFn(item)] = item), map), {});
}
