import fs from 'fs';
import assert from 'assert';
import {parse} from 'graphql';
import {databaseInfoFromAST} from 'gestalt-graphql';
import generateDatabaseInterface from '../src/generateDatabaseInterface';
import expectedSchema from './fixtures/schema';
import expectedUpdatedSchema from './fixtures/schemaUpdate';

function loadSchema(path) {
  const schema = fs.readFileSync(path, 'utf8');
  const schemaAST = parse(schema);
  const schemaInfo = databaseInfoFromAST(schemaAST);
  return generateDatabaseInterface('', schemaInfo).schema;
}

describe('generateDatabaseInterface', () => {
  it('generates a database schema definition from a GraphQL IDL AST', () => {
    assert.deepEqual(
      loadSchema(`${__dirname}/fixtures/schema.graphql`),
      expectedSchema,
    );
    assert.deepEqual(
      loadSchema(`${__dirname}/fixtures/schemaUpdate.graphql`),
      expectedUpdatedSchema,
    );
  });
});
