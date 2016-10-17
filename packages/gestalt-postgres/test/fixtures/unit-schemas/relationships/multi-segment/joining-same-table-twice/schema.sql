CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE humans (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raised_by_human_id uuid
);

ALTER TABLE humans ADD CONSTRAINT humans_raised_by_human_id_fkey FOREIGN KEY (raised_by_human_id) REFERENCES humans (id) MATCH FULL;

CREATE INDEX ON humans (raised_by_human_id);
