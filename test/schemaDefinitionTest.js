import 'colors';
import {assert} from 'chai';
import path from 'path';
import fs from 'fs';
import {graphql} from 'graphql';
import {parse} from 'graphql/language/parser';
import generateGraphQLSchema from '../src/GraphQL/generateGraphQLSchema';
import generateDatabaseInterface from '../src/PostgreSQL';
import generateDatabaseSchemaMigration from
  '../src/PostgreSQL/generateDatabaseSchemaMigration';
import expectedDatabaseSchema from './BlogsSchema/expectedDatabaseSchema';

const definitionPath = path.resolve(__dirname, 'BlogsSchema/schema.graphql');
const definitionAST = parse(fs.readFileSync(definitionPath, 'utf8'));

const sqlSchemaPath = path.resolve(__dirname, 'BlogsSchema/schema.sql');
const expectedSQLSchema = fs.readFileSync(sqlSchemaPath, 'utf8');

const graphQLQueryPath = path.resolve(__dirname, 'BlogsSchema/query.graphql');
const graphQLQuery = fs.readFileSync(graphQLQueryPath, 'utf8');


describe('schema definition', () => {

  it('generates a database schema definition from a GraphQL IDL AST', () => {
    assert.deepEqual(
      expectedDatabaseSchema,
      generateDatabaseInterface(definitionAST).schema
    );
  });

  it('generates SQL from a database schema definition', () => {
    assert.equal(
      expectedSQLSchema,
      generateDatabaseSchemaMigration(expectedDatabaseSchema)
    );
  });

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
