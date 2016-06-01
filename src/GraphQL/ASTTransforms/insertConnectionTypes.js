// @flow

import type {Document, ObjectTypeDefinition, FieldDefinition} from
  '../../types';
import {baseType} from '../../util';
import {plural} from 'pluralize';

export default function insertConnectionTypes(ast: Document): void {
  const newDefinitions = [];
  const definedConnections = new Set;

  ast.definitions.forEach(definition => {
    definition.fields && definition.fields.forEach(field => {
      if (isPluralEdge(field)) {
        const rootType = baseType(field.type);
        const typeName = rootType.name.value;
        const connectionTypeName = `${plural(typeName)}Connection`;
        const edgeTypeName = `${typeName}Edge`;

        rootType.name.value = connectionTypeName;

        addConnectionArgumentsToField(field);

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

function isPluralEdge(field: FieldDefinition): boolean {
  const edgeDirective = field.directives && field.directives.find(
     directive => directive.name.value === 'edge'
  );
  const pathArgument = edgeDirective && edgeDirective.arguments.find(
    argument => argument.name.value === 'path'
  );

  return pathArgument && pathArgument.value.value.match(/=[A-Za-z]+=/);
}

export function addConnectionArgumentsToField(
  field: FieldDefinition
): void {
  field.arguments.push(
    {
      kind: 'InputValueDefinition',
      name: {kind: 'Name', value: 'first'},
      type: {
        kind: 'NamedType',
        name: {kind: 'Name', value: 'Int'}
      },
    },
    {
      kind: 'InputValueDefinition',
      name: {kind: 'Name', value: 'after'},
      type: {
        kind: 'NamedType',
        name: {kind: 'Name', value: 'String'}
      },
    },
    {
      kind: 'InputValueDefinition',
      name: {kind: 'Name', value: 'last'},
      type: {
        kind: 'NamedType',
        name: {kind: 'Name', value: 'Int'}
      },
    },
    {
      kind: 'InputValueDefinition',
      name: {kind: 'Name', value: 'before'},
      type: {
        kind: 'NamedType',
        name: {kind: 'Name', value: 'String'}
      },
    },
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
        {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: 'totalCount'},
          arguments: [],
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: 'Int'}
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
