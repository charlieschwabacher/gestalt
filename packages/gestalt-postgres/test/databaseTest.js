import fs from 'fs';
import assert from 'assert';
import DB from '../src/DB';
import readExistingDatabaseSchema, {normalizeSchemaForComparison} from
  '../src/readExistingDatabaseSchema';
import expectedDatabaseSchema from './fixtures/expectedDatabaseSchema';

const DATABASE_URL = 'postgres://localhost/gestalt_test';

const db = new DB({
  url: DATABASE_URL,
  log: false,
});

describe('postgres database interface', () => {
  before(async () => {
    // reset database
    await db.exec(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
      COMMENT ON SCHEMA public IS 'standard public schema';
    `);
    // load schema and seeds
    await db.exec(
      fs.readFileSync(`${__dirname}/fixtures/schema.sql`) +
      fs.readFileSync(`${__dirname}/fixtures/seeds.sql`)
    );
  });

  describe('find', () => {
    it('returns a single result', async () => {
      const result = await db.find(
        'SELECT email FROM users WHERE id = $1;',
        ['00000000-0000-0000-0000-000000000001']
      );
      assert.deepEqual(result, {email: 'test1@test.com'});
    });

    it('throws an error when zero rows are selected', async () => {
      try {
        await db.find(
          'SELECT * FROM users WHERE id = $1;',
          ['00000000-0000-0000-0000-000000000004'],
        );
      } catch (e) {
        assert.equal(e.message, 'find should select a single row');
        return;
      }
      throw 'db.find did not raise error as expected';
    });

    it('throws an error when more than one row is selected', async () => {
      try {
        await db.find(
          'SELECT * FROM users WHERE id = ANY ($1);',
          [[
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
          ]],
        );
      } catch (e) {
        assert.equal(e.message, 'find should select a single row');
        return;
      }
      throw 'db.find did not raise error as expected';
    });
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

  describe('count', () => {
    it('counts rows', async () => {
      const result = await db.count('SELECT count(*) FROM users;');
      assert.equal(result, 3);
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
