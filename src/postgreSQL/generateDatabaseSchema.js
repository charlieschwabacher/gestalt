// Generates an internal representation of a PostgreSQL schema from a GraphQL
// type definition AST.
// @flow

import type {Document, Node, ObjectTypeDefinition, FieldDefinition, Directive,
  Type, NamedType} from 'graphql/language/ast';
import type {DatabaseSchema, Table, Index, Column, ColumnType, Edge,
  EdgeSegment, EdgeSegmentPair, JoinTableDescription, ForeignKeyDescription}
  from './types';
import {plural} from 'pluralize';
import {snake} from 'change-case';
import invariant from '../util/invariant';


export default function generateDatabaseSchema(ast: Document): DatabaseSchema {
  const tables: [Table] = [];
  const tablesByName: {[key: string]: Table} = {};
  const indices: [Index] = [];
  const edges: [Edge] = [];

  // create tables and indexes for object types, take inventory of edges
  ast.definitions.forEach(definition => {
    if (isDatabaseType(definition)) {
      const table = tableFromObjectTypeDefinition(definition);
      tablesByName[table.name] = table;
      tables.push(table);

      indices.push(idIndexFromObjectTypeDefinition(definition));
      edges.push(...edgesFromObjectTypeDefinition(definition));
    }
  });

  // create join tables, foreign key columns, and indices for object edges
  segmentPairsFromEdges(edges).forEach(pair => {
    if (segmentPairRequiresJoinTable(pair)) {
      // add join table and indices
      const description = joinTableDescriptionFromEdgeSegmentPair(pair);
      tables.push(joinTableFromDescription(description));
      indices.push(...joinTableIndicesFromDescription(description));
    } else {
      // add foreign key and index
      const description = foreignKeyDescriptionFromEdgeSegmentPair(pair);
      const table = tablesByName[description.table];
      table.columns.push(columnFromForeignKeyDescription(description));
      indices.push(indexFromForeignKeyDescription(description));
    }
  });

  return {tables, indices};
}

export function isDatabaseType(definition: Node): boolean {
  // Only ObjectTypes implementing the Node interface are recorded
  return (
    definition.kind === 'ObjectTypeDefinition' &&
    definition.interfaces.some(type => type.name.value === 'Node')
  );
}

export function isDatabaseField(definition: FieldDefinition): boolean {
  // Fields with the @virtual directive are not recorded, fields with the @edge
  // directive generate join tables or foreign keys which are added seperately
  return (
    !definition.directives ||
    !definition.directives.some(
      d => d.name.value === 'virtual' || d.name.value === 'edge'
    )
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

export function baseType(type: Type): NamedType {
  let next = type;
  while (next.type) {
    next = next.type;
  }
  return next;
}

export function tableFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): Table {
  const name = snake(plural(definition.name.value));
  const columns = [];

  definition.fields.forEach(field => {
    if (isDatabaseField(field)) {
      columns.push(columnFromFieldDefintion(field));
    }
  });

  return {name, columns};
}

export function columnFromFieldDefintion(definition: FieldDefinition): Column {
  return {
    name: snake(definition.name.value),
    type: columnTypeFromGraphQLType(definition.type),
    primaryKey: definition.name.value === 'id',
    nonNull: isNonNullType(definition.type),
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
      return 'varchar(255)';
    case 'Int':
      return 'integer';
    case 'Float':
      return 'double precision';
    case 'Text':
      return 'text';
    case 'Date':
      return 'timestamp';
    case 'Money':
      return 'money';
    default:
      return 'jsonb';
  }
}

export function idIndexFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): Index {
  return {
    table: snake(plural(definition.name.value)),
    columns: ['id'],
  };
}

export function edgesFromObjectTypeDefinition(
  definition: ObjectTypeDefinition,
): [Edge] {
  const fromType = definition.name.value;
  const edges = [];

  definition.fields.forEach(field => {
    if (field.directives) {
      const edgeDirective = field.directives.find(d => d.name.value === 'edge');
      if (edgeDirective) {
        invariant(!isListType(field.type), 'edges cannot be list types');
        const nonNull = isNonNullType(field.type);
        const toType = baseType(field.type).name.value;
        edges.push(edgeFromDirective(fromType, toType, nonNull, edgeDirective));
      }
    }
  });

  return edges;
}

export function edgeFromDirective(
  fromType: string,
  toType: string,
  nonNull: boolean,
  directive: Directive
): Edge {
  const pathArgument = directive.arguments.find(
    argument => argument.name.value === 'path'
  );

  return edgeFromPathString(fromType, toType, nonNull, pathArgument.value.value);
}

export function edgeFromPathString(
  initialType: string,
  finalType: string,
  nonNull: boolean,
  pathString: string,
): Edge {
  const parts = pathString.split(/([A-Za-z_]+)/);
  const path = [];
  let fromType = initialType;

  while (parts.length > 3) {
    const [left, label, right, toType] = parts.splice(0, 4);
    path.push(edgeSegmentFromParts(fromType, left, label, right, toType));
    fromType = toType;
  }

  const [left, label, right] = parts;
  path.push(
    edgeSegmentFromParts(fromType, left, label, right, finalType, nonNull)
  );

  invariant(
    !nonNull || path.length === 1 && path[0].cardinality === 'singular',
    'Only singular edges with one segment can be non null'
  );

  return {path};
}

