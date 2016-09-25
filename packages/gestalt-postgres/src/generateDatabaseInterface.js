// @flow
// Generates an internal representation of a PostgreSQL schema from a GraphQL
// type definition AST.

import type {Document, Node, ObjectTypeDefinition, FieldDefinition, Directive,
  Type, NamedType, DatabaseInterface, DatabaseSchema, Table, Enum, Index,
  Column, ColumnType, Relationship, RelationshipSegment,
  RelationshipSegmentPair, JoinTableDescription, ForeignKeyDescription,
  RelationshipSegmentDescription, DatabaseRelevantSchemaInfo,
  GestaltServerConfig, PolymorphicTypeMap} from 'gestalt-utils';
import {plural} from 'pluralize';
import snake from 'snake-case';
import collapseRelationshipSegments from './collapseRelationshipSegments';
import generateNodeResolver from './generateNodeResolver';
import {generateRelationshipResolver, generateRelationshipLoaders} from
  './generateRelationshipResolver';
import {invariant, keyMap, baseType, compact} from 'gestalt-utils';
import DB from './DB';
import REQUIRED_EXTENSIONS from './REQUIRED_EXTENSIONS';


export default function generateDatabaseInterface(
  databaseURL: string,
  schemaInfo: DatabaseRelevantSchemaInfo,
  config?: ?GestaltServerConfig,
): DatabaseInterface {
  const {objectTypes, enumTypes, polymorphicTypes, relationships} = schemaInfo;

  const db = new DB({
    url: databaseURL,
    log: config != null && !!config.development,
  });

  const tables: Table[] = [];
  const enums: Enum[] = [];
  const tablesByName: {[key: string]: Table} = {};
  const indices: Index[] = [];

  // create tables and indexes for object types, take inventory of relationships
  Object.values(objectTypes).forEach(definition => {
    const table = tableFromObjectTypeDefinition(definition);
    tablesByName[table.name] = table;
    tables.push(table);

    indices.push(...indicesFromObjectTypeDefinition(definition));
  });

  // having looked at each type and recorded their relationships, we create
  // normalized descriptions of the relationships
  const segmentPairs = segmentPairsFromRelationships(relationships);
  const {mapping: pairMapping, pairs: collapsedPairs} =
    collapseRelationshipSegments(segmentPairs, polymorphicTypes);
  const segmentDescriptions =
    segmentDescriptionsFromPairs(collapsedPairs, polymorphicTypes);
  const segmentDescriptionsBySignature = keyMap(
    segmentDescriptions,
    segment => segment.pair.signature
  );

  // create DB enums for each enum type and polymorphic type
  Object.keys(enumTypes).forEach(name => {
    enums.push({name: `${snake(name)}`, values: enumTypes[name]});
  });
  Object.keys(polymorphicTypes).forEach(name => {
    enums.push({name: `_${snake(name)}_type`, values: polymorphicTypes[name]});
  });

  // create join tables, foreign key columns, and indices based on the
  // relationship descriptions
  segmentDescriptions.forEach(segment => {
    if (segment.type === 'join') {
      // add join table and indices
      tables.push(joinTableFromDescription(segment.storage));
      indices.push(...joinTableIndicesFromDescription(segment.storage));
    } else {
      // add foreign key and index
      const table = tablesByName[segment.storage.table];
      if (table != null) {
        table.columns.push(columnFromForeignKeyDescription(segment.storage));
        indices.push(indexFromForeignKeyDescription(segment.storage));
      }
    }
  });

  return {
    db,
    schema: {
      tables,
      indices,
      enums,
      extensions: REQUIRED_EXTENSIONS,
    },
    resolveNode: generateNodeResolver(db),
    generateRelationshipResolver: generateRelationshipResolver(
      segmentDescriptionsBySignature,
    ),
    prepareQueryContext: ctx => {
      const loaders = generateRelationshipLoaders(
        db,
        segmentDescriptionsBySignature,
        relationships
      );
      return {...ctx, db, loaders};
    },
  };
}

export function isDatabaseField(definition: FieldDefinition): boolean {
  // Fields with the @virtual directive are not recorded, fields with the
  // @relationship directive generate join tables or foreign keys which are
  // added seperately
  return (
    !definition.directives ||
    !definition.directives.some(
      d => d.name.value === 'virtual' || d.name.value === 'relationship'
    )
  );
}

export function validateDatabaseField(definition: FieldDefinition): void {
  // because we use the seq field for ordering, we can't allow it to be defined
  // as a database field
  invariant(
    definition.name !== 'seq',
    'The `seq` field is reserved by Gestalt and cannot be defined',
  );
}

export function isNonNullType(type: Type): boolean {
  return type.kind === 'NonNullType';
}

export function isListType(type: Type): boolean {
  return (
    type.kind === 'ListType' ||
    (type.kind === 'NonNullType' && type.type.kind === 'ListType')
  );
}

