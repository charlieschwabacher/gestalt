CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _artwork_type AS ENUM ('Photo', 'Painting');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pinned_artwork_id uuid NOT NULL,
  pinned_artwork_type _artwork_type text NOT NULL
);

CREATE TABLE landscapes (
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

CREATE TABLE artwork_depicted_landscapes (
  artwork_id uuid NOT NULL,
  artwork_type _artwork_type NOT NULL,
  depicted_landscape_id uuid NOT NULL,
  UNIQUE (artwork_id, artwork_type, depicted_landscape_id)
);

ALTER TABLE artwork_depicted_landscapes ADD CONSTRAINT artwork_depicted_landscapes_depicted_landscape_id_fkey FOREIGN KEY (depicted_landscape_id) REFERENCES landscapes (id) MATCH FULL;

CREATE INDEX ON users (pinned_artwork_id, pinned_artwork_type);

CREATE INDEX ON artwork_depicted_landscapes (depicted_landscape_id);
