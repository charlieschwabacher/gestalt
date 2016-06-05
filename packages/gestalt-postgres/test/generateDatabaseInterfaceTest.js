import fs from 'fs';
import assert from 'assert';
import {parse} from 'graphql';
import {databaseInfoFromAST} from 'gestalt-graphql';
import generateDatabaseInterface from '../src/generateDatabaseInterface';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';

const schema = fs.readFileSync(`${__dirname}/fixtures/schema.graphql`, 'utf8');
const schemaAST = parse(schema);
const {objectDefinitions, relationships} = databaseInfoFromAST(schemaAST);

describe('generateDatabaseInterface', () => {
  it('generates a database schema definition from a GraphQL IDL AST', () => {
    assert.deepEqual(
      expectedDatabaseSchema,
      generateDatabaseInterface('', objectDefinitions, relationships).schema
    );
  });
});
