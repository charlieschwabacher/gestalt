// @flow
// Retreives a Node given its global ID

import {tableNameFromTypeName} from './generateDatabaseInterface';
import {invariant} from 'gestalt-utils';
import type {GraphQLResolveInfo, GraphQLFieldResolveFn} from 'gestalt-utils';
import type DB from './DB';

export default function generateNodeResolver(
  db: DB
): GraphQLFieldResolveFn {
  return async (source, args, context, info) => {
    const [typeName, id] = args.id.split(':');
    invariant(
      typeName && id,
      'invalid node id - the expected format is type name, colon, database id'
    );

    if (typeName === 'Session') {
      return {...context.session, _type: 'Session'};
    }

    const tableName = tableNameFromTypeName(typeName);
    const result = await db.findBy(tableName, {id});
    result._type = typeName;
    return result;
  };
}
