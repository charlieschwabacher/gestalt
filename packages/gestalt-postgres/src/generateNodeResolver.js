// Retreives a Node given its global ID
// @flow

import {tableNameFromTypeName} from './generateDatabaseInterface';
import type {GraphQLResolveInfo, GraphQLFieldResolveFn} from 'gestalt-utils';
import type DB from './DB';

export default function generateNodeResolver(
  db: DB
): GraphQLFieldResolveFn {
  return async (source, args, context, info) => {
    console.log('resolving node!', args.id);
    const [typeName, id] = args.id.split(':');
    const tableName = tableNameFromTypeName(typeName);
    const result = await db.findBy(tableName, {id});
    result._type = typeName;
    return result;
  };
}
