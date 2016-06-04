// @flow

export default function setMap<A, B>(
  list: Array<A>,
  valFn: (item: A) => B,
): Set<B> {
  const set = new Set();
  list.forEach(item => set.add(valFn(item)));
  return set;
}
