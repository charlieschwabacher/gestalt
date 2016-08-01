import fs from 'fs';
import assert from 'assert';
import {parse} from 'graphql';
import {databaseInfoFromAST} from 'gestalt-graphql';
import generateDatabaseInterface from '../src/generateDatabaseInterface';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';
import updatedDatabaseSchema from './fixtures/updatedDatabaseSchema';

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
      expectedDatabaseSchema,
    );
    assert.deepEqual(
      loadSchema(`${__dirname}/fixtures/updatedSchema.graphql`),
      updatedDatabaseSchema,
    );
  });
});
