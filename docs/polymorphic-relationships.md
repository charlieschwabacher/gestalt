# polymorphic relationships


## notes

- one segment direct polymorphic to polymorphic relationship not possible
  - we *can* have a relationship to a polymorphic type on an interface, but
    because it's field is defined on the individual types it doesn't need any
    special treatment

- polymorphic to polymorphic segment of a multi segment relationship
  - join table with two id and two type columns
  - no difference between singular and plural segments
  - direction of arrow only affects join table and column names

- polymorphic to homomorphic segment of a multi segment relationship
  - join table with foreign key, id, and type columns
  - no differnece between singular and plural segments

- homomorphic to polymorphic segments
  - one to one and one to many (meaning polymorphic field is singular)
    - id and type columns are added to the table for the type with field
      resolving to the polymorphic type.
    - only difference between one to one and one to many is unique constraint on
      (id, type) columns in 1:1 relationship
    - only difference between arrow directions is column naming

  - many to one and many to many (meaning polymorphic field is plural),
    - join table with foreign key, id, and type columns
    - many to many and many to one are modeled / queried exactly the same
    - only difference between arrow directions is join table / column naming
    - limitation that we can't sort efficiently on any fields besides id (using
      the join table), because even if a column is shared between the two
      tables, coalescing it to sort hits the entire table.

  - why not have foreign key on polymorphic types for many to one? (ie players
    and coaches have team id column)  For limit / sort, we would have to do
    multiple queries and either awkwardly union and resort in sql (union is hard
    because number of columns in all tables has to match), or sort in the
    application.  If we want to query a polymorphic type w/ n members, and limit
    to m rows, we would have to fetch n * m rows from the db.  Using a join
    table we can fetch only m.  Issue w/ this is more complexity / readability
    of generated sql than performance.


## examples

### 1:1 out

```
User <-DEPICTED- Image
Post <-DEPICTED- Image
Image -DEPICTED-> Subject
```
```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE IMAGES (
  id text PRIMARY KEY,
  depicted_subject_id text,
  depicted_subject_type _subject_type
  UNIQUE(depicted_subject_id, depicted_subject_type)
);
```
```sql
SELECT * FROM images WHERE depicted_subject_type = 'users' AND depicted_subject_id = $1;
SELECT * FROM images WHERE depicted_subject_type = 'posts' AND depicted_subject_id = $1;
SELECT * FROM users WHERE id = $1;
```


### 1:1 in
```
User -INSPIRED-> Image
Post -INSPIRED-> Image
Image <-INSPIRED- Subject
```
```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE images (
  id text PRIMARY KEY,
  inspired_by_subject_id text,
  inspired_by_subject_type _subject_type
  UNIQUE(inspired_by_subject_id, inspired_by_subject_type)
);
```
```sql
SELECT * FROM images WHERE inspired_by_subject_type = 'users' AND inspired_by_subject_id = $1;
SELECT * FROM images WHERE inspired_by_subject_type = 'posts' AND inspired_by_subject_id = $1;
SELECT * FROM users WHERE id = $1;
```


### 1:many out
```
User <=DEPICTED= Image
Post <=DEPICTED= Image
Image -DEPICTED-> Subject
```
```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE images (
  id text PRIMARY KEY,
  depicted_subject_id text,
  depicted_subject_type _subject_type
);
```
```sql
SELECT * FROM images WHERE depicted_subject_type = 'users' AND depicted_subject_id = $1;
SELECT * FROM images WHERE depicted_subject_type = 'posts' AND depicted_subject_id = $1;
SELECT * FROM users WHERE id = $1;
```


### 1:many in
```
User =INSPIRED=> Image
Post =INSPIRED=> Image
Image <-INSPIRED- Subject
```
```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE IMAGES (
  id text PRIMARY KEY,
  inspired_by_subject_id text,
  inspired_by_subject_type _subject_type
);
```
```sql
SELECT * FROM images WHERE inspired_by_subject_type = 'users' AND inspired_by_subject_id = $1;
SELECT * FROM images WHERE inspired_by_subject_type = 'posts' AND inspired_by_subject_id = $1;
SELECT * FROM users WHERE id = $1;
```


