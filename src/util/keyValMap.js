// @flow
export default function keyValMap<T, V>(
  list: Array<T>,
  keyFn: (item: T) => string,
  valFn: (item: T) => V
): {[key: string]: V} {
  return list.reduce(
    (map, item) => ((map[keyFn(item)] = valFn(item)), map),
    {}
  );
}
