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
  const {objectDefinitions, relationships} = databaseInfoFromAST(schemaAST);
  return generateDatabaseInterface('', objectDefinitions, relationships).schema;
}

describe('generateDatabaseInterface', () => {
  it('generates a database schema definition from a GraphQL IDL AST', () => {
    assert.deepEqual(
      expectedDatabaseSchema,
      loadSchema(`${__dirname}/fixtures/schema.graphql`),
    );
    assert.deepEqual(
      updatedDatabaseSchema,
      loadSchema(`${__dirname}/fixtures/updatedSchema.graphql`),
    );
  });
});
