// Compares internal representations of expected and existing database schemas,
// generates a migration in SQL to make the necessary updates.
// @flow

import type {DatabaseSchema, Table, Column, Index} from './types';


export default function generateDatabaseSchemaMigration(
  expectedSchema: DatabaseSchema,
  existingSchema: ?DatabaseSchema,
): string {
  return (
    (existingSchema == null)
    ? generateInitialMigration(expectedSchema)
    : generateSchemaUpdateMigration(expectedSchema, existingSchema)
  );
}

export function generateInitialMigration(schema: DatabaseSchema): string {
  const indicesByTableName = indicesByTableNameFromSchema(schema);
  return schema.tables.map(table =>
    createTable(table) + indicesByTableName[table.name].map(createIndex).join('')
  ).join('\n');
}

function tablesByNameFromSchema(
  schema: DatabaseSchema
): {[key: string]: Table} {
  return schema.tables.reduce((memo, table) => {
    memo[table.name] = table;
    return memo;
  }, {});
}

function indicesByTableNameFromSchema(
  schema: DatabaseSchema
): {[key: string]: Index[]} {
  return schema.indices.reduce((memo, index) => {
    memo[index.table] = memo[index.table] || [];
    memo[index.table].push(index);
    return memo;
  }, {});
}

export function generateSchemaUpdateMigration(
  expectedSchema: DatabaseSchema,
  existingSchema: ?DatabaseSchema,
): string {
  return '';
}

export function createTable(table: Table): string {
  const {name, columns, constraints = []} = table;

  const columnsRows = columns.map(
    column => {
      const {name, type, primaryKey, nonNull, references} = column;
      const parts = [
        name,
        type,
        primaryKey ? 'PRIMARY KEY' : null,
        nonNull && !primaryKey ? 'NOT NULL' : null,
        references ? `REFERENCES ${references.table} (${references.column})` : null
      ].filter(p => p);
      return `  ${parts.join(' ')}`;
    }
  );

  const constraintsRows = constraints.map(constraint =>
    `  UNIQUE (${constraint.columns.join(', ')})`
  );

  const columnsAndConstraintsText = columnsRows.concat(constraintsRows).join(',\n');

  return `CREATE TABLE ${name} (\n${columnsAndConstraintsText}\n);\n`;
}

export function dropTable(table: Table): string {
  return '';
}

export function alterTable(table: Table): string {
  return '';
}

export function addColumn(column: Column): string {
  return '';
}

export function removeColumn(colum: Column): string {
  return '';
}

export function alterColumn(column: Column): string {
  return '';
}

export function createIndex(index: Index): string {
  const {table, columns} = index;
  return `CREATE INDEX ON ${table} (${columns.join(', ')});\n`;
}

export function dropIndex(index: Index): string {
  return '';
}
