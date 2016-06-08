// @flow

import assert from 'assert';
import {relationshipFromPathString as r, segmentDescriptionsFromRelationships}
  from '../src/generateDatabaseInterface';
import {sqlStringFromQuery, applyCursorsToEdges, edgesToReturn,
  queryFromRelationship} from '../src/generateRelationshipResolver';
import {keyMap} from 'gestalt-utils';
import type {Relationship, ConnectionArguments} from 'gestalt-utils';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;


function testConnectionArgs(
  relationships: Relationship[],
  args: ConnectionArguments,
  sql: string,
): void {
  const descriptions = keyMap(
    segmentDescriptionsFromRelationships(relationships),
    segment => segment.signature,
  );
  assert.equal(
    sqlStringFromQuery(
      edgesToReturn(
        applyCursorsToEdges(
          queryFromRelationship(descriptions, relationships[0]),
          args
        ),
        args
      )
    ),
    sql
  );
}


describe('connection query generation', () => {
  const relationships = [
    r('posts', 'User', 'Post', false, '=AUTHORED=>'),
    r('author', 'Post', 'User', true, '<-AUTHORED-'),
  ];

  it('handles none', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.created_at ASC;'
    );
  });

  it('handles first', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', first: 3},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.created_at ASC LIMIT 3;'
    );
  });

  it('handles after', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.created_at > (SELECT created_at FROM posts WHERE id = $2) ' +
      'ORDER BY posts.created_at ASC;'
    );
  });

  it('handles first and after', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', first: 7, after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.created_at > (SELECT created_at FROM posts WHERE id = $2) ' +
      'ORDER BY posts.created_at ASC LIMIT 7;'
    );
  });

  it('handles last', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', last: 4},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.created_at DESC LIMIT 4;'
    );
  });

  it('handles before', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', before: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.created_at < (SELECT created_at FROM posts WHERE id = $2) ' +
      'ORDER BY posts.created_at DESC;'
    );
  });

  it('handles last and before', () => {
    testConnectionArgs(
      relationships,
      {order: 'created_at', last: 2, before: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.created_at < (SELECT created_at FROM posts WHERE id = $2) ' +
      'ORDER BY posts.created_at DESC LIMIT 2;'
    );
  });
});
