<p align='center'>
  <img
    width=58
    height=50
    src='https://cdn.rawgit.com/charlieschwabacher/gestalt/master/logo.svg'
  />
</p>

Gestalt
=======

Gestalt lets you use the [GraphQL](http://graphql.org/) schema language and a
small set of directives to define an API with a PostgreSQL backend
declaratively, *really quickly*, and with a *tiny* amount of code.


GraphQL schema language
-----------------------
The GraphQL schema language (also called IDL for *interface definition
language*) is a [proposed](https://github.com/facebook/graphql/pull/90) addition
to the GraphQL spec adding a shorthand to describe types in a GraphQL schema.
While it isn't officially part of the spec, the
[reference implementation](https://github.com/graphql/graphql-js) of GraphQL
already includes a parser for the IDL, and if you have spent much time with the
GraphQL [docs](http://graphql.org/docs/typesystem/) you have probably
already seen it.  It looks like this:

```graphql
type Human {
  id: String!
  name: String
  age: Int
}
```

The Schema Language can be used to define the types in a schema: Objects,
Enums, Interfaces, etc., but it doesn't cover resolution.  To actually create a
usable GraphQL API that can load your data you end up writing a lot of code
like this:

```javascript
import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

export default new GraphQLObjectType({
    name: 'Human',
    fields: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(obj) {
          return obj.id;
        }
      },
      name: {
        type: GraphQLString,
        resolve(obj) {
          return obj.name;
        }
      },
      age: {
        type: GraphQLInt,
        resolve(obj) {
          return obj.age;
        }
      }
    }
  })
});
```

It would be nice to just write the first thing!  If you use Gestalt and are
willing to accept some reasonable defaults, you can.  Gestalt understands how
your objects are related and is able to define the resolution for you.

Gestalt is designed to make it really easy for small teams of 1-10 developers to
build GraphQL APIs quickly.  Its also designed not to lock you in - you can
build an API with Gestalt, make changes quickly, and drop down to javascript
whenever you need to do something your own way.


Getting started with Gestalt
-----------------------------

If you want to jump straight to the code, here is an
[example project](//github.com/charlieschwabacher/gestalt/tree/master/packages/blogs-example).
If you want a hands on introduction, this
[step by step tutorial](//github.com/charlieschwabacher/gestalt/blob/master/docs/getting-started.md)
will walk you through creating a new project.


Writing a schema
----------------

Gestalt apps are based on a `schema.graphql` file you write using the IDL.
Gestalt defines the base mutation and query types, the Relay Node interface and
connection types, and a few directives and additional scalar types for you, so
in `schema.graphql`, you only define types specific to your app.

Any Objects you define implementing the Node interface result in database
tables.  Other objects and arrays they reference are stored in PostgreSQL as
JSON, and relationships between nodes are specified with directives.


Object relationships
--------------------
Gestalt needs information about the relationships between objects to generate a
database schema and efficient queries for resolution.  You provide this using
the `@relationship` directive and a syntax inspired by
[Neo4j](//github.com/neo4j/neo4j)'s Cypher query language.

```GraphQL
type User implements Node {
  name: String
  posts: Post @relationship(path: "=AUTHORED=>")
}
type Post implements Node {
  text: String
  author: User @relationship(path: "<-AUTHORED-")
}
```

This arrow syntax has three parts - the label `AUTHORED`, the direction of
the arrow `in` or `out`, and a cardinality ('singular' or 'plural') based on the
`-` or `=` characters.

Arrows with identical labels and types at their head and tail are matched, and
the combination of their cardinalities determines how the relationship between
their types will be stored in the database.

In the example above the relationship 'user authored post' is represented with
an arrow pointing out from `User` and in to `Post`.  Because a user can author
many posts, but each post has only one author, the arrow on the posts field of
the User type is plural (`=`) and the arrow on the author field of the Post type
is singular (`-`).

A plural arrow also indicates that a field should be a Relay connection -
Based on the directives in the example above, Gestalt would create
`PostsConnection` and `PostEdge` types, and update the type of the `posts`
field to `PostsConnection`.  In addition to the relay connection arguments, if
any scalar fields on the parent type are indexed, Gestalt will add an `order`
argument to connection field (accepting a `PostsOrder` enum type).

Gestalt will calculate how to store and query relationships efficiently -
continuing with example above, Gestalt will add a foreign key
`authored_by_user_id` to the `posts` table.

Relationships can be extended to represent more complex relationships:

```GraphQL
type User implements Node {
  name: String
  posts: Post @relationship(path: "=AUTHORED=>")
  followedUsers: User @relationship(path: "=FOLLOWED=>")
  followers: User @relationship(path: "<=FOLLOWED=")
  feed: Post @relationship(path: "=FOLLOWED=>User=AUTHORED=>")
}
type Post implements Node {
  text: String
  author: User @relationship(path: "<-AUTHORED-")
}
```

In this example we have added `followedUsers` and `followers` fields to the
`User` type with a many to many relationship.  Gestalt will create a join table
`user_followed_users` with columns `user_id` and `followed_user_id` to represent
this relationship.

We also added a `feed` field to `User` with multiple segments.  This doesn't
require any new storage beyond what we already have to represent the `FOLLOWED`
and `AUTHORED` relationships between users and posts, but it does require a more
complex query.  Gestalt will generate an efficient query to resolve the field
by joining the `user_followed_users` and `posts` tables.


Other directives
----------------
In addition to `@relationship`, there are a few more directives used by Gestalt
to provide extra information about how to create the database and GraphQL
schemas.

- `@hidden` is used to define fields that should become part of the database
  schema but not be exposed as part of the GraphQL schema.  It can be used for
  private information like email addresses and password hashes.

- `@virtual` marks fields that should be part of the GraphQL schema, but should
  not be stored in the database.  These require custom resolution to be
  defined - they could be computed from existing fields or are stored in a
  different datastore.

- `@index` marks fields that should be indexed in the database.  They can be
  used to sort

- `@unique` marks fields that should have a guarantee of uniqueness by
  constraint in the database.


Session type
------------
Gestalt defines two fields on the query root, `node` and `session` - you are
expected to define the Session type as the entry point to your schema.  Session
is not a Node, so it won't be stored in the database and you will need to define
custom resolution for its fields.  A session object is made accessible in the
query context.  It is both readable and writable, and any changes are persisted
between requests.

```GraphQL
type Session {
  currentUser: User
}
```


Defining custom resolution
--------------------------
Sometimes more processing is needed for fields in your API.  Its easy to define
custom resolvers using gestalt.  Given the following User type:

```GraphQL
type User extends Node {
  email: String @hidden
  firstName: String
  lastName: String
  fullName: String @virtual
  profileImage(size: Int): String @virtual
}
```

We could define custom resolution for the `fullName` and `profileImage` fields
by joining `firstName` and `lastName`, and by generating a Gravatar image url
based on `email`.

```javascript
export default {
  name: 'User',
  fields: {
    // calculate user's first name from first and last names
    fullName: obj => `${obj.firstName} ${obj.lastName}`,

    // get a Gravatar image url for a user based on their email address, scaled
    // by an optional size argument
    profileImage: (obj, args) => {
      const email = obj.email.toLowerCase();
      const hash = crypto.createHash('md5').update(email).digest('hex');
      const size = args.size || 200;
      return `//www.gravatar.com/avatar/${hash}?s=${size}`;
    },
  },
}
```

Custom resolution is defined using the name of the Type, and then providing
resolution functions `(obj, args, context) => value`.  It isn't required for
every object, and when it is present for an object, it doesn't need to be
defined for every field.


Defining mutations
------------------
Mutation definitions depend on the types you define with the schema language,
so you create them as functions of an object mapping type names to GraphQL
Types. Mutations are added to the schema in a second pass after object types are
fully defined.

```javascript
export default types => ({
  name: 'UpdateStatus',
  inputFields: {
    status: types.String,
  },
  outputFields: {
    currentUser: types.User,
  },
  mutateAndGetPayload: async (input, context) => {
    const currentUser = await User.load(session.currentUserID);
    await currentUser.update({status: input.status});
    return {currentUser};
  },
});
```

The configuration object returned by mutation definition functions is nearly the
same as what you would pass to `graphql-relay-js`'s
`mutationWithClientMutationId`.  The only difference is that types can be passed
directly as values in the `inputFields` and `outputFields` objects.


Creating an API server
----------------------

Gestalt provides Connect middleware based on `express-graphql` to respond to
GraphQL API requests.

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
  secret: '!',
}));

app.listen(3000);
```

Gestalt server accepts the following options:

- `schemaPath` - the path to your schema definition in GraphQL
- `database` - a database adapter
- `objects` - an array of object definitions
- `mutations` - an array of mutation definition functions
- `secret` - used to sign the session cookie
- `development` - a boolean, if true gestalt will log queries and serve the
  GraphiQL IDE.


Should I use Gestalt?
---------------------
Yes! Gestalt is cool 😀

If you are trying to add an API to a big existing app, or if you have
non-standard storage requirements, Gestalt might not be the best choice for you.

If you are starting a new Relay app from scratch, Gestalt should save you a lot
of time and make your schema easier to work with.

Gestalt is usable now - but it's still very early.  There are likely to be some
major changes before it gets to version 1.0.  That said - changes will not be
gratuitous and will aim to be easy to work around.


Other database adapters
-----------------------
I have written a backend using PostgreSQL, but Gestalt is designed for pluggable
database adapters.  If Gestalt sounds cool to you, but you would like to use a
different backend, please consider writing one!


The Gestalt modules
-------------------
Although they are all part of this git repo, Gestalt is made up a few different
npm modules so that you can use only parts you need.


- [gestalt-cli](//github.com/charlieschwabacher/gestalt/tree/master/packages/gestalt-cli) -
  a command line tool to scaffold new projects, run database migrations, and
  update your `schema.json` file.


- [gestalt-server](//github.com/charlieschwabacher/gestalt/tree/master/packages/gestalt-server) -
  connect middleware that loads your `schema.graphql` file and


- [gestalt-graphql](//github.com/charlieschwabacher/gestalt/tree/master/packages/gestalt-graphql) -
  if you want to generate a GraphQL schema, but don't need the middleware, you
  can use `gestalt-graphql` directly.


- [gestalt-postgres](//github.com/charlieschwabacher/gestalt/tree/master/packages/gestalt-postgres) -
  the only database adapter (so far) for Gestalt.  `gestalt-postgres` generates
  a SQL schema and queries based on your `schema.graphql`.  It is used with
  either `gestalt-server` or `gestalt-graphql`.


Contributing
------------

For instructions on how to build and test the project locally, see
[CONTRIBUTING.md](//github.com/charlieschwabacher/gestalt/blob/master/CONTRIBUTING.md).
