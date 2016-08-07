TODO:
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)
  - allow sorting of connections on multiple columns
  - allow filtering connections
  - better batching on connections
  - do obvious perf optimization of gestalt-postgres relationship loaders (TODOs
    in comments in file)
  - make sure resolvers use prepared statements
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - refactor: keep track of non null, unique, and primary key as constraints on
    tables instead of as fields on Column objects?
  - refactor: code cleanup in CLI, move code into main package allowing globally
    installed CLI module to be updated less frequently
  - refactor: move non shared flow types into individual packages from
    gestalt-utils
  - CLI command for gestalt postgres to run EXPLAIN and print cost of queries to
    resolve all relationships
