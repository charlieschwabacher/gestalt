Database Interfaces
-------------------

If you want to write your own database adapter for Gestalt, or just understand
how the internals work, you are reading the right document.

Gestalt database adapters are functions that take any database specific
configuration they will need as an argument, and return a function to which
Gestalt will pass information on your schema.  This inner function will
return a database interface object.

```javascript
(databaseSpecificConfig) =>
  (objectDefinitions, relationships, serverConfig) =>
    DatabaseInterface
```

`objectDefinitions` will be an array of GraphQL ObjectTypeDefinition AST nodes
produced by the `graphql-js` parser.  The array will include definitions for any
objects implementing the Node interface. You can find their flow types
[here](//github.com/graphql/graphql-js/blob/master/src/language/ast.js).

`relationships` will be an array of objects describing relationship directives
in the schema with parsed paths.  These objects will have the following format:

```
type Relationship = {
  fieldName: string,
  cardinality: 'singular' | 'plural',
  path: RelationshipSegment[],
};

type RelationshipSegment = {
  fromType: string,
  toType: string,
  label: string,
  direction: 'in' | 'out',
  cardinality: 'singular' | 'plural',
  nonNull: boolean,
  signature: string,
};
```

`server config` will be included when the adapter is used with
[gestalt-server](//github.com/charlieschwabacher/gestalt/tree/master/packages/gestalt-server),
and will include the configuration options passed when the server is created.
It is useful to do things like log queries only when the server is in
development mode.

The database interface that your adapter should create and return has 3 keys:

```
{
  resolveNode,
  prepareContext,
  generateRelationshipResolver,
}
```

`resolveNode` is a GraphQL resolve function for the node interface - it takes
the arguments `(obj, args, context, info)`, where args contains `{id}`. It
should query and return the node object by ID.

`prepareContext` runs once at the beginning of each query and allows you to add
query helpers to the query context, or to do other work that should run
once per query like creating [DataLoaders](//github.com/facebook/dataloader).

`generateRelationshipResolver` is a function that takes a relationship object,
and returns a GraphQL resolve function that will be attached to the
relationship's field.
