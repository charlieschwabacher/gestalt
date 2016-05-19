// @flow
// Generates a graphql schema from a type definition AST

import path from 'path';
import fs from 'fs';
import type {Document} from 'graphql/language/ast';
import type {GraphQLFieldResolveFn} from 'graphql/type/definition';
import type {GraphQLSchema, GraphQLFieldConfig} from 'graphql';
import {parse} from 'graphql/language';
import {buildASTSchema, concatAST, printSchema} from 'graphql/utilities';
import scalarTypeDefinitions from './scalarTypeDefinitions';
import resolveSession from '../server/resolveSession';
import resolveNode from '../PostgreSQL/resolveNode';
import generateEdgeResolver from '../PostgreSQL/generateEdgeResolver';
import {isDatabaseType, baseType} from '../PostgreSQL/generateDatabaseSchema';

const baseSchemaPath = path.resolve(__dirname, 'baseSchema.graphql');
const baseAST = parse(fs.readFileSync(baseSchemaPath, 'utf8'));

type ObjectTypeFieldResolutionInfo = {
  name: string,
  fields: {[key: string]: GraphQLFieldResolveFn}
};

// generate a graphql schema given object types,
export default function generateGraphQLSchema(
  ast: Document,
  objectTypes: ObjectTypeFieldResolutionInfo[],
  mutations: GraphQLFieldConfig[],
): GraphQLSchema {
  const modifiedAST = concatAST([baseAST, ast]);
  removeHiddenNodes(modifiedAST);
  insertConnectionTypes(modifiedAST);
  const schema = buildASTSchema(modifiedAST);

  defineScalarTypes(schema);
  defineBaseSchemaResolution(schema);
  defineEdgeResolution(schema, ast);
  attachObjectTypeFieldResolutionInfo(schema, objectTypes);
  defineMutations(schema, mutations);

  console.log(printSchema(schema));

  return schema;
}

function removeHiddenNodes(ast: Document): void {
  const visible = hasDirective('hidden', false);

  // remove hidden types
  ast.definitions = ast.definitions.filter(visible);

  // remove hidden fields
  ast.definitions.forEach(definition => {
    if (definition.fields) {
      definition.fields = definition.fields.filter(visible);
    }
  });
}

function insertConnectionTypes(ast: Document): void {
  const newDefinitions = [];
  const definedConnections = new Set;

  ast.definitions.forEach(definition => {
    definition.fields && definition.fields.forEach(field => {
      if (hasDirective('edge')(field)) {
        const rootType = baseType(field.type);
        const typeName = rootType.name.value;
        rootType.name = {kind: 'Name', value: `${typeName}Connection`};
        if (!definedConnections.has(typeName)) {
          definedConnections.add(typeName);
          newDefinitions.push(...makeConnectionDefintionASTNodes(typeName));
        }
      }
    });
  });

  ast.definitions.push(...newDefinitions);
}

function makeConnectionDefintionASTNodes(
  typeName: string
): [ObjectTypeDefinition, ObjectTypeDefinition] {
  return [
    {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: `${typeName}Connection`},
      fields: [
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'edges'},
          arguments: [],
          type: {
            kind: 'ListType',
            type: {
              kind: 'NamedType',
              name: {kind: 'Name', value: `${typeName}Edge`}
            }
          },
        },
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'pageInfo'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: 'PageInfo'}
          },
        },
      ],
      interfaces: [],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: `${typeName}Edge`},
      fields: [
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'node'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: typeName}
          },
        },
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'cursor'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: 'String'}
          },
        },
      ],
      interfaces: [],
    }
  ];
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
function defineBaseSchemaResolution(schema: GraphQLSchema): void {
  defineFieldResolve(schema, 'QueryRoot', 'node', resolveNode);
  defineFieldResolve(schema, 'QueryRoot', 'session', resolveSession);
}

// attach user defined field resolve functions
function attachObjectTypeFieldResolutionInfo(
  schema: GraphQLSchema,
  objectTypes: ObjectTypeFieldResolutionInfo[]
): void {
  objectTypes.forEach(objectType => {
    const typeName = objectType.name;
    Object.entries(objectType.fields).forEach(([fieldName, resolve]) => {
      defineFieldResolve(schema, typeName, fieldName, resolve);
    });
  });
}

// generate resolve functions for connection fields
// TODO: refactor this - we should keep around matched edge pairs from db schema
// creation and use here for much more straightforward definition
function defineEdgeResolution(schema: GraphQLSchema, ast: Document): void {
  // ast.definitons
  //   .filter(isDatabaseType)
  //   .forEach(definition => {
  //     const typeName = definition.name.value;
  //     definition.fields
  //       .filter(hasDirective('edge'))
  //       .forEach(field => {
  //         const fieldName = field.name.value;
  //         defineFieldResolve(
  //           schema,
  //           typeName,
  //           fieldName,
  //           generateEdgeResolver();
  //         );
  //       });
  //   });
}

function defineMutations(
  schema: GraphQLSchema,
  mutations: GraphQLFieldConfig
): void {

}

export function defineFieldResolve(
  schema: GraphQLSchema,
  typeName: string,
  fieldName: string,
  resolve: GraphQLFieldResolveFn
): void {
  const type = schema.getType(typeName);
  const field = type.getFields()[fieldName];
  field.resolve = resolve;
}

function hasDirective(
  directiveName: string,
  expected: boolean = true
): (node: Node) => boolean {
  return (node: Node) =>
    (
      node.directives &&
      node.directives.some(
        directive => (directive.name.value === directiveName)
      )
    ) === expected;
}
