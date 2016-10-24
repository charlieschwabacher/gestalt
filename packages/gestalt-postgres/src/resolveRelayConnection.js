// @flow
import type {Query, ConnectionArguments, Order, GraphQLResolveInfo} from
  'gestalt-utils';
import type DB from './DB';
import {invariant} from 'gestalt-utils';
import {sqlStringFromQuery} from './sqlStringFromQuery';
import snake from 'snake-case';

export async function resolveRelayConnection(
  db: DB,
  query: Query,
  key: string,
  args: Object,
  info: GraphQLResolveInfo,
): Promise<{
  edges: Array<{
    cursor: string,
    node: Object,
  }>,
  totalCount: ?number,
  pageInfo: ?{
    hasNextPage: ?boolean,
    hasPreviousPage: ?boolean,
  },
}> {
  const slicedQuery = applyCursorsToQuery(query, args);
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
    const countSql = sqlStringFromQuery(countQuery(query));
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

export async function resolveHasPreviousPage(
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
    sqlStringFromQuery(countQuery(slicedQuery)),
    [[key], args.before]
  );
  return count > nodesLength;
}

export async function resolveHasNextPage(
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
    sqlStringFromQuery(countQuery(slicedQuery)),
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
  const order = orderFromOrderArgument(query.defaultOrder, args.order);

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

export function orderFromOrderArgument(defaultOrder: Order, order: ?string): Order {
  if (order == null) {
    return defaultOrder;
  }

  return {
    column: (
      order === 'ASC' || order === 'DESC'
      ? defaultOrder.column
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

// for count: clear order, set reverseResults false, update selection
export function countQuery(query: Query): Query {
  return {
    ...query,
    order: null,
    reverseResults: false,
    selection: `COUNT(${query.table}.*)`,
    joins: query.joins.filter(join => join.type !== 'LEFT'),
  };
}
