Name:
  - gestalt (define as little as possible, blanks are automatically filled in,
    logo could be three circles w/ blanks in shape of vertices of triangle:
    image a here:
    https://upload.wikimedia.org/wikipedia/commons/6/63/Reification.jpg)

View Permissions?
  - one straightforward way is to use the graph, anything reachable is viewable
  - don't expose ids of things that are private

Scaffolds?
  - `gestalt create project` generate a new project


User=FOLLOWED=>User
User<=FOLLOWED=User
  - add join table user_followed_user

User=AUTHORED=>Post
Post<-AUTHORED-User
  - add authored_user_id column to posts

Post<=COMMENT_ON=Comment
Comment-COMMENT_ON->Post
  - add comment_on_post_id column to comments

User=AUTHORED=>Comment
Comment<-AUTHORED-User
  - add authored_user_id column to posts

possible combos:
  plural + plural
    - create join table from_label_to
  missing + plural
    - create join table from_label_to
  singular + plural
    - add foreign key on singular side
  singular + singular
    - add foreign key on the to side
  missing + singular
    - add foreign key

if target is a Union type, add type column in addition to id.
if union contains any non node types, raise an error.


algorithm to go from edges to table additions:
- get flat list of edge segments
- make pairs
  - match segments w/ the same types and label and opposite directions
  - ignore duplicate segments
