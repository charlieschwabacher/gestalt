// exports the AST of a base schema
// @flow

import {parse} from 'graphql';

export default parse(`
directive @virtual on FIELD_DEFINITION
directive @hidden on OBJECT | FIELD_DEFINITION
directive @relationship(path: String) on FIELD_DEFINITION

scalar Date
scalar Money
scalar Text
scalar Geo

schema {
  query: QueryRoot
}

type QueryRoot {
  node(id: ID!): Node
  session: Session
}

interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
`);
