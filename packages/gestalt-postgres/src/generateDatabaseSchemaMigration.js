// @flow
//
// Compares internal representations of expected and existing database schemas,
// generates a migration in SQL to make the necessary updates.
//
// list tables in existing schema but not expected
// create tables in expected schema but not existing
// alter tables present in both schemas
//   list columns present in existing schema but not expected
//   add columns present in expected schema but not existing
//   alter columns
//     change data type?
//     add / remove index
//     add / remove uniqueness constraint
//     make non nullable / nullable
//
// some changes will require manual updates:
// - removing tables, columns, or indices
// - changing data type of a column where values cannot be coerced
// - adding a uniqueness constraint to a column w/ non unique values
// - making a column non nullable when there are null values

import type {DatabaseSchema, Table, Column, Index, DatabaseSchemaMigration,
  DatabaseSchemaMigrationOperation, ColumnType} from 'gestalt-utils';
import {keyMap, group, invariant} from 'gestalt-utils';
import readExistingDatabaseSchema from './readExistingDatabaseSchema';

const EMPTY_SCHEMA = {tables: [], indices: [], extensions: []};


export default function generateDatabaseSchemaMigration(
  expectedSchema: DatabaseSchema,
  existingSchema: DatabaseSchema = EMPTY_SCHEMA,
): DatabaseSchemaMigration {
  const existingTables = keyMap(existingSchema.tables, table => table.name);
  const existingIndices = indexMapFromSchema(existingSchema);
  const expectedIndices = indexMapFromSchema(expectedSchema);

  const operations = [];

  const existingExtensions = new Set(existingSchema.extensions);
  expectedSchema.extensions.forEach(expectedExtension => {
    if (!existingExtensions.has(expectedExtension)) {
      operations.push({
        type: 'CreateExtension',
        extension: expectedExtension,
      });
    }
  });

  expectedSchema.tables.forEach(expectedTable => {
    const existingTable = existingTables[expectedTable.name];
    if (existingTable == null) {

      // create tables in expected schema but not existing
      operations.push({
        type: 'CreateTable',
        table: expectedTable
      });

    } else {

      // alter tables present in both schemas
      const existingColumns = keyMap(existingTable.columns, c => c.name);

      expectedTable.columns.forEach(expectedColumn => {
        const existingColumn = existingColumns[expectedColumn.name];

        // add columns present in expected schema but not existing
        if (existingColumn == null) {
          operations.push({
            type: 'AddColumn',
            table: existingTable,
            column: expectedColumn,
          });
        } else {
          // change data type?
          if (existingColumn.type !== expectedColumn.type) {
            operations.push({
              type: 'ChangeColumnType',
              table: existingTable,
              column: existingColumn,
              toType: expectedColumn.type,
            });
          }

          // add / remove uniqueness constraint
          if (existingColumn.unique !== expectedColumn.unique) {
            operations.push({
              type: (
                expectedColumn.unique
                ? 'AddUniquenessConstraint'
                : 'RemoveUniquenessConstraint'
              ),
              table: existingTable,
              column: existingColumn,
              // TODO: should this include constraint object?
            });
          }

          // make non nullable / nullable
          if (existingColumn.nonNull !== expectedColumn.nonNull) {
            operations.push({
              type: expectedColumn.nonNull ? 'MakeNonNullable' : 'MakeNullable',
              table: existingTable,
              column: existingColumn,
            });
          }

          // TODO: handle change to references constraints
        }
      });
    }
  });

  // add or update foreign key constraints
  // this needs to run after all tables have been created to avoid the
  // possibility of referencing a non existant table
  expectedSchema.tables.forEach(expectedTable => {
    const existingTable = existingTables[expectedTable.name];
    const existingColumns = existingTable && keyMap(
      existingTable.columns,
      c => c.name
    );

    expectedTable.columns.forEach(column => {
      const existingColumn = existingColumns && existingColumns[column.name];
      const existingReferences = existingColumn && existingColumn.references;
      const {references} = column;

      if (references == null && existingReferences == null) {
        // do nothing
      } else if (existingReferences == null) {
        // add foreign key constraint
        operations.push({
          type: 'AddForeignKeyConstraint',
          table: expectedTable,
          column,
          references,
        });
      } else if (references == null) {
        // remove existing foreign key constraint
        operations.push({
          type: 'RemoveForeignKeyConstraint',
          table: existingTable,
          constraintName: existingReferences.constraintName,
        });
      } else if (
        existingReferences.table !== references.table ||
        existingReferences.column !== references.column
      ) {
        // replace existing foreign key constraint
        operations.push({
          type: 'RemoveForeignKeyConstraint',
          table: existingTable,
          constraintName: existingReferences.constraintName,
        }, {
          type: 'AddForeignKeyConstraint',
          table: expectedTable,
          column,
          references,
        });
      }
    });
  });

  // add indices
  expectedSchema.tables.forEach(expectedTable => {
    const expectedTableIndices = expectedIndices[expectedTable.name];
    if (expectedTableIndices != null) {
      const existingTable = existingTables[expectedTable.name];
      const existingTableIndices = (
        existingTable &&
        existingIndices[existingTable.name]
      );

      Object.entries(expectedTableIndices).forEach(([key, index]) => {
        if (existingTableIndices == null || existingTableIndices[key] == null) {
          operations.push({
            type: 'CreateIndex',
            index,
          });
        }
      });
    }
  });

  return {
    sql: operations.map(sqlFromOperation).join('\n\n') + '\n',
    operations,
  };
}

