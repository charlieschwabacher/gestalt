import Gestalt from './Gestalt';

export default class GestaltMutation {
  constructor(config) {
    Gestalt.registerMutation(this, config);
  }
}
