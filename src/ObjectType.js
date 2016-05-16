import Gestalt from './Gestalt';

export type ObjectTypeConfig = {
  name: string,
};

export default class ObjectType {
  constructor(config) {
    Gestalt.registerObjectType(this, config);
  }
}
