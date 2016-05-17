// @flow

import pg from 'pg';

export async function sql(
  query: string,
  ...escapes: Array<any>
): Promise<[Object]> {
  return new Promise(r => r([]));
}

export async function reset(): Promise<boolean> {
  return new Promise(r => r(true));
}
