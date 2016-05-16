// @flow

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import Gestalt from './Gestalt';
import SessionType from './SessionType';
import nodeInterface from './nodeInterface';

export default class Schema extends GraphQLSchema {
  constructor(sessionTypeConfig: GraphQLObjectTypeConfig) {
    const QueryRoot = new GraphQLObjectType({
      name: 'QueryRoot',
      fields: {
        node: {
          type: nodeInterface,
          args: {
            id: {
              type: new GraphQLNonNull(GraphQLID),
              description: 'The ID of an object'
            }
          },
          resolve: (obj, args, plan) => {

          },
        },
        session: {
          type: new SessionType(sessionTypeConfig),
          resolve: (obj, args, plan) => {
            return {id: '!', currentUserId: '!'};
          },
        },
      },
    });

    const MutationRoot = new GraphQLObjectType({
      name: 'MutationRoot',
      fields: Gestalt.mutations,
    });

    super({
      query: QueryRoot,
      mutation: MutationRoot
    });
  }
}
