// @flow
// Creates a resolve function for a GraphQL schema given a source type, target
// type, and relationship information.

import type {Relationship, DescribedRelationship,
  RelationshipSegmentDescriptionMap, RelationshipSegmentDescription,
  RelationshipSegment, DescribedSegment, Query, Join, JoinCondition,
  JoinConditionSide, QueryCondition, Order, GraphQLFieldResolveFn,
  GraphQLResolveInfo, ConnectionArguments, ForeignKeyDescription,
  JoinTableDescription, DatabaseRelevantSchemaInfo, PolymorphicTypeMap} from
  'gestalt-utils';
import type DB from './DB';
import {pairingSignatureFromRelationshipSegment, tableNameFromTypeName} from
  './generateDatabaseInterface';
import {sqlStringFromQuery} from './sqlStringFromQuery';
import {validateConnectionArgs, resolveRelayConnection} from
  './resolveRelayConnection';
import DataLoader from 'dataloader';
import camel from 'camel-case';
import snake from 'snake-case';
import {invariant, keyMap, group, flatten} from 'gestalt-utils';

export function generateRelationshipResolver(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
): (relationship: Relationship) => GraphQLFieldResolveFn {
  return relationship => {
    const describedRelationship = describeRelationship(
      segmentDescriptionMap,
      relationship
    );

    const {keyColumn, typeColumn} = objectKeyColumnsFromRelationship(
      describedRelationship,
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
        describeRelationship(segmentDescriptionMap, relationship),
      ),
    );
  });

  return relationshipLoaderMap;
}

export function generateRelationshipLoader(
  db: DB,
  polymorphicTypes: PolymorphicTypeMap,
  relationship: DescribedRelationship,
): DataLoader {
  const keyColumn = resolvedKeyColumnFromRelationship(relationship);

  if (relationship.cardinality === 'singular') {
    return generateSingularRelationshipLoader(
      db,
      polymorphicTypes,
      relationship,
      keyColumn,
    );
  } else {
    return generatePluralRelationshipLoader(
      db,
      polymorphicTypes,
      relationship,
      keyColumn,
    );
  }

}

