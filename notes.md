WORKING NOTES:
  - update schema generation to handle polymorphic types
  - segment pairing:

      looking at this schema:
      ```graphql
      type User {
        posts: =AUTHORED=> Post
        contents: =AUTHORED=> Content
        feed: =FOLLOWED=> Agent =AUTHORED=> Content
      }
      type Admin {
        contents: =AUTHORED=> Content
      }
      type Post {
        author: <-AUTHORED- Agent!
        comments: =INSPIRED=> Comment
      }
      type Comment {
        author: <-AUTHORED- Agent!
        post: <-INSPIRED- Post
      }
      union Content = Post | Comment;
      union Agent = User | Admin;
      union Addressable = User | Post | Comment;
      ```

      we get these relationships:
      ```javascript
      [
        {
          fieldName: 'posts',
          cardinality: 'plural',
          path: [
            // User|AUTHORED|Post
            {
              fromType: 'User',
              toType: 'Post',
              label: 'AUTHORED',
              direction: 'out',
              cardinality: 'plural',
              nonNull: false,
            },
          ],
        },
        {
          fieldName: 'contents',
          cardinality: 'plural',
          path: [
            // User|AUTHORED|Content
            {
              fromType: 'User',
              toType: 'Content',
              label: 'AUTHORED',
              direction: 'out',
              cardinality: 'plural',
              nonNull: false,
            },
          ],
        },
        {
          fieldName: 'feed',
          cardinality: 'plural',
          path: [
            // User|FOLLOWED|Agent
            {
              fromType: 'User',
              toType: 'Agent',
              label: 'FOLLOWED',
              direction: 'out',
              cardinality: 'plural',
              nonNull: false,
            },
            // Agent|AUTHORED|Content
            {
              fromType: 'Agent',
              toType: 'Content',
              label: 'AUTHORED',
              direction: 'out',
              cardinality: 'plural',
              nonNull: false,
            }
          ],
        },
        {
          fieldName: 'contents',
          cardinality: 'plural',
          path: [
            // Admin|AUTHORED|Content
            {
              fromType: 'Admin',
              toType: 'Content',
              label: 'AUTHORED',
              direction: 'out',
              cardinality: 'plural',
              nonNull: false,
            },
          ],
        },
        {
          fieldName: 'author',
          cardinality: 'singular',
          path: [
            // Agent|AUTHORED|Post
            {
              fromType: 'Post',
              toType: 'Agent',
              label: 'AUTHORED',
              direction: 'in',
              cardinality: 'singular',
              nonNull: true,
            },
          ],
        },
        {
          fieldName: 'author',
          cardinality: 'singular',
          path: [
            // Agent|AUTHORED|Comment
            {
              fromType: 'Comment',
              toType: 'Agent',
              label: 'AUTHORED',
              direction: 'in',
              cardinality: 'singular',
              nonNull: true,
            },
          ],
        },      
      ]
      ```

      we have these pairing signatures:
      ```
      User|AUTHORED|Post
      User|AUTHORED|Content
      User|FOLLOWED|Agent
      Agent|AUTHORED|Content
      Admin|AUTHORED|Content
      Agent|AUTHORED|Post
      Agent|AUTHORED|Comment
      ```

      we want to collapse to:
      ```
      User|FOLLOWED|Agent
        - User|FOLLOWED|User
        - User|FOLLOWED|Admin
      Agent|AUTHORED|Content
        - User|AUTHORED|Post
        - User|AUTHORED|Comment
        - User|AUTHORED|Content
        - Admin|AUTHORED|Post
        - Admin|AUTHORED|Comment
        - Admin|AUTHORED|Content
      ```

      algorithm:
      - instead of storing pairs, we will store sets of segments for each
        RelationshipSegmentDescription
      - to generate descriptions
        - take flattened unique segments
        - take segments containing a polymorphic type on the right
        - group by `${LABEL}|${toType}`
        - within groups, collapse types on the left that belong to the same
          polymorphic type
        - put results into map by pairing signature (will be either a
          polymorphic or homomorphic type on the left, and a polymorphic type
          on the right)
        - take remanining segments (homomorphic to homomorphic), if types on
          the left or right belong to polymorphic types, add to groups, otherwise
          add to map using their own signatures
          - need some way to resolve ambiguity when types belong to many
            polymorphic types (dont allow shared labels in this case?)

      1) take flattened unique segments
      ```
      User|AUTHORED|Post
      User|AUTHORED|Content
      User|FOLLOWED|Agent
      Agent|AUTHORED|Content
      Admin|AUTHORED|Content
      Agent|AUTHORED|Post
      Agent|AUTHORED|Comment
      ```

      2) group by `${LABEL}|${toType}`
      ```
      AUTHORED|Post
        User|AUTHORED|Post
        Agent|AUTHORED|Post
      AUTHORED|Comment
        Agent|AUTHORED|Comment
      AUTHORED|Content
        User|AUTHORED|Content
        Admin|AUTHORED|Content
        Agent|AUTHORED|Content
      FOLLOWED|Agent
        User|FOLLOWED|Agent
      ```

      4) collapse homomorphic types on the left into their polymorphic type
      ```
      Agent|AUTHORED|Content
      User|FOLLOWED|Agent
      ```

      5) take remaining types, collapse types that can be satisfied by existing
         polymorphic relationships
      ```
      User|FOLLOWED|Agent
      Agent|AUTHORED|Content
        User|AUTHORED|Post
        Agent|AUTHORED|Post
        Agent|AUTHORED|Comment
      ```

      6) the final types are
      ```
      User|FOLLOWED|Agent
      Agent|AUTHORED|Content
      ```

      WITH DIRECTIONS REVERSED

      1) take flattened unique segments
      ```
      Post|ORIGINATED|User
      Content|ORIGINATED|User
      Agent|CAPTURED|User
      Content|ORIGINATED|Agent
      Content|ORIGINATED|Admin
      Post|ORIGINATED|Agent
      Comment|ORIGINATED|Agent
      ```

      2) take segments containing a polymorphic type on the right
      ```
      Content|ORIGINATED|Agent
      Post|ORIGINATED|Agent
      Comment|ORIGINATED|Agent
      ```

      3) group by `${LABEL}|${toType}`
      ```
      ORIGINATED|Agent
        Content|ORIGINATED|Agent
        Post|ORIGINATED|Agent
        Comment|ORIGINATED|Agent
      ```

      4) collapse types on the left that belong to the same polymorphic type
      ```
      Content|ORIGINATED|Agent
      ```

      5)

  - how do we handle polymorphic types w/ mix of node and non node types?
    - validate that these are not allowed

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
