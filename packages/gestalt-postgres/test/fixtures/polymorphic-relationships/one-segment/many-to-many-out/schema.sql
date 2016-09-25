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

CREATE TABLE team_included_members (
  team_id uuid NOT NULL,
  included_member_id uuid NOT NULL,
  included_member_type _member_type NOT NULL,
  UNIQUE (team_id, included_member_id, included_member_type)
);

ALTER TABLE team_included_members ADD CONSTRAINT team_included_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) MATCH FULL;

CREATE INDEX ON team_included_members (included_member_id, included_member_type);
