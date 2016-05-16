import Gestalt from './Gestalt';

export default class Mutation {
  constructor(config) {
    Gestalt.registerMutation(this, config);
  }
}
