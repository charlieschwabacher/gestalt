// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.
// @flow

import type {Edge, EdgeSegmentDescriptionMap, EdgeSegment} from '../types';
import {pairingSignatureFromEdgeSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import {query, find} from './db';


export default function generateEdgeResolver(
  segmentDescriptionsBySignature: EdgeSegmentDescriptionMap,
  edge: Edge,
): () => Promise<Object> {
  const sql = sqlQueryFromEdge(segmentDescriptionsBySignature, edge);

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
// segment.  We won't need any if the path has only one segment.
// Then look at first segment to apply condition based on id.
export function sqlQueryFromEdge(
  segmentDescriptionsBySignature: EdgeSegmentDescriptionMap,
  edge: Edge,
): string {
  return (
    selectClauseFromFinalSegment(edge.path[edge.path.length - 1]) +
    joinClauseFromIntermediateSegments(segmentDescriptionsBySignature, edge.path.slice(1)) +
    whereClauseFromInitialSegment(segmentDescriptionsBySignature, edge.path[0])
  );
}

function selectClauseFromFinalSegment(segment: EdgeSegment): string {
  const finalTableName = tableNameFromTypeName(segment.toType);
  return `SELECT ${finalTableName}.* FROM ${finalTableName}`;
}

function whereClauseFromInitialSegment(
  segmentDescriptionsBySignature: EdgeSegmentDescriptionMap,
  segment: EdgeSegment,
): string {
  const signature = pairingSignatureFromEdgeSegment(segment);
  const description = segmentDescriptionsBySignature[signature];

  if (description.type === 'foreignKey') {
    const {table, referencedTable, column, direction} = description.storage;
    if (segment.direction === direction) {
      return ` WHERE ${table}.${column} = ?;`;
    } else {
      return ` WHERE ${referencedTable}.id = ?;`;
    }
  } else {
    const {name, leftTableName, rightTableName, leftColumnName,
      rightColumnName} = description.storage;

    if (segment.direction === 'in') {
      return ` JOIN ${name} ON ${name}.${leftColumnName} = ${leftTableName}.id WHERE ${name}.${rightColumnName} = ?;`;
    } else {
      return ` JOIN ${name} ON ${name}.${rightColumnName} = ${rightTableName}.id WHERE ${name}.${leftColumnName} = ?;`;
    }
  }
}

function joinClauseFromIntermediateSegments(
  segmentDescriptionsBySignature: EdgeSegmentDescriptionMap,
  segments: EdgeSegment[],
): string {
  return segments.reverse().map(segment => {
    const signature = pairingSignatureFromEdgeSegment(segment);
    const description = segmentDescriptionsBySignature[signature];
    const {storage} = description;
    const toTableName = tableNameFromTypeName(segment.toType);

    if (description.type === 'foreignKey') {
      const {direction, table, referencedTable, column} = description.storage;
      if (segment.direction === direction) {
        return ` JOIN ${referencedTable} ON ${referencedTable}.id = ${table}.${column}`;
      } else {
        return ` JOIN ${table} ON ${table}.${column} = ${referencedTable}.id`;
      }
    } else {
      if (toTableName === storage.leftTableName) {
        return ` JOIN ${storage.name} ON ${storage.name}.${storage.leftColumnName} = ${toTableName}.id JOIN ${storage.rightTableName} ON ${storage.rightTableName}.id = ${storage.name}.${storage.rightColumnName}`;
      } else {
        // JOIN user_authored_posts ON user_authored_posts.authored_post_id = posts.id JOIN users ON users.id = user_authored_posts.user_id
        return ` JOIN ${storage.name} ON ${storage.name}.${storage.rightColumnName} = ${toTableName}.id JOIN ${storage.leftTableName} ON ${storage.leftTableName}.id = ${storage.name}.${storage.leftColumnName}`;
      }
    }
  }).join('');
}
