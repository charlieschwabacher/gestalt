// @flow
import type {Join, JoinConditionSide, Query} from 'gestalt-utils';
import {invariant} from 'gestalt-utils';

export function sqlStringFromQuery(
  query: Query,
): string {
  invariant(
    !query.variableTable,
    'query must have a defined table in order generate a SQL string'
  );

  const {selection, table, joins, conditions, limit, order, reverseResults} =
    query;

  let sql = `SELECT ${
    selection
  } FROM ${
    table
  }${
    joins.map(sqlStringFromJoin).join('')
  } WHERE ${
    conditions.map(({table, alias, column, operator, value}) =>
      `${alias || table}.${column} ${operator} ${value}`
    ).join(' AND ')
  }${
    (order != null)
    ? ` ORDER BY ${table}.${order.column} ${order.direction}`
    : ''
  }${
    (limit != null) ? ` LIMIT ${limit}` : ''
  }`;

  if (reverseResults) {
    invariant(order, 'results cannot be reversed without a defined order');

    const column = order.column;
    const direction = order.direction === 'ASC' ? 'DESC' : 'ASC';
    sql = `SELECT * FROM (${sql}) ${table} ORDER BY ${column} ${direction}`;
  }

  return `${sql};`;
}

export function sqlStringFromJoin(join: Join): string {
  const {type, table, alias, conditions} = join;

  return `${
    type ? ` ${type}` : ''
  } JOIN ${table}${
    alias != null ? ` ${alias}` : ''
  } ON ${
    conditions.map(({left, right}) =>
      `${
        sqlStringFromJoinConditionSide(table, alias, left)
      } = ${
        sqlStringFromJoinConditionSide(table, null, right)
      }`
    ).join(' AND ')
  }`;
}

export function sqlStringFromJoinConditionSide(
  table: string,
  alias: ?string,
  side: JoinConditionSide,
): string {
  if (side.type === 'reference') {
    if (side.table === table && alias != null) {
      return `${alias}.${side.column}`;
    } else {
      return `${side.table}.${side.column}`;
    }
  } else {
    return side.value;
  }
}
