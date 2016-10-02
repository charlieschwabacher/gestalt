WORKING NOTES:

  - TODO: DO NOT need type in joins / indices because ids are globally unique

  - Resolution:
    - Starting point is `queryFromRelationship` in
      `generateRelationshipResolver.js`
      - `relationshipSegmentMap` argument is mapping of pairing signature to
        segment description, is produced in `generateDatabaseInterface.js`.
          * This will need to be updated to include info from the mapping
            produced by `collapseRelationshipSegments` so that segments can be
            resolved through their polymorphic types.
    - Resolved query now works by selecting from the final type of a
      relationship and creating joins working backwards along the path.  In
      cases where the final type is polymorphic, we will need to select from one
      type back and left join all of the possible types.
      * The `Query` flow type will need to include information on what to
        select, because it won't necessarily match `table`.  This can replace
        the `count` argument to `sqlStringFromQuery`.
      * The `Join` flow type will need to include join type (left, inner, etc..)
      * When selecting something like `posts.*, comments.*`, need to look at
        results returned by `pg`, might need to normalize in some way, tag
        results with `_type` or something.

    - We will never need to expand polymorphic types other than at the final


  - segment pairing TODO:
    - how do we handle polymorphic types w/ mix of node and non node types?
      - validate that these are not allowed

TODO:
  - Required fields should NOT effect which side of a relationship gets a
    foreign key (they do now in one to one relationships)
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
  - refactor: (performance) singular relationships where the foreign key is on
    the node we have already resolved can be resolved through a global Node
    loader and can cache across relationships
  - CLI command for gestalt postgres to run EXPLAIN and print cost of queries to
    resolve all relationships