function sqlFromOperation(operation: DatabaseSchemaMigrationOperation): string {
  switch (operation.type) {
    case 'CreateTable':
      return createTable(operation.table);
    case 'CreateIndex':
      return createIndex(operation.index);
    case 'CreateExtension':
      return createExtension(operation.extension);
    case 'AddColumn':
      return addColumn(operation.table, operation.column);
    case 'AddUniquenessConstraint':
      return addUniquenessConstraint(operation.table, operation.column);
    case 'RemoveUniquenessConstraint':
      return removeUniquenessConstraint(operation.table, operation.column);
    case 'AddForeignKeyConstraint':
      return addForeignKeyConstraint(
        operation.table,
        operation.column,
        operation.references
      );
    case 'RemoveForeignKeyConstraint':
      return removeForeignKeyConstraint(operation.table, operation.name);
    case 'MakeNullable':
      return makeNullable(operation.table, operation.column);
    case 'MakeNonNullable':
      return makeNonNullable(operation.table, operation.column);
    case 'ChangeColumnType':
      return changeColumnType(
        operation.table,
        operation.column,
        operation.toType,
      );
    default:
      throw `Unrecognized operation type '${operation.type}'`;
  }
}

export function createTable(table: Table): string {
  const {name, columns, constraints = []} = table;
  const columnsRows = columns.map(column => `  ${describeColumn(column)}`);
  const constraintsRows = constraints.map(constraint =>
    `  UNIQUE (${constraint.columns.join(', ')})`
  );
  const columnsAndConstraints = columnsRows.concat(constraintsRows).join(',\n');
  return `CREATE TABLE ${name} (\n${columnsAndConstraints}\n);`;
}

export function describeColumn(column: Column): string {
  const {name, type, primaryKey, nonNull, unique, defaultValue}
    = column;
  const parts = [
    name,
    type,
    primaryKey ? 'PRIMARY KEY' : null,
    nonNull && !primaryKey ? 'NOT NULL' : null,
    unique ? 'UNIQUE' : null,
    defaultValue ? `DEFAULT ${defaultValue}` : null,
  ].filter(p => p);
  return parts.join(' ');
}

export function addColumn(table: Table, column: Column): string {
  return `ALTER TABLE ${table.name} ADD COLUMN ${describeColumn(column)};`;
}

export function createExtension(extension: string): string {
  return `CREATE EXTENSION IF NOT EXISTS "${extension}";`;
}

export function createIndex(index: Index): string {
  const {table, columns} = index;
  return `CREATE INDEX ON ${table} (${columns.join(', ')});`;
}

export function addUniquenessConstraint(table: Table, column: Column): string {
  return `ALTER TABLE ${table.name} ADD UNIQUE (${column.name});`;
}

export function removeUniquenessConstraint(
  table: Table,
  column: Column
): string {
  return `ALTER TABLE ${table.name} DROP UNIQUE (${column.name});`;
}

export function addForeignKeyConstraint(
  table: Table,
  column: Column,
  references: {table: string, column: string}
): string {
  const constraintName = `${table.name}_${column.name}_fkey`;
  return (
    `ALTER TABLE ${table.name} ADD CONSTRAINT ${constraintName} FOREIGN KEY ` +
    `(${column.name}) REFERENCES ${references.table} (${references.column}) ` +
    'MATCH FULL;'
  );
}

export function removeForeignKeyConstraint(
  table: Table,
  name: string
): string {
  return `ALTER TABLE ${table.name} DROP CONSTRAINT ${name};`;
}

export function makeNullable(table: Table, column: Column): string {
  return `ALTER TABLE ${table.name} ALTER COLUMN ${column.name} DROP NOT NULL;`;
}

export function makeNonNullable(table: Table, column: Column): string {
  return `ALTER TABLE ${table.name} ALTER COLUMN ${column.name} SET NOT NULL;`;
}

export function changeColumnType(
  table: Table,
  column: Column,
  type: ColumnType,
): string {
  return 'ALTER TABLE ${table.name} ALTER COLUMN ${column.name} TYPE ${type}';
}

export function dropTable(table: Table): string {
  const {name} = table;
  return `DROP TABLE ${name};`;
}

export function dropIndex(index: Index): string {
  invariant(index.name != null, 'Cannot drop index without name');
  return 'DROP INDEX ${index.name}';
}

export function removeColumn(table: Table, column: Column): string {
  return 'ALTER TABLE ${table.name} DROP COLUMN ${column.name};';
}

export function indexMapFromSchema(
  schema: DatabaseSchema
): {[key: string]: {[key: string]: Index}} {
  return (
    Object.entries(
      group(schema.indices, index => index.table)
    ).reduce((memo, [table, indices]) => {
      memo[table] = keyMap(indices, index => index.columns.join('|'));
      return memo;
    }, {})
  );
}
