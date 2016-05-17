// Generates a graphql schema from a type definition AST
// @flow

import type {GraphQLObjectTypeConfig} from 'graphql/type/definition';
import type {Document, ObjectTypeDefinition, InterfaceTypeDefinition,
  UnionTypeDefinition, EnumTypeDefinition} from 'graphql/language/ast';
import type {MutationConfig} from './types';
import {GraphQLSchema, GraphQLObjectType, GraphQLInterfaceType,
  GraphQLUnionType, GraphQLEnumType, GraphQLNonNull, GraphQLID} from 'graphql';
import NodeInterface from './baseSchema/NodeInterface';
import resolveNode from '../PostgreSQL/resolveNode';
import generateEdgeResolver from '../PostgreSQL/generateEdgeResolver';


export default function generateGraphQLSchema(
  ast: Document,
  mutations: {[key: string]: MutationConfig},
  objects: {[key: string]: GraphQLObjectTypeConfig},
): GraphQLSchema {
  return new GraphQLSchema({
    query: generateQueryRoot(),
    mutation: generateMutationRoot(),
  });
}

export function generateQueryRoot(): GraphQLObjectType {
  return new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      node: {
        type: NodeInterface,
        args: {
          id: {type: new GraphQLNonNull(GraphQLID)}
        },
        resolve: ast => resolveNode(ast.id),
      },
      session: {} // TODO
    }),
  });
}

export function generateMutationRoot(): GraphQLObjectType {
  return new GraphQLObjectType({
    name: 'Mutation',
    fields: {}
  });
}

export function generateObjectType(
  definition: ObjectTypeDefinition,
  typeMap: {[key: string]: Object}
): GraphQLObjectType {

}

export function generateInterfaceType(
  definition: InterfaceTypeDefinition
): GraphQLInterfaceType {

}

export function generateUnionType(
  definition: UnionTypeDefinition
): GraphQLUnionType {

}

export function generateEnumType(
  definition: EnumTypeDefinition
): GraphQLEnumType {

}
