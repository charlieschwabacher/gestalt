CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _subject_type AS ENUM ('User', 'Post');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE posts (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE images (
  id uuid PRIMARY KEY,
  inspired_by_subject_id uuid,
  inspired_by_subject_type _subject_type,
  UNIQUE(inspired_by_subject_id, inspired_by_subject_type)
);
