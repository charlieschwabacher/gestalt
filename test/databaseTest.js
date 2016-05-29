import fs from 'fs';
import {assert} from 'chai';
import {reset, query, find, exec} from '../src/PostgreSQL/db';

describe('postgres database interface', () => {

  before(async () => {
    await reset();
    await exec(
      fs.readFileSync(`${__dirname}/BlogsSchema/schema.sql`) +
      fs.readFileSync(`${__dirname}/BlogsSchema/seeds.sql`)
    );
  });

  describe('query', () => {
    it('returns an array of results', async () => {
      const result = await query('SELECT id FROM users');
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
      const result = await query(
        'SELECT posts.id FROM posts WHERE posts.authored_by_user_id = ANY ($1)',
        [[
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
          '00000000-0000-0000-0000-000000000003'
        ]]
      );
      assert.deepEqual(
        result,
        [
          {id: '00000000-0000-0000-0000-000000000004'},
          {id: '00000000-0000-0000-0000-000000000005'},
          {id: '00000000-0000-0000-0000-000000000006'},
        ]
      );
    })
  });

});
