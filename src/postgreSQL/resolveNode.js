// Retreives a Node given its global ID
// @flow

import {find} from './db';
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
  const result = await find('SELECT * FROM users WHERE id = $1', [id]);
  result._type = typeName;
  return result;
}
