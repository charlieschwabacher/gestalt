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
  const nextPairMap: {[key: string]: RelationshipSegmentPair} = {};
  let collapsed = false;

  // group segment pairs by their label and one of their types
  const groups = group(pairs, direction === 'left' ? groupLeft : groupRight);

  // for each group, collapse segments where the non grouping type is a member
  // of a polymorphic type in the same group
  Object.keys(groups).forEach(groupSignature => {
    const group = groups[groupSignature];
    const polymorphicPairs = {};
    const homomorphicPairs = {};
    group.forEach(pair => {
      const type = pair[direction];
      if (polymorphicTypes[type] != null) {
        polymorphicPairs[type] = pair;
        nextPairMap[pair.signature] = pair;
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
        nextMapping[pair.signature] = polymorphicPairs[superTypeName].signature;
        nextPairMap[pair.signature] = mergePairs(
          nextPairMap[pair.signature] || polymorphicPairs[superTypeName],
          pair
        );
        collapsed = true;
      } else {
        nextPairMap[pair.signature] = pair;
      }
    });
  });

  const nextPairs = Object.keys(nextPairMap).map(key => nextPairMap[key]);

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

// merge a homomorphic pair into an existing polymorphic pair, adding new
// information to the polymorphic based on the cardinality and nullability of
// the homomorphic pair
function mergePairs(polymorphicPair, homomorphicPair) {
  const mergedPair = {...polymorphicPair};

  if (homomorphicPair.in != null) {
    if (polymorphicPair.in == null) {
      mergedPair.in = {
        fromType: polymorphicPair.out.toType,
        toType: polymorphicPair.out.fromType,
        label: mergedPair.label,
        direction: 'in',
        cardinality: homomorphicPair.in.cardinality,
        nonNull: homomorphicPair.in.nonNull,
      };
    } else {
      mergedPair.in.nonNull = (
        polymorphicPair.in.nonNull &&
        homomorphicPair.in.nonNull
      );
      mergedPair.in.cardinality = (
        (
          polymorphicPair.in.cardinality === 'plural' ||
          homomorphicPair.in.cardinality === 'plural'
        )
        ? 'plural'
        : 'singular'
      );
    }
  }

  if (homomorphicPair.out != null) {
    if (polymorphicPair.out == null) {
      mergedPair.out = {
        fromType: polymorphicPair.in.toType,
        toType: polymorphicPair.in.fromType,
        label: mergedPair.label,
        direction: 'out',
        cardinality: homomorphicPair.out.cardinality,
        nonNull: homomorphicPair.out.nonNull,
      };
    } else {
      mergedPair.out.nonNull = (
        polymorphicPair.out.nonNull &&
        homomorphicPair.out.nonNull
      );
      mergedPair.out.cardinality = (
        (
          polymorphicPair.out.cardinality === 'plural' ||
          homomorphicPair.out.cardinality === 'plural'
        )
        ? 'plural'
        : 'singular'
      );
    }
  }

  return mergedPair;
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
