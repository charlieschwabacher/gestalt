// @flow

import type {Document, ObjectTypeDefinition, FieldDefinition} from '../../types';
import {baseType} from '../../util';
import {plural} from 'pluralize';

export default function insertConnectionTypes(ast: Document): void {
  const newDefinitions = [];
  const definedConnections = new Set;

  ast.definitions.forEach(definition => {
    definition.fields && definition.fields.forEach(field => {
      if (isEdge(field)) {
        const rootType = baseType(field.type);
        const typeName = rootType.name.value;
        const connectionTypeName = `${plural(typeName)}Connection`;
        const edgeTypeName = `${typeName}Edge`;

        rootType.name.value = connectionTypeName;

        if (!definedConnections.has(typeName)) {
          definedConnections.add(typeName);
          newDefinitions.push(
            ...generateConnectionTypeDefintions(
              typeName,
              connectionTypeName,
              edgeTypeName
            )
          );
        }
      }
    });
  });

  ast.definitions.push(...newDefinitions);
}

function isEdge(field: FieldDefinition): boolean {
  return field.directives && field.directives.some(
    directive => directive.name.value === 'edge'
  );
}

export function generateConnectionTypeDefintions(
  typeName: string,
  connectionTypeName: string,
  edgeTypeName: string
): [ObjectTypeDefinition, ObjectTypeDefinition] {
  return [
    {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: connectionTypeName},
      fields: [
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'edges'},
          arguments: [],
          type: {
            kind: 'ListType',
            type: {
              kind: 'NamedType',
              name: {kind: 'Name', value: edgeTypeName}
            }
          },
        },
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'pageInfo'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: 'PageInfo'}
          },
        },
      ],
      interfaces: [],
    },
    {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: edgeTypeName},
      fields: [
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'node'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: typeName}
          },
        },
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'cursor'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: 'String'}
          },
        },
      ],
      interfaces: [],
    }
  ];
}
