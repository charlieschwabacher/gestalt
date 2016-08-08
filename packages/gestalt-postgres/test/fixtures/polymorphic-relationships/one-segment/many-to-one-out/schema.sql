CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE team_included_members (
  team_id text NOT NULL REFERENCES team (id),
  included_member_id text NOT NULL,
  included_member_type _member_type NOT NULL,
  UNIQUE (included_member_id, included_member_type, team_id)
);
