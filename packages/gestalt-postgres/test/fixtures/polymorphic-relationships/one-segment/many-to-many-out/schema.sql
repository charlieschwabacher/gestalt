CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE team_included_members (
  team_id text,
  included_member_id text,
  included_member_type _member_type,
  UNIQUE (included_member_id, included_member_type, team_id)
);
