// @flow
// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.

import type {Relationship, RelationshipSegmentDescriptionMap,
  RelationshipSegmentDescription, RelationshipSegment, Query, Join,
  JoinCondition, QueryCondition, Order, GraphQLFieldResolveFn,
  GraphQLResolveInfo, ConnectionArguments, ForeignKeyDescription,
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
    return (object, args, context, info) => {
      const loader = context.loaders.get(relationship);
      const key = object[keyColumn];
      if (relationship.cardinality === 'singular') {
        return loader.load(key);
      } else {
        validateConnectionArgs(args);
        return loader.load({key, args, info});
      }
    };
  };
}

// TODO: this doesn't yet check inside fragments - if there are any present we
// assume all fields are selected
export function selectsField(
  info: GraphQLResolveInfo,
  fieldName: string,
): boolean {
  const field = info.fieldASTs[0];
  return (
    (info.fragments && Object.keys(info.fragments).length > 0) ||
    field && field.selectionSet.selections.some(
      selection => selection.name.value === fieldName
    )
  );
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
    return Promise.all(loadKeys.map(async ({key, args, info}) => {

      // resolve edges
      const slicedQuery = applyCursorsToQuery(baseQuery, args);
      const connectionQuery = applyLimitToQuery(slicedQuery, args);
      const sql = sqlStringFromQuery(connectionQuery);
      const params: mixed[] = [[key]];
      if (args.before || args.after) {
        params.push(args.before || args.after);
      }
      const nodes = await db.query(sql, params);
      const edges = nodes.map(node => ({node, cursor: node.id}));

      // look ahead in query AST to determine wether to resolve totalCount and
      // pageInfo
      const selectsCount = selectsField(info, 'totalCount');
      const selectsPageInfo = selectsField(info, 'pageInfo');

      let totalCount, pageInfo;
      if (selectsCount || selectsPageInfo) {
        const countSql = sqlStringFromQuery(baseQuery, true);
        totalCount = await db.count(countSql, [[key]]);
        if (selectsPageInfo) {
          pageInfo = {
            hasPreviousPage: await resolveHasPreviousPage(
              db,
              key,
              args,
              slicedQuery,
              nodes.length,
              totalCount
            ),
            hasNextPage: await resolveHasNextPage(
              db,
              key,
              args,
              slicedQuery,
              nodes.length,
              totalCount
            ),
          };
        }
      }

      return {
        edges,
        totalCount,
        pageInfo,
      };
    }));
  });
}

async function resolveHasPreviousPage(
  db: DB,
  key: string,
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

  const count = await db.count(
    sqlStringFromQuery(slicedQuery, true),
    [[key], args.before]
  );
  return count > nodesLength;
}

async function resolveHasNextPage(
  db: DB,
  key: string,
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

  const count = await db.count(
    sqlStringFromQuery(slicedQuery, true),
    [[key], args.after]
  );
  return count > nodesLength;
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
  const order = orderFromOrderArgument(args.order);

  // for reverse pagination, we need to flip the ordering in order to use LIMIT,
  // and then reverse the results
  let reverseResults = false;
  if (before != null || last != null) {
    order.direction = order.direction === 'ASC' ? 'DESC' : 'ASC';
    reverseResults = true;
  }

  const {table} = query;
  const {column, direction} = order;
  const value = `(SELECT ${column} FROM ${table} WHERE id = $2)`;
  const operator = direction === 'ASC' ? '>' : '<';
  let {conditions} = query;

  if (before != null || after != null) {
    conditions = conditions.concat({
      table,
      column,
      value,
      operator,
    });
  }

  return {
    ...query,
    conditions,
    order,
    reverseResults,
  };
}

export function orderFromOrderArgument(order: string): Order {
  return {
    column: (
      order == null || order === 'ASC' || order === 'DESC'
      ? 'seq'
      : snake(order.replace(/_ASC$|_DESC$/, ''))
    ),
    direction: order && order.match(/DESC$/) ? 'DESC' : 'ASC',
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

  if (description.type === 'foreignKey') {
    const {storage} = description;
    if (storage.direction !== segment.direction) {
      return camel(storage.column);
    }
  }

  return 'id';
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

  if (description.type === 'foreignKey') {
    const {storage} = description;
    if (storage.direction === segment.direction) {
      return camel(storage.column);
    }
  }

  return 'id';
}


// Work backwards along the path applying joins, stopping before the first
// segment.

export function queryFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
): Query {
  const initialSegment = relationship.path[0];
  const finalSegment = relationship.path[relationship.path.length - 1];
  const table = tableNameFromTypeName(finalSegment.toType);
  const joins = aliasJoins(table, compactJoins(joinsFromPath(
    segmentDescriptionMap,
    relationship.path
  )));
  const finalJoin = joins[joins.length - 1];
  const conditionAlias = finalJoin && finalJoin.alias;
  const conditions = [
    conditionFromSegment(segmentDescriptionMap, initialSegment, conditionAlias)
  ];

  return {table, joins, conditions};
}

