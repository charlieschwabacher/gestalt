import 'colors';
import path from 'path';
import fs from 'fs';
import {assert} from 'chai';
import {graphql, parse} from 'graphql';
import generateGraphQLSchema from '../src/GraphQL/generateGraphQLSchema';
import generateDatabaseInterface from '../src/PostgreSQL';
import generateDatabaseSchemaMigration from
  '../src/PostgreSQL/generateDatabaseSchemaMigration';
import {segmentDescriptionsFromRelationships} from
  '../src/PostgreSQL/generateDatabaseInterface';
import {sqlQueryFromRelationship} from '../src/PostgreSQL/generateRelationshipResolver';
import {keyMap} from '../src/util';
import expectedDatabaseSchema from './BlogsSchema/expectedDatabaseSchema';

function readFileAsString(filePath) {
  return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
}

const definitionAST = parse(readFileAsString('BlogsSchema/schema.graphql'));
const expectedSQLSchema = readFileAsString('BlogsSchema/schema.sql');
const expectedSQLQueries = readFileAsString('BlogsSchema/expectedQueries.sql');
const graphQLQuery = readFileAsString('BlogsSchema/query.graphql');


describe('schema definition', () => {

  it('generates a database schema definition from a GraphQL IDL AST', () => {
    assert.deepEqual(
      expectedDatabaseSchema,
      generateDatabaseInterface(definitionAST).schema
    );
  });

  it(
    'generates SQL creating tables and indices from a schema definition',
    () => {
      assert.equal(
        expectedSQLSchema,
        generateDatabaseSchemaMigration(expectedDatabaseSchema)
      );
    },
  );

  it('generates SQL queries to resolve relationships', () => {
    const database = generateDatabaseInterface(definitionAST);
    const relationships = database.relationships;
    const segmentDescriptionsBySignature = keyMap(
      segmentDescriptionsFromRelationships(relationships),
      segment => segment.signature,
    );
    const sqlQueries = relationships.map(
      relationship => sqlQueryFromRelationship(
        segmentDescriptionsBySignature,
        relationship
      )
    );
    assert.deepEqual(
      sqlQueries,
      expectedSQLQueries
        .replace(/\n$/, '')
        .split('\n\n')
        .map(s => s.replace(/\n/g, ' ')),
    );
  });

  it('generates a graphql schema from a GraphQL IDL AST', async () => {
    const {schema} = generateGraphQLSchema(definitionAST, [], []);
    const context = {session: {id: '!'}};
    const result = await graphql(schema, graphQLQuery, null, context);
    assert(
      !result.errors,
      'should resolve query against generated schema without errors'
    );
  });

});
