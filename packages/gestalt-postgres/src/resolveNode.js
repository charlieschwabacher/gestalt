// Retreives a Node given its global ID
// @flow

import {findBy} from './db';
import {tableNameFromTypeName} from './generateDatabaseInterface';
import type {GraphQLResolveInfo} from '../types';

export default async function resolveNode(
  source: Object,
  args: {id: string},
  context: mixed,
  info: GraphQLResolveInfo,
): Promise<Object> {
  const [typeName, id] = args.id.split(':');
  const tableName = tableNameFromTypeName(typeName);
  const result = await findBy(tableName, {id});
  result._type = typeName;
  return result;
}
