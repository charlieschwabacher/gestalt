// @flow

export default function invariant(condition: boolean, message: string): void {
  if (!condition) {
    console.warn(message);
  }
}
