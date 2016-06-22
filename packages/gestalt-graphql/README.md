gestalt-graphql
---------------

Gestalt GraphQL generates a GraphQL schema with resolution based on a definition
using the GraphQL schema language.

```javascript
import fs from 'fs';
import gestaltGraphQL from 'gestalt-graphql';
import gestaltPostgres from 'gestalt-postgres';

const schemaText = fs.readFileSync(`${__dirname}/schema.graphql`);

const {schema} = gestaltGraphQL(
  schemaText,
  importAll(`${__dirname}/objects`),
  importAll(`${__dirname}/mutations`),
  gestaltPostgres(''),
);
```
