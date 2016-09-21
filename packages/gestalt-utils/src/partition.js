// @flow

export default function group<T>(
  list: T[],
  paritionFn: (item: T) => boolean,
): [T[], T[]] {
  return list.reduce((memo, item) => {
    memo[paritionFn(item) ? 0 : 1].push(item);
    return memo;
  }, [[], []]);
}
