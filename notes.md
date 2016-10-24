TODO:
  - add resolveType to interface / union types
  - update id algorithm to be sortable
  - DO NOT need type in joins / indices because ids are globally unique
  - allow sorting of connections on multiple columns
  - allow filtering connections
  - better batching on connections
  - do obvious perf optimization of gestalt-postgres relationship loaders (TODOs
    in comments in file)
  - make sure resolvers use prepared statements
  - refactor: keep track of non null, unique, and primary key as constraints on
    tables instead of as fields on Column objects?
  - refactor: code cleanup in CLI, move code into main package allowing globally
    installed CLI module to be updated less frequently
  - refactor: move non shared flow types into individual packages from
    gestalt-utils
  - refactor: (performance) singular relationships where the foreign key is on
    the node we have already resolved can be resolved through a global Node
    loader and can cache across relationships
  - CLI command for gestalt postgres to run EXPLAIN and print cost of queries to
    resolve all relationships
