// @flow
export default function compact<T>(array: Array<?T>): Array<T> {
  const nextArray = [];
  array.forEach(member => {
    if (member != null) {
      nextArray.push(member);
    }
  });
  return nextArray;
}
