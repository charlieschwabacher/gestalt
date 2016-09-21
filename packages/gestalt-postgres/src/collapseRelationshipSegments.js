// @flow
import {group, invariant} from 'gestalt-utils';
import type {RelationshipSegmentPair, PolymorphicTypeMap} from
  'gestalt-utils';

export default function collapseRelationshipSegments(
  pairs: RelationshipSegmentPair[],
  polymorphicTypes: PolymorphicTypeMap,
  direction: ('left' | 'right') = 'left',
  mapping: {[key: string]: string} = {},
  final: boolean = false,
): {
  mapping: {[key: string]: string},
  pairs: RelationshipSegmentPair[],
} {
  const nextMapping = {...mapping};
  const nextPairs = [];
  const groups = group(pairs, direction === 'left' ? groupLeft : groupRight);
  let collapsed = false;

  Object.keys(groups).forEach(groupSignature => {
    const group = groups[groupSignature];
    const polymorphicPairs = {};
    const homomorphicPairs = {};
    group.forEach(pair => {
      const type = normalSegment(pair)[direction];
      if (polymorphicTypes[type] != null) {
        polymorphicPairs[type] = pair;
        nextPairs.push(pair);
      } else {
        homomorphicPairs[type] = pair;
      }
    });

    const homomorphicTypeNames = Object.keys(homomorphicPairs);
    const polymorphicTypeNames = Object.keys(polymorphicPairs);

    homomorphicTypeNames.forEach(homomorphicTypeName => {
      const pair = homomorphicPairs[homomorphicTypeName];
      const superTypeName = polymorphicTypeNames.find(polymorphicTypeName =>
        polymorphicTypes[polymorphicTypeName].includes(homomorphicTypeName)
      );
      if (superTypeName != null) {
        nextMapping[pair.signature] = polymorphicPairs[superTypeName];
        collapsed = true;
      } else {
        nextMapping[pair.signature] = pair;
        nextPairs.push(pair);
      }
    });
  });

  if (collapsed || !final) {
    return collapseRelationshipSegments(
      nextPairs,
      polymorphicTypes,
      direction === 'left' ? 'right' : 'left',
      nextMapping,
      !collapsed,
    );
  } else {
    return {
      mapping: nextMapping,
      pairs: nextPairs,
    };
  }
}

function normalSegment(
  pair: RelationshipSegmentPair
): {
  left: string,
  right: string,
  label: string,
} {
  if (pair.in != null) {
    const {toType: left, fromType: right, label} = pair.in;
    return {left, right, label};
  } else if (pair.out != null) {
    const {fromType: left, toType: right, label} = pair.out;
    return {left, right, label};
  } else {
    throw 'Relationship segment pair should have at least one segment';
  }
}

function groupLeft(pair: RelationshipSegmentPair): string {
  const {right, label} = normalSegment(pair);
  return `${label}|${right}`;
}

function groupRight(pair) {
  const {left, label} = normalSegment(pair);
  return `${left}|${label}`;
}
