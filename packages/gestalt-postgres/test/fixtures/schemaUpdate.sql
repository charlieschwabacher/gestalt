ALTER TABLE users ADD COLUMN pinned_post_id uuid;

ALTER TABLE posts ADD UNIQUE (title);

ALTER TABLE posts ADD COLUMN subtitle text;

ALTER TABLE posts ALTER COLUMN text DROP NOT NULL;

ALTER TABLE posts ADD COLUMN images jsonb;

CREATE TABLE pages (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  created_by_user_id uuid NOT NULL
);

ALTER TABLE users ADD CONSTRAINT users_pinned_post_id_fkey FOREIGN KEY (pinned_post_id) REFERENCES posts (id) MATCH FULL;

ALTER TABLE pages ADD CONSTRAINT pages_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users (id) MATCH FULL;

CREATE INDEX ON users (first_name);

CREATE INDEX ON users (pinned_post_id);

CREATE INDEX ON pages (title);

CREATE INDEX ON pages (created_by_user_id);
