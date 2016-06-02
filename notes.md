TODO:
  - respect connection arguments
  - write migration generation code: when schema changes run cli command to
    both update schema.json and generate a database migration
  - handle singular relationship to same table
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - handle non node object types as JSON
  - add @index, @unique directives on object fields
  - during database definition handle creating extensions for UUIDs, geo, etc..
  - make resolvers use prepared statements
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)

View Permissions?
  - existing way is to use the graph, anything reachable is viewable,
    don't expose ids of things that are private
  - would like to add another way letting you define different named permission
    checks as functions of obj and session and then attach them to types or
    fields with directives

Definition
  - right now plural relations in the db automatically become relay connections,
    should there be some way to make some use arrays instead w/o edges / node?
    Leaning no for simplicity
  - Could be cool to define named functions that transform values from the
    database, allow you to attach them / chain them to fields as directives

Scaffolds?
  - `gestalt create project` generate a new project?
  - how much is generated as part of scaffold vs is internal to the library
  - do we want anything beyond that - types or mutations, etc..?
  - do we want scaffolds to include other libraries beyond express, react,
    relay?

Extended IDL Syntax?
  It would be nice if you could write relationships as:
  ```
  type User implements Node {
    name: String
    posts: =AUTHORED=> Post
  }
  ```
  instead of:
  ```
  type User implements Node {
    name: String
    posts: Post @relationship(path: "=AUTHORED=>")
  }
  ```
  This puts the arrow in a place that feels more natural and better matches
  Cypher.  It would be easy to define a preprocessing step that converts the
  first syntax into the second before passing to the graphlq-js parser.  I 100%
  prefer the first syntax, but am concerned about compatibility w/ other tools
  w/ syntax extensions.  Having a base schema that gets prepended already could
  make this difficult so maybe there isn't that much to lose.
