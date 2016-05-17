// @flow

import GraphQLScalarType from 'graphql';

export default new GraphQLScalarType({
  name: 'Date',
  serialize: v => v,
  parseValue: v => v,
  parseLiteral: ast => ast.value,
});
