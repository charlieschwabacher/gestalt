// @flow

import type {GraphQLFieldResolveFn, GraphQLType, GraphQLNamedType} from
  'graphql/type/definition';
import type {ObjectTypeDefinition} from 'graphql/language/ast';
import type {GraphQLFieldConfigMap, InputObjectConfigFieldMap,
  GraphQLResolveInfo} from 'graphql';
import type DataLoader from 'dataloader';

export type {GraphQLFieldResolveFn, GraphQLResolveInfo, GraphQLFieldConfig,
  GraphQLType} from 'graphql/type/definition';
export type {Document, Node, ObjectTypeDefinition, UnionTypeDefinition,
  EnumTypeDefinition, TypeDefinition, FieldDefinition, Directive, Type,
  NamedType} from 'graphql/language/ast';

import type {GraphQLSchema, GraphQLObjectType, GraphQLField} from 'graphql';
export type {GraphQLSchema, GraphQLObjectType, GraphQLField};


export type ConnectionArguments = {
  before?: ?string,
  after?: ?string,
  first?: ?number,
  last?: ?number,
  order?: ?string,
};

// represents the interface between the GraphQL schema and database backend

export type DatabaseInterface = {
  schema: DatabaseSchema,
  resolveNode: GraphQLFieldResolveFn,
  generateRelationshipResolver: (relationship: Relationship) =>
    GraphQLFieldResolveFn,
  prepareQueryContext?: (context: mixed) => mixed,
  db?: any,
};

export type DatabaseRelevantSchemaInfo = {
  relationships: Relationship[],
  objectTypes: {[key: string]: ObjectTypeDefinition},
  enumTypes: EnumTypeMap,
  polymorphicTypes: PolymorphicTypeMap,
};

// maps union or interface type name to array of member type names
export type PolymorphicTypeMap = {[key: string]: string[]};

// maps enum type name to array of values
export type EnumTypeMap = {[key: string]: string[]};

export type DatabaseInterfaceDefinitionFn = (
  schemaInfo: DatabaseRelevantSchemaInfo,
  config?: ?GestaltServerConfig,
) => DatabaseInterface;

export type DatabaseSchema = {
  tables: Table[],
  enums: Enum[],
  indices: Index[],
  extensions: string[],
};

export type Table = {
  name: string,
  columns: Column[],
  constraints: Constraint[],
};

export type Enum = {
  name: string,
  values: string[],
};

export type Index = {
  name?: string,
  table: string,
  columns: string[],
};

export type Column = {
  name: string,
  type: string,
  primaryKey: boolean,
  nonNull: boolean,
  unique: boolean,
  defaultValue?: ?string,
  references?: ?{
    table: string,
    column: string,
    name?: ?string,
  },
};

export type Constraint = {
  name?: string,
  type: 'UNIQUE',
  columns: string[],
};

export type DatabaseSchemaMigration = {
  sql: string,
  operations: DatabaseSchemaMigrationOperation[],
};

export type DatabaseSchemaMigrationOperation = CreateTable | AddColumn |
  ChangeColumnType | CreateIndex | AddUniquenessConstraint |
  RemoveUniquenessConstraint | AddForeignKeyConstraint |
  RemoveForeignKeyConstraint | MakeNullable | MakeNonNullable |
  CreateExtension | CreateEnum | AddEnumValue;

export type CreateTable = {
  type: 'CreateTable',
  table: Table,
};

export type AddColumn = {
  type: 'AddColumn',
  table: Table,
  column: Column,
};

export type ChangeColumnType = {
  type: 'ChangeColumnType',
  table: Table,
  column: Column,
  toType: string,
};

export type CreateIndex = {
  type: 'CreateIndex',
  index: Index,
};

// TODO: this should handle multi column constraints
export type AddUniquenessConstraint = {
  type: 'AddUniquenessConstraint',
  table: Table,
  column: Column,
};

// TODO: this should handle removing constraints by name
export type RemoveUniquenessConstraint = {
  type: 'RemoveUniquenessConstraint',
  table: Table,
  column: Column,
};

export type AddForeignKeyConstraint = {
  type: 'AddForeignKeyConstraint',
  table: Table,
  column: Column,
  references: {
    table: string,
    column: string,
  },
};

export type RemoveForeignKeyConstraint = {
  type: 'RemoveForeignKeyConstraint',
  table: Table,
  constraintName: string,
};

export type MakeNullable = {
  type: 'MakeNullable',
  table: Table,
  column: Column,
};

