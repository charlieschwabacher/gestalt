// @flow
// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.

import type {Relationship, RelationshipSegmentDescriptionMap,
  RelationshipSegmentDescription, RelationshipSegment, Query, Join, Condition,
  GraphQLFieldResolveFn, ConnectionArguments, ForeignKeyDescription,
  JoinTableDescription} from 'gestalt-utils';
import type DB from './DB';
import {pairingSignatureFromRelationshipSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import DataLoader from 'dataloader';
import camel from 'camel-case';
import snake from 'snake-case';
import {invariant, keyMap, group} from 'gestalt-utils';


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
      if (relationship.cardinality === 'singular') {
        return loader.load(key);
      } else {
        validateConnectionArgs(args);
        return loader.load({key, args});
      }
    };
  };
}

export function generateRelationshipLoaders(
  db: DB,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationships: Relationship[],
): Map<Relationship, DataLoader> {
  // TODO: we should be able to pregenerate and store SQL queries so that they
  // are only calculated once, not re-calcualted on every request.

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
    const query = queryFromRelationship(
      segmentDescriptionMap,
      relationship,
    );

    if (relationship.cardinality === 'singular') {
      const sql = sqlStringFromQuery(query);
      relationshipLoaderMap.set(
        relationship,
        generateSingularRelationshipLoader(
          db,
          relationship,
          keyColumn,
          sql
        )
      );
    } else {
      relationshipLoaderMap.set(
        relationship,
        generatePluralRelationshipLoader(
          db,
          relationship,
          keyColumn,
          query
        )
      );
    }
  });

  return relationshipLoaderMap;
}

function generateSingularRelationshipLoader(
  db: DB,
  relationship: Relationship,
  keyColumn: string,
  sql: string
): DataLoader {
  return new DataLoader(async keys => {
    const results = await db.query(sql, [keys]);
    const resultsByKey = keyMap(results, result => result[keyColumn]);
    return keys.map(key => resultsByKey[key]);
  });
}

function generatePluralRelationshipLoader(
  db: DB,
  relationship: Relationship,
  keyColumn: string,
  baseQuery: Query,
): DataLoader {
  return new DataLoader(loadKeys => {
    return Promise.all(loadKeys.map(async ({key, args}) => {
      const slicedQuery = applyCursorsToQuery(baseQuery, args);
      const connectionQuery = applyLimitToQuery(slicedQuery, args);
      const sql = sqlStringFromQuery(connectionQuery);
      const countSql = sqlStringFromQuery(baseQuery, true);
      const params = [[key]];
      if (args.before || args.after) {
        params.push(args.before || args.after);
      }
      const nodes = await db.query(sql, params);
      const totalCount = await db.count(countSql, [[key]]);
      const edges = nodes.map(node => ({node, cursor: node.id}));
      return {
        edges,
        totalCount,
        pageInfo: {
          hasPreviousPage: await resolveHasPreviousPage(
            db,
            args,
            slicedQuery,
            nodes.length,
            totalCount
          ),
          hasNextPage: await resolveHasNextPage(
            db,
            args,
            slicedQuery,
            nodes.length,
            totalCount
          ),
        },
      };
    }));
  });
}

async function resolveHasPreviousPage(
  db: DB,
  args: Object,
  slicedQuery: Query,
  nodesLength: number,
  totalCount: number,
): Promise<boolean> {
  if (args.last == null) {
    return false;
  }
  if (args.before == null) {
    return totalCount > nodesLength;
  }
  return (await db.count(slicedQuery)) > nodesLength;
}

async function resolveHasNextPage(
  db: DB,
  args: Object,
  slicedQuery: Query,
  nodesLength: number,
  totalCount: number
): Promise<boolean> {
  if (args.first == null) {
    return false;
  }
  if (args.after == null) {
    return totalCount > nodesLength;
  }
  return (await db.count(slicedQuery) > nodesLength);
}

export function validateConnectionArgs(
  args: ConnectionArguments
): void {
  const {first, last, before, after} = args;

  // we don't support combining forward and reverse paging because it does not
  // translate well to SQL
  invariant(
    (first == null && after == null) || (last == null && before == null),
    'forward and reverse pagination arguments should not be combined'
  );
}

export function applyCursorsToQuery(
  query: Query,
  args: ConnectionArguments
): Query {
  const {before, after, first, last} = args;
  const column = args.order == null ? 'seq' : snake(args.order);
  const {table} = query;
  const value = `(SELECT ${column} FROM ${table} WHERE id = $2)`;
  let {conditions} = query;

  const order = {
    column,
    direction: (last != null || before != null) ? 'DESC' : 'ASC',
  };

  if (after != null) {
    conditions = conditions.concat({
      table,
      column,
      value,
      operator: '>',
    });
  } else if (before != null) {
    conditions = conditions.concat({
      table,
      column,
      value,
      operator: '<',
    });
  }

  return {
    ...query,
    order,
    conditions,
  };
}

export function applyLimitToQuery(
  query: Query,
  args: ConnectionArguments,
): Query {
  const {first, last} = args;
  const limit = (first != null) ? first : last;
  return {
    ...query,
    limit,
  };
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

export function queryFromRelationship(
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
    conditions: [conditionFromSegment(segmentDescriptionMap, initialSegment)],
    batched: true,
  };
}


function conditionFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment
): Condition {
  const description = descriptionFromSegment(segmentDescriptionMap, segment);
  const operator = '=';
  const value = 'ANY ($1)';

  if (description.type === 'foreignKey') {
    const {table, referencedTable, column, direction} = description.storage;
    if (segment.direction === direction) {
      return {table, column, operator, value};
    } else {
      return {table: referencedTable, column: 'id', operator, value};
    }
  } else {
    const {name, leftTableName, rightTableName, leftColumnName,
      rightColumnName} = description.storage;
    if (segment.direction === 'in') {
      return {table: name, column: rightColumnName, operator, value};
    } else {
      return {table: name, column: leftColumnName, operator, value};
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

export function sqlStringFromQuery(
  query: Query,
  count: boolean = false
): string {
  const {table, joins, conditions, limit, order} = query;

  return `SELECT ${
    count
    ? `COUNT(${table}.*)`
    : `${table}.*`
  } FROM ${table}${
    joins.map(join => {
      const {table, condition} = join;
      const {left, right} = condition;
      return (
        ` JOIN ${table} ON ${left.table}.${left.column} = ` +
        `${right.table}.${right.column}`
      );
    }).join('')
  } WHERE ${
    conditions.map(({table, column, operator, value}) =>
      `${table}.${column} ${operator} ${value}`
    ).join(' AND ')
  }${
    (order != null)
    ? ` ORDER BY ${table}.${order.column} ${order.direction}`
    : ''
  }${
    (limit != null) ? ` LIMIT ${limit}` : ''
  };`;
}
