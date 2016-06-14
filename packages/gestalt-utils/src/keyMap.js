// @flow

export default function keyMap<T>(
  list: Array<T>,
  keyFn: (item: T) => string
): {[key: string]: T} {
  return list.reduce(
    (memo, item) => ((memo[keyFn(item)] = item), memo),
    {}
  );
}
