import fs from 'fs';
import assert from 'assert';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';
import updatedDatabaseSchema from './fixtures/updatedDatabaseSchema';

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
        generateDatabaseSchemaMigration(expectedDatabaseSchema)
      );
    },
  );

  it('generates SQL updating an existing schema', () => {
    assert.equal(
      expectedSQLSchemaUpdate,
      generateDatabaseSchemaMigration(
        expectedDatabaseSchema,
        updatedDatabaseSchema,
      ),
    );
  });
});