function aliasJoins(table: string, joins: Join[]): Join[] {
  const usedTables = {[table]: 1};
  return joins.map(join => {
    const usage = usedTables[join.table];
    const alias = usage && `${join.table}${usage + 1}`;
    usedTables[join.table] = (usage || 0) + 1;
    return {...join, alias};
  });
}

function conditionFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment,
  alias: ?string,
): QueryCondition {
  const description = descriptionFromSegment(segmentDescriptionMap, segment);
  const operator = '=';
  const value = 'ANY ($1)';

  if (description.type === 'foreignKey') {
    const {table, referencedTable, column, direction} = description.storage;
    if (segment.direction === direction) {
      return {table, alias, column, operator, value};
    } else {
      return {table: referencedTable, column: 'id', alias, operator, value};
    }
  } else {
    const {name, leftTableName, rightTableName, leftColumnName,
      rightColumnName} = description.storage;
    if (segment.direction === 'in') {
      return {table: name, column: rightColumnName, alias, operator, value};
    } else {
      return {table: name, column: leftColumnName, alias, operator, value};
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
          conditions: [{
            left: {table: referencedTable, column: 'id'},
            right: {table, column},
          }],
        });
      } else {
        joins.push({
          table,
          conditions: [{
            left: {table, column},
            right: {table: referencedTable, column: 'id'},
          }],
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
            conditions: [{
              left: {table: name, column: leftColumnName},
              right: {table: leftTableName, column: 'id'},
            }],
          },
          {
            table: rightTableName,
            conditions: [{
              left: {table: rightTableName, column: 'id'},
              right: {table: name, column: rightColumnName},
            }],
          },
        );
      } else {
        joins.push(
          {
            table: name,
            conditions: [{
              left: {table: name, column: rightColumnName},
              right: {table: toTableName, column: 'id'},
            }],
          },
          {
            table: leftTableName,
            conditions: [{
              left: {table: leftTableName, column: 'id'},
              right: {table: name, column: leftColumnName},
            }],
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
        conditions: [{
          left: {table: name, column: leftColumnName},
          right: {table: leftTableName, column: 'id'},
        }],
      }];
    } else {
      return [{
        table: name,
        conditions: [{
          left: {table: name, column: rightColumnName},
          right: {table: rightTableName, column: 'id'},
        }],
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
      join.conditions.length === next.conditions.length &&
      join.conditions.every((condition, index) => {
        const nextCondition = next.conditions[index];
        return (
          condition.left.table === nextCondition.right.table &&
          condition.left.column === nextCondition.right.column
        );
      })
    ) {
      compactJoins.push({
        table: next.table,
        conditions: join.conditions.map((condition, index) => {
          const nextCondition = next.conditions[index];
          return {
            left: nextCondition.left,
            right: condition.right,
          };
        })
      });
      i += 1;
    } else {
      compactJoins.push(join);
    }
  }

  return compactJoins;
}

export function descriptionFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment
): RelationshipSegmentDescription {
  const signature = pairingSignatureFromRelationshipSegment(segment);
  return segmentDescriptionMap[signature];
}

export function sqlStringFromJoin(join: Join): string {
  const {table, alias, conditions} = join;
  const aliasedLeftTableName = alias || conditions[0].left.table;

  return ` JOIN ${table}${alias != null ? ` ${alias}` : ''} ON ${
    conditions.map(({left, right}) =>
      `${aliasedLeftTableName}.${left.column} = ${right.table}.${right.column}`
    ).join(' AND ')
  }`;
}

export function sqlStringFromQuery(
  query: Query,
  count: boolean = false
): string {
  const {table, joins, conditions, limit, order, reverseResults} = query;

  let sql = `SELECT ${
    count
    ? `COUNT(${table}.*)`
    : `${table}.*`
  } FROM ${table}${
    joins.map(sqlStringFromJoin).join('')
  } WHERE ${
    conditions.map(({table, alias, column, operator, value}) =>
      `${alias || table}.${column} ${operator} ${value}`
    ).join(' AND ')
  }${
    (order != null && !count)
    ? ` ORDER BY ${table}.${order.column} ${order.direction}`
    : ''
  }${
    (limit != null) ? ` LIMIT ${limit}` : ''
  }`;

  if (reverseResults && !count) {
    invariant(order, 'results cannot be reversed without a defined order');

    const column = order.column;
    const direction = order.direction === 'ASC' ? 'DESC' : 'ASC';
    sql = `SELECT * FROM (${sql}) ${table} ORDER BY ${column} ${direction}`;
  }

  return `${sql};`;
}
