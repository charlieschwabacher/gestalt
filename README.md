Gestalt
=======

Gestalt is a schema defined backend library for GraphQL.  With Gestalt, you can
use the GraphQL IDL and a small set of directives to define a GraphQL schema,
database schema, and API server in only a few minutes.

----

GraphQL IDL
-----------
The GraphQL IDL was recently added to the GraphQL spec as a shorthand to
describe types in a GraphQL schema.  Resolution has to be defined separately,
but if you are willing to accept some defaults, Gestalt is able to define it
for you with only a little extra information you provide through directives.


Base Schema
-----------
Gestalt defines base mutation and query types, the Relay Node interface and
connection types, and directives it requires for database schema and field
resolution definition.  In the IDL schema you provide, you are expected to
define only


Relationships
-------------
In addition to Types and their fields, Gestalt needs some extra information
about the relationships between types.  You provide this using the
`@relationship` directive and a syntax inspired by Neo4j's Cypher query
language.

```GraphQL
type User implements Node {
  name: String
  posts: Post @relationship("=AUTHORED=>")
}
type Post implements Node {
  text: String
  author: User @relationship("<-AUTHORED-")
}
```

This arrow syntax has three parts - the label `AUTHORED`, the direction of
the arrow `in` or `out`, and a cardinality ('singular' or 'plural') based on the
`-` or `=` characters.

Arrows with identical labels and types at their head and tail are matched, and
the combination of their cardinalities determines how the relationship will be
stored in the database.

A plural arrow also indicates that a field should be a Relay connection -
Gestalt will create`PostsConnection` and `PostEdge` types, and update the
type of the `posts` field to `PostsConnection`.

Based on the edge directives in the example above, Gestalt will calculate how to
store and query the relationship efficiently - in the example above, if we are
using a Postgres adapter, Gestalt will add a foreign key `authored_by_user_id`
to its `posts` table.

Arrows can be extended to represent more complex relationships:

```GraphQL
type User implements Node {
  name: String
  posts: Post @relationship("=AUTHORED=>")
  followedUsers: User @relationship("=FOLLOWED=>")
  followers: User @relationship("<=FOLLOWED=")
  feed: Post @relationship("=FOLLOWED=>User=AUTHORED=>")
}
type Post implements Node {
  text: String
  author: User @relationship("<-AUTHORED-")
}
```

In this example we have added `followedUsers` and `followers` fields to the
`User` type with a many to many relationship.  GestaltPostgres will create a
join table `user_followed_users` with columns `user_id` and `followed_user_id`
to represent this relationship.

We also added a `feed` field to `User` with multiple segments.  This doesn't
require any new storage beyond what we already have to represent the `FOLLOWED`
and `AUTHORED` relationships between users and posts, but it does require a more
complex query to resolve the field.  Gestalt is able to generate an efficient
query joining both tables.

Other Directives
----------------
There are a few more directives used by Gestalt to provide extra information
about how to create the database and GraphQL schemas.

- `@hidden` is used to define fields that should become part of the database
  schema but not be exposed as part of the GraphQL schema.  It can be used for
  private information like email addresses and password hashes.

- `@virtual` marks fields that should be part of the GraphQL schema, but should
  not be stored in the database.  Maybe they can be computed from existing
  fields or are stored in a different datastore.

- `@index` marks fields that should be indexed in the database.

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

We could define custom resolution for `fullName` and a Gravatar image url
`profileImage`:

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
every object, and when it's present for every object, it doesn't need to be
defined for every field.


Defining Mutations
------------------
Mutations are always defined in code - mutation definitions depend on the types
you define with the IDL, so you create them as functions of an object mapping
type names to GraphQL Types and they are added to the schema in a second pass
after object types are fully defined.

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

The configuration object is nearly the same as what you would pass to
`graphql-relay-js`'s `mutationWithClientMutationId`, with one difference - types
can be passed directly as values in `inputFields` and `outputFields`.


Creating an API Server
----------------------
```javascript
const app = express();

app.use('/graphql', gestalt({
  databaseURL: 'postgres://localhost',
  schemaPath: `${__dirname}/schema.graphql`,
  objects: importAll(`${__dirname}/objects`),
  mutations: importAll(`${__dirname}/mutations`),
  secret: 'keyboard cat',
}));

app.listen(3000);
```

Gestalt provides Connect middleware to respond to GraphQL API requests.  It
accepts the following options:

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
