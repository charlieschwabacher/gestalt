// @flow
// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.

import type {Relationship, RelationshipSegmentDescriptionMap,
  RelationshipSegmentDescription, RelationshipSegment, Query, Join,
  JoinCondition, JoinConditionSide, QueryCondition, Order,
  GraphQLFieldResolveFn, GraphQLResolveInfo, ConnectionArguments,
  ForeignKeyDescription, JoinTableDescription, DatabaseRelevantSchemaInfo,
  PolymorphicTypeMap} from 'gestalt-utils';
import type DB from './DB';
import {pairingSignatureFromRelationshipSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import DataLoader from 'dataloader';
import camel from 'camel-case';
import snake from 'snake-case';
import {invariant, keyMap, group, flatten} from 'gestalt-utils';

export function generateRelationshipResolver(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
): (relationship: Relationship) => GraphQLFieldResolveFn {
  return relationship => {
    const {keyColumn, typeColumn} = objectKeyColumnsFromRelationship(
      segmentDescriptionMap,
      relationship
    );
    return (object, args, context, info) => {
      const loader = context.loaders.get(relationship);
      const key = object[keyColumn];
      if (relationship.cardinality === 'singular') {
        const type = object[typeColumn];
        return loader.load({key, type});
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
  schemaInfo: DatabaseRelevantSchemaInfo,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationships: Relationship[],
): Map<Relationship, DataLoader> {
  const { polymorphicTypes } = schemaInfo;

  // TODO: we should be able to pregenerate and store SQL queries so that they
  // are only calculated once, not re-calcualted on every request.

  // TODO: instead of using a native map here - we should wrap in something
  // that creates loaders lazily.  It's likely that a single request will only
  // use some small subset of the available loaders so will be worthwile to
  // avoid generating the rest
  const relationshipLoaderMap = new Map();

  relationships.forEach(relationship => {
    relationshipLoaderMap.set(
      relationship,
      generateRelationshipLoader(
        db,
        polymorphicTypes,
        segmentDescriptionMap,
        relationship,
      ),
    );
  });

  return relationshipLoaderMap;
}

export function generateRelationshipLoader(
  db: DB,
  polymorphicTypes: PolymorphicTypeMap,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
): DataLoader {
  const keyColumn = resolvedKeyColumnFromRelationship(
    segmentDescriptionMap,
    relationship
  );

  if (relationship.cardinality === 'singular') {
    return generateSingularRelationshipLoader(
      db,
      polymorphicTypes,
      segmentDescriptionMap,
      relationship,
      keyColumn,
    );
  } else {
    return generatePluralRelationshipLoader(
      db,
      polymorphicTypes,
      segmentDescriptionMap,
      relationship,
      keyColumn,
    );
  }

}

function generateSingularRelationshipLoader(
  db: DB,
  polymorphicTypes: PolymorphicTypeMap,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
  keyColumn: string,
): DataLoader {
  // pre-generate a query
  const query = queryFromRelationship(
    polymorphicTypes,
    segmentDescriptionMap,
    relationship,
  );

  return new DataLoader(async objs => {
    // group requested object keys by type
    const objsByType: Map<?string, string[]> = objs.reduce(
      (memo, {key, type}) => {
        if (memo.has(type)) {
          memo.get(type).push(key);
        } else {
          memo.set(type, [key]);
        }
        return memo;
      },
      new Map(),
    );

    // generate a query for each requested type, and load in parallel
    const results = flatten(
      await Promise.all(
        Array.from(objsByType.entries()).map(([type, keys]) => {
          let sql;
          if (type != null) {
            const table = tableNameFromTypeName(type);
            sql = sqlStringFromQuery({
              ...query,
              table,
              selection: `${table}.*`,
            });
          } else {
            sql = sqlStringFromQuery(query);
          }
          return db.query(sql, [keys]);
        })
      )
    );

    const resultsByKey = keyMap(results, result => result[keyColumn]);
    return objs.map(({key}) => resultsByKey[key]);
  }, {
    cacheKeyFn: ({key, type}) => `${key}|${type}`,
  });
}

// TODO: these are not yet batched - unless we are using 'before' or 'after'
// args they should be able to be batched
function generatePluralRelationshipLoader(
  db: DB,
  polymorphicTypes: PolymorphicTypeMap,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
  keyColumn: string,
): DataLoader {
  const baseQuery = queryFromRelationship(
    polymorphicTypes,
    segmentDescriptionMap,
    relationship,
  );

  // console.log('GENERATING RELATIONSHIP LOADER', keyColumn, baseQuery);

  return new DataLoader(loadKeys => {
    console.log('DATALOADING', loadKeys);
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
        const countSql = sqlStringFromQuery(countQuery(baseQuery));
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
    sqlStringFromQuery(countQuery(slicedQuery)),
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

export function orderFromOrderArgument(order: ?string): Order {
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

// for count: clear order, set reverseResults false, update selection
export function countQuery(query: Query): Query {
  return {
    ...query,
    order: null,
    reverseResults: false,
    selection: `COUNT(${query.table}.*)`,
  };
}

// this is used to calcualte which column on a parent object should be used as
// key when calling .load on a DataLoader to resolve the field for a given
// relationship
export function objectKeyColumnsFromRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship
): {
  keyColumn: string,
  typeColumn: ?string,
} {
  const segment = relationship.path[0];
  const description = descriptionFromSegment(
    segmentDescriptionMap,
    relationship.path[0]
  );

  if (description.type === 'foreignKey') {
    const {storage} = description;
    if (storage.direction !== segment.direction) {
      return {
        keyColumn: camel(storage.column),
        typeColumn: storage.isPolymorphic ? storage.typeColumn : null,
      };
    }
  }

  return {
    keyColumn: 'id',
    typeColumn: null,
  };
}

// This is used to calculate which column on the resolved objects corresponds to
// the object key column in its parent object.  It is necessary in order to
// match rows loaded by a DataLoader in a batch to the individual load requests
// so that they can be fulfilled
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
  polymorphicTypes: PolymorphicTypeMap,
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
  type?: string,
): Query {
  const initialSegment = relationship.path[0];
  const finalSegment = relationship.path[relationship.path.length - 1];

  let table;
  let selection;
  let path;
  const joins = [];
  const conditions = [];

  // if the final type is polymorphic, we may need to select from one table back
  // join each possible type
  const targetTypes = polymorphicTypes[finalSegment.toType];
  if (targetTypes == null) {
    table = tableNameFromTypeName(finalSegment.toType);
    selection = `${table}.*`;
    path = relationship.path;
  } else {
    const targetTables = targetTypes.map(tableNameFromTypeName);
    const description = descriptionFromSegment(
      segmentDescriptionMap,
      finalSegment,
    );

    // if we have a foreign key, we need to select from a table based on the
    // value of type column of the object we have already loaded
    if (description.type === 'foreignKey') {
      invariant(type, 'type information is needed to generate this query');
      table = tableNameFromTypeName(type);
      selection = `${table}.*`;
      path = [];

    // if we have a join table, we need to select from the join table, and join
    // the tables for each member of the polymorphic type
    } else {
      const {storage} = description;
      const side = storage[finalSegment.direction === 'out' ? 'right' : 'left'];
      invariant(side.isPolymorphic);

      const {column, typeColumn} = side;

      table = storage.name;
      selection = targetTables.map(tableName => `${tableName}.*`).join(', ');
      path = relationship.path.slice(0, relationship.path.length - 1);
      joins.push(...leftJoinsFromTargetTypes(
        targetTypes,
        targetTables,
        table,
        column,
        typeColumn,
      ));
    }
  }

  joins.push(...aliasJoins(table, compactJoins(joinsFromPath(
    segmentDescriptionMap,
    path,
  ))));

  const finalJoin = joins[joins.length - 1];
  const conditionAlias = finalJoin && finalJoin.alias;
  conditions.push(
    ...conditionsFromSegment(
      segmentDescriptionMap,
      initialSegment,
      conditionAlias,
      type,
    )
  );

  return {selection, table, joins, conditions};
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

function leftJoinsFromTargetTypes(
  targetTypes: string[],
  targetTables: string[],
  table: string,
  column: string,
  typeColumn: string,
): Join[] {
  return targetTypes.map((typeName, i) => {
    const targetTable = targetTables[i];

    return {
      table: targetTable,
      type: 'LEFT',
      conditions: [
        {
          left: {
            type: 'reference',
            table,
            column: typeColumn,
          },
          right: {
            type: 'value',
            value: `'${typeName}'`,
          },
        },
        {
          left: {
            type: 'reference',
            table: targetTable,
            column: 'id',
          },
          right: {
            type: 'reference',
            table,
            column,
          },
        },
      ]
    };
  });
}

function conditionsFromSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment,
  alias: ?string,
  type: ?string,
): QueryCondition[] {
  const conditions = [];
  const description = descriptionFromSegment(segmentDescriptionMap, segment);
  const operator = '=';
  const value = 'ANY ($1)';

  if (description.type === 'foreignKey') {
    const {table, referencedTable, column, direction} = description.storage;
    if (segment.direction === direction) {

      // this condition is not necessary when ids are globally unique, consider
      // removing after transition to meldio style ids
      if (description.storage.isPolymorphic) {
        const {typeColumn} = description.storage;
        conditions.push({
          table,
          column: typeColumn,
          alias,
          operator,
          value: `'${segment.fromType}'`,
        });
      }

      conditions.push({table, alias, column, operator, value});
    } else {
      let fromTable = referencedTable;
      if (description.storage.isPolymorphic) {
        invariant(type != null);
        fromTable = tableNameFromTypeName(type);
      }
      conditions.push({
        table: fromTable,
        column: 'id',
        alias,
        operator,
        value
      });
    }
  } else {
    const {name, left, right} = description.storage;
    const side = segment.direction === 'in' ? right : left;

    // this condition is not necessary if ids are globally unique, consider
    // removing once the transition to meldio style ids is complete
    if (side.isPolymorphic) {
      conditions.push({
        table: name,
        column: side.typeColumn,
        alias,
        operator,
        value: `'${segment.fromType}'`,
      });
    }

    conditions.push({
      table: name,
      column: side.column,
      alias,
      operator,
      value,
    });
  }

  return conditions;
}

function joinsFromPath(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segments: RelationshipSegment[]
): Join[] {
  if (segments.length === 0) {
    return [];
  }

  // console.log('JOINS FROM PATH');
  // console.log('PATH');
  // console.log(JSON.stringify(segments, null, 2));
  // console.log('JOINS FROM SEGMENTS');
  // console.log(JSON.stringify(joinsFromSegments(segmentDescriptionMap, segments.slice(1)), null, 2));
  // console.log('JOINS FROM INITIAL SEGMENT');
  // console.log(JSON.stringify(joinsFromInitialSegment(segmentDescriptionMap, segments[0]), null, 2));

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
    joins.push(...joinsFromSegment(segment, description));
  }

  return joins;
}

function joinsFromSegment(
  segment: RelationshipSegment,
  description: RelationshipSegmentDescription
): Join[] {
  if (description.type === 'foreignKey') {
    return joinsFromForeignKeySegment(segment, description.storage);
  } else {
    return joinsFromJoinTableSegment(segment, description.storage);
  }
}

function joinsFromForeignKeySegment(
  segment: RelationshipSegment,
  storage: ForeignKeyDescription,
): Join[] {
  const {isPolymorphic, direction, table, referencedTable, column} = storage;
  // console.log('JOINS FROM FOREIGN KEY SEGMENT', {direction, table, referencedTable, column});

  if (segment.direction === direction) {
    return [{
      table: referencedTable,
      conditions: [{
        left: {
          type: 'reference',
          table: referencedTable,
          column: 'id',
        },
        right: {
          type: 'reference',
          table,
          column,
        },
      }],
    }];
  } else {
    return [{
      table,
      conditions: [{
        left: {
          type: 'reference',
          table,
          column,
        },
        right: {
          type: 'reference',
          table: referencedTable,
          column: 'id',
        },
      }],
    }];
  }
}

function joinsFromJoinTableSegment(
  segment: RelationshipSegment,
  storage: JoinTableDescription,
): Join[] {
  const toTableName = tableNameFromTypeName(segment.toType);

  const {
    name,
    left: {
      table: leftTable,
      column: leftColumn,
    },
    right: {
      table: rightTable,
      column: rightColumn,
    },
  } = storage;

  // console.log('JOINS FROM JOIN TABLE SEGMENT', {name, leftTable, rightTable});

  if (toTableName === leftTable) {
    return [
      {
        table: name,
        conditions: [{
          left: {
            type: 'reference',
            table: name,
            column: leftColumn,
          },
          right: {
            type: 'reference',
            table: leftTable,
            column: 'id',
          },
        }],
      },
      {
        table: rightTable,
        conditions: [{
          left: {
            type: 'reference',
            table: rightTable,
            column: 'id',
          },
          right: {
            type: 'reference',
            table: name,
            column: rightColumn,
          },
        }],
      },
    ];
  } else {
    const rightConditions = [{
      left: {
        type: 'reference',
        table: name,
        column: rightColumn,
      },
      right: {
        type: 'reference',
        table: toTableName,
        column: 'id',
      },
    }];

    if (storage.right.isPolymorphic) {
      rightConditions.push({
        left: {
          type: 'reference',
          table: name,
          column: storage.right.typeColumn,
        },
        right: {
          type: 'reference',
          table: toTableName,
          column: '__type',
        },
      });
    }

    const leftConditions = [{
      left: {
        type: 'reference',
        table: leftTable,
        column: 'id',
      },
      right: {
        type: 'reference',
        table: name,
        column: leftColumn,
      },
    }];

    if (storage.left.isPolymorphic) {
      leftConditions.push({
        left: {
          type: 'reference',
          table: leftTable,
          column: '__type',
        },
        right: {
          type: 'reference',
          table: name,
          column: storage.left.typeColumn,
        },
      });
    }

    return [
      {
        table: name,
        conditions: rightConditions,
      },
      {
        table: leftTable,
        conditions: leftConditions,
      },
    ];
  }
}

function joinsFromInitialSegment(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  segment: RelationshipSegment,
): Join[] {
  const description = descriptionFromSegment(segmentDescriptionMap, segment);

  if (description.type === 'join') {
    const {
      name,
      left: {table: leftTable, column: leftColumn},
      right: {table: rightTable, column: rightColumn},
    } = description.storage;

    if (segment.direction === 'in') {
      const conditions = [{
        left: {
          type: 'reference',
          table: name,
          column: leftColumn,
        },
        right: {
          type: 'reference',
          table: leftTable,
          column: 'id',
        },
      }];

      if (description.storage.left.isPolymorphic) {
        conditions.push({
          left: {
            type: 'reference',
            table: name,
            column: description.storage.left.typeColumn,
          },
          right: {
            type: 'reference',
            table: leftTable,
            column: '__type',
          },
        });
      }

      return [{
        table: name,
        conditions,
      }];
    } else {
      const conditions = [{
        left: {
          type: 'reference',
          table: name,
          column: rightColumn,
        },
        right: {
          type: 'reference',
          table: rightTable,
          column: 'id',
        },
      }];

      if (description.storage.right.isPolymorphic) {
        conditions.push({
          left: {
            type: 'reference',
            table: name,
            column: description.storage.right.typeColumn,
          },
          right: {
            type: 'reference',
            table: rightTable,
            column: '__type',
          },
        });
      }

      return [{
        table: name,
        conditions,
      }];
    }
  } else {
    return [];
  }
}

// Joins generated by joinsFromSegments may join intermediate tables that are
// not neccessary in the context of the preceding and following joins.  For
// example if we join user_authored_posts to posts to post_inspired_comments, we
// can skip the posts table and join user_authored_posts directly to
// post_inspired_comments on post_id.  This method looks at an array of joins
// and removes any that are uncessary in this way.
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
          (
            condition.left.type === 'reference' &&
            nextCondition.right.type === 'reference' &&
            condition.left.table === nextCondition.right.table &&
            condition.left.column === nextCondition.right.column
          ) || (
            condition.left.type === 'value' &&
            nextCondition.right.type === 'value' &&
            condition.left.value === nextCondition.right.value
          )
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
