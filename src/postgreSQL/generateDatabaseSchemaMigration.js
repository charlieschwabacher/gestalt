// Compares internal representations of expected and existing database schemas,
// generates a migration in SQL to make the necessary updates.
// @flow

import {DatabaseSchema, Table, Column, Index} from './types';

export default function generateDatabaseSchemaMigration(
  expectedSchema: DatabaseSchema,
  existingSchema: ?DatabaseSchema,
): string {
  return '';
}

export function createTable(table: Table): string {

}

export function dropTable(table: Table): string {

}

export function alterTable(table: Table): string {

}

export function addColumn(column: Column): string {

}

export function removeColumn(colum: Column): string {

}

export function alterColumn(column: Column): string {

}

export function createIndex(index: Index): string {

}

export function dropIndex(index: Index): string {

}
