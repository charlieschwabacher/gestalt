CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE profiles (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid,
  depicted_by_image_id uuid
);

CREATE TABLE images (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE profiles ADD CONSTRAINT profiles_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE profiles ADD CONSTRAINT profiles_depicted_by_image_id_fkey FOREIGN KEY (depicted_by_image_id) REFERENCES images (id) MATCH FULL;

CREATE INDEX ON profiles (created_by_user_id);

CREATE INDEX ON profiles (depicted_by_image_id);
