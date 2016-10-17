CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE profiles (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid
);

ALTER TABLE profiles ADD CONSTRAINT profiles_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users (id) MATCH FULL;

CREATE INDEX ON profiles (created_by_user_id);
