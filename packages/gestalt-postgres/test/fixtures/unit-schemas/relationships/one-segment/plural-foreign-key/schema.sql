CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authored_by_user_id uuid
);

ALTER TABLE posts ADD CONSTRAINT posts_authored_by_user_id_fkey FOREIGN KEY (authored_by_user_id) REFERENCES users (id) MATCH FULL;

CREATE INDEX ON posts (authored_by_user_id);
