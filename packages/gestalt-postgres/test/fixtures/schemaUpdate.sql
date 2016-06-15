ALTER TABLE users DROP COLUMN favorite_food;
CREATE INDEX on users first_name;

ALTER TABLE posts ADD COLUMN images jsonb;
ALTER TABLE posts ALTER COLUMN text DROP NOT NULL;
ALTER TABLE posts ADD UNIQUE (title);

DROP TABLE comments;

CREATE TABLE pages (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY,
  title text NOT NULL,
  content text,
);
CREATE INDEX ON pages (title);
