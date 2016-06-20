Getting Started With Gestalt
============================

This will walk you through creating your first Gestalt project from scratch.


Prerequisites:
--------------

You will need Node and NPM, and PostgreSQL to be installed and running.

Steps:
------

1) Install the gestalt-cli globally: `npm install --global gestalt-cli`

`gestalt-cli` is a module that will help you scaffold new projects and run database migrations.  This will allow you to run `gestalt` on the command line.

2) Create your database: `createdb blogs`

This will create a PostgreSQL database named `blogs` for our Gestalt app to connect to.

3) Create a new Gestalt project: `gestalt init blogs`

This will create a new directory `blogs`, install the `gestalt-server` and `gestalt-postgres` modules, and create the boilerplate files for a simple express app running a GraphQL API.

The Gestalt CLI will prompt you for a database url.  You can enter anything here, but in this case the default ('postgres://localhost/blogs') matches the database we just created, so you can just hit enter.

3) Edit schema.graphql

`gestalt init` will have created a simple `schema.graphql` file with only a simple Session type.

```graphql
type Session {
  id: ID!
}
```

Let's extend this with a type for us to query:

```graphql
type Session {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String
  passwordHash: String @hidden
}
```

This adds a `User` type to our GraphQL schema with fields `id` and `email`.  Because we added the `@hidden` directive to the  `passwordHash` field, it won't be added to our GraphQL schema, but will create a column on the users table in the next step.

4) Run database migrations: `cd your-project` and `gestalt migrate`

When you run `gestalt-migrate` in the root directory of your project, gestalt reads the existing database schema, compares it to what is defined in `schema.graphql`, and generates a migration to update the database.  This migration will only add tables and columns - if you need to delete them, you will have to do it manually for safety.

After our additions to `schema.graphql`, `gestalt migrate` will confirm our database url, and then generate and print the following SQL migration:

```SQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  email text,
  password_hash text
);
```

You can type 'yes' to run the migration, and 'no' to skip writing it to a file.

At this point, you should be able to start the server and explore your schema in the GraphiQL IDE.  Run `npm start` and navigate to `localhost:3000/graphql`.

5) Add a `Post` type, relationship, and run migrations again:

```graphql
type Session {
  id: ID!
}

type User implements Node {
  id: ID!
  email: String
  passwordHash: String @hidden
  posts: Post @relationship(path: "=AUTHORED=>")
}

type Post implements Node {
  id: ID!
  email: String
  passwordHash: String @hidden
  author: User @relationship(path: "<-AUTHORED-")
}
```

After these changes, `gestalt-migrate` will create the following migration:

```SQL
CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  email text,
  password_hash text,
  authored_by_user_id uuid REFERENCES users (id)
);

CREATE INDEX ON posts (authored_by_user_id);
```

After running the migration, if you restart your server you should see the `Post` type and `posts` field on `User` show up in the GraphiQL schema browser.

6) Create `SignUp` and `SignIn` mutations and add `currentUser` to the `Session` type.

You can create mutations in the mutations directory, and your server will load them automatically.

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
