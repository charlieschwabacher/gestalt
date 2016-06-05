import assert from 'assert';
import fs from 'fs';
import {graphql, parse} from 'graphql';
import generateGraphQLSchema from '../src/generateGraphQLSchema';

const databaseInterface = (objectDefinitions, relationships) => ({
  resolveNode: () => null,
  generateRelationshipResolver: () => () => null,
  generateRelationshipLoaders: () => new Map(),
});

const schemaPath = `${__dirname}/fixtures/schema.graphql`;
const schemaText = fs.readFileSync(schemaPath, 'utf8');

const queryPath = `${__dirname}/fixtures/query.graphql`;
const queryText = fs.readFileSync(queryPath, 'utf8');

describe('generateGraphQLSchema', () => {
  it('generates a graphql schema from a GraphQL IDL AST', async () => {
    const schema = generateGraphQLSchema(schemaText, [], [], databaseInterface);
    const context = {session: {id: '!'}};
    const result = await graphql(schema, queryText, null, context);
    assert(
      !result.errors,
      'should resolve query against generated schema without errors'
    );
  });
});
