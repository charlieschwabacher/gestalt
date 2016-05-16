// @flow

import invariant from './util/invariant';
import ObjectType from './ObjectType';
import Mutation from './Mutation';

export default {
  objectTypes: {},
  mutations: {},
  _resolve: null,

  registerObjectType(
    type: ObjectType,
    config: {name: string, edges: [any]}
  ): void {
    const {name, edges} = config;

    // ensure type has a unique name
    invariant(name, 'Type must be named.');
    invariant(!this.objectTypes[name], `Duplicate type '${name}'.`);

    this.objectTypes[name] = type;
  },

  registerMutation(
    mutation: Mutation,
    config: {name: string}
  ): void {
    const {name} = config;

    // ensure type has a unique name
    invariant(name, 'Mutation must be named.');
    invariant(!this.mutations[name], `Duplicate mutation '${name}'.`);

    this.mutations[name] = mutation;
  },
};
