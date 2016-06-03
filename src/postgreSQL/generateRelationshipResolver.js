// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

import type {Relationship, RelationshipSegmentDescriptionMap,
  RelationshipSegmentDescription, RelationshipSegment, Query, Join, Condition,
  GraphQLFieldResolveFn, ConnectionArguments, ForeignKeyDescription,
  JoinTableDescription} from '../types';
import {pairingSignatureFromRelationshipSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import {query, find} from './db';
import DataLoader from 'dataloader';
import {camel} from 'change-case';
import {keyMap, group} from '../util';


export function generateRelationshipResolver(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
): (relationship: Relationship) => GraphQLFieldResolveFn {
  return relationship => {
    const keyColumn = objectKeyColumnFromRelationship(
      segmentDescriptionMap,
      relationship
    );
    return (object, args, context) => {
      const loader = context.loaders.get(relationship);
      const key = object[keyColumn];
      return loader.load({key, args});
    };
  };
}

export function generateRelationshipLoaders(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationships: Relationship[],
): () => Map<Relationship, DataLoader> {
  // TODO: we should be able to pregenerate and store SQL queries so that they
  // are only calculated once, not re-calcualted on every request.

  return () => {
    // TODO: instead of using a native map here - we should wrap in something
    // that creates loaders lazily.  It's likely that a single request will only
    // use some small subset of the available loaders so will be worthwile to
    // avoid generating the rest

    const relationshipLoaderMap = new Map();

    relationships.forEach(relationship => {
      const keyColumn = resolvedKeyColumnFromRelationship(
        segmentDescriptionMap,
        relationship
      );

      if (relationship.cardinality === 'singular') {
        const sql = sqlQueryFromRelationship(
          segmentDescriptionMap,
          relationship
        );
        relationshipLoaderMap.set(
          relationship,
          generateSingularRelationshipLoader(relationship, keyColumn, sql)
        );
      } else {
        const query = queryFromRelationship(
          segmentDescriptionMap,
          relationship,
        );
        relationshipLoaderMap.set(
          relationship,
          generatePluralRelationshipLoader(relationship, keyColumn, query)
        );
      }
    });

    return relationshipLoaderMap;
  };
}

function generateSingularRelationshipLoader(
  relationship: Relationship,
  keyColumn: string,
  sql: string
): DataLoader {
  return new DataLoader(async loadKeys => {
    const keys = loadKeys.map(({key}) => key);
    const results = await query(sql, [keys]);
    const resultsByKey = keyMap(results, result => result[keyColumn]);
    return keys.map(key => resultsByKey[key]);
  });
}

// TODO: this needs to handle connection arguments
function generatePluralRelationshipLoader(
  relationship: Relationship,
  keyColumn: string,
  baseQuery: Query
): DataLoader {
  return new DataLoader(loadKeys =>
    Promise.all(loadKeys.map(async ({key, args}) => {
      const sql = sqlStringFromQuery(applyConnectionArgs(baseQuery, args));
      const nodes = await query(sql, [[key]]);
      const edges = nodes.map(node => ({node, cursor: node.id}));
      return {
        edges,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
        },
        count: edges.length,
        totalCount: edges.length,
      };
    }))
  );
}

export function applyConnectionArgs(
  query: Query,
  args: ConnectionArguments
): Query {
  // TODO: fill in args here
  return query;
}

export function objectKeyColumnFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship
): string {
  const segment = relationship.path[0];
  const description = descriptionFromSegment(
    segmentDescriptionMap,
    relationship.path[0]
  );
  const {type, storage} = description;

  return (
    type === 'foreignKey' && storage.direction !== segment.direction
    ? camel(storage.column)
    : 'id'
  );
}

export function resolvedKeyColumnFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship
): string {
  const segment = relationship.path[0];
  const description = descriptionFromSegment(
    segmentDescriptionMap,
    relationship.path[0]
  );
  const {type, storage} = description;

  return (
    type === 'foreignKey' && storage.direction === segment.direction
    ? camel(storage.column)
    : 'id'
  );
}


// Work backwards along the path applying joins, stopping before the first
// segment.

export function sqlQueryFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
): string {
  return sqlStringFromQuery(
    queryFromRelationship(segmentDescriptionMap, relationship)
  );
}

function queryFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
): Query {
  const initialSegment = relationship.path[0];
  const finalSegment = relationship.path[relationship.path.length - 1];

  return {
    table: tableNameFromTypeName(finalSegment.toType),
    joins: compactJoins(
      joinsFromPath(segmentDescriptionMap, relationship.path)
    ),
    condition: conditionFromSegment(segmentDescriptionMap, initialSegment),
  };
}

function conditionFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment
): Condition {
  const description = descriptionFromSegment(segmentDescriptionMap, segment);

  if (description.type === 'foreignKey') {
    const {table, referencedTable, column, direction} = description.storage;
    if (segment.direction === direction) {
      return {table, column, value: '?'};
    } else {
      return {table: referencedTable, column: 'id'};
    }
  } else {
    const {name, leftTableName, rightTableName, leftColumnName,
      rightColumnName} = description.storage;
    if (segment.direction === 'in') {
      return {table: name, column: rightColumnName};
    } else {
      return {table: name, column: leftColumnName};
    }
  }
}

function joinsFromPath(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segments: RelationshipSegment[]
): Join[] {
  return joinsFromSegments(segmentDescriptionMap, segments.slice(1))
    .concat(joinsFromInitialSegment(segmentDescriptionMap, segments[0]));
}

function joinsFromSegments(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segments: RelationshipSegment[]
): Join[] {
  const joins = [];

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    const description = descriptionFromSegment(segmentDescriptionMap, segment);
    const toTableName = tableNameFromTypeName(segment.toType);

    if (description.type === 'foreignKey') {
      const storage: ForeignKeyDescription = description.storage;
      const {direction, table, referencedTable, column} = storage;
      if (segment.direction === direction) {
        joins.push({
          table: referencedTable,
          condition: {
            left: {table: referencedTable, column: 'id'},
            right: {table, column},
          },
        });
      } else {
        joins.push({
          table,
          condition: {
            left: {table, column},
            right: {table: referencedTable, column: 'id'},
          },
        });
      }
    } else {
      const storage: JoinTableDescription = description.storage;
      const {name, leftTableName, leftColumnName, rightTableName,
        rightColumnName} = storage;
      if (toTableName === leftTableName) {
        joins.push(
          {
            table: name,
            condition: {
              left: {table: name, column: leftColumnName},
              right: {table: leftTableName, column: 'id'},
            },
          },
          {
            table: rightTableName,
            condition: {
              left: {table: rightTableName, column: 'id'},
              right: {table: name, column: rightColumnName},
            },
          },
        );
      } else {
        joins.push(
          {
            table: name,
            condition: {
              left: {table: name, column: rightColumnName},
              right: {table: toTableName, column: 'id'},
            },
          },
          {
            table: leftTableName,
            condition: {
              left: {table: leftTableName, column: 'id'},
              right: {table: name, column: leftColumnName},
            },
          },
        );
      }
    }
  }

  return joins;
}

function joinsFromInitialSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment,
): Join[] {
  const description = descriptionFromSegment(segmentDescriptionMap, segment);

  if (description.type === 'join') {
    const {name, leftTableName, rightTableName, leftColumnName,
      rightColumnName} = description.storage;

    if (segment.direction === 'in') {
      return [{
        table: name,
        condition: {
          left: {table: name, column: leftColumnName},
          right: {table: leftTableName, column: 'id'},
        },
      }];
    } else {
      return [{
        table: name,
        condition: {
          left: {table: name, column: rightColumnName},
          right: {table: rightTableName, column: 'id'},
        },
      }];
    }
  } else {
    return [];
  }
}

function compactJoins(joins: Join[]): Join[] {
  const compactJoins = [];

  for (let i = 0; i < joins.length; i++) {
    const join = joins[i];
    const next = joins[i + 1];
    if (
      next != null &&
      join.condition.left.table === next.condition.right.table &&
      join.condition.left.column === next.condition.right.column
    ) {
      compactJoins.push({
        table: next.table,
        condition: {
          left: next.condition.left,
          right: join.condition.right,
        }
      });
      i += 1;
    } else {
      compactJoins.push(join);
    }
  }

  return compactJoins;
}


function descriptionFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment
): RelationshipSegmentDescription {
  const signature = pairingSignatureFromRelationshipSegment(segment);
  return segmentDescriptionMap[signature];
}

function sqlStringFromQuery(query: Query): string {
  const {table, joins, condition, limit} = query;
  return `SELECT ${table}.* FROM ${table}${
    joins.map(join => {
      const {table, condition} = join;
      const {left, right} = condition;
      return (
        ` JOIN ${table} ON ${left.table}.${left.column} = ` +
        `${right.table}.${right.column}`
      );
    }).join('')
  } WHERE ${
    `${condition.table}.${condition.column} = ANY ($1)`
  }${
    (limit != null) ? ` LIMIT ${limit}` : ''
  };`
}
