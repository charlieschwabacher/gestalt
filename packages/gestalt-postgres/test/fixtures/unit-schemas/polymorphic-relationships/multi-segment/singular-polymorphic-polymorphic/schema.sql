CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _artwork_type AS ENUM ('Photo', 'Painting');

CREATE TYPE _subject_type AS ENUM ('Landscape', 'StillLife');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinned_artwork_id uuid,
  pinned_artwork_type _artwork_type
);

CREATE TABLE landscapes (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE still_lives (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE photos (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE paintings (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE artwork_depicted_subjects (
  artwork_id uuid NOT NULL,
  artwork_type _artwork_type NOT NULL,
  depicted_subject_id uuid NOT NULL,
  depicted_subject_type _subject_type NOT NULL,
  UNIQUE (artwork_id, artwork_type, depicted_subject_id, depicted_subject_type)
);

CREATE INDEX ON users (pinned_artwork_id, pinned_artwork_type);

CREATE INDEX ON artwork_depicted_subjects (depicted_subject_id, depicted_subject_type);