export type MakeNonNullable = {
  type: 'MakeNonNullable',
  table: Table,
  column: Column,
};

export type CreateExtension = {
  type: 'CreateExtension',
  extension: string,
}

export type CreateEnum = {
  type: 'CreateEnum',
  name: string,
  values: string[],
}

export type AddEnumValue = {
  type: 'AddEnumValue',
  name: string,
  value: string,
}

export type Relationship = {
  fieldName: string,
  cardinality: 'singular' | 'plural',
  path: RelationshipSegment[],
};

export type DescribedRelationship = {
  fieldName: string,
  cardinality: 'singular' | 'plural',
  describedPath: DescribedSegment[],
};

export type RelationshipSegment = {
  fromType: string,
  toType: string,
  label: string,
  direction: 'in' | 'out',
  cardinality: 'singular' | 'plural',
  nonNull: boolean,
};

export type DescribedSegment = {
  fromType: string,
  toType: string,
  label: string,
  direction: 'in' | 'out',
  cardinality: 'singular' | 'plural',
  nonNull: boolean,
  description: RelationshipSegmentDescription,
};

export type RelationshipSegmentPair = {
  in?: RelationshipSegment,
  out?: RelationshipSegment,
  left: string,
  right: string,
  label: string,
  signature: string,
};

export type RelationshipSegmentDescription = {
  type: 'join',
  pair: RelationshipSegmentPair,
  storage: JoinTableDescription,
} | {
  type: 'foreignKey',
  pair: RelationshipSegmentPair,
  storage: ForeignKeyDescription,
};

export type JoinTableDescription = {
  name: string,
  left: JoinTableDescriptionSide,
  right: JoinTableDescriptionSide,
};

export type JoinTableDescriptionSide = {
  isPolymorphic: false,
  table: string,
  column: string,
} | {
  isPolymorphic: true,
  tables: string[],
  column: string,
  typeColumn: string,
  typeColumnEnum: string,
};

export type ForeignKeyDescription = {
  isPolymorphic: false,
  direction: 'in' | 'out',
  table: string,
  referencedTable: string,
  column: string,
  nonNull: boolean,
} | {
  isPolymorphic: true,
  direction: 'in' | 'out',
  table: string,
  referencedTables: string[],
  column: string,
  typeColumn: string,
  typeColumnEnum: string,
  nonNull: boolean,
  unique: boolean,
};

export type RelationshipSegmentDescriptionMap = {
  [key: string]: RelationshipSegmentDescription
};

export type TypeMap = {[typeName: string]: GraphQLType};

// represents custom field resolution definitions for graphql object types
// defined using the IDL

export type ObjectTypeFieldResolutionDefinition = {
  name: string,
  fields: {[key: string]: GraphQLFieldResolveFn}
};

export type MutationDefinitionFn = (types: {[key: string]: GraphQLType}) =>
  MutationDefinition;

export type MutationDefinition = {
  name: string,
  inputFields: InputObjectConfigFieldMap,
  outputFields: GraphQLFieldConfigMap,
  mutateAndGetPayload:
    (object: Object, ctx: Object, info: GraphQLResolveInfo) => Object |
    (object: Object, ctx: Object, info: GraphQLResolveInfo) => Promise<Object>
};


// Intermediate representations used in SQL query generation
// this is not intended to represent all possible SQL queries - only the small
// subset we use for relationship resolution

export type Query = {
  table: string,
  selection: string,
  joins: Join[],
  conditions: QueryCondition[],
  defaultOrder: Order,
  order?: ?Order,
  limit?: ?number,
  reverseResults?: boolean,
};

export type Join = {
  type?: ?('LEFT' | 'RIGHT'), // assumed to be inner if not set
  table: string,
  alias?: ?string,
  conditions: JoinCondition[],
};

export type JoinConditionSide = {
  type: 'reference',
  table: string,
  column: string
} | {
  type: 'value',
  value: string
};

export type JoinCondition = {
  left: JoinConditionSide,
  right: JoinConditionSide,
};

export type QueryCondition = {
  table: string,
  alias?: ?string,
  column: string,
  operator: string,
  value: string,
};

export type Order = {
  column: string,
  direction: 'ASC' | 'DESC',
};


// config for gestalt server

export type GestaltServerConfig = {
  schemaPath?: string,
  schemaText?: string,
  objects?: ObjectTypeFieldResolutionDefinition[],
  mutations?: MutationDefinitionFn[],
  secret: string,
  database: DatabaseInterfaceDefinitionFn,
  development?: boolean,
};
