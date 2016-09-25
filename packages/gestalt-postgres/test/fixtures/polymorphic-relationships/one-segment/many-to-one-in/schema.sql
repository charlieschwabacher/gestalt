CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _member_type AS ENUM ('Player', 'Coach');

CREATE TABLE players (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE coaches (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE teams (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE member_joined_teams (
  member_id uuid NOT NULL,
  member_type _member_type NOT NULL,
  joined_team_id uuid NOT NULL,
  UNIQUE (member_id, member_type, joined_team_id)
);

ALTER TABLE member_joined_teams ADD CONSTRAINT member_joined_teams_joined_team_id_fkey FOREIGN KEY (joined_team_id) REFERENCES teams (id) MATCH FULL;

CREATE INDEX ON member_joined_teams (joined_team_id);
