// @flow

import {
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLID
} from 'graphql';

export default new GraphQLInterfaceType({
  name: 'Node',
  description: 'An object with an ID',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The id of the object.',
    },
  }),
  resolveType: v => v,
});
