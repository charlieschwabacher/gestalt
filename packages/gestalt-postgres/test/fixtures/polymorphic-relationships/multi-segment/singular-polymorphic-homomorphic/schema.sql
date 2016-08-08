CREATE TABLE users (
  id text PRIMARY KEY,
  pinned_artwork_id text NOT NULL,
  pinned_artwork_type _artwork_type text NOT NULL
);
CREATE TABLE photos (id text PRIMARY KEY);
CREATE TABLE paintings (id text PRIMARY KEY);
CREATE TABLE landscapes (id text PRIMARY KEY);
CREATE TABLE artwork_depicted_landscapes (
  artwork_id text NOT NULL,
  artwork_type _artwork_type NOT NULL,
  depicted_landscape_id NOT NULL REFERENCES landscapes (id),
  UNIQUE (artwork_id, artwork_type, depicted_landscape_id)
);
