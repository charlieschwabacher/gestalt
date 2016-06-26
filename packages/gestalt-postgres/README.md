gestalt-postgres
----------------

A PostgreSQL database adapter for the Gestalt framework

```js
import gestaltPostgres from 'gestalt-postgres';

const adapter = gestaltPostgres({
  databaseURL: 'postgres://localhost/your-db'
});
```

Query helper API
----------------

Gestalt-postgres will add a query helper, `context.db`, to the GraphQL query
context.  This helper has the following API:

- `exec(query: string, escapes?: Array<mixed>): Promise<Object>` runs the query
  using [node-postgres](//github.com/brianc/node-postgres), and returns the
  result directly with no formatting.

- `count(query: string, escapes?): Promise<number>` runs the query

- `find(query: string, escapes?): Promise<Object>)`

- `query(query: string, escapes?): Promise<Object[]>)`

- `insert(table: string, object: Object): Promise<Object>`

- `deleteBy(table: string, conditions: Object): Promise<Object>`

- `findBy(table: string, conditions: Object): Promise<Object>`

- `queryBy(table: string, conditionsL Object): Promise<Object[]>`
