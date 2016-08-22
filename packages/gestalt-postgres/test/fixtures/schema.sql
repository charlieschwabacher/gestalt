CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE food AS ENUM ('ICE_CREAM', 'PIZZA', 'SALAD');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  location jsonb,
  favorite_food jsonb,
  first_name text,
  last_name text
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  authored_by_user_id uuid NOT NULL
);

CREATE TABLE comments (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  authored_by_user_id uuid,
  inspired_by_post_id uuid NOT NULL
);

CREATE TABLE user_followed_users (
  user_id uuid NOT NULL,
  followed_user_id uuid NOT NULL,
  UNIQUE (user_id, followed_user_id)
);

ALTER TABLE posts ADD CONSTRAINT posts_authored_by_user_id_fkey FOREIGN KEY (authored_by_user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE comments ADD CONSTRAINT comments_authored_by_user_id_fkey FOREIGN KEY (authored_by_user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE comments ADD CONSTRAINT comments_inspired_by_post_id_fkey FOREIGN KEY (inspired_by_post_id) REFERENCES posts (id) MATCH FULL;

ALTER TABLE user_followed_users ADD CONSTRAINT user_followed_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE user_followed_users ADD CONSTRAINT user_followed_users_followed_user_id_fkey FOREIGN KEY (followed_user_id) REFERENCES users (id) MATCH FULL;

CREATE INDEX ON posts (title);

CREATE INDEX ON posts (authored_by_user_id);

CREATE INDEX ON comments (authored_by_user_id);

CREATE INDEX ON comments (inspired_by_post_id);

CREATE INDEX ON user_followed_users (followed_user_id);
