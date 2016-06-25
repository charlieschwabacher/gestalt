Blogs Example
=============

This is a simple microblogging app intended to be an example of the Gestalt
framework using PostgreSQL.  Users of the app can sign up, sign in and out,
create posts, follow other users, and view a feed of posts written by users they
follow.


Running the app:
----------------

Make sure you have PostgreSQL installed, and a database named 'blogs_example'
  - `brew install postgresql` to install PostgreSQL
  - `createdb blogs_example` to create a database named 'blogs_example'

Migrate and load the seed data
  - `gestalt migrate`
  - `psql -d blogs_example -f seeds.sql`

Compile the client code
  - `npm install`
  - `npm run build`

Start the server
  - `npm start`

You can load the app at http://localhost:3000/ or explore the schema using
GraphiQL at http://localhost:3000/graphql.


Approaching the code:
---------------------

The entry point to the server code is `server.js`, it creates an `express` app
and attaches the `gestalt-server` middleware and `gestalt-postgres` database
adapter.  `server.js` loads `schema.graphql` which defines the types which will
be stored in the database and available to the GraphQL API.

Custom resolution for some fields on the `User` and `Session` types can be found
in the `objects` directory, and mutation code can be found in `mutations`.

The client code is in `client`, and its entry point is `client/index.js`.  It
uses `react`, `react-router`, and `relay`.
