import fs from 'fs';
import assert from 'assert';
import DB from '../src/DB';
import {readExistingDatabaseSchema, normalizeSchemaForComparison} from
  '../src/readExistingDatabaseSchema';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';

const DATABASE_URL = 'postgres://localhost/gestalt_test';

const db = new DB({
  url: DATABASE_URL,
  log: false,
});

describe('postgres database interface', () => {
  before(async () => {
    await db.reset();
    await db.exec(
      fs.readFileSync(`${__dirname}/fixtures/schema.sql`) +
      fs.readFileSync(`${__dirname}/fixtures/seeds.sql`)
    );
  });

  describe('query', () => {
    it('returns an array of results', async () => {
      const result = await db.query('SELECT id FROM users');
      assert.deepEqual(
        result,
        [
          {id: '00000000-0000-0000-0000-000000000001'},
          {id: '00000000-0000-0000-0000-000000000002'},
          {id: '00000000-0000-0000-0000-000000000003'},
        ]
      );
    });

    it('can select a batch of results', async () => {
      const result = await db.query(
        'SELECT posts.id FROM posts WHERE posts.authored_by_user_id = ANY ($1)',
        [[
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
        ]]
      );
      assert.deepEqual(
        result,
        [
          {id: '00000000-0000-0000-0000-000000000004'},
          {id: '00000000-0000-0000-0000-000000000005'},
        ]
      );
    });
  });

  describe('readExistingDatabaseSchema', () => {
    it('reads the existing schema', async () => {
      assert.deepEqual(
        normalizeSchemaForComparison(
          await readExistingDatabaseSchema(DATABASE_URL)
        ),
        normalizeSchemaForComparison(expectedDatabaseSchema),
      );
    });
  });
});
