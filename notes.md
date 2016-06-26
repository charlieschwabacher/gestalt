TODO:
  - make sure migrations add references constraints for foreign keys
  - handle singular relationship to same table (need to keep track of table
    names used, name them if repeated)
  - un-pend unit tests for generateRelationshipResolver
  - handle PageInfo / totalCount on connections w/ lookahead and better
    batching (would it be better to use stored procedures in PL/pgSQL?)
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)
  - do obvious perf optimization of gestalt-postgres relationship loaders (TODOs
    in comments in file)
  - Define named functions that transform values from the database, allow you to
    attach them / chain them to fields as directives.. sort of like middleware
    for field resolution.  These will also be useful for permissions checks
    because they are free to return nil or raise errors.
  - make sure resolvers use prepared statements
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - handle enum types w/ db enums
  - refactor: keep track of non null, unique, and primary key as constraints on
    tables instead of as fields on Column objects?
  - refactor: code cleanup in CLI, move code into main package allowing globally
    installed CLI module to be updated less frequently
  - refactor: replace change-case w/ individual modules for constant, snake,
    camel case (change-case includes other unused modules)
  - come up w/ a config file format .gestaltrc?

Open Questions:

Extended IDL Syntax?
  - It would be nice if you could write relationships as:
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
    first syntax into the second before passing to the graphlq-js parser.  I
    100% prefer the first syntax, but am concerned about compatibility w/ other
    tools if we introduce syntax extensions.  On the other hand, having a base
    schema that gets prepended already could make this difficult so maybe there
    isn't *that* much to lose, and we can always write the complete translated
    schema to a file or something.

View Permissions:
  - existing way is to use the graph, anything reachable is viewable,
    don't expose ids of things that are private
  - right now i'm using random uuids for secure ids, but need to store a SERIAL
    on each table for ordering anyways.. is it possible / better to just have a
    single serial id column and encrypt / decrypt node ids in a way that keeps
    them secure?
  - third way in todo above: define different named permission checks as
    functions of obj and session and then attach them to types or fields with
    directives

Definition:
  - right now the node interface is used to define types that will be stored in
    the database - should we instead use a directive?  If we use a directive,
    that will require the user to define `resolveNode`.
  - right now plural relations in the db automatically become relay connections,
    should there be some way to make some use arrays instead w/o edges / node?
    Leaning no for simplicity
