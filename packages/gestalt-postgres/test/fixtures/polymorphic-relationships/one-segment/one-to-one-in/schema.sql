CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE images (
  id text PRIMARY KEY,
  inspired_by_subject_id text,
  inspired_by_subject_type _subject_type
  UNIQUE(inspired_by_subject_id, inspired_by_subject_type)
);
