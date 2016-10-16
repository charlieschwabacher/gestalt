// @flow

import assert from 'assert';
import {keyMap} from 'gestalt-utils';
import {relationshipFromPathString as r} from 'gestalt-graphql';
import {segmentPairsFromRelationships, segmentDescriptionsFromPairs} from
  '../src/generateDatabaseInterface';
import {objectKeyColumnsFromRelationship, describeRelationship} from
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
    objectKeyColumnsFromRelationship(
      describeRelationship(descriptions, inRelationship)
    ).keyColumn,
    inKeyColumn,
  );
  assert.equal(
    objectKeyColumnsFromRelationship(
      describeRelationship(descriptions, outRelationship)
    ).keyColumn,
    outKeyColumn,
  );
}


describe('key column generation', () => {
  it('foreign key relationship', () => {
    testKeyColumns(
      r('posts', 'User', 'Post', false, '=AUTHORED=>'),
      r('author', 'Post', 'User', false, '<-AUTHORED-'),
      'id',
      'authoredByUserId',
    );
  });

  it('join table relationship', () => {
    testKeyColumns(
      r('posts', 'User', 'Post', false, '=AUTHORED=>'),
      r('author', 'Post', 'User', false, '<=AUTHORED='),
      'id',
      'id',
    );
  });
});
