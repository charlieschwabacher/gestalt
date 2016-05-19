import {assert} from 'chai';
import {edgeFromPathString} from '../src/PostgreSQL/generateDatabaseSchema';

describe('parsing path strings', () => {

  it('parses a long edge', () => {
    assert.deepEqual(
      edgeFromPathString(
        'User',
        'Post',
        false,
        '=FOLLOWED=>User=FOLLOWED=>User=AUTHORED=>'
      ),
      {
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
      edgeFromPathString('Post', 'User', true, '<-AUTHORED-'),
      {
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
