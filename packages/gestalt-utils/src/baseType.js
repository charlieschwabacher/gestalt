// @flow

import type {Type, NamedType} from './types';

export default function baseType(type: Type): NamedType {
  let next = type;
  while (next.type) {
    next = next.type;
  }
  return next;
}
