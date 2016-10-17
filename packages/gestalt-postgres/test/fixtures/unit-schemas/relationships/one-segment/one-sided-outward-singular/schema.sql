CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinned_post_id uuid
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE users ADD CONSTRAINT users_pinned_post_id_fkey FOREIGN KEY (pinned_post_id) REFERENCES posts (id) MATCH FULL;

CREATE INDEX ON users (pinned_post_id);
