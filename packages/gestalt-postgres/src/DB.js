// @flow
import {red, green, blue} from 'colors/safe';
import pg from 'pg';
import {camelizeKeys, invariant} from 'gestalt-utils';
import snake from 'snake-case';

function whereFromConditions(conditions: Object): [string, mixed[]] {
  const sql = `WHERE ${
    Object.keys(conditions)
      .map((key, i) => `${snake(key)} = $${i + 1}`)
      .join(' AND ')
  };`;
  const escapes = Object.values(conditions);

  return [sql, escapes];
}


// executes a SQL query and returns the result directly from pg
export default class DB {
  url: string;
  log: boolean;

  constructor(config: string | {url: string, log: boolean}): void {
    if (typeof(config) === 'object') {
      this.url = config.url;
      this.log = config.log;
    } else {
      this.url = config;
    }
  }

  exec(
    query: string,
    escapes?: ?mixed[]
  ): Promise<Object> {
    if (this.log) {
      console.log(
        green(query),
        blue(JSON.stringify(escapes))
      );
    }

    return new Promise((resolve, reject) => {
      pg.connect(this.url, (err, client, done) => {
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

  async count(
    query: string,
    escapes?: mixed[],
  ): Promise<number> {
    const result = await this.exec(query, escapes);
    invariant(result.rows.length === 1, 'count should select a single row');
    return result.rows[0].count;
  }

  // exectutes a query expecting a single row - it returns the row as an
  // object, and raises if it receives more than one.
  async find(
    query: string,
    escapes?: mixed[]
  ): Promise<Object> {
    const result = await this.exec(query, escapes);
    invariant(result.rows.length === 1, 'find should select a single row');
    return camelizeKeys(result.rows[0]);
  }

  // executes a query expecting to find many rows - it returns an array of
  // objects
  async query(
    query: string,
    escapes?: mixed[]
  ): Promise<Object[]> {
    const result = await this.exec(query, escapes);
    return result.rows.map(camelizeKeys);
  }

  // inserts into the db based on a table name and object
  async insert(
    table: string,
    object: Object,
  ): Promise<Object> {
    const escapes = Object.values(object);
    const columns = Object.keys(object).map(snake);
    const values = escapes.map((v, i) => `$${i + 1}`);
    const result = await this.exec(
      `INSERT INTO ${table} (${columns}) VALUES ${values}) RETURNING *;`,
      escapes
    );
    return camelizeKeys(result.rows[0]);
  }

  deleteBy(
    table: string,
    conditions: Object,
  ): Promise<Object> {
    const [sql, escapes] = whereFromConditions(conditions);
    return this.exec(`DELETE FROM ${table} ${sql}`, escapes);
  }

  findBy(
    table: string,
    conditions: Object
  ): Promise<Object> {
    const [sql, escapes] = whereFromConditions(conditions);
    return this.find(`SELECT * FROM ${table} ${sql}`, escapes);
  }

  queryBy(
    table: string,
    conditions: Object
  ) {
    const [sql, escapes] = whereFromConditions(conditions);
    return this.query(`SELECT * FROM ${table} ${sql}`, escapes);
  }

}
