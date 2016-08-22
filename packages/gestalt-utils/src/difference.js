// @flow

export default function difference<A>(a: Array<A>, b: Array<A>): Array<A> {
  const set = new Set(b);
  return a.filter(x => !set.has(x));
}
