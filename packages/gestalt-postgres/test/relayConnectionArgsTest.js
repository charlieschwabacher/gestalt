// @flow

import assert from 'assert';
import {relationshipFromPathString as r} from 'gestalt-graphql';
import {segmentDescriptionsFromPairs, segmentPairsFromRelationships} from
  '../src/generateDatabaseInterface';
import {sqlStringFromQuery, applyCursorsToQuery, applyLimitToQuery,
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
    segmentDescriptionsFromPairs(
      segmentPairsFromRelationships(relationships),
      {}
    ),
    segment => segment.pair.signature,
  );
  assert.equal(
    sqlStringFromQuery(
      applyLimitToQuery(
        applyCursorsToQuery(
          queryFromRelationship(descriptions, relationships[0]),
          args
        ),
        args
      )
    ),
    sql,
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
      {},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.seq ASC;'
    );
  });

  it('handles first', () => {
    testConnectionArgs(
      relationships,
      {first: 3},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.seq ASC LIMIT 3;'
    );
  });

  it('handles after', () => {
    testConnectionArgs(
      relationships,
      {after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.seq > (SELECT seq FROM posts WHERE id = $2) ' +
      'ORDER BY posts.seq ASC;'
    );
  });

  it('handles first and after', () => {
    testConnectionArgs(
      relationships,
      {first: 7, after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.seq > (SELECT seq FROM posts WHERE id = $2) ' +
      'ORDER BY posts.seq ASC LIMIT 7;'
    );
  });

  it('handles last', () => {
    testConnectionArgs(
      relationships,
      {last: 4},
      'SELECT * FROM (SELECT posts.* FROM posts WHERE ' +
      'posts.authored_by_user_id = ANY ($1) ORDER BY posts.seq DESC LIMIT 4) ' +
      'posts ORDER BY seq ASC;'
    );
  });

  it('handles before', () => {
    testConnectionArgs(
      relationships,
      {before: 'z'},
      'SELECT * FROM (SELECT posts.* FROM posts WHERE ' +
      'posts.authored_by_user_id = ANY ($1) AND posts.seq < (SELECT seq FROM ' +
      'posts WHERE id = $2) ORDER BY posts.seq DESC) posts ORDER BY seq ASC;'
    );
  });

  it('handles last and before', () => {
    testConnectionArgs(
      relationships,
      {last: 2, before: 'a'},
      'SELECT * FROM (SELECT posts.* FROM posts WHERE ' +
      'posts.authored_by_user_id = ANY ($1) AND posts.seq < (SELECT seq FROM ' +
      'posts WHERE id = $2) ORDER BY posts.seq DESC LIMIT 2) posts ORDER BY ' +
      'seq ASC;'
    );
  });

  it('handles ASC order', () => {
    testConnectionArgs(
      relationships,
      {order: 'ASC'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.seq ASC;'
    );
  });

  it('handles DESC order', () => {
    testConnectionArgs(
      relationships,
      {order: 'DESC'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.seq DESC;'
    );
  });

  it('handles ASC order on column', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_ASC'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.title ASC;'
    );
  });

  it('handles DESC order on column', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_DESC'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'ORDER BY posts.title DESC;'
    );
  });

  it('handles ASC order and forward paging', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_ASC', first: 3, after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.title > (SELECT title FROM posts WHERE id = $2) ' +
      'ORDER BY posts.title ASC LIMIT 3;'
    );
  });

  it('handles ASC order and reverse paging', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_ASC', last: 3, before: 'z'},
      'SELECT * FROM (SELECT posts.* FROM posts WHERE ' +
      'posts.authored_by_user_id = ANY ($1) AND posts.title < (SELECT title ' +
      'FROM posts WHERE id = $2) ORDER BY posts.title DESC LIMIT 3) posts ' +
      'ORDER BY title ASC;'
    );
  });

  it('handles DESC order and forward paging', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_DESC', first: 3, after: 'a'},
      'SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1) ' +
      'AND posts.title < (SELECT title FROM posts WHERE id = $2) ' +
      'ORDER BY posts.title DESC LIMIT 3;'
    );
  });

  it('handles DESC order and reverse paging', () => {
    testConnectionArgs(
      relationships,
      {order: 'TITLE_DESC', last: 3, before: 'z'},
      'SELECT * FROM (SELECT posts.* FROM posts WHERE ' +
      'posts.authored_by_user_id = ANY ($1) AND posts.title > (SELECT title ' +
      'FROM posts WHERE id = $2) ORDER BY posts.title ASC LIMIT 3) posts ' +
      'ORDER BY title DESC;'
    );
  });
});
