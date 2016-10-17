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
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE user_followed_pages (
  user_id uuid NOT NULL,
  followed_page_id uuid NOT NULL,
  UNIQUE (user_id, followed_page_id)
);

CREATE TABLE page_authored_posts (
  page_id uuid NOT NULL,
  authored_post_id uuid NOT NULL,
  UNIQUE (page_id, authored_post_id)
);

ALTER TABLE user_followed_pages ADD CONSTRAINT user_followed_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE user_followed_pages ADD CONSTRAINT user_followed_pages_followed_page_id_fkey FOREIGN KEY (followed_page_id) REFERENCES pages (id) MATCH FULL;

ALTER TABLE page_authored_posts ADD CONSTRAINT page_authored_posts_page_id_fkey FOREIGN KEY (page_id) REFERENCES pages (id) MATCH FULL;

ALTER TABLE page_authored_posts ADD CONSTRAINT page_authored_posts_authored_post_id_fkey FOREIGN KEY (authored_post_id) REFERENCES posts (id) MATCH FULL;

CREATE INDEX ON user_followed_pages (followed_page_id);

CREATE INDEX ON page_authored_posts (authored_post_id);
