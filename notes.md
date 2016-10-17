WORKING NOTES:

  - Proposed query from relationship algorithm:
    - this should clean up the awful collapse joins and '@@@@' placeholder
      segments we do now
    - algorithm:
      - look at the to type of the final segment
        - if it is homomorphic
          - select from the table for the to type of the final segment
          - use all segments as path
        - if it is polymorphic
          - if its storage uses a foreign key
            - select from the table based on the type column on the parent object
            - do not do any joins
          - if its storage uses a join table
            - select from the join table
            - left join the table for each member of the polymorphic type
            - use everything but the final segment as path
      - take each pair of adjacent segments, starting at the end of path
        - generate a join for each pair based on the two descriptions
      - generate a condition from the final pair

  - we need to calculate query obj later once we have access to type (it becomes
    an argument to queryFromRelationship)

  - Resolution:
    - Starting point is `queryFromRelationship` in
      `generateRelationshipResolver.js`
    - in 'polymorphic relationships multi segment singular polymorphic
      homomorphic generates sql queries' test, we have an extra join to
      'artworks' that shouldn't be happening.
    - it is coming from `joinsFromSegments` - artwork id and artwork type should
      columns on user, which we should already have access to.
    - Resolved query now works by selecting from the final type of a
      relationship and creating joins working backwards along the path.  In
      cases where the final type is polymorphic, we will need to select from one
      type back and left join all of the possible types.

TODO:
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
