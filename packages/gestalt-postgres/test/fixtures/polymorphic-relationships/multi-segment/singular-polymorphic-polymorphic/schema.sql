CREATE TABLE users (
  id text PRIMARY KEY
  pinned_artwork_type _artwork_type NOT NULL,
  pinned_artwork_id text NOT NULL
);
CREATE TABLE photos (id text PRIMARY KEY);
CREATE TABLE paintings (id text PRIMARY KEY);
CREATE TABLE landscapes (id text PRIMARY KEY);
CREATE TABLE still_lifes (id text PRIMARY KEY);
CREATE TABLE artwork_depicted_subjects (
  artwork_id text NOT NULL,
  artwork_type _artwork_type NOT NULL,
  subject_id text NOT NULL,
  depicted_subject_type _subject_type NOT NULL,
  UNIQUE (artwork_type, agent_type, authored_piece_id, authored_piece_type)
);
