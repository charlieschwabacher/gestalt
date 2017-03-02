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
    // reset database, load schema and seeds
    await db.exec([
      'DROP SCHEMA public CASCADE;',
      'CREATE SCHEMA public;',
      'GRANT ALL ON SCHEMA public TO postgres;',
      'GRANT ALL ON SCHEMA public TO public;',
      'COMMENT ON SCHEMA public IS \'standard public schema\';',
      fs.readFileSync(`${__dirname}/fixtures/schema.sql`) +
      fs.readFileSync(`${__dirname}/fixtures/seeds.sql`)
    ].join('\n'));
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
          {id: '00000000-0000-0000-0000-000000000007'},
          {id: '00000000-0000-0000-0000-000000000008'},
          {id: '00000000-0000-0000-0000-000000000010'},
          {id: '00000000-0000-0000-0000-000000000011'},
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

  describe('insert', () => {
    it('adds rows', async () => {
      const input = {
        email: 'a@test.com',
        passwordHash: 'abcd',
        createdAt: new Date,
        favoriteFood: '"SALAD"',
        location: {
          city: 'Los Angeles',
          state: 'CA',
        }
      };
      const result = await db.insert('users', input);
      assert.equal(await db.count('SELECT count(*) FROM users;'), 4);
      assert.notEqual(result.id, null);
      assert.equal(result.email, 'a@test.com');
    });
  });

  describe('update', () => {
    it('updates rows', async () => {
      const result = await db.update(
        'users',
        {email: 'a@test.com'},
        {firstName: 'Jane'}
      );
      assert.equal(result.length, 1);
      assert.notEqual(result[0].id, null);
      assert.equal(result[0].firstName, 'Jane');
    });
  });

  describe('deleteBy', async () => {
    const result = await db.deleteBy('users', {email: 'a@test.com'});
    assert.equal(await db.count('SELECT count(*) FROM users;'), 3);
  });

  describe('findBy', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const result = await db.findBy('users', {id});
    assert.equal(result.id, id);
    assert.equal(result.email, 'test1@test.com');
  });

  describe('queryBy', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const result = await db.queryBy('users', {lastName: 'Tester'});
    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map(row => row.id),
      [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ],
    );
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
