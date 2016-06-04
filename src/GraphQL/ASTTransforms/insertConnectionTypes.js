// @flow

import type {Document, ObjectTypeDefinition, TypeDefinition, FieldDefinition}
  from '../../types';
import {baseType, keyMap, setMap} from '../../util';
import {plural} from 'pluralize';
import {constantCase} from 'change-case';

export default function insertConnectionTypes(ast: Document): void {
  const newDefinitions = [];
  const definedConnections = new Set;

  const typeMap = keyMap(
    ast.definitions.filter(
      definition => definition.kind === 'ObjectTypeDefinition'
    ),
    definition => definition.name.value
  );

  ast.definitions.forEach(definition => {
    definition.fields && definition.fields.forEach(field => {
      if (isPluralRelationship(field)) {
        const rootType = baseType(field.type);
        const typeName = rootType.name.value;
        const pluralTypeName = plural(typeName);
        const connectionTypeName = `${pluralTypeName}Connection`;
        const edgeTypeName = `${typeName}Edge`;
        const orderEnumTypeName = `${pluralTypeName}Order`;
        const orderEnumValues = orderEnumValuesFromType(typeMap[typeName]);
        const isOrderable = orderEnumValues.length > 0;

        rootType.name.value = connectionTypeName;

        addConnectionArgumentsToField(field, orderEnumTypeName, isOrderable);

        if (!definedConnections.has(typeName)) {
          definedConnections.add(typeName);
          newDefinitions.push(
            ...generateConnectionTypeDefintions(
              typeName,
              connectionTypeName,
              edgeTypeName,
              orderEnumTypeName,
              orderEnumValues,
            )
          );
        }
      }
    });
  });

  ast.definitions.push(...newDefinitions);
}

function isPluralRelationship(field: FieldDefinition): boolean {
  const directive = field.directives && field.directives.find(
     directive => directive.name.value === 'relationship'
  );
  const argument = directive && directive.arguments.find(
    argument => argument.name.value === 'path'
  );

  // relationships with any plural segments in their paths are plural
  return argument && argument.value.value.match(/=[A-Za-z]+=/);
}

export function addConnectionArgumentsToField(
  field: FieldDefinition,
  orderEnumTypeName: string,
  isOrderable: boolean,
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

  if (isOrderable) {
    field.arguments.push({
      kind: 'InputValueDefinition',
      name: {kind: 'Name', value: 'order'},
      type: {
        kind: 'NamedType',
        name: {kind: 'Name', value: orderEnumTypeName}
      },
    });
  }
}

export function generateConnectionTypeDefintions(
  typeName: string,
  connectionTypeName: string,
  edgeTypeName: string,
  orderEnumTypeName: string,
  orderEnumValues: string[],
): TypeDefinition[] {
  const definitions: TypeDefinition[] = [
    // connection type
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

    // edge type
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
    },
  ];

  if (orderEnumValues.length > 0) {
    definitions.push({
      kind: 'EnumTypeDefinition',
      name: {kind: 'name', value: orderEnumTypeName},
      values: orderEnumValues.map(value => ({
        kind: 'EnumValueDefinition',
        name: {kind: 'Name', value},
      }))
    });
  }

  return definitions;
}

export function orderEnumValuesFromType(
  type: ObjectTypeDefinition,
): string[] {
  // take order enum types from fields that have the @index directive and are
  // not @hidden
  const values = [];
  type.fields.forEach(({name, directives}) => {
    const directiveNames = setMap(
      directives, directive => directive.name.value
    );
    if (directiveNames.has('index') && !directiveNames.has('hidden')) {
      values.push(constantCase(name.value));
    }
  });
  return values;
}
