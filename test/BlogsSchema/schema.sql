CREATE TABLE users (
  id uuid PRIMARY KEY,
  first_name varchar(255),
  last_name varchar(255),
  email varchar(255) NOT NULL,
  created_at timestamp NOT NULL,
  password_hash varchar(255) NOT NULL
);
CREATE INDEX ON users (id);

CREATE TABLE user_followed_users (
  user_id uuid NOT NULL REFERENCES users (id),
  followed_id uuid NOT NULL REFERENCES users (id),
  UNIQUE (user_id, followed_id)
);
CREATE INDEX ON user_followed_users (user_id);
CREATE INDEX ON user_followed_users (followed_id);

CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title varchar(255) NOT NULL,
  text text NOT NULL,
  created_at timestamp NOT NULL,
  authored_id uuid NOT NULL REFERENCES users (id),
)
CREATE INDEX ON posts (id);
CREATE INDEX ON posts (authored_id);

CREATE TABLE comments (
  id uuid PRIMARY KEY,
  text text NOT NULL,
  created_at timestamp NOT NULL,
  authored_id uuid NOT NULL REFERENCES users (id),
  comment_on_id uuid NOT NULL REFERENCES Post (id)
)
CREATE INDEX ON comments (id);
CREATE INDEX ON comments (authored_id);
CREATE INDEX ON comments (comment_on_id);
