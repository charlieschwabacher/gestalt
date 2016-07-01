TODO:
  - un-pend unit tests for generateRelationshipResolver
  - handle PageInfo / totalCount on connections w/ lookahead and better
    batching (would it be better to use stored procedures in PL/pgSQL?)
  - AST validation for helpful error messages (notes in stub files in
    ./src/validation)
  - do obvious perf optimization of gestalt-postgres relationship loaders (TODOs
    in comments in file)
  - make sure resolvers use prepared statements
  - handle enum types w/ db enums
  - handle union types (need type column in addition to foreign key, need to
    handle during query generation)
  - refactor: keep track of non null, unique, and primary key as constraints on
    tables instead of as fields on Column objects?
  - refactor: code cleanup in CLI, move code into main package allowing globally
    installed CLI module to be updated less frequently
