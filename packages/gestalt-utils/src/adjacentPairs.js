// @flow

export default function adjacentPairs<T>(array: Array<T>): Array<[T, T]> {
  return array.slice(1).map((member, i) => [array[i], member]);
}
