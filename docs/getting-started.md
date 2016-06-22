Getting Started With Gestalt
============================

This will walk you through creating a simple twitter clone from scratch using
Gestalt.



Prerequisites:
--------------

You will need Node and NPM, and PostgreSQL to be installed and running.

If you don't have [postgres](https://www.postgresql.org/) already, the easiest
way to install it on a mac is with [homebrew](http://brew.sh/).



Steps:
------


#### 1) Create your database

`createdb blogs`

We will need a PostgreSQL database for our app to connect to.  You can create
one with the `createdb` command.  Let's name it 'blogs'.


#### 2) Install gestalt-cli

`npm install --global gestalt-cli`

`gestalt-cli` is a module that will help you scaffold new projects and run
database migrations.  Installing it globally with npm will allow you to use
the `gestalt` command on the command line.


#### 3) Create a new Gestalt project:

`gestalt init blogs`

This will create a new directory `blogs`, install `gestalt-server`,
`gestalt-postgres`, and a few other necessary modules, and create the
boilerplate files for a simple express app running a GraphQL API.

The Gestalt CLI will prompt you for a database url.  Because we already created
a database matching the name of our project (`'blogs'`), you can just hit enter
to use the default url (`'postgres://localhost/blogs'`).


#### 4) Edit schema.graphql

`gestalt init` will have created a simple `schema.graphql` file with an object
type named 'Session'.

```graphql
type Session {
  id: ID!
}
```

Let's add some more types to our schema to represent users and posts:

```graphql
type Session {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String! @unique
  passwordHash: String! @hidden
}

type Post implements Node {
  id: ID!
  text: String!
  createdAt: Date!
}
```

This adds a type named `User` to our schema with fields `id` and `email`.  We
added the `@unique` directive to email to tell the database to enforce its
uniqueness, and the `@hidden` directive to the `passwordHash` field to create a
database column, but NOT a field in our GraphQL schema.


#### 5) Run database migrations: `cd your-project` and `gestalt migrate`

When you run `gestalt-migrate` in the root directory of your project, gestalt
reads the existing database schema, compares it to what is defined in
`schema.graphql`, and generates a migration to update the database.  This
migration will only add tables and columns - for safety, you will have to delete
tables manually.

After our additions to `schema.graphql`, `gestalt migrate` will confirm our
database url, and then generate and print the following SQL migration:

```SQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL
);
```

A couple things are going on here - we are adding the 'uuid-ossp' extension for
uuids, and then creating tables for the two types we added.

Looking first at the `users` table, the email and password hash columns are
straightforward. We can see that the `email` column is `UNIQUE` because we added
the `@unique` directive, and that both of the columns have type `text`
corresponding to `String` in our GraphQL schema.

The `id` and `seq` columns could be a little surprising.  You might expect a
single column `id SERIAL PRIMARY KEY`.  Instead `id` has type `uuid`, and we
have an additional column `seq` with type `SERIAL`.

The reason for this is that it lets us query nodes by id without needing to
define permission checks.  uuids are not guessable, and have enough randomness
that.

We include the `seq` column to record the order that rows were created and to be
able to sort chronologically.

You can type 'yes' to run the migration, and then 'no' to skip writing it to a
file.  At this point, you should be able to start the server and explore your
schema in the GraphiQL IDE.  Run `npm start` and navigate to
`localhost:3000/graphql`.


#### 6) Add the `AUTHORED` relationship between users and posts:

```graphql
type Session {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String! @unique
  passwordHash: String! @hidden
  posts: Post @relationship(path: "=AUTHORED=>")
}

type Post implements Node {
  id: ID!
  text: String!
  createdAt: Date!
  author: User @relationship(path: "<-AUTHORED-")
}
```

After these changes, `gestalt-migrate` will create the following migration:

```SQL
ALTER TABLE posts ADD COLUMN authored_by_user_id uuid;

CREATE INDEX ON posts (authored_by_user_id);
```

After running the migration, if you restart your server you should see the
`posts` field on `User` and `author` field on `Posts` show up in GraphiQL.


#### 7) Add the `FOLLOWED` relationship between users:

```graphql
type User implements Node {
  ...
  followedUsers: User @relationship(path: "=FOLLOWED=>")
  followers: User @relationship(path: "<=FOLLOWED=")
 }
```

this will result in the following migration:

```
CREATE TABLE user_followed_users (
  user_id uuid NOT NULL REFERENCES users (id),
  followed_user_id uuid NOT NULL REFERENCES users (id),
  UNIQUE (user_id, followed_user_id)
);

CREATE INDEX ON user_followed_users (followed_user_id);
```

#### 8) Add the `feed` field to `User`:

```graphql
type User implements Node {
  ...
  feed: Post @relationship(path: "=FOLLOWED=>User=AUTHORED=>")
 }
```

#### 9) Add a `gravatar` field to `User` with custom resolution

```
type User implements Node {
  ...
  gravatar: String! @virtual
}
```

```js
import crypto from 'crypto';

export default {
  name: 'User',
  fields: {
    // get a user's gravatar image url using their email address
    gravatar: (obj, args) => {
      const email = obj.email.toLowerCase();
      const hash = crypto.createHash('md5').update(email).digest('hex');
      return `//www.gravatar.com/avatar/${hash}?d=mm&s=${args.size || 200}`;
    },
  },
};
```

#### 8) Add `currentUser` to the `Session` type

```
type Session {
  id: ID!
  currentUser: User
}
```

```javascript
export default {
  name: 'Session',
  fields: {
    id: () => '!',
    currentUser: (obj, args, context) => {
      if (obj.currentUserID == null) { return null; }
      return context.db.findBy('users', {id: obj.currentUserID});
    },
  },
};
```


#### 9) create `SignIn` and `SignOut` mutations
You can create mutations in the mutations directory, and your server will load
them automatically.

```js
import bcrypt from 'bcrypt-as-promised';
import assert from 'assert';

export default types => ({
  name: 'SignUp',
  inputFields: {
    email: types.String,
    password: types.String,
  },
  outputFields: {
    session: types.Session,
  },
  mutateAndGetPayload: async (input, context) => {
    const {email, password} = input;
    const {db, session} = context;

    assert(email.match(/.+@.+?\..+/), 'Email is invalid');
    assert(password.length > 5, 'Password is invalid');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      email,
      passwordHash,
    });

    session.currentUserID = user.id;
    return {session};
  },
});
```

#### 10) create `SignUp` and `CreatePost` mutations

#### 11) Create `FollowUser` and `UnfollowUser` mutations

#### 12) Create a front end
.....
