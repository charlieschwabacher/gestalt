// @flow

import {GraphQLObjectType, GraphQLObjectTypeConfig} from 'graphql';
import {globalIdField} from 'graphql-relay';
import invariant from './util/invariant';

export default class SessionType extends GraphQLObjectType {
  constructor(config: GraphQLObjectTypeConfig) {
    super({
      name: 'Session',
      config,
    });
  }
}
