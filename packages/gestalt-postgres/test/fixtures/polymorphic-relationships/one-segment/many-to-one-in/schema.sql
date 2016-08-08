CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE member_joined_teams (
  member_id text NOT NULL,
  member_type _member_type NOT NULL,
  joined_team_id text NOT NULL REFERENCES team (id),
  UNIQUE (member_id, member_type, joined_team_id)
);
