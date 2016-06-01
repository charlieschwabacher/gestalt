// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

import type {Edge, EdgeSegmentDescriptionMap, EdgeSegment, Query, Join,
  Condition, GraphQLFieldResolveFn} from '../types';
import {pairingSignatureFromEdgeSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import {query, find} from './db';
import DataLoader from 'dataloader';
import {camel} from 'change-case';
import {keyMap, group} from '../util';


export function generateEdgeResolver(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
): (edge: Edge) => GraphQLFieldResolveFn {
  return edge => {
    const keyColumn = objectKeyColumnFromEdge(segmentDescriptionMap, edge);
    return (object, args, context) => {
      const loader = context.loaders.get(edge);
      const key = object[keyColumn];
      return loader.load(key);
    };
  };
}

export function generateEdgeLoaders(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edges: Edge[],
): () => Map<Edge, DataLoader> {
  // TODO: we should be able to pregenerate and store SQL queries so that they
  // are only calculated once, not re-calcualted on every request.

  return () => {
    // TODO: instead of using a native map here - we should wrap in something
    // that creates loaders lazily.  It's likely that a single request will only
    // use some small subset of the available loaders so will be worthwile to
    // avoid generating the rest

    const edgeLoaderMap = new Map();

    edges.forEach(edge => {
      const keyColumn = resolvedKeyColumnFromEdge(segmentDescriptionMap, edge);
      const sql = sqlQueryFromEdge(segmentDescriptionMap, edge);

      if (edge.cardinality === 'singular') {
        edgeLoaderMap.set(
          edge,
          generateSingularEdgeLoader(edge, keyColumn, sql)
        );
      } else {
        edgeLoaderMap.set(
          edge,
          generatePluralEdgeLoader(edge, keyColumn, sql)
        );
      }
    });

    return edgeLoaderMap;
  };
}

function generateSingularEdgeLoader(
  edge: Edge,
  keyColumn: string,
  sql: string
): DataLoader {
  return new DataLoader(async keys => {
    const results = await query(sql, [keys]);
    const resultsByKey = keyMap(results, result => result[keyColumn]);
    return keys.map(key => resultsByKey[key]);
  });
}

// TODO: this needs to handle connection arguments
function generatePluralEdgeLoader(
  edge: Edge,
  keyColumn: string,
  sql: string
): DataLoader {
  return new DataLoader(keys => {
    return Promise.all(keys.map(async ({key, args}) => {
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
    }));
  });
}

export function objectKeyColumnFromEdge(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edge: Edge
): string {
  const segment = edge.path[0];
  const description = descriptionFromSegment(
    segmentDescriptionMap,
    edge.path[0]
  );
  const {type, storage} = description;

  return (
    type === 'foreignKey' && storage.direction !== segment.direction
    ? camel(storage.column)
    : 'id'
  );
}

export function resolvedKeyColumnFromEdge(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edge: Edge
): string {
  const segment = edge.path[0];
  const description = descriptionFromSegment(
    segmentDescriptionMap,
    edge.path[0]
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

export function sqlQueryFromEdge(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edge: Edge,
): string {
  return sqlStringFromQuery(
    queryFromEdge(segmentDescriptionMap, edge)
  );
}

function queryFromEdge(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edge: Edge,
): Query {
  const initialSegment = edge.path[0];
  const finalSegment = edge.path[edge.path.length - 1];

  return {
    table: tableNameFromTypeName(finalSegment.toType),
    joins: compactJoins(joinsFromPath(segmentDescriptionMap, edge.path)),
    condition: conditionFromSegment(segmentDescriptionMap, initialSegment),
  };
}

function conditionFromSegment(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segment: EdgeSegment
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
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segments: EdgeSegment[]
): Join[] {
  return joinsFromSegments(segmentDescriptionMap, segments.slice(1))
    .concat(joinsFromInitialSegment(segmentDescriptionMap, segments[0]));
}

function joinsFromSegments(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segments: EdgeSegment[]
): Join[] {
  const joins = [];

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    const description = descriptionFromSegment(segmentDescriptionMap, segment);
    const {storage} = description;
    const toTableName = tableNameFromTypeName(segment.toType);

    if (description.type === 'foreignKey') {
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
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segment: EdgeSegment,
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
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segment: EdgeSegment
): EdgeSegmentDescription {
  const signature = pairingSignatureFromEdgeSegment(segment);
  return segmentDescriptionMap[signature];
}

function sqlStringFromQuery(query: Query): string {
  const {table, joins, condition} = query;
  return `SELECT ${table}.* FROM ${table}${
    joins.map(join => {
      const {table, condition} = join;
      const {left, right} = condition;
      return (
        ` JOIN ${table} ON ${left.table}.${left.column} = ` +
        `${right.table}.${right.column}`
      );
    }).join('')
  } WHERE ${condition.table}.${condition.column} = ANY ($1);`;
}
