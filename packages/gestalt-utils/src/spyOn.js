// @flow

type Spy = {
  stop: () => void,
  calls: mixed[],
};

export default function spyOn(
  object: Object,
  methodName: string,
): Spy {
  const method = object[methodName];

  const spy = {
    calls: [],
    stop: () => {
      object[methodName] = method;
    }
  };

  object[methodName] = function() {
    spy.calls.push(arguments);
    return method.apply(object, arguments);
  };

  return spy;
}
