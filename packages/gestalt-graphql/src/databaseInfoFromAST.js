// @flow
import {invariant, isListType, baseType, keyValMap, keyMap} from
  'gestalt-utils';
import type {Document, Relationship, ObjectTypeDefinition, UnionTypeDefinition,
  EnumTypeDefinition, Directive, RelationshipSegment, EnumTypeMap,
  PolymorphicTypeMap, DatabaseRelevantSchemaInfo} from 'gestalt-utils';

export default function databaseInfoFromAST(
  ast: Document,
): DatabaseRelevantSchemaInfo {
  const objectDefinitions = [];
  const interfaceMembers = [];
  const enumDefinitions = [];
  const unionDefinitions = [];
  const relationships = [];

  ast.definitions.forEach(definition => {
    switch (definition.kind) {
      case 'ObjectTypeDefinition':
        if (isDatabaseType(definition)) {
          objectDefinitions.push(definition);
          if (isNonNodeInterfaceMember(definition)) {
            interfaceMembers.push(definition);
          }
        }
        break;
      case 'EnumTypeDefinition':
        enumDefinitions.push(definition);
        break;
      case 'UnionTypeDefinition':
        unionDefinitions.push(definition);
        break;
    }
  });

  return {
    relationships: relationshipsFromObjectDefinitions(objectDefinitions),
    objectTypes: objectTypesByName(objectDefinitions),
    enumTypes: enumTypeMapFromEnumDefinitions(enumDefinitions),
    polymorphicTypes: polymorphicTypeMapFromUnionsAndInterfaceMembers(
      unionDefinitions,
      interfaceMembers
    ),
  };
}

export function objectTypesByName(
  definitions: ObjectTypeDefinition[]
): {[key: string]: ObjectTypeDefinition} {
  return keyMap(definitions, definition => definition.name.value);
}

export function enumTypeMapFromEnumDefinitions(
  enumDefinitions: EnumTypeDefinition[]
): EnumTypeMap {
  return keyValMap(
    enumDefinitions,
    definition => definition.name.value,
    definition => definition.values.map(enumValue => enumValue.name.value),
  );
}

export function polymorphicTypeMapFromUnionsAndInterfaceMembers(
  unionDefinitions: UnionTypeDefinition[],
  interfaceMembers: ObjectTypeDefinition[],
): PolymorphicTypeMap {
  const polymorphicTypes = {};

  unionDefinitions.forEach(definition => {
    const typeName = definition.name.value;
    const members = definition.types.map(member => member.name.value);
    polymorphicTypes[typeName] = members;
  });

  interfaceMembers.forEach(definition => {
    const typeName = definition.name.value;
    definition.interfaces.forEach(ifce => {
      const interfaceName = ifce.name.value;
      if (interfaceName !== 'Node') {
        polymorphicTypes[interfaceName] = polymorphicTypes[interfaceName] || [];
        polymorphicTypes[interfaceName].push(typeName);
      }
    });
  });

  return polymorphicTypes;
}

export function relationshipsFromObjectDefinitions(
  definitions: ObjectTypeDefinition[],
): Relationship[] {
  return definitions.reduce((memo, definition) => {
    memo.push(...relationshipsFromObjectDefinition(definition));
    return memo;
  }, []);
}

export function relationshipsFromObjectDefinition(
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
        const toType = baseType(field.type).name.value;
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
    definition.interfaces.some(type => type.name.value === 'Node') &&
    definition.name.value !== 'Session'
  );
}

export function isNonNodeInterfaceMember(definition: Object): boolean {
  return definition.interfaces.some(type => type.name.value !== 'Node');
}
