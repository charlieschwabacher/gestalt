// Generates a graphql schema from a type definition AST
// @flow

import {GraphQLSchema} from 'graphql';

export default function generateGraphQLSchema(ast: Object): GraphQLSchema {
  return new GraphQLSchema();
}
