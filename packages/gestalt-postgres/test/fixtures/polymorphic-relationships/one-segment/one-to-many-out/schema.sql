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
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depicted_subject_id uuid,
  depicted_subject_type _subject_type
);

CREATE INDEX ON images (depicted_subject_id, depicted_subject_type);