function generateSingularRelationshipLoader(
  db: DB,
  polymorphicTypes: PolymorphicTypeMap,
  relationship: DescribedRelationship,
  keyColumn: string,
): DataLoader {
  // pre-generate a query
  const query = queryFromRelationship(
    polymorphicTypes,
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
  relationship: DescribedRelationship,
  keyColumn: string,
): DataLoader {
  const baseQuery = queryFromRelationship(
    polymorphicTypes,
    relationship,
  );
  // console.log('GENERATING RELATIONSHIP LOADER', keyColumn, baseQuery);
  return new DataLoader(loadKeys =>
    Promise.all(loadKeys.map(({key, args, info}) =>
      resolveRelayConnection(db, baseQuery, key, args, info)
    )),
  );
}

// this is used to calcualte which column on a parent object should be used as
// key when calling .load on a DataLoader to resolve the field for a given
// relationship
export function objectKeyColumnsFromRelationship(
  relationship: DescribedRelationship
): {
  keyColumn: string,
  typeColumn: ?string,
} {
  const segment = relationship.path[0];
  if (segment.description.type === 'foreignKey') {
    const {storage} = segment.description;
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
  relationship: DescribedRelationship
): string {
  const segment = relationship.path[0];

  if (segment.description.type === 'foreignKey') {
    const {storage} = segment.description;
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
  relationship: DescribedRelationship,
  type?: string,
): Query {
  const finalSegment = relationship.path[relationship.path.length - 1];

  let table;
  let selection;
  let path;
  let joins = [];
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
    const {description} = finalSegment;

    // if we have a foreign key, we need to select from a table based on the
    // value of type column of the object we have already loaded
    if (description.type === 'foreignKey') {
      invariant(type, 'type information is needed to generate this query');
      table = tableNameFromTypeName(type);
      selection = `${table}.*`;

      // TODO: in the case of interfaces, we may be able to continue here, but
      // at the moment don't allow additional joins after a polymorphic type
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

  joins.push(...joinsFromPath(path));

  joins = aliasJoins(table, compactJoins(joins));

  conditions.push(
    ...conditionsFromSegment(
      relationship.path[0],
      relationship.path[1],
      joins[joins.length - 1],
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
  segment: DescribedSegment,
  previousSegment: ?DescribedSegment,
  join: ?Join,
  type: ?string,
): QueryCondition[] {
  const {description} = segment;
  const alias = join && join.alias;
  const conditions = [];
  const operator = '=';
  const value = 'ANY ($1)';

  // console.log('HERE', JSON.stringify({segment, previousSegment}, null, 2));

  if (description.type === 'foreignKey') {
    const {table, column, direction} = description.storage;
    const referencedTable =
      description.storage.isPolymorphic
      ? '@@@@'
      : description.storage.referencedTable;

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
      let column = 'id';
      if (description.storage.isPolymorphic) {
        invariant(type != null);
        if (previousSegment == null) {
          fromTable = tableNameFromTypeName(type);
        } else {
          const previousDescription = previousSegment.description;
          if (previousDescription.type === 'join') {
            const {direction, storage} = previousDescription;
            const side = storage[direction === 'in' ? 'right' : 'left'];
            fromTable = storage.name;
            column = side.column;

            console.log('HERE', previousSegment, fromTable, column);

            conditions.push({
              table: fromTable,
              column: side.typeColumn,
              alias,
              operator,
              value: `'${type}'`,
            });
          } else if (previousDescription.type === 'foreignKey') {
            // TODO: do you need to handle this case?
          }
        }
      }

      conditions.push({
        table: fromTable,
        column,
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
  segments: DescribedSegment[]
): Join[] {
  if (segments.length === 0) {
    return [];
  }

  // console.log('JOINS FROM PATH');
  // console.log('PATH');
  // console.log(JSON.stringify(segments, null, 2));
  // console.log('JOINS FROM SEGMENTS');
  // console.log(JSON.stringify(joinsFromSegments(segments.slice(1)), null, 2));
  // console.log('JOINS FROM INITIAL SEGMENT');
  // console.log(JSON.stringify(joinsFromInitialSegment(segments[0]), null, 2));

  return joinsFromSegments(segments.slice(1)).concat(
    joinsFromInitialSegment(segments[0]),
  );
}

function joinsFromSegments(
  segments: DescribedSegment[]
): Join[] {
  const joins = [];

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    joins.push(...joinsFromSegment(segment));
  }

  return joins;
}

function joinsFromSegment(segment: DescribedSegment): Join[] {
  if (segment.description.type === 'foreignKey') {
    return joinsFromForeignKeySegment(segment, segment.description.storage);
  } else {
    return joinsFromJoinTableSegment(segment, segment.description.storage);
  }
}

function joinsFromForeignKeySegment(
  segment: DescribedSegment,
  storage: ForeignKeyDescription,
): Join[] {
  const {isPolymorphic, direction, table, column} = storage;
  const referencedTable = (
    storage.isPolymorphic
    ? '@@@@'
    : storage.referencedTable
  );

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
  segment: DescribedSegment,
  storage: JoinTableDescription,
): Join[] {
  const toTableName = tableNameFromTypeName(segment.toType);
  const {name, left, right} = storage;
  const leftTable = left.isPolymorphic ? '@@@@' : left.table;
  const rightTable = right.isPolymorphic ? '@@@@' : right.table;

  // console.log('JOINS FROM JOIN TABLE SEGMENT', {name, leftTable, rightTable});

  if (toTableName === leftTable) {
    return [
      {
        table: name,
        conditions: [{
          left: {
            type: 'reference',
            table: name,
            column: left.column,
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
            column: right.column,
          },
        }],
      },
    ];
  } else {
    const rightConditions = [{
      left: {
        type: 'reference',
        table: name,
        column: right.column,
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
          column: '@@@@',
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
        column: left.column,
      },
    }];

    if (storage.left.isPolymorphic) {
      leftConditions.push({
        left: {
          type: 'reference',
          table: leftTable,
          column: '@@@@',
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
  segment: DescribedSegment,
): Join[] {
  const {description} = segment;

  if (description.type === 'join') {
    const {name, left, right} = description.storage;
    const side = segment.direction === 'in' ? left : right;
    const table = side.isPolymorphic ? '@@@@' : side.table;

    const conditions = [{
      left: {
        type: 'reference',
        table: name,
        column: side.column,
      },
      right: {
        type: 'reference',
        table,
        column: 'id',
      },
    }];

    if (side.isPolymorphic) {
      conditions.push({
        left: {
          type: 'reference',
          table: name,
          column: side.typeColumn,
        },
        right: {
          type: 'reference',
          table,
          column: '@@@@',
        },
      });
    }

    return [{
      table: name,
      conditions,
    }];
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

  console.log('COMPACTING JOINS', joins.map(({table}) => table));

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
    } else if (next != null || join.table !== '@@@@') {
      compactJoins.push(join);
    }
  }

  console.log('COMPACTED', compactJoins.map(({table}) => table));

  return compactJoins;
}

export function describeRelationship(
  segmentDescriptionMap: RelationshipSegmentDescriptionMap,
  relationship: Relationship,
): DescribedRelationship {
  return {
    ...relationship,
    path: relationship.path.map(segment => {
      const signature = pairingSignatureFromRelationshipSegment(segment);
      return {
        ...segment,
        description: segmentDescriptionMap[signature],
      };
    }),
  };
}
