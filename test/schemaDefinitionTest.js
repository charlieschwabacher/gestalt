import 'colors';
import path from 'path';
import fs from 'fs';
import {assert} from 'chai';
import {graphql, parse} from 'graphql';
import generateGraphQLSchema from '../src/GraphQL/generateGraphQLSchema';
import generateDatabaseInterface from '../src/PostgreSQL';
import generateDatabaseSchemaMigration from
  '../src/PostgreSQL/generateDatabaseSchemaMigration';
import {segmentDescriptionsFromEdges} from
  '../src/PostgreSQL/generateDatabaseInterface';
import {sqlQueryFromEdge} from '../src/PostgreSQL/generateEdgeResolver';
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

  // it('generates SQL queries to resolve edges', () => {
  //   const edges = generateDatabaseInterface(definitionAST).edges;
  //   const segmentDescriptionsBySignature = keyMap(
  //     segmentDescriptionsFromEdges(edges),
  //     segment => segment.signature,
  //   );
  //   const sqlQueries = edges.map(
  //     edge => sqlQueryFromEdge(segmentDescriptionsBySignature, edge)
  //   );
  //   assert.deepEqual(
  //     sqlQueries,
  //     expectedSQLQueries
  //       .replace(/\n$/, '')
  //       .split('\n\n')
  //       .map(s => s.replace(/\n/g, ' ')),
  //   );
  // });

  it('generates a graphql schema from a GraphQL IDL AST', done => {
    const schema = generateGraphQLSchema(definitionAST, [], []);
    graphql(schema, graphQLQuery).then(result => {
      console.log(result);
      done();
    }).catch(e => {
      throw e;
    });
  });

});
