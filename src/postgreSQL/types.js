// @flow

export type DatabaseSchema = {
  tables: [Table],
  indices: [Index],
};

export type Table = {
  name: string,
  columns: [Column],
  constraints?: [Constraint],
};

export type Index = {
  table: string,
  columns: [string],
};

export type Column = {
  name: string,
  type: ColumnType,
  primaryKey?: boolean,
  nonNull?: boolean,
  references?: {
    table: string,
    column: string,
  },
};

type Constraint = {
  type: 'unique',
  columns: [string],
};

export type ColumnType = 'uuid' | 'jsonb' | 'varchar(255)' | 'timestamp' |
  'text' | 'integer' | 'double precision' | 'money';

export type Edge = {
  path: [EdgeSegment],
};

export type EdgeSegment = {
  fromType: string,
  toType: string,
  label: string,
  direction: 'in' | 'out',
  cardinality: 'singular' | 'plural'
}
