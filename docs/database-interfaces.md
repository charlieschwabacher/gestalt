If you want to write your own database adapter for Gestalt, or just understand
how the internals work, you are reading the right document.

Gestalt database adapters are functions that takes any database specific
configuration they will need as an argument, and then returns a function to
which Gestalt will pass information on your schema.  This inner function will
return your database interface object.

```
(databaseSpecificConfig) =>
  (objectDefinitions, relationships, serverConfig) =>
    DatabaseInterface
```

The database interface object has 3 keys:

```
{
  resolveNode,
  prepareContext,
  generateRelationshipResolver,
}
```

`resolveNode` is a GraphQL resolve function for the node interface - it takes
the arguments `(obj, args, context, info)`, where args contains `{id}`. It
should query return the node object by ID.

`prepareContext` runs once at the beginning of each query and allows you to add
a database interface to the query context, or to do other work that should run
once per query like creating [DataLoaders](//github.com/facebook/dataloader).

`generateRelationshipResolver` is a function that takes a relationship object,
and returns a GraphQL resolve function.
