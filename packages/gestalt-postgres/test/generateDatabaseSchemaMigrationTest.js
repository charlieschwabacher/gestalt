import fs from 'fs';
import assert from 'assert';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';
import generateDatabaseSchemaMigration from
  '../src/generateDatabaseSchemaMigration';

const expectedSQLSchema =
  fs.readFileSync(`${__dirname}/fixtures/schema.sql`, 'utf8');

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
});
