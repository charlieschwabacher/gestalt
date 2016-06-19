CREATE INDEX ON users (first_name);

ALTER TABLE posts ADD UNIQUE (title);

ALTER TABLE posts ADD COLUMN subtitle text;

ALTER TABLE posts ALTER COLUMN text DROP NOT NULL;

ALTER TABLE posts ADD COLUMN images jsonb;

CREATE TABLE pages (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  title text NOT NULL,
  content text,
  created_by_user_id uuid NOT NULL REFERENCES users (id)
);

CREATE INDEX ON pages (title);

CREATE INDEX ON pages (created_by_user_id);
