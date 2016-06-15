// @flow

export default function sortBy<T>(
  arr: Array<T>,
  fn: (item: T) => any,
): Array<T> {
  return arr.slice(0).sort((a, b) => {
    const aKey = fn(a);
    const bKey = fn(b);
    if (aKey < bKey || aKey == null && bKey != null) {
      return -1;
    } else if (aKey > bKey || aKey != null && bKey == null) {
      return 1;
    }
    return 0;
  });
}
