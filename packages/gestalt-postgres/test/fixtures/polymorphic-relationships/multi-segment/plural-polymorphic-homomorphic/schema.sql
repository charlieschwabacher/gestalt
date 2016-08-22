CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _vehicle_type AS ENUM ('Car', 'Truck');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE cars (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE trucks (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE packages (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE user_drove_vehicles (
  user_id text NOT NULL REFERENCES users (id),
  drove_vehicle_id text NOT NULL,
  drove_vehicle_type _vehicle_type NOT NULL,
  UNIQUE (user_id, drove_vehicle_id, drove_vehicle_type)
);

CREATE TABLE vehicle_carried_packages (
  vehicle_id text NOT NULL,
  vehicle_type _vehicle_type NOT NULL,
  carried_package_id text NOT NULL REFERENCES packages (id),
  UNIQUE (vehicle_id, vehicle_type, carried_package_id)
);

ALTER TABLE user_drove_vehicles ADD CONSTRAINT user_drove_vehicles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

ALTER TABLE vehicle_carried_packages ADD CONSTRAINT vehicle_carried_packages_carried_package_id_fkey FOREIGN KEY (carried_package_id) REFERENCES packages (id) MATCH FULL;

CREATE INDEX ON user_drove_vehicles (drove_vehicle_id);

CREATE INDEX ON vehicle_carried_packages (carried_package_id);
