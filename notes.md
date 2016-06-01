View Permissions?
  - one straightforward way is to use the graph, anything reachable is viewable
  - don't expose ids of things that are private
  - maybe some other way letting you define different named permission checks
    as functions of obj and session and then attach them to types or fields with
    directives

Definition
  - right now plural relations in the db automatically become relay connections,
    should there be some way to make some use arrays instead w/o edges / node?
    Leaning no for simplicity

Scaffolds?
  - `gestalt create project` generate a new project
  - how much is generated as part of scaffold vs is internal to the library
  - do we want anything beyond that  - types or mutations, etc..?

todo:
  - connection arguments
  - rename @edge to @relationship
  - add @index, @unique directives on object fields
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - handle non node object types as json
  - handle singular relationship to same table
  - during database definition handle creating extensions for UUIDs, geo, etc..
  - make resolvers use prepared statements
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)