export function tableFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): Table {
  const name = tableNameFromTypeName(definition.name.value);
  const columns = [
    // every table gets an auto incrementing field 'seq' used for ordering
    {
      name: 'seq',
      type: 'SERIAL',
      primaryKey: false,
      nonNull: true,
      unique: true,
      defaultValue: null,
      references: null,
    }
  ];

  definition.fields.forEach(field => {
    if (isDatabaseField(field)) {
      validateDatabaseField(field);
      columns.push(columnFromFieldDefintion(field));
    }
  });

  return {name, columns, constraints: []};
}

export function columnFromFieldDefintion(definition: FieldDefinition): Column {
  const isId = definition.name.value === 'id';
  return {
    name: snake(definition.name.value),
    type: columnTypeFromGraphQLType(definition.type),
    primaryKey: isId,
    nonNull: isNonNullType(definition.type),
    unique: definition.directives.some(d => d.name.value === 'unique'),
    defaultValue: isId ? 'gen_random_uuid()' : null,
    references: null,
  };
}

export function columnTypeFromGraphQLType(type: Type): ColumnType {
  if (type.isListType) {
    return 'jsonb';
  }

  switch (baseType(type).name.value) {
    case 'ID':
      return 'uuid';
    case 'String':
      return 'text';
    case 'Int':
      return 'integer';
    case 'Float':
      return 'double precision';
    case 'Date':
      return 'timestamp without time zone';
    case 'Money':
      return 'money';
    case 'SERIAL':
      return 'SERIAL';
    default:
      return 'jsonb';
  }
}

export function indicesFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): Index[] {
  const indices = [];
  const table = tableNameFromTypeName(definition.name.value);
  definition.fields.forEach(field => {
    if (
      field.directives &&
      field.directives.some(directive => directive.name.value === 'index') &&
      // a uniqueness constraint implies an index, so if the @unique directive
      // is present we don't need to add an additional one
      !field.directives.some(directive => directive.name.value === 'unique')
    ) {
      indices.push({table, columns: [snake(field.name.value)]});
    }
  });
  return indices;
}

export function segmentPairsFromRelationships(
  relationships: Relationship[],
): RelationshipSegmentPair[] {
  const segments = flattenedUniqueSegmentsFromRelationships(relationships);

  // create map of segments by taking their signature along the relationship
  // direction
  const segmentMap: {[key: string]: RelationshipSegment[]} = {};
  segments.forEach(segment => {
    const signature = pairingSignatureFromRelationshipSegment(segment);
    segmentMap[signature] = (segmentMap[signature] || []).concat(segment);
  });

  // create RelationshipSegmentDescription objects
  return Object.keys(segmentMap).map(signature => {
    const [firstSegment, secondSegment] = segmentMap[signature];
    const {label, direction, fromType, toType} = firstSegment;

    const pair: RelationshipSegmentPair = {
      signature,
      label,
      [direction]: firstSegment,
      left: direction === 'in' ? toType : fromType,
      right: direction === 'in' ? fromType : toType,
    };

    if (secondSegment) {
      pair[secondSegment.direction] = secondSegment;
    }

    return pair;
  });
}

export function segmentDescriptionsFromPairs(
  pairs: RelationshipSegmentPair[],
  polymorphicTypes: PolymorphicTypeMap,
): RelationshipSegmentDescription[] {
  return pairs.map(pair => {
    if (segmentPairRequiresJoinTable(pair, polymorphicTypes)) {
      return {
        pair,
        type: 'join',
        storage: joinTableDescriptionFromRelationshipSegmentPair(pair, polymorphicTypes),
      };
    } else {
      return {
        pair,
        type: 'foreignKey',
        storage: foreignKeyDescriptionFromRelationshipSegmentPair(pair),
      };
    }
  });

}

export function pairingSignatureFromRelationshipSegment(
  segment: RelationshipSegment
): string {
  const {fromType, toType, label, direction} = segment;
  return (
    (direction === 'in')
    ? `${toType}|${label}|${fromType}`
    : `${fromType}|${label}|${toType}`
  );
}

export function flattenedUniqueSegmentsFromRelationships(
  relationships: Relationship[]
): RelationshipSegment[] {
  const segmentMap: Map<string, RelationshipSegment> = new Map;
  relationships.forEach(relationship =>
    relationship.path.forEach(segment => {
      const signature = identitySignatureFromRelationshipSegment(segment);
      const existingSegment = segmentMap.get(signature);
      if (existingSegment == null || !existingSegment.nonNull) {
        segmentMap.set(signature, segment);
      }
    })
  );

  return Array.from(segmentMap.values());
}

export function identitySignatureFromRelationshipSegment(
  segment: RelationshipSegment
): string {
  const {fromType, toType, label, direction} = segment;
  return [fromType, toType, label, direction].join('|');
}

export function segmentPairRequiresJoinTable(
  pair: RelationshipSegmentPair,
  polymorphicTypes: PolymorphicTypeMap,
): boolean {
  return (
    (
      (pair.in == null || pair.in.cardinality === 'plural') &&
      (pair.out == null || pair.out.cardinality === 'plural')
    ) ||
    polymorphicTypes[pair.left] != null ||
    polymorphicTypes[pair.right] != null
  );
}

