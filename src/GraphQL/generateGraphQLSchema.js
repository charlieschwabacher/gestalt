// @flow
// Generates a graphql schema from a type definition AST

import path from 'path';
import fs from 'fs';
import type {Document, GraphQLSchema, ObjectTypeDefinition,
  GraphQLFieldResolveFn, GraphQLFieldConfig, DatabaseInterface,
  ObjectTypeFieldResolutionDefinition, GraphQLType} from '../types';
import {buildASTSchema, concatAST, printSchema} from 'graphql';
import {insertConnectionTypes, removeHiddenNodes} from './ASTTransforms';
import scalarTypeDefinitions from './scalarTypeDefinitions';
import generateDatabaseInterface from '../PostgreSQL';
import {isDatabaseType, baseType} from
  '../PostgreSQL/generateDatabaseInterface';
import baseSchema from './baseSchema';


// generate a graphql schema given object types,
export default function generateGraphQLSchema(
  ast: Document,
  objects: ObjectTypeFieldResolutionDefinition[],
  mutations: GraphQLFieldConfig[],
): {schema: GraphQLSchema, database: DatabaseInterface} {
  const database = generateDatabaseInterface(ast);

  // preprocess the parsed AST to remove hidden types and insert implied types
  const modifiedAST = concatAST([baseSchema, ast]);
  removeHiddenNodes(modifiedAST);
  insertConnectionTypes(modifiedAST);

  // generate a GraphQLSchema instance from the GraphQL IDL AST
  const schema = buildASTSchema(modifiedAST);

  // add aditional definitions and attach resolution functions
  defineScalarTypes(schema);
  defineBaseSchemaResolution(schema, database);
  defineEdgeResolution(schema, database);
  defineNodeIDResolution(schema);
  attachObjectTypeFieldResolution(schema, objects);
  defineMutations(schema, mutations);

  // log generated schema
  // console.log(printSchema(schema));

  return {schema, database};
}

// attach serialization and parsing functions to scalar types defined by
// baseSchema.graphql
function defineScalarTypes(schema: GraphQLSchema): void {
  Object.entries(scalarTypeDefinitions).forEach(([typeName, definition]) => {
    const type = schema.getType(typeName);
    Object.assign(type._scalarConfig, definition);
  });
}

// define field resolution on object types defined by baseSchema.graphql
function defineBaseSchemaResolution(
  schema: GraphQLSchema,
  database: DatabaseInterface,
): void {
  defineFieldResolve(schema, 'QueryRoot', 'node', database.resolveNode);
  defineFieldResolve(schema, 'QueryRoot', 'session', resolveSession);
}

// generate resolve functions for connection fields
function defineEdgeResolution(
  schema: GraphQLSchema,
  database: DatabaseInterface,
): void {
  database.edges.forEach(edge => {
    defineFieldResolve(
      schema,
      edge.path[0].fromType,
      edge.fieldName,
      database.generateEdgeResolver(edge),
    );
  });
}

// we define id resolution to include both a type name and database uuid
function defineNodeIDResolution(schema: GraphQLSchema): void {
  const typeMap = schema.getTypeMap();
  const nodeInterface = typeMap.Node;

  nodeInterface.resolveType = obj => typeMap[obj._type];

  Object.values(typeMap).forEach((type: GraphQLType): void => {
    if (
      type.getInterfaces &&
      type.getInterfaces().includes(nodeInterface)
    ) {
      defineFieldResolve(
        schema,
        type.name,
        'id',
        obj => `${type.name}:${obj.id}`,
      );
    }
  });
}

// attach user defined field resolution
function attachObjectTypeFieldResolution(
  schema: GraphQLSchema,
  objects: ObjectTypeFieldResolutionDefinition[],
): void {
  objects.forEach(objectType => {
    const typeName = objectType.name;
    Object.entries(objectType.fields).forEach(([fieldName, resolve]) => {
      defineFieldResolve(schema, typeName, fieldName, resolve);
    });
  });
}

function defineMutations(
  schema: GraphQLSchema,
  mutations: GraphQLFieldConfig,
): void {

}

function defineFieldResolve(
  schema: GraphQLSchema,
  typeName: string,
  fieldName: string,
  resolve: GraphQLFieldResolveFn,
): void {
  const type = schema.getType(typeName);
  const field = type.getFields()[fieldName];
  field.resolve = resolve;
}

function hasDirective(
  directiveName: string,
  expected: boolean = true,
): (node: Node) => boolean {
  return (node: Node) =>
    (
      node.directives &&
      node.directives.some(
        directive => (directive.name.value === directiveName)
      )
    ) === expected;
}

function resolveSession(
  object: Object,
  args: Object,
  context: Object
): Object {
  return context.session;
}
