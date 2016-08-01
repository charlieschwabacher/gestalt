// @flow

export default function keyValMap<T>(
  list: Array<T>,
  keyFn: (item: T) => string,
  valFn: (item: T) => any,
): {[key: string]: T} {
  return list.reduce(
    (memo, item) => ((memo[keyFn(item)] = valFn(item)), memo),
    {}
  );
}
