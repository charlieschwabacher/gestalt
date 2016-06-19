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
        generateDatabaseSchemaMigration(expectedDatabaseSchema).sql
      );
    },
  );

  it('generates SQL updating an existing schema', () => {
    const schema = generateDatabaseSchemaMigration(
      updatedDatabaseSchema,
      expectedDatabaseSchema,
    );

    assert.equal(
      expectedSQLSchemaUpdate,
      generateDatabaseSchemaMigration(
        updatedDatabaseSchema,
        expectedDatabaseSchema,
      ).sql,
    );
  });
});
