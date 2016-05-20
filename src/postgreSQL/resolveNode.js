// Retreives a Node given its global ID
// @flow

import {find} from './db';
import type {GraphQLResolveInfo} from '../types';

export default function resolveNode(
  source: Object,
  args: {id: string},
  context: mixed,
  info: GraphQLResolveInfo,
): Promise<Object> {
  const [tableName, id] = args.id.split(':');
  return find('SELECT * FROM $1 WHERE id = $2', [tableName, id]);
}
