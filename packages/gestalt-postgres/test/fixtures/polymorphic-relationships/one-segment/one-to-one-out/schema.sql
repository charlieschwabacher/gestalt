CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE posts (id text PRIMARY KEY);
CREATE TABLE IMAGES (
  id text PRIMARY KEY,
  depicted_subject_id text,
  depicted_subject_type _subject_type
  UNIQUE(depicted_subject_id, depicted_subject_type)
);
