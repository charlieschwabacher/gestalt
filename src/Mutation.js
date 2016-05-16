import Gestalt from './Gestalt';

export type MutationConfig = {
  name: string,
};

export default class Mutation {
  constructor(config) {
    Gestalt.registerMutation(this, config);
  }
}
