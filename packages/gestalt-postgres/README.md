gestalt-postgres
================

[![npm version](https://badge.fury.io/js/gestalt-postgres.svg)](https://badge.fury.io/js/gestalt-postgres)

A PostgreSQL database adapter for the Gestalt framework


Example
-------

```js
import gestaltPostgres from 'gestalt-postgres';

const adapter = gestaltPostgres({
  databaseURL: 'postgres://localhost/your-db'
});
```



Query helper API
----------------

Gestalt-postgres will add a query helper, `db`, to the GraphQL query context.
This helper has the following API:


- `exec(query: string, escapes?: Array<mixed>): Promise<Object>` runs the query
  using [node-postgres](//github.com/brianc/node-postgres), and returns the
  result directly with no formatting.


- `count(query: string, escapes?): Promise<number>` runs the query, pareses the
  result and returns a promised number.


- `find(query: string, escapes?): Promise<Object>)` runs the query, throws an
  error if there is not exactly one row selected, and then formats the result.
  Returns a promised object formatted `{camelCaseColumnName: value}`.


- `query(query: string, escapes?): Promise<Object[]>)` runs the query, and
  returns an array of objects formatted `{camelCaseColumnName: value}`.


- `insert(table: string, object: Object): Promise<Object>` converts camel case
  keys in the `object` argument to column names, and inserts their values into
  table.  It returns the inserted row as a promised object formatted
  `{camelCaseColumnName: value}`.


- `deleteBy(table: string, conditions: Object): Promise<Object>` converts camel
  case keys in the `conditions` argument to column names, and deletes matching
  rows.  Returns the result from `node-postgres` directly with no formatting.


- `findBy(table: string, conditions: Object): Promise<Object>` converts camel
  case keys in the `conditions` argument to column names, and runs a query
  selecting matching rows.  Throws an error unless exactly one row is selected,
  and returns the result as a promised object formatted
  `{camelCaseColumnName: value}`.


- `queryBy(table: string, conditionsL Object): Promise<Object[]>`  converts
  camel case keys in the `conditions` argument to column names, and runs a query
  selecting matching rows.  Returns the result as a promised array of objects
  formatted `{camelCaseColumnName: value}`.