### many:1 out
```
Player <-INCLUDED- Team
Coach <-INCLUDED- Team
Team =INCLUDED=> Member
```
```sql
CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE team_included_members (
  team_id text NOT NULL REFERENCES team (id),
  included_member_id text NOT NULL,
  included_member_type _member_type NOT NULL,
  UNIQUE (included_member_id, included_member_type, team_id)
);
```
```sql
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'players' AND
    team_included_members.included_member_id = $1;
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'coaches' AND
    team_included_members.included_member_id = $1;
SELECT players.*, coaches.* FROM team_included_members
  LEFT JOIN players ON
    team_included_members.included_member_type = 'players' AND
    players.id = team_included_members.included_member_id
  LEFT JOIN coaches ON
    team_included_members.included_member_type = 'coaches' AND
    coaches.id = team_included_members.member_id
  WHERE team_included_members.team_id = $1;
```


### many:1 in
```
Player -JOINED-> Team
Coach -JOINED-> Team
Team <=JOINED= Member
```
```sql
CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE member_joined_teams (
  member_id text NOT NULL,
  member_type _member_type NOT NULL,
  joined_team_id text NOT NULL REFERENCES team (id),
  UNIQUE (member_id, member_type, joined_team_id)
);
```
```sql
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'players' AND
    member_joined_teams.member_id = $1;
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'coaches' AND
    member_joined_teams.member_id = $1;
SELECT players.*, coaches.* FROM member_joined_teams
  LEFT JOIN players ON
    member_joined_teams.member_type = 'players' AND
    players.id = member_joined_teams.member_id
  LEFT JOIN coaches ON
    member_joined_teams.member_type = 'coaches' AND
    coaches.id = member_joined_teams.member_id
  WHERE member_joined_teams.team_id = $1;
```


### many:many out
```
Player <=INCLUDED= Team
Coach <=INCLUDED= Team
Team =INCLUDED=> Member
```
```sql
CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE team_included_members (
  team_id text,
  included_member_id text,
  included_member_type _member_type,
  UNIQUE (included_member_id, included_member_type, team_id)
);
```
```sql
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'players' AND
    team_included_members.included_member_id = $1;
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'coaches' AND
    team_included_members.included_member_id = $1;
SELECT players.*, coaches.* FROM team_included_members
  LEFT JOIN players ON
    team_included_members.included_member_type = 'players' AND
    team_included_members.included_member_id = players.id
  LEFT JOIN coaches ON
    team_included_members.included_member_type = 'coaches' AND
    team_included_members.included_member_id = coaches.id
  WHERE team_included_members.team_id = $1;
```


### many:many in
```
Player =JOINED=> Team
Coach =JOINED=> Team
Team <=JOINED= Member
```
```sql
CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE member_joined_teams (
  member_id text,
  member_type _member_type,
  joined_team_id text,
  UNIQUE (member_id, member_type, joined_team_id)
);
```
```sql
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'players' AND
    member_joined_teams.member_id = $1;
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'coaches' AND
    member_joined_teams.member_id = $1;
SELECT players.*, coaches.* FROM member_joined_teams
  LEFT JOIN players ON
    member_joined_teams.member_type = 'players' AND
    member_joined_teams.member_id = players.id
  LEFT JOIN coaches ON
    member_joined_teams.member_type = 'coaches' AND
    member_joined_teams.member_id = coaches.id;
```


## multi segment examples

### plural polymorphic and polymorphic
```
union Agent = User | Bot
union Piece = Blog | Tweet
User =FOLLOWED=> Agent =AUTHORED=> Piece
```

```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE bots (id text PRIMARY KEY);
CREATE TABLE blogs (id text PRIMARY KEY);
CREATE TABLE tweets (id text PRIMARY KEY);
CREATE TABLE user_followed_agents (
  user_id text NOT NULL REFERENCES users (id),
  followed_agent_id text NOT NULL,
  followed_agent_type _agent_type NOT NULL,
  UNIQUE (user_id, followed_agent_id, followed_agent_type)
);
CREATE TABLE agent_authored_pieces (
  agent_id text NOT NULL,
  agent_type _agent_type NOT NULL,
  authored_piece_id text NOT NULL,
  authored_piece_type _piece_type NOT NULL,
  UNIQUE (agent_id, agent_type, authored_piece_id, authored_piece_type)
);
```

```sql
SELECT blogs.*, tweets.* FROM agent_authored_pieces
  LEFT JOIN blogs ON
    agent_authored_peices.authored_piece_type = 'blogs' AND
    blogs.id = agent_authored_peices.authored_piece_id
  LEFT JOIN tweets ON
    agent_authored_peices.authored_piece_type = 'tweets' AND
    tweets.id = agent_authored_peices.authored_piece_id
  JOIN user_followed_agents ON
    user_followed_agents.followed_agent_type = agent_authored_pieces.agent_type AND
    user_followed_agents.followed_agent_id = agent_authored_pieces.agent_id
  WHERE user_followed_agents.user_id = $1;
```

