import {GraphQLObjectType} from 'graphql';
import {globalIdField} from 'graphql-relay';
import invariant from './invariant';

export default class GestaltSessionType extends GraphQLObjectType {
  constructor(fields) {
    super({
      name: 'Session',
      fields: fields,
    });
  }
}
