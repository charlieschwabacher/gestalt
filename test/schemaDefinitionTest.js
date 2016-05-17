import 'babel-polyfill';

import {assert} from 'chai';
import path from 'path';
import fs from 'fs';
import {parse} from 'graphql/language/parser';
import generateDatabaseSchema, {edgeFromPathString}
from '../src/PostgreSQL/generateDatabaseSchema';
import expectedDatabaseSchema from './BlogsSchema/expectedDatabaseSchema';

const definitionPath = path.resolve(__dirname, 'BlogsSchema/schema.graphql');
const ast = parse(fs.readFileSync(definitionPath, 'utf8'));

describe('schema definition', () => {
  it('defines a database schema', () => {
    assert.deepEqual(expectedDatabaseSchema, generateDatabaseSchema(ast));
  });

  it('defines a graphql schema', () => {

  });
});

describe('parsing path strings', () => {
  it('parses a long edge', () => {
    assert.deepEqual(
      edgeFromPathString('User', 'Post', '=FOLLOWED=>User=FOLLOWED=>User=AUTHORED=>'),
      {
        path: [
          {fromType: 'User', toType: 'User', label: 'FOLLOWED', cardinality: 'plural', direction: 'out'},
          {fromType: 'User', toType: 'User', label: 'FOLLOWED', cardinality: 'plural', direction: 'out'},
          {fromType: 'User', toType: 'Post', label: 'AUTHORED', cardinality: 'plural', direction: 'out'},
        ]
      }
    );
  });
  it('parses a short edge', () => {
    assert.deepEqual(
      edgeFromPathString('Post', 'User', '<-AUTHORED-'),
      {
        path: [
          {fromType: 'Post', toType: 'User', label: 'AUTHORED', direction: 'in', cardinality: 'singular'},
        ]
      }
    );
  });
});
