// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

import type {Edge, EdgeSegmentDescriptionMap, EdgeSegment, Query, Join,
  Condition} from '../types';
import {pairingSignatureFromEdgeSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import {query, find} from './db';


export default function generateEdgeResolver(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  edge: Edge,
): () => Promise<Object> {
  const sql = sqlQueryFromEdge(segmentDescriptionMap, edge);

  return async () => {
    const results = query(sql);
    return {
      edges: [],
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
      },
      count: 0,
      totalCount: 0,
    };
  };
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

export function queryFromEdge(
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

export function conditionFromSegment(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segment: EdgeSegment
): Condition {
  const signature = pairingSignatureFromEdgeSegment(segment);
  const description = segmentDescriptionMap[signature];

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

export function joinsFromPath(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segments: EdgeSegment[]
): Join[] {
  return joinsFromSegments(segmentDescriptionMap, segments.slice(1))
    .concat(joinsFromInitialSegment(segmentDescriptionMap, segments[0]));
}

export function joinsFromSegments(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segments: EdgeSegment[]
): Join[] {
  const joins = [];

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    const signature = pairingSignatureFromEdgeSegment(segment);
    const description = segmentDescriptionMap[signature];
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

export function joinsFromInitialSegment(
  segmentDescriptionMap: EdgeSegmentDescriptionMap,
  segment: EdgeSegment,
): Join[] {
  const signature = pairingSignatureFromEdgeSegment(segment);
  const description = segmentDescriptionMap[signature];

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

export function compactJoins(joins: Join[]): Join[] {
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
