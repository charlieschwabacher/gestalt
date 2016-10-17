CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE user_authored_posts (
  user_id uuid NOT NULL,
  authored_post_id uuid NOT NULL,
  UNIQUE (user_id, authored_post_id)
);

ALTER TABLE user_authored_posts ADD CONSTRAINT user_authored_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE user_authored_posts ADD CONSTRAINT user_authored_posts_authored_post_id_fkey FOREIGN KEY (authored_post_id) REFERENCES posts (id) MATCH FULL;

CREATE INDEX ON user_authored_posts (authored_post_id);
