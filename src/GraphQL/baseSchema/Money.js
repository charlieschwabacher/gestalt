// @flow

import GraphQLScalarType from 'graphql';

export default new GraphQLScalarType({
  name: 'Money',
  serialize: v => v,
  parseValue: v => v,
  parseLiteral: ast => ast.value,
});
