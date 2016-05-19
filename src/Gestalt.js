// @flow
import {graphql, GraphQLSchema} from 'graphql';
import {parse} from 'graphql/language/parser';
import generateGraphQLSchema from './GraphQL/generateGraphQLSchema';

export default class Gestalt {
  schema: GraphQLSchema;

  constructor(definitionString: string) {
    const ast = parse(definitionString);
    this.schema = generateGraphQLSchema(ast, [], []);
  }

  start(config: {port: number}): void {

  }

  registerObjectType(): void {

  }

  registerMutation(): void {

  }
}
