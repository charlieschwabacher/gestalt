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
