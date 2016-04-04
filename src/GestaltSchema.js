import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import Gestalt from './Gestalt';
import GestaltSessionType from './GestaltSessionType';
import nodeInterface from './nodeInterface';

export default class GestaltSchema extends GraphQLSchema {
  constructor(sessionFields) {
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
            const {id} = args;
            return Gestalt.resolve(obj, id, info);
          },
        },
        session: {
          type: new GestaltSessionType(sessionFields),
          resolve: (obj, args, plan) => {
            return {id: '!', currentUserId: '!'};
          },
        },
      },
    });

    // const MutationRoot = new GraphQLObjectType({
    //   name: 'MutationRoot',
    //   fields: Gestalt.mutations,
    // });

    super({
      query: QueryRoot,
      // mutation: MutationRoot
    });
  }
}
