// @flow
import {group, invariant} from 'gestalt-utils';
import type {RelationshipSegmentPair, PolymorphicTypeMap} from
  'gestalt-utils';

// recursively collapse relationship segments that can be fulfilled by existing
// segments with polymorphic types
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
  let collapsed = false;

  // group segment pairs by their label and one of their types
  const groups = group(pairs, direction === 'left' ? groupLeft : groupRight);

  // for each group, collapse segments where a
  Object.keys(groups).forEach(groupSignature => {
    const group = groups[groupSignature];
    const polymorphicPairs = {};
    const homomorphicPairs = {};
    group.forEach(pair => {
      const type = pair[direction];
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

  // repeat this process alternating sides until we have looked at both sides
  // without collapsing any types
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

// generate a grouping signature based on the label and right type of a pair
function groupLeft(pair: RelationshipSegmentPair): string {
  const {right, label} = pair;
  return `${label}|${right}`;
}

// generate a grouping signature based on the label and left type of a pair
function groupRight(pair) {
  const {left, label} = pair;
  return `${left}|${label}`;
}
