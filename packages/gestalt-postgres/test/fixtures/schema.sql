CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
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
  id uuid PRIMARY KEY,
  title text NOT NULL,
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  authored_by_user_id uuid NOT NULL REFERENCES users (id)
);

CREATE INDEX ON posts (title);

CREATE INDEX ON posts (authored_by_user_id);

CREATE TABLE comments (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  text text NOT NULL,
  created_at timestamp without time zone NOT NULL,
  authored_by_user_id uuid REFERENCES users (id),
  inspired_by_post_id uuid NOT NULL REFERENCES posts (id)
);

CREATE INDEX ON comments (authored_by_user_id);

CREATE INDEX ON comments (inspired_by_post_id);

CREATE TABLE user_followed_users (
  user_id uuid NOT NULL REFERENCES users (id),
  followed_user_id uuid NOT NULL REFERENCES users (id),
  UNIQUE (user_id, followed_user_id)
);

CREATE INDEX ON user_followed_users (followed_user_id);
