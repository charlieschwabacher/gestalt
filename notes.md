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

Project Structure
  /someApp
    /mutations
    /objectResolutionDefinitions (need a better name)
    server.js
    schema.graphql

todo:
  - batching
  - connections
  - rename @edge to @relationship
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - handle singular relationship to same table
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)
  - query generation: handle skipping joins to join tables when unnecessary
