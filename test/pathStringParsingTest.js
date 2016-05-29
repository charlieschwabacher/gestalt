import {assert} from 'chai';
import {edgeFromPathString} from '../src/PostgreSQL/generateDatabaseInterface';

describe('parsing path strings', () => {

  it('parses a long edge', () => {
    assert.deepEqual(
      edgeFromPathString(
        'posts',
        'User',
        'Post',
        false,
        '=FOLLOWED=>User=FOLLOWED=>User=AUTHORED=>'
      ),
      {
        fieldName: 'posts',
        cardinality: 'plural',
        path: [
          {
            fromType: 'User',
            toType: 'User',
            label: 'FOLLOWED',
            cardinality: 'plural',
            direction: 'out',
            nonNull: false
          },
          {
            fromType: 'User',
            toType: 'User',
            label: 'FOLLOWED',
            cardinality: 'plural',
            direction: 'out',
            nonNull: false
          },
          {
            fromType: 'User',
            toType: 'Post',
            label: 'AUTHORED',
            cardinality: 'plural',
            direction: 'out',
            nonNull: false
          },
        ]
      }
    );
  });

  it('parses a short edge', () => {
    assert.deepEqual(
      edgeFromPathString('user', 'Post', 'User', true, '<-AUTHORED-'),
      {
        fieldName: 'user',
        cardinality: 'singular',
        path: [
          {
            fromType: 'Post',
            toType: 'User',
            label: 'AUTHORED',
            direction: 'in',
            cardinality: 'singular',
            nonNull: true,
          },
        ]
      }
    );
  });

});
