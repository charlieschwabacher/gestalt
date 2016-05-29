// @flow

import type {GraphQLFieldResolveFn} from 'graphql/type/definition';
import type DataLoader from 'dataloader';

export type {GraphQLSchema, GraphQLObjectType} from 'graphql';
export type {GraphQLFieldResolveFn, GraphQLResolveInfo, GraphQLFieldConfig,
  GraphQLType} from 'graphql/type/definition';
export type {Document, Node, ObjectTypeDefinition, FieldDefinition, Directive,
  Type, NamedType} from 'graphql/language/ast';

// represents the interface between the GraphQL schema and database backend

export type DatabaseInterface = {
  schema: DatabaseSchema,
  edges: Edge[],
  resolveNode: GraphQLFieldResolveFn,
  generateEdgeResolver: (edge: Edge) => GraphQLFieldResolveFn,
  generateEdgeLoader: (edge: Edge) => DataLoader,
}

export type DatabaseSchema = {
  tables: Table[],
  indices: Index[],
}

export type Table = {
  name: string,
  columns: Column[],
  constraints?: Constraint[],
}

export type Index = {
  table: string,
  columns: string[],
}

export type Column = {
  name: string,
  type: ColumnType,
  primaryKey: boolean,
  nonNull: boolean,
  references?: {
    table: string,
    column: string,
  },
}

type Constraint = {
  type: 'unique',
  columns: string[],
}

export type ColumnType = 'uuid' | 'jsonb' | 'varchar(255)' | 'timestamp' |
  'text' | 'integer' | 'double precision' | 'money'

export type Edge = {
  fieldName: string,
  cardinality: 'singular' | 'plural',
  path: EdgeSegment[],
}

export type EdgeSegment = {
  fromType: string,
  toType: string,
  label: string,
  direction: 'in' | 'out',
  cardinality: 'singular' | 'plural',
  nonNull: boolean,
  signature: string,
}

export type EdgeSegmentPair = {
  in?: EdgeSegment,
  out?: EdgeSegment,
}

export type EdgeSegmentDescription = {
  type: 'join',
  signature: string,
  pair: EdgeSegmentPair,
  storage: JoinTableDescription,
} | {
  type: 'foreignKey',
  signature: string,
  pair: EdgeSegmentPair,
  storage: ForeignKeyDescription,
}

export type JoinTableDescription = {
  name: string,
  leftTableName: string,
  rightTableName: string,
  leftColumnName: string,
  rightColumnName: string,
}

export type ForeignKeyDescription = {
  direction: 'in' | 'out',
  table: string,
  referencedTable: string,
  column: string,
  nonNull: boolean,
}

export type EdgeSegmentDescriptionMap = {[key: string]: EdgeSegmentDescription}


// represents custom field resolution definitions for graphql object types
// defined using the IDL

export type ObjectTypeFieldResolutionDefinition = {
  name: string,
  fields: {[key: string]: GraphQLFieldResolveFn}
};


// intermediate representations used in SQL query generation

export type Query = {
  table: string,
  joins: Join[],
  condition: Condition,
}

export type Join = {
  table: string,
  condition: {
    left: {table: string, column: string},
    right: {table: string, column: string},
  },
}

export type Condition = {
  table: string,
  column: string,
}
