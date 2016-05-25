// @flow
// Generates a graphql schema from a type definition AST

import path from 'path';
import fs from 'fs';
import type {Document, GraphQLSchema, ObjectTypeDefinition,
  GraphQLFieldResolveFn, GraphQLFieldConfig, DatabaseInterface,
  ObjectTypeFieldResolutionDefinition} from '../types';
import {parse, buildASTSchema, concatAST, printSchema} from 'graphql';
import {insertConnectionTypes, removeHiddenNodes} from './ASTTransforms';
import scalarTypeDefinitions from './scalarTypeDefinitions';
import generateDatabaseInterface from '../PostgreSQL';
import resolveSession from '../server/resolveSession';
import {isDatabaseType, baseType} from
  '../PostgreSQL/generateDatabaseInterface';

const baseSchemaPath = path.resolve(__dirname, 'baseSchema.graphql');
const baseAST = parse(fs.readFileSync(baseSchemaPath, 'utf8'));



// generate a graphql schema given object types,
export default function generateGraphQLSchema(
  ast: Document,
  objectTypes: ObjectTypeFieldResolutionDefinition[],
  mutations: GraphQLFieldConfig[],
): GraphQLSchema {
  const database = generateDatabaseInterface(ast);

  // preprocess the parsed AST to remove hidden types and insert implied types
  const modifiedAST = concatAST([baseAST, ast]);
  removeHiddenNodes(modifiedAST);
  insertConnectionTypes(modifiedAST);

  // generate a GraphQLSchema instance from the GraphQL IDL AST
  const schema = buildASTSchema(modifiedAST);

  // add aditional definitions and attach resolution functions
  defineScalarTypes(schema);
  defineBaseSchemaResolution(schema, database);
  defineConnectionResolution(schema, database);
  attachObjectTypeFieldResolution(schema, objectTypes);
  defineMutations(schema, mutations);

  // log generated schema
  // console.log(printSchema(schema));

  return schema;
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
function defineConnectionResolution(
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

// attach user defined field resolution
function attachObjectTypeFieldResolution(
  schema: GraphQLSchema,
  objectTypes: ObjectTypeFieldResolutionDefinition[],
): void {
  objectTypes.forEach(objectType => {
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

export function defineFieldResolve(
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
