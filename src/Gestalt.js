import invariant from './invariant';

export default {
  objectTypes: {},
  mutations: {},
  _resolve: null,

  use(resolve) {
    this._resolve = resolve;
  },

  resolve() {
    invariant(this._resolve, 'No database adapter provided to gestalt');
    return this._resolve(...arguments);
  },

  registerObjectType(type, config) {
    const {name, edges} = config;

    // ensure type has a unique name
    invariant(name, 'Type must be named.');
    invariant(!this.objectTypes[name], `Duplicate type '${name}'.`);

    this.objectTypes[name] = type;
  },

  registerMutation(mutation, config) {
    const {name} = config;

    // ensure type has a unique name
    invariant(name, 'Mutation must be named.');
    invariant(!this.mutations[name], `Duplicate mutation '${name}'.`);

    this.mutations[name] = type;
  },
}
