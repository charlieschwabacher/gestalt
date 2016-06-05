Gestalt
=======

Gestalt is a library that lets you use the GraphQL schema language and a small
set of directives to define a GraphQL schema, database schema, and API server
in only a few minutes.


GraphQL Schema Language
-----------------------
The GraphQL Schema Language is a shorthand to describe types in a GraphQL schema
and a recent addition to the GraphQL spec.  The Schema Language doesn't cover
resolution, but if you are willing to accept some reasonable defaults, Gestalt
is able to define resolution for you with only a little extra information.

Gestalt is designed to make it really for small teams of 1-10 developers to
build APIs quickly.  Its also designed not to lock you in - you can build an API
with Gestalt, make changes quickly, and then replace pieces of it one at a time
as your app grows and your needs change.


Writing a Schema
----------------
The first step towards building an app with Gestalt is writing a schema.
Gestalt defines the base mutation and query types, the Relay Node interface and
connection types, and a few directives, and an additional `Date` scalar type.
In the `schema.graphql` file you provide, you are only expected to define your
object, interface and union types.

Any Objects you define extending the Node interface result in database tables.
Objects and arrays they reference are stored in Postgres as structured data, and
relationships between objects are defined with directives.  Mutations are
defined separately using javascript and are attached to the schema in a second
pass.

```GraphQL
type User extends Node {
  firstName: String
  lastName: String
  createdAt: Date
  age: Int
}
```

Session Type
------------
Gestalt defines two fields on the query root, `node` and `session` - you are
expected to define the Session type as the entry point to your schema.  Session
is not a Node, so it won't be stored in the database and you will need to define
custom resolution for its fields.  The session value is accessible in the
context.  When modified, it will be stored after every request.

```GraphQL
type Session {
  currentUser: User
}
```

Object Relationships
--------------------
In addition to Types and their fields, Gestalt needs extra information about
the relationships between objects in order to generate a database schema and
efficient queries for resolution.  You provide this using the `@relationship`
directive and a syntax inspired by Neo4j's Cypher query
language.

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
the combination of their cardinalities determines how the relationship will be
stored in the database.

A plural arrow also indicates that a field should be a Relay connection -
Gestalt will create `PostsConnection` and `PostEdge` types, and update the
type of the `posts` field to `PostsConnection`.  In addition to the relay
connection arguments, if any scalar fields on the parent type are indexed,
Gestalt will add an `order` argument to connection field and create a
`PostsOrder` enum type allowing the connection to be sorted.

Based on the edge directives in the example above, Gestalt will calculate how to
store and query the relationship efficiently - if we are using a Postgres
adapter, Gestalt will add a foreign key `authored_by_user_id` to the `posts`
table.

Arrows can be extended to represent more complex relationships:

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


Other Directives
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


Defining Custom Resolution
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


Defining Mutations
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


Creating an API Server
----------------------
```javascript
import gestaltServer from 'gestaltServer';
import gestaltPostgres from 'gestaltPostgres';

const app = express();

app.use('/graphql', gestalt({
  schemaPath: `${__dirname}/schema.graphql`,
  database: gestaltPostgres('postgres://localhost'),
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  secret: '༼ つ ◕_◕ ༽つ',
}));

app.listen(3000);
```

Gestalt provides Connect middleware based on `express-graphql` to respond to
GraphQL API requests.  It accepts the following options:

- `databaseURL` - the url to a Postgres database
- `schemaPath` - the path to your schema definition in GraphQL
- `objects` - an array of object definitions
- `mutations` - an array of mutation definition functions
- `secret` - used to sign the session cookie
- `development` - a boolean, if true gestalt will log queries and serve the
  GraphiQL IDE.


Should I use Gestalt?
---------------------
If you are trying to add an API to a big existing app, or if you have
non-standard storage requirements, Gestalt might not be the best choice for you.

If you are starting a new Relay app from scratch, Gestalt should save you a lot
of time and make your schema easier to work with.

Gestalt is usable now - but its still very early.  The API is likely to change
before it gets to a version 1.0.


Other Database Adapters
-----------------------
I have written a backend using PostgreSQL, but Gestalt is designed for pluggable
database adapters.  If Gestalt sounds cool to you, but you would like to use a
different backend, please consider writing one!


Roadmap
-------

check out `notes.md` for current todos and progress.
