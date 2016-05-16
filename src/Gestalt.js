// @flow

import invariant from './util/invariant';
import ObjectType, {ObjectTypeConfig} from './ObjectType';
import Mutation, {MutationConfig} from './Mutation';

export default {
  objectTypes: {},
  mutations: {},

  registerObjectType(
    type: ObjectType,
    config: ObjectTypeConfig,
  ): void {
    const {name} = config;

    // ensure type has a unique name
    invariant(name, 'Type must be named.');
    invariant(!this.objectTypes[name], `Duplicate type '${name}'.`);

    this.objectTypes[name] = type;
  },

  registerMutation(
    mutation: Mutation,
    config: MutationConfig,
  ): void {
    const {name} = config;

    // ensure type has a unique name
    invariant(name, 'Mutation must be named.');
    invariant(!this.mutations[name], `Duplicate mutation '${name}'.`);

    this.mutations[name] = mutation;
  },
};
