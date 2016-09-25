// @flow

import assert from 'assert';
import collapseRelationshipSegments from '../src/collapseRelationshipSegments';
import {pairingSignatureFromRelationshipSegment} from
  '../src/generateDatabaseInterface';
import type {RelationshipSegment, RelationshipSegmentPair, PolymorphicTypeMap}
  from 'gestalt-utils';

declare function describe(a: string, b: () => any): void;
declare function it(a: string, b: () => any): void;

function pairsFromSegments(
  segments: RelationshipSegment[],
): RelationshipSegmentPair[] {
  return segments.map(segment => {
    const {direction, label, fromType, toType} = segment;
    return {
      label,
      [direction]: segment,
      left: direction === 'in' ? toType : fromType,
      right: direction === 'in' ? fromType : toType,
      signature: pairingSignatureFromRelationshipSegment(segment),
    };
  });
}

describe('collapseRelationshipSegments', () => {
  it('should collapse simple homomorphic relationship segments that can be ' +
     'resolved through existing polymorphic relationships', () => {

    const initialPairs = pairsFromSegments([
      {
        fromType: 'User',
        toType: 'Post',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'User',
        toType: 'Comment',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'User',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
    ]);

    const expectedPairs = pairsFromSegments([
      {
        fromType: 'User',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
    ]);

    const polymorphicTypes: PolymorphicTypeMap = {
      Content: ['Post', 'Comment'],
    };

    const {mapping, pairs} = collapseRelationshipSegments(
      initialPairs,
      polymorphicTypes
    );

    assert.deepEqual(
      pairs,
      expectedPairs,
    );
  });

  it('should collapse complex homomorphic relationship segments that can be ' +
     'resolved through existing polymorphic relationships', () => {

    const initialPairs = pairsFromSegments([
      {
        fromType: 'User',
        toType: 'Post',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'User',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'User',
        toType: 'Agent',
        label: 'FOLLOWED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'Agent',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'Admin',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'Post',
        toType: 'Agent',
        label: 'AUTHORED',
        direction: 'in',
        cardinality: 'singular',
        nonNull: false,
      },
      {
        fromType: 'Post',
        toType: 'Agent',
        label: 'AUTHORED',
        direction: 'in',
        cardinality: 'singular',
        nonNull: false,
      },
      {
        fromType: 'Post',
        toType: 'Comment',
        label: 'INSPIRED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'Comment',
        toType: 'Agent',
        label: 'AUTHORED',
        direction: 'in',
        cardinality: 'singular',
        nonNull: false,
      },
    ]);

    const expectedPairs = pairsFromSegments([
      {
        fromType: 'Agent',
        toType: 'Content',
        label: 'AUTHORED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'User',
        toType: 'Agent',
        label: 'FOLLOWED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
      {
        fromType: 'Post',
        toType: 'Comment',
        label: 'INSPIRED',
        direction: 'out',
        cardinality: 'plural',
        nonNull: false,
      },
    ]);

    const polymorphicTypes: PolymorphicTypeMap = {
      Content: ['Post', 'Comment'],
      Agent: ['User', 'Admin']
    };

    const {mapping, pairs} = collapseRelationshipSegments(
      initialPairs,
      polymorphicTypes
    );

    assert.deepEqual(
      pairs,
      expectedPairs,
    );
  });
});
