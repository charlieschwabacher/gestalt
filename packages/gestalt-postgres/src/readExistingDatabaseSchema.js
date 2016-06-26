// @flow
// TODO: I think its possible to load this data in the right format, or at least
// something a lot closer to the right format, entirely w/ SQL.  It seems like
// that could be a better approach. If any postgres experts read this and feel
// like refactoring or explaining why that isn't a good approach, it will be
// appreciated! 😊

import type {DatabaseSchema, Constraint, Index} from 'gestalt-utils';
import {camelizeKeys, keyValMap, sortBy} from 'gestalt-utils';
import DB from './DB';

export default async function readExistingDatabaseSchema(
  databaseUrl: string,
): DatabaseSchema {
  const db = new DB({url: databaseUrl, log: false});

  const [extensions, columns, columnConstraints, tableConstraints, indices] = (
    await Promise.all([
      loadExtensions(db),
      loadColumns(db),
      loadColumnConstraints(db),
      loadTableConstraints(db),
      loadIndices(db),
    ])
  );

  const tables = Object.values(
    columns.map(camelizeKeys).reduce(
      (memo, {tableName, columnName, columnDefault, dataType, isNullable}) => {
        memo[tableName] = memo[tableName] || {
          name: tableName,
          columns: [],
          constraints: tableConstraints[tableName] || [],
        };

        const constraints = columnConstraints[tableName][columnName] || {
          primaryKey: false,
          unique: false,
        };

        memo[tableName].columns.push(Object.assign({
          name: columnName,
          defaultValue: columnName === 'seq' ? null : columnDefault,
          type: columnName === 'seq' ? 'SERIAL' : dataType,
          nonNull: isNullable === 'NO',
          references: null,
        }, constraints));

        return memo;
      },
      {}
    )
  );

  return {
    tables,
    indices,
    extensions,
  };
}

function loadColumns(db: DB): Promise<Object[]> {
  return db.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = 'public';
  `);
}

async function loadColumnConstraints(db: DB) {
  // column constraints (unique and non null)
  return (await db.query(`
    SELECT
      tc.constraint_name as name,
      tc.constraint_type as type,
      tc.table_name as table,
      kc.column_name as column,
      cc.table_name as foreign_table,
      cc.column_name as foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kc
    ON kc.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage cc
    ON cc.constraint_name = tc.constraint_name
    WHERE tc.constraint_name IN (
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kc
      ON kc.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
      GROUP BY tc.constraint_name
      HAVING count(*) = 1
    );
  `)).reduce(
    (memo, {name, type, table, column, foreignTable, foreignColumn}) => {
      memo[table] = memo[table] || {};
      memo[table][column] = memo[table][column] || {
        primaryKey: false,
        unique: false,
      };

      if (type === 'UNIQUE') {
        memo[table][column].unique = true;
      } else if (type === 'PRIMARY KEY') {
        memo[table][column].primaryKey = true;
      } else if (type === 'FOREIGN KEY') {
        memo[table][column].references = {
          table: foreignTable,
          column: foreignColumn,
        };
      } else {
        throw `unrecognized constraint type for ${name} on ${table}, ${column}`;
      }

      return memo;
    },
    {}
  );
}

async function loadTableConstraints(
  db: DB
): Promise<{[key: string]: Constraint}> {
  const constraintRows = (await db.query(`
    SELECT
      tc.table_name,
      kc.column_name,
      kc.ordinal_position,
      tc.constraint_type as type,
      tc.constraint_name as name
    FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kc
      ON kc.constraint_name = tc.constraint_name
    WHERE tc.constraint_name IN (
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kc
        ON kc.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
      GROUP BY tc.constraint_name
      HAVING count(*) > 1
    );
  `));

  // map table constraints {tableName: {constraintName: constraint}}
  const tableConstraints: {[key: string]: {[key: string]: Constraint}} = (
    constraintRows.reduce(
      (memo, {tableName, columnName, ordinalPosition, type, name}) => {
        memo[tableName] = memo[tableName] || {};
        memo[tableName][name] = memo[tableName][name] || {
          name,
          type,
          columns: [],
        };
        memo[tableName][name].columns[ordinalPosition - 1] = columnName;
        return memo;
      },
      {}
    )
  );

  // unmap by constraint name to get {tableName: [constraint]}
  return Object.keys(tableConstraints).reduce((memo, key) => {
    memo[key] = Object.values(tableConstraints[key]);
    return memo;
  }, {});
}

function loadIndices(db: DB): Promise<Index[]> {
  return db.query(`
    SELECT
      i.relname AS name,
      t.relname AS table,
      array_to_json(array_agg(a.attname)) AS columns
    FROM
      pg_class t,
      pg_class i,
      pg_index ix,
      pg_attribute a,
      pg_indexes pgi
    WHERE
      t.oid = ix.indrelid
      AND i.oid = ix.indexrelid
      AND a.attrelid = t.oid
      AND a.attnum = ANY(ix.indkey)
      AND t.relkind = 'r'
      AND pgi.indexname = i.relname
      AND pgi.schemaname = 'public'
      AND ix.indisunique = FALSE
      AND ix.indisprimary = FALSE
    GROUP BY
      t.relname,
      i.relname
  `);
}

export async function loadExtensions(db: DB): Promise<string[]> {
  const rows = await db.query('SELECT extname FROM pg_extension;');
  return rows.map(({extname}) => extname);
}

export function normalizeSchemaForComparison(
  schema: DatabaseSchema
): DatabaseSchema {
  return {
    tables: sortBy(schema.tables, t => t.name).map(table => (
      {
        ...table,
        constraints: table.constraints.map(constraint => {
          const c = {...constraint};
          delete c.name;
          return c;
        })
      }
    )),
    indices: sortBy(schema.indices, i => [i.table, i.columns]).map(index => {
      const i = {...index};
      delete i.name;
      return i;
    }),
  };
}
