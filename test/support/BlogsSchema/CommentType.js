import {GestaltObjectType} from '../../../src/GestaltObjectType';
import {GraphQLList, GraphQLString, GraphQLInt} from 'graphql';
import UserType from './UserType';
import PostType from './PostType';


export default new GestaltObjectType({
  name: 'Comment',

  edges: () => ({
    // <-[AUTHORED]-(User)
    author: {
      type: UserType,
      path: [
        { label: 'AUTHORED', direction: 'in' },
      ],
    },

    // -[COMMENT_ON]->(Post)
    subject: {
      type: PostType,
      path: [
        { label: 'COMMENT_ON', direction: 'out' }
      ]
    },
  }),

  fields: {
    text: { type: GraphQLString },
    createdAt: { type: GraphQLInt },
  },
});
