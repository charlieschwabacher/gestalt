// @flow

import GraphQLScalarType from 'graphql';

export default new GraphQLScalarType({
  name: 'Text',
  serialize: v => v,
  parseValue: v => v,
  parseLiteral: ast => ast.value,
});
