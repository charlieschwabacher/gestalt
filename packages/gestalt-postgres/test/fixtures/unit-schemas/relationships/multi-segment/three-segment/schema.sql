CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE pages (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  made_by_page_id uuid
);

CREATE TABLE comments (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspired_by_post_id uuid
);

CREATE TABLE user_followed_pages (
  user_id uuid NOT NULL,
  followed_page_id uuid NOT NULL,
  UNIQUE (user_id, followed_page_id)
);

ALTER TABLE posts ADD CONSTRAINT posts_made_by_page_id_fkey FOREIGN KEY (made_by_page_id) REFERENCES pages (id) MATCH FULL;

ALTER TABLE comments ADD CONSTRAINT comments_inspired_by_post_id_fkey FOREIGN KEY (inspired_by_post_id) REFERENCES posts (id) MATCH FULL;

ALTER TABLE user_followed_pages ADD CONSTRAINT user_followed_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE user_followed_pages ADD CONSTRAINT user_followed_pages_followed_page_id_fkey FOREIGN KEY (followed_page_id) REFERENCES pages (id) MATCH FULL;

CREATE INDEX ON posts (made_by_page_id);

CREATE INDEX ON comments (inspired_by_post_id);

CREATE INDEX ON user_followed_pages (followed_page_id);
