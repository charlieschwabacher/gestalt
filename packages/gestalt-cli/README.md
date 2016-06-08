gestalt-cli
-----------

Gestalt CLI includes the command line tools for using Gestalt:

`npm install -g gestalt-cli`

and then

- `gestalt init {name}` - creates a new project
  - `mkdir {name}`
  - `cd {name}`
  - `git init`
  - `npm init`
  - `updates package json w/ name`
  - `npm install --save gestalt gestalt-postgres`
  - creates `server.js`
  - creates `schema.graphql` w/ session type
  - creates `objects` directory w/ session object
  - creates `mutations` directory .gitkeep
- `gestalt migrate`
  - updates `schema.json` from `schema.graphql`
  - generates and runs database schema migrations based on changes to your
    `schema.graphql` file.
    - w/ confirmation will run migration directly
    - also gives option to write migration to a sql file
