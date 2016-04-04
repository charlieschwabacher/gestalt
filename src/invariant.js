export default function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
