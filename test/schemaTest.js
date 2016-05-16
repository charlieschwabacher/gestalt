import 'babel-polyfill';
import 'mochawait';

import assert from 'assert';
import path from 'path';
import fs from 'fs';
import {graphql} from 'graphql';
import schema from './support/testSchema';
import {reset} from '../src/PostgresQL/db';

import Gestalt from '../src/Gestalt';

const queryFilePath = path.resolve(__dirname, 'testQuery.graphql');
const query = fs.readFileSync(queryFilePath, 'utf8');



before(reset);

describe('schema', () => {

  it('resolves a maximal query', async done => {
    const session = {currentUserId: 'testuser'};

    try {
      const result = await graphql(schema, query, session);
      console.log('\n\ngot query result:\n', JSON.stringify(result, null, 2));

      assert(result.errors === undefined, 'does not have errors');
    } catch (e) {
      console.log('error', e);
      assert(false);
    }

    done();
  });
});
