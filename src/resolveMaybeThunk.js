export default function resolveMaybeThunk<T>(thingOrThunk: T | () => T): T {
  return typeof thingOrThunk === 'function' ? thingOrThunk() : thingOrThunk;
}
