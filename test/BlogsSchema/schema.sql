CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  created_at timestamp NOT NULL,
  first_name varchar(255),
  last_name varchar(255)
);
CREATE INDEX ON users (id);

CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title varchar(255) NOT NULL,
  text text NOT NULL,
  created_at timestamp NOT NULL,
  authored_by_user_id uuid NOT NULL REFERENCES users (id)
);
CREATE INDEX ON posts (id);
CREATE INDEX ON posts (authored_by_user_id);

CREATE TABLE comments (
  id uuid PRIMARY KEY,
  text text NOT NULL,
  created_at timestamp NOT NULL,
  authored_by_user_id uuid REFERENCES users (id),
  inspired_by_post_id uuid NOT NULL REFERENCES posts (id)
);
CREATE INDEX ON comments (id);
CREATE INDEX ON comments (authored_by_user_id);
CREATE INDEX ON comments (inspired_by_post_id);

CREATE TABLE user_followed_users (
  user_id uuid NOT NULL REFERENCES users (id),
  followed_user_id uuid NOT NULL REFERENCES users (id),
  UNIQUE (user_id, followed_user_id)
);
CREATE INDEX ON user_followed_users (user_id);
CREATE INDEX ON user_followed_users (followed_user_id);
