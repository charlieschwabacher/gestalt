CREATE TABLE players (id text PRIMARY KEY);
CREATE TABLE coaches (id text PRIMARY KEY);
CREATE TABLE teams (id text PRIMARY KEY);
CREATE TABLE member_joined_teams (
  member_id text,
  member_type _member_type,
  joined_team_id text,
  UNIQUE (member_id, member_type, joined_team_id)
);
