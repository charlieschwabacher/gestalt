// @flow
// Generates a graphql schema from a type definition AST

import path from 'path';
import fs from 'fs';
import camel from 'camel-case';
import {parse, buildASTSchema, concatAST, printSchema, GraphQLObjectType,
  getNamedType, GraphQLSchema} from 'graphql';
import {mutationWithClientMutationId} from 'graphql-relay';
import {insertConnectionTypes, removeHiddenNodes} from './ASTTransforms';
import databaseInfoFromAST from './databaseInfoFromAST';
import scalarTypeDefinitions from './scalarTypeDefinitions';
import baseSchema from './baseSchema';
import type {Document, ObjectTypeDefinition, GraphQLField,
  GraphQLFieldResolveFn, MutationDefinitionFn, MutationDefinition,
  DatabaseInterface, DatabaseInterfaceDefinitionFn,
  ObjectTypeFieldResolutionDefinition, GraphQLType, TypeMap, Relationship,
  GestaltServerConfig} from 'gestalt-utils';

// generate a graphql schema given object types,
export default function generateGraphQLSchema(
  schemaText: string,
  objects: ObjectTypeFieldResolutionDefinition[],
  mutations: MutationDefinitionFn[],
  databaseInterfaceDefinitionFn: DatabaseInterfaceDefinitionFn,
  config?: GestaltServerConfig,
): {schema: GraphQLSchema, databaseInterface: DatabaseInterface} {
  const ast = parse(schemaText);

  // we take inventory of object definitions and relationships before the ast
  // is modified
  const {objectDefinitions, relationships} = databaseInfoFromAST(ast);
  const databaseInterface = databaseInterfaceDefinitionFn(
    objectDefinitions,
    relationships,
    config,
  );

  // this modifies the AST by prepending the base schema, removing hidden
  // fields, and inserting connection types
  const schema = generateGraphQLSchemaWithoutResolution(ast, mutations);

  // log generated schema
  // console.log(printSchema(schema));

  defineScalarTypes(schema);
  defineBaseSchemaResolution(schema, databaseInterface);
  defineRelationshipResolution(schema, relationships, databaseInterface);
  defineNodeIDResolution(schema);
  attachObjectTypeFieldResolution(schema, objects);

  return {schema, databaseInterface};
}

export function generateGraphQLSchemaWithoutResolution(
  ast: Document,
  mutations: MutationDefinitionFn[]
): GraphQLSchema {
  // preprocess the AST to remove hidden types and insert implied types
  const modifiedAST = concatAST([baseSchema, ast]);
  removeHiddenNodes(modifiedAST);
  insertConnectionTypes(modifiedAST);

  // generate GraphQLSchema
  const schema = buildASTSchema(modifiedAST);

  // create and attach mutations
  defineMutations(schema, mutations);

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
  defineFieldResolve(schema, 'Session', 'id', () => 'Session:!');
}

// generate resolve functions for connection fields
function defineRelationshipResolution(
  schema: GraphQLSchema,
  relationships: Relationship[],
  database: DatabaseInterface,
): void {
  relationships.forEach(relationship => {
    defineFieldResolve(
      schema,
      relationship.path[0].fromType,
      relationship.fieldName,
      database.generateRelationshipResolver(relationship),
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
      type.getInterfaces().includes(nodeInterface) &&
      type.name !== 'Session'
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

// attach user defined mutations to schema
function defineMutations(
  schema: GraphQLSchema,
  mutations: MutationDefinitionFn[],
): void {
  if (mutations.length === 0) {
    return;
  }

  const types = schema.getTypeMap();
  const MutationRoot = new GraphQLObjectType({
    name: 'MutationRoot',
    fields: mutations.reduce((memo, mutationDefinition) => {
      const definition = transformSimpleMutationDefinition(
        mutationDefinition(types)
      );
      memo[camel(definition.name)] = mutationWithClientMutationId(definition);
      return memo;
    }, {}),
  });

  schema._mutationType = MutationRoot;
  const newTypes = newTypesFromMutationType(MutationRoot);

  extendTypeMap(types, newTypesFromMutationType(MutationRoot));
}

// allow GraphQLTypes to be provided in place of InputObjectFieldConfigs or
// GraphQLFieldConfigs as part of the mutation config.  If a GraphQLType is
// provided directly, it implies {type: GraphQLType} and leavs all other options
// blank.
function transformSimpleMutationDefinition(
  definition: MutationDefinition,
): MutationDefinition {
  Object.keys(definition.inputFields).forEach(key => {
    const field = definition.inputFields[key];
    if (field.type == null) {
      definition.inputFields[key] = {type: field};
    }
  });
  Object.keys(definition.outputFields).forEach(key => {
    const field = definition.outputFields[key];
    if (field.type == null) {
      definition.outputFields[key] = {type: field};
    }
  });
  return definition;
}

function extendTypeMap(
  typeMap: TypeMap,
  types: GraphQLType[],
): void {
  types.forEach(type => {
    if (typeMap[type.name]) {
      if (typeMap[type.name] !== type) {
        throw new Error(`Duplicate definition of '${type.name}'`);
      }
      return;
    }

    typeMap[type.name] = type;
  });
}

function newTypesFromMutationType(
  mutationType: GraphQLObjectType
): GraphQLType[] {
  const fields: GraphQLField[] = Object.values(mutationType.getFields());

  return fields.reduce((memo, field) =>
    memo.concat(
      field.type,
      getNamedType(field.args[0].type),
    )
  , [mutationType]);
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

function resolveSession(
  object: Object,
  args: Object,
  context: Object
): Object {
  return context.session;
}
