Name:
  - gestalt (define as little as possible, blanks are autmatically filled in,
    logo could be three circles w/ blanks in shape of vertices of triangle:
    image a here:
    https://upload.wikimedia.org/wikipedia/commons/6/63/Reification.jpg)
  - sonora (DRY.. logo could be cactus in foreground here:
    https://upload.wikimedia.org/wikipedia/commons/1/1f/Agfr_desert.jpg )


View Permissions?
  - one straightforward way is to use the graph, anything reachable is viewable
  - use interface types to allow only certain fields (need a new PrivacyInterface
    that is checked in resolve function)
  - dont expose ids of things that are private

Updates?
  - validation `update(model: Object, changes: Object): Promise`
  - keep history in graph w/ immutable chain storing all changed values w/
    timestamps and code versions?

Scaffolds?
  - `gestalt create project` generate a new project
  - `gestalt g user` generates a user w/ auth
  - `gestalt g type Post` generates a post type

Scalability?
  - pluggable backends for neo4j, orientdb, postgres, mysql
  - easy to swap for something distrubuted like titan as scale grows?