### singular polymorphic and polymorphic
```
union Artwork = Photo | Painting
union Subject = Landscape | StillLife
User -PINNED-> Artwork -DEPICTED-> Subject
```

```sql
CREATE TABLE users (
  id text PRIMARY KEY
  pinned_artwork_type _artwork_type NOT NULL,
  pinned_artwork_id text NOT NULL
);
CREATE TABLE photos (id text PRIMARY KEY);
CREATE TABLE paintings (id text PRIMARY KEY);
CREATE TABLE landscapes (id text PRIMARY KEY);
CREATE TABLE still_lifes (id text PRIMARY KEY);
CREATE TABLE artwork_depicted_subjects (
  artwork_id text NOT NULL,
  artwork_type _artwork_type NOT NULL,
  subject_id text NOT NULL,
  depicted_subject_type _subject_type NOT NULL,
  UNIQUE (artwork_type, agent_type, authored_piece_id, authored_piece_type)
)
```

```sql
SELECT landscapes.*, still_lives.* FROM artwork_depicted_subjects
  LEFT JOIN landscapes ON
    artwork_depicted_subjects.depicted_subject_type = 'landscapes' AND
    landscapes.id = artwork_depicted_subjects.depicted_subject_id
  LEFT JOIN still_lives ON
    artwork_depicted_subjects.depicted_subject_type = 'still_lifes' AND
    still_lifes.id = artwork_depicted_subjects.depicted_subject_id
  WHERE
    artwork_depicted_subjects.artwork_id = $1 AND
    artwork_depicted_subjects.artwork_type = $2
```

### plural polymorphic and homomorphic
```
union Vehicle = Car | Truck
User =DROVE=> Vehicle =CARRIED=> Package
```

```sql
CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE cars (id text PRIMARY KEY);
CREATE TABLE trucks (id text PRIMARY KEY);
CREATE TABLE packages (id text PRIMARY KEY);
CREATE TABLE user_drove_vehicles (
  user_id text NOT NULL REFERENCES users (id),
  drove_vehicle_id text NOT NULL,
  drove_vehicle_type _vehicle_type NOT NULL,
  UNIQUE (user_id, followed_agent_id, followed_agent_type)
);
CREATE TABLE vehicle_carried_packages (
  vehicle_id text NOT NULL,
  vehicle_type _vehicle_type NOT NULL,
  carried_package_id text NOT NULL REFERENCES packages (id),
  UNIQUE (vehicle_id, vehicle_type, carried_package_id)
);
```

```sql
SELECT packages.* FROM packages
  JOIN vehicle_carried_packages ON
    vehicle_carried_packages.carried_package_id = packages.id
  JOIN user_drove_vehicles ON
    user_drove_vehicles.drove_vehicle_id = vehicle_carried_packages.vehicle_id AND
    user_drove_vehicles.drove_vehicle_type = vehicle_carried_packages.vehicle_type
  WHERE user_drove_vehicles.user_id = $1;
```

### singular polymorphic and homomorphic
```
union Artwork = Photo | Painting
User -PINNED-> Artwork -DEPICTED-> Landscape
```

```sql
CREATE TABLE users (
  id text PRIMARY KEY,
  pinned_artwork_id text NOT NULL,
  pinned_artwork_type _artwork_type text NOT NULL
);
CREATE TABLE photos (id text PRIMARY KEY);
CREATE TABLE paintings (id text PRIMARY KEY);
CREATE TABLE landscapes (id text PRIMARY KEY);
CREATE TABLE artwork_depicted_landscapes (
  artwork_id text NOT NULL,
  artwork_type _artwork_type NOT NULL,
  depicted_landscape_id NOT NULL REFERENCES landscapes (id),
  UNIQUE (artwork_id, artwork_type, depicted_landscape_id)
);
```

```sql
SELECT landscapes.* FROM landscapes
  JOIN artwork_depicted_landscapes ON
    artwork_depicted_landscapes.depicted_landscape_id = landscapes.id
  WHERE
    artwork_depicted_landscapes.pinned_artwork_id = $1 AND
    artwork_depicted_landscapes.pinned_artwork_type = $2;
```
