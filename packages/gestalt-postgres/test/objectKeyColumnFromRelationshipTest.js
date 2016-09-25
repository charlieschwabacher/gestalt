// @flow

import assert from 'assert';
import {keyMap} from 'gestalt-utils';
import {relationshipFromPathString as r} from 'gestalt-graphql';
import {segmentPairsFromRelationships, segmentDescriptionsFromPairs} from
  '../src/generateDatabaseInterface';
import {objectKeyColumnFromRelationship} from
  '../src/generateRelationshipResolver';

import type {Relationship} from 'gestalt-utils';
declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;

function testKeyColumns(
  inRelationship: Relationship,
  outRelationship: Relationship,
  inKeyColumn: string,
  outKeyColumn: string
): void {
  const descriptions = keyMap(
    segmentDescriptionsFromPairs(
      segmentPairsFromRelationships([inRelationship, outRelationship]),
      {},
    ),
    segment => segment.pair.signature,
  );
  assert.equal(
    objectKeyColumnFromRelationship(descriptions, inRelationship),
    inKeyColumn
  );
  assert.equal(
    objectKeyColumnFromRelationship(descriptions, outRelationship),
    outKeyColumn
  );
}


describe('key column generation', () => {
  it('one segment foreign key relationship', () => {
    testKeyColumns(
      r('posts', 'User', 'Post', false, '=AUTHORED=>'),
      r('author', 'Post', 'User', false, '<-AUTHORED-'),
      'id',
      'authoredByUserId',
    );
  });

  it('two segment join table relationship', () => {
    testKeyColumns(
      r('posts', 'User', 'Post', false, '=AUTHORED=>'),
      r('author', 'Post', 'User', false, '<=AUTHORED='),
      'id',
      'id',
    );
  });
});
