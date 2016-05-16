CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar(255) NOT NULL,
  passwordHash varchar(255) NOT NULL,
  firstName varchar(255),
  lastName varchar(255),
  createdAt timestamp NOT NULL,
);
CREATE INDEX ON users (id);

CREATE TABLE user_followed_users (
  user_id uuid REFERENCES users (id),
  followed_id uuid REFERENCES users (id),
  UNIQUE (user_id, followed_user_id)
)
CREATE INDEX ON user_followed_users (user_id);
CREATE INDEX ON user_followed_users (followed_id);

CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title varchar(255) NOT NULL,
  text text NOT NULL,
  createdAt timestamp NOT NULL,
  authored_id uuid REFERENCES users (id),
)
CREATE INDEX ON posts (id);
CREATE INDEX ON posts (authored_id);

CREATE TABLE comments (
  id uuid PRIMARY KEY,
  text text NOT NULL,
  createdAt timestamp NOT NULL,
  authored_id uuid REFERENCES users (id),
  comment_on_id uuid REFERENCES comments (id)
)
CREATE INDEX ON comments (id);
CREATE INDEX ON comments (authored_id);
CREATE INDEX ON comments (comment_on_id);