const ARROWS = {
  '-->': {cardinality: 'singular', direction: 'out'},
  '<--': {cardinality: 'singular', direction: 'in'},
  '==>': {cardinality: 'plural', direction: 'out'},
  '<==': {cardinality: 'plural', direction: 'in'},
};

export function edgeSegmentFromParts(
  fromType: string,
  left: string,
  label: string,
  right: string,
  toType: string,
  nonNull: boolean = false
): EdgeSegment {
  const arrow = ARROWS[left + right];
  invariant(arrow, 'invalid path string');
  return Object.assign({fromType, toType, label, nonNull}, arrow);
}

export function segmentPairsFromEdges(edges: [Edge]): [EdgeSegmentPair] {
  const segments = flattenedUniqueSegmentsFromEdges(edges);

  // create map of segments by taking their signature along the edge direction
  const segmentMap: {[key: string]: [EdgeSegment]} = {};
  segments.forEach(segment => {
    const signature = pairingSignatureFromEdgeSegment(segment);
    segmentMap[signature] = (segmentMap[signature] || []).concat(segment);
  });

  // create EdgeSegmentPair objects
  return Object.values(segmentMap).map(segments => {
    const pair = {};
    segments.forEach(segment => pair[segment.direction] = segment);
    return pair;
  });
}

export function pairingSignatureFromEdgeSegment(segment: EdgeSegment): string {
  const {fromType, toType, label, direction} = segment;
  return (
    (direction === 'in')
    ? `${toType}|${label}|${fromType}`
    : `${fromType}|${label}|${toType}`
  );
}

export function flattenedUniqueSegmentsFromEdges(edges: [Edge]): [EdgeSegment] {
  const segmentMap: {[key: string]: EdgeSegment} = {};
  edges.forEach(edge =>
    edge.path.forEach(segment => {
      const signature = identitySignatureFromEdgeSegment(segment);
      if (segmentMap[signature] == null || !segmentMap[signature].nonNull) {
        segmentMap[signature] = segment;
      }
    })
  );

  return Object.values(segmentMap);
}

export function identitySignatureFromEdgeSegment(segment: EdgeSegment): string {
  const {fromType, toType, label, direction} = segment;
  return [fromType, toType, label, direction].join('|');
}

export function segmentPairRequiresJoinTable(pair: EdgeSegmentPair): boolean {
  return (
    (pair.in == null || pair.in.cardinality === 'plural') &&
    (pair.out == null || pair.out.cardinality === 'plural')
  );
}

export function joinTableDescriptionFromEdgeSegmentPair(
  pair: EdgeSegmentPair
): JoinTableDescription {
  invariant(
    pair.out || pair.in,
    'edge segment pair must have at least one segment'
  );
  const left = (pair.out && pair.out.fromType) || (pair.in && pair.in.toType);
  const right = (pair.out && pair.out.toType) || (pair.in && pair.in.fromType);
  const label = (pair.out && pair.out.label) || (pair.in && pair.in.label);

  return {
    name: snake(plural(`${left}_${label}_${right}`)),
    leftTableName: snake(plural(left)),
    rightTableName: snake(plural(right)),
    leftColumnName: snake(`${left}_id`),
    rightColumnName: snake(`${label}_${right}_id`),
  };
}

export function joinTableFromDescription(
  description: JoinTableDescription
): Table {
  const {name, leftTableName, rightTableName, leftColumnName,
    rightColumnName} = description;

  return {
    name,
    columns: [
      {
        name: leftColumnName,
        type: 'uuid',
        nonNull: true,
        primaryKey: false,
        references: {
          table: leftTableName,
          column: 'id',
        }
      },
      {
        name: rightColumnName,
        type: 'uuid',
        nonNull: true,
        primaryKey: false,
        references: {
          table: rightTableName,
          column: 'id',
        },
      },
    ],
    constraints: [
      {
        type: 'unique',
        columns: [leftColumnName, rightColumnName],
      },
    ],
  };
}

export function joinTableIndicesFromDescription(
  description: JoinTableDescription
): [Index] {
  const {name, leftTableName, rightTableName, leftColumnName,
    rightColumnName} = description;

  return [
    {
      table: name,
      columns: [leftColumnName],
    },
    {
      table: name,
      columns: [rightColumnName],
    }
  ];
}

// when considering a segment pair we will use a foreign key if one or both of
// the segments are singular. We decide on which of the two tables to put the
// foreign key using the following rules:

// missing + singular:
//   - add the column to the fromType of the existing segment
// singular + plural
//   - add the column to the fromType of the singular segment
// singular + singular
//   - if one segment is non null, add the column to its fromType, otherwise
//     add it to the toType of the out segment.

export function foreignKeyDescriptionFromEdgeSegmentPair(
  pair: EdgeSegmentPair
): ForeignKeyDescription {
  const normalType = (
    (pair.in == null || pair.out == null)
    ? pair.in || pair.out
    : (pair.in.cardinality === 'plural' || pair.out.cardinality === 'plural')
    ? (pair.in.cardinality === 'plural') ? pair.out : pair.in
    : (pair.in.nonNull && !pair.out.nonNull)
    ? pair.in
    : pair.out
  );

  invariant(normalType, 'input pair does not require a foreign key');
  const {label, fromType, toType, direction, nonNull} = normalType;

  return {
    nonNull,
    table: snake(plural(fromType)),
    referencedTable: snake(plural(toType)),
    column: snake(
      (direction === 'in')
      ? `${label}_by_${toType}_id`
      : `${label}_${toType}_id`
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
    references: {
      table: description.referencedTable,
      column: 'id'
    },
  };
}
