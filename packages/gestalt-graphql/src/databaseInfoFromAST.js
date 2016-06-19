// @flow
import {invariant, isListType, baseType} from 'gestalt-utils';
import type {Document, Relationship, ObjectTypeDefinition, Directive,
  RelationshipSegment} from 'gestalt-utils';

export default function databaseInfoFromAST(
  ast: Document,
): {
  objectDefinitions: ObjectTypeDefinition[],
  relationships: Relationship[]
} {
  const objectDefinitions = [];
  const relationships = [];

  ast.definitions.forEach(definition => {
    if (isDatabaseType(definition)) {
      objectDefinitions.push(definition);
      relationships.push(...relationshipsFromObjectTypeDefinition(definition));
    }
  });

  return {objectDefinitions, relationships};
}

export function relationshipsFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): Relationship[] {
  const fromType = definition.name.value;
  const relationships = [];

  definition.fields.forEach(field => {
    if (field.directives) {
      const relationshipDirective = field.directives.find(
        d => d.name.value === 'relationship'
      );
      if (relationshipDirective) {
        invariant(
          !isListType(field.type),
          'relationships cannot be list types'
        );
        const fieldName = field.name.value;
        const nonNull = field.type.kind === 'NonNullType';
        const toType =
          baseType(field.type).name.value.replace(/Connection$/, '');

        relationships.push(
          relationshipFromDirective(
            fieldName,
            fromType,
            toType,
            nonNull,
            relationshipDirective
          )
        );
      }
    }
  });

  return relationships;
}

export function relationshipFromDirective(
  fieldName: string,
  fromType: string,
  toType: string,
  nonNull: boolean,
  directive: Directive
): Relationship {
  const pathArgument = directive.arguments.find(
    argument => argument.name.value === 'path'
  );

  return relationshipFromPathString(
    fieldName,
    fromType,
    toType,
    nonNull,
    pathArgument.value.value
  );
}

export function relationshipFromPathString(
  fieldName: string,
  initialType: string,
  finalType: string,
  nonNull: boolean,
  pathString: string,
): Relationship {
  const parts = pathString.split(/([A-Za-z_]+)/);
  const path = [];
  let fromType = initialType;

  while (parts.length > 3) {
    const [left, label, right, toType] = parts.splice(0, 4);
    path.push(
      relationshipSegmentFromParts(fromType, left, label, right, toType)
    );
    fromType = toType;
  }

  const [left, label, right] = parts;
  path.push(
    relationshipSegmentFromParts(
      fromType,
      left,
      label,
      right,
      finalType,
      nonNull
    )
  );

  invariant(
    !nonNull || path.length === 1 && path[0].cardinality === 'singular',
    'Only singular relationships with one segment can be non null'
  );

  const cardinality = (
    path.some(segment => segment.cardinality === 'plural')
    ? 'plural'
    : 'singular'
  );

  return {
    fieldName,
    path,
    cardinality,
  };
}

const ARROWS = {
  '-->': {cardinality: 'singular', direction: 'out'},
  '<--': {cardinality: 'singular', direction: 'in'},
  '==>': {cardinality: 'plural', direction: 'out'},
  '<==': {cardinality: 'plural', direction: 'in'},
};

export function relationshipSegmentFromParts(
  fromType: string,
  left: string,
  label: string,
  right: string,
  toType: string,
  nonNull: boolean = false
): RelationshipSegment {
  const arrow = ARROWS[left + right];
  invariant(arrow, 'invalid path string');
  return Object.assign({fromType, toType, label, nonNull}, arrow);
}

export function isDatabaseType(definition: Object): boolean {
  // Only ObjectTypes implementing the Node interface are recorded
  return (
    definition.kind === 'ObjectTypeDefinition' &&
    definition.interfaces.some(type => type.name.value === 'Node')
  );
}
