CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE cars (id text PRIMARY KEY);
CREATE TABLE trucks (id text PRIMARY KEY);
CREATE TABLE packages (id text PRIMARY KEY);
CREATE TABLE user_drove_vehicles (
  user_id text NOT NULL REFERENCES users (id),
  drove_vehicle_id text NOT NULL,
  drove_vehicle_type _vehicle_type NOT NULL,
  UNIQUE (user_id, followed_agent_id, followed_agent_type)
);
CREATE TABLE vehicle_carried_packages (
  vehicle_id text NOT NULL,
  vehicle_type _vehicle_type NOT NULL,
  carried_package_id text NOT NULL REFERENCES packages (id),
  UNIQUE (vehicle_id, vehicle_type, carried_package_id)
);
