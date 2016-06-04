// @flow

import pg from 'pg';
import {camelizeKeys, invariant} from '../util';
import {snake} from 'change-case';

const DATABASE_URL = 'postgres://localhost/gestalt';
const LOG_QUERIES = true;

// executes a SQL query and returns the result directly from pg
export function exec(
  query: string,
  escapes: ?any[]
): Promise<Object> {
  if (LOG_QUERIES) {
    console.log(query);
  }

  return new Promise((resolve, reject) => {
    pg.connect(DATABASE_URL, (err, client, done) => {
      if (err) {
        reject(err);
      }
      client.query(query, escapes, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
        done();
      });
    });
  });
}

// exectutes a query expecting a single row - it returns the row as an
// object, and raises if it receives more than one.
export async function find(
  query: string,
  escapes: ?any[]
): Promise<Object> {
  const result = await exec(query, escapes);
  invariant(result.rows.length === 1, 'find should select a single row');
  return camelizeKeys(result.rows[0]);
}

// executes a query expecting to find many rows - it returns an array of objects
export async function query(
  query: string,
  escapes?: any[]
): Promise<Object[]> {
  const result = await exec(query, escapes);
  return result.rows.map(camelizeKeys);
}

// inserts into the db based on a table name and object
export async function insert(
  table: string,
  object: Object,
): Promise<Object> {
  const escapes = Object.values(object);
  const columns = Object.keys(object).map(snake);
  const values = escapes.map((v, i) => `$${i + 1}`);
  const result = await exec(
    `INSERT INTO ${table} (id, ${columns}) VALUES (uuid_generate_v4(), ${values}) RETURNING *;`,
    escapes
  );
  return camelizeKeys(result.rows[0]);
}

export function deleteBy(
  table: string,
  conditions: Object,
): Promise<Object> {
  const [sql, escapes] = whereFromConditions(conditions);
  return exec(`DELETE FROM ${table} ${sql}`);
}

export function findBy(
  table: string,
  conditions: Object
): Promise<Object> {
  const [sql, escapes] = whereFromConditions(conditions);
  return find(`SELECT * FROM ${table} ${sql}`, escapes);
}

export function queryBy(
  table: string,
  conditions: Object
) {
  const [sql, escapes] = whereFromConditions(conditions);
  return query(`SELECT * FROM ${table} ${sql}`, escapes);
}

function whereFromConditions(conditions: Object): [string, any[]] {
  const comparisonOperator = key => ' = ';
  const sql = `WHERE ${
    Object.keys(conditions)
      .map((key, i) => `${key} ${comparisonOperator(key)} $${i + 1}`)
      .join(' AND ')
  };`;
  const escapes = Object.values(conditions);

  return [sql, escapes];
}

export async function reset(): Promise<true> {
  await exec(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
    COMMENT ON SCHEMA public IS 'standard public schema';
  `);
  return true;
}
