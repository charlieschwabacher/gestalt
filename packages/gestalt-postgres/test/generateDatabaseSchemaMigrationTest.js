import fs from 'fs';
import assert from 'assert';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';
import expectedSchema from './fixtures/schema';
import expectedUpdatedSchema from './fixtures/schemaUpdate';

const expectedSQLSchema =
  fs.readFileSync(`${__dirname}/fixtures/schema.sql`, 'utf8');

const expectedSQLSchemaUpdate =
  fs.readFileSync(`${__dirname}/fixtures/schemaUpdate.sql`, 'utf8');

describe('generateDatabaseSchemaMigration', () => {
  it(
    'generates SQL creating tables and indices from a schema definition',
    () => {
      assert.equal(
        expectedSQLSchema,
        generateDatabaseSchemaMigration(expectedSchema).sql
      );
    },
  );

  it('generates SQL updating an existing schema', () => {
    const schema = generateDatabaseSchemaMigration(
      expectedUpdatedSchema,
      expectedSchema,
    );

    assert.equal(
      expectedSQLSchemaUpdate,
      generateDatabaseSchemaMigration(
        expectedUpdatedSchema,
        expectedSchema,
      ).sql,
    );
  });
});
