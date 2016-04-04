import {GestaltObjectType} from '../../../src/GestaltObjectType';
import {GraphQLList, GraphQLString, GraphQLInt} from 'graphql';
import PostType from './PostType';
import CommentType from './CommentType';


const UserType = new GestaltObjectType({
  name: 'User',

  edges: () => ({
    // -[FOLLOWED]->(User)
    followedUsers: {
      type: new GraphQLList(UserType),
      path: [
        { label: 'FOLLOWED', direction: 'out' },
      ],
    },

    // <-[FOLLOWED]-(User)
    followers: {
      type: new GraphQLList(UserType),
      path: [
        { label: 'FOLLOWED', direction: 'in' },
      ],
    },

    // -[AUTHORED]->(Post)
    posts: {
      type: new GraphQLList(PostType),
      path: [
        { label: 'AUTHORED', direction: 'out'}
      ],
    },

    // -[FOLLOWED]->(User)-[AUTHORED]->(Post)
    feed: {
      type: new GraphQLList(PostType),
      path: [
        { label: 'FOLLOWED', direction: 'out', to: UserType},
        { label: 'AUTHORED', direction: 'out'},
      ],
    },

    // -[LIKED]->(Post)
    likes: {
      type: new GraphQLList(PostType),
      path: [
        { label: 'LIKED', direction: 'out' }
      ]
    },

    // -[AUTHORED]->(Comment)
    comments: {
      type: new GraphQLList(CommentType),
      path: [
        { label: 'AUTHORED', direction: 'out' }
      ]
    },
  }),

  fields: {
    firstName: {
      type: GraphQLString,
      args: {
        format: {
          type: GraphQLString,
        },
      },
    },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    createdAt: { type: GraphQLInt },
    fullName: {
      type: GraphQLString,
      resolve: u => [u.firstName, u.lastName].filter(n => n).join(' ')
    },
  }
});

export default UserType;