export function joinTableDescriptionFromRelationshipSegmentPair(
  pair: RelationshipSegmentPair,
  polymorphicTypes: PolymorphicTypeMap,
): JoinTableDescription {
  const {left, right, label} = pair;
  const leftPolymorphic = polymorphicTypes[left] != null;
  const rightPolymorphic = polymorphicTypes[right] != null;

  return {
    name: tableNameFromTypeName(`${left}_${label}_${right}`),
    left: (
      leftPolymorphic
      ? {
        isPolymorphic: true,
        tableName: tableNameFromTypeName(left),
        columnName: `${snake(left)}_id`,
        typeColumnName: `${snake(left)}_type`,
        typeColumnEnumName: `_${snake(left)}_type`,
      }
      : {
        isPolymorphic: false,
        tableName: tableNameFromTypeName(left),
        columnName: `${snake(left)}_id`,
      }
    ),
    right: (
      rightPolymorphic
      ? {
        isPolymorphic: true,
        tableName: tableNameFromTypeName(right),
        columnName: `${snake(label)}_${snake(right)}_id`,
        typeColumnName: `${snake(label)}_${snake(right)}_type`,
        typeColumnEnumName: `_${snake(right)}_type`,
      }
      : {
        isPolymorphic: false,
        tableName: tableNameFromTypeName(right),
        columnName: snake(`${label}_${right}_id`),
      }
    ),
  };
}

export function joinTableFromDescription(
  description: JoinTableDescription
): Table {
  const {name, left, right} = description;
  const columns = [];

  columns.push({
    name: left.columnName,
    type: 'uuid',
    nonNull: true,
    primaryKey: false,
    unique: false,
    defaultValue: null,
    references: left.isPolymorphic ? null : {
      table: left.tableName,
      column: 'id',
    }
  });

  if (left.isPolymorphic) {
    columns.push({
      name: left.typeColumnName,
      type: left.typeColumnEnumName,
      nonNull: true,
      primaryKey: false,
      unique: false,
      defaultValue: null,
    });
  }

  columns.push({
    name: right.columnName,
    type: 'uuid',
    nonNull: true,
    primaryKey: false,
    unique: false,
    defaultValue: null,
    references: right.isPolymorphic ? null : {
      table: right.tableName,
      column: 'id',
    },
  });

  if (right.isPolymorphic) {
    columns.push({
      name: right.typeColumnName,
      type: right.typeColumnEnumName,
      nonNull: true,
      primaryKey: false,
      unique: false,
      defaultValue: null,
    });
  }

  return {
    name,
    columns,
    constraints: [
      {
        type: 'UNIQUE',
        columns: compact([
          left.columnName,
          left.isPolymorphic ? left.typeColumnName : null,
          right.columnName,
          right.isPolymorphic ? right.typeColumnName : null,
        ]),
      },
    ],
  };
}

export function joinTableIndicesFromDescription(
  description: JoinTableDescription
): Index[] {
  const {name, right} = description;
  return [
    {
      table: name,
      columns: compact([
        right.columnName,
        right.isPolymorphic ? right.typeColumnName : null,
      ]),
    }
  ];
}

// when considering a segment pair we will use a foreign key if one or both of
// the segments are singular. We decide on which of the two tables to put the
// foreign key using the following rules:

// missing + singular:
//   - add the column to the fromType of the existing segment
// singular + plural:
//   - add the column to the fromType of the singular segment
// singular + singular:
//   - if one segment is non null, add the column to its fromType, otherwise
//     add it to the toType of the out segment.

export function foreignKeyDescriptionFromRelationshipSegmentPair(
  pair: RelationshipSegmentPair
): ForeignKeyDescription {
  let normalType;
  if (pair.in == null) {
    invariant(pair.out);
    normalType = {
      ...pair.out,
      direction: 'in',
      fromType: pair.out.toType,
      toType: pair.out.fromType,
    };
  } else {
    normalType = (
      (
        (pair.out == null) ||
        (pair.in.cardinality === 'plural') ||
        (pair.out.nonNull && !pair.in.nonNull)
      )
      ? pair.in
      : pair.out
    );
  }

  invariant(normalType, 'input pair does not require a foreign key');
  const {label, fromType, toType, direction} = normalType;

  return {
    direction,
    nonNull: (
      (pair.out != null && pair.out.nonNull) ||
      (pair.in != null && pair.in.nonNull)
    ),
    table: tableNameFromTypeName(toType),
    referencedTable: tableNameFromTypeName(fromType),
    column: snake(
      (direction === 'in')
      ? `${label}_${fromType}_id`
      : `${label}_by_${fromType}_id`
    ),
  };
}

export function indexFromForeignKeyDescription(
  description: ForeignKeyDescription
): Index {
  return {
    table: description.table,
    columns: [description.column]
  };
}

export function columnFromForeignKeyDescription(
  description: ForeignKeyDescription
): Column {
  return {
    name: description.column,
    type: 'uuid',
    primaryKey: false,
    nonNull: description.nonNull,
    unique: false,
    defaultValue: null,
    references: {
      table: description.referencedTable,
      column: 'id',
    },
  };
}

export function tableNameFromTypeName(typeName: string): string {
  return snake(plural(typeName));
}
