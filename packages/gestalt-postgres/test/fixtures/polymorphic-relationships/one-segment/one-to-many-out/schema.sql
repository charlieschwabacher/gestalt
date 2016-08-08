CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE images (
  id text PRIMARY KEY,
  depicted_subject_id text,
  depicted_subject_type _subject_type
);
