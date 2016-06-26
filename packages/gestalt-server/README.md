gestalt-server
--------------

[![npm version](https://badge.fury.io/js/gestalt-server.svg)](https://badge.fury.io/js/gestalt-server)

Connect middleware based on `express-graphql` to create a GraphQL API server
using the Gestalt framework.  Accepts the following options:

- `schemaPath` - the path to your schema definition in GraphQL
- `database` - a database adapter
- `objects` - an array of object definitions
- `mutations` - an array of mutation definition functions
- `secret` - used to sign the session cookie
- `development` - a boolean, if true gestalt will log queries and serve the
  GraphiQL IDE.


```javascript
import gestaltServer from 'gestalt-server';
import gestaltPostgres from 'gestalt-postgres';
import importAll from 'import-all';

const app = express();

app.use('/graphql', gestaltServer({
  schemaPath: `${__dirname}/schema.graphql`,
  database: gestaltPostgres({
    databaseURL: 'postgres://localhost'
  }),
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  secret: '༼ つ ◕_◕ ༽つ',
}));

app.listen(3000);
```
