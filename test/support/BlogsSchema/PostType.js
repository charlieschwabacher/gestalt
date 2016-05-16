import {GestaltObjectType} from '../../../src/GestaltObjectType';
import {GraphQLList, GraphQLString, GraphQLInt} from 'graphql';
import UserType from './UserType';
import CommentType from './CommentType';


export default new GestaltObjectType({
  name: 'Post',

  edges: () => ({
    // <-[AUTHORED]-(User)
    author: {
      type: UserType,
      path: [
        { label: 'AUTHORED', direction: 'in' },
      ],
    },

    // <-[COMMENT_ON]-(Post)
    comments: {
      type: CommentType,
      path: [
        { label: 'COMMENT_ON', direction: 'in' }
      ]
    },
  }),

  fields: {
    title: { type: GraphQLString },
    text: { type: GraphQLString },
    createdAt: { type: GraphQLInt },
  },
});
