CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _vehicle_type AS ENUM ('Car', 'Rocket');

CREATE TYPE _agent_type AS ENUM ('Human', 'Robot');

CREATE TABLE cars (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE rockets (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE humans (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE robots (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE teams (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE team_included_agents (
  team_id uuid NOT NULL,
  included_agent_id uuid NOT NULL,
  included_agent_type _agent_type NOT NULL,
  UNIQUE (team_id, included_agent_id, included_agent_type)
);

CREATE TABLE agent_operated_vehicles (
  agent_id uuid NOT NULL,
  agent_type _agent_type NOT NULL,
  operated_vehicle_id uuid NOT NULL,
  operated_vehicle_type _vehicle_type NOT NULL,
  UNIQUE (agent_id, agent_type, operated_vehicle_id, operated_vehicle_type)
);

CREATE TABLE vehicle_carried_agents (
  vehicle_id uuid NOT NULL,
  vehicle_type _vehicle_type NOT NULL,
  carried_agent_id uuid NOT NULL,
  carried_agent_type _agent_type NOT NULL,
  UNIQUE (vehicle_id, vehicle_type, carried_agent_id, carried_agent_type)
);

ALTER TABLE team_included_agents ADD CONSTRAINT team_included_agents_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams (id) MATCH FULL;

CREATE INDEX ON team_included_agents (included_agent_id, included_agent_type);

CREATE INDEX ON agent_operated_vehicles (operated_vehicle_id, operated_vehicle_type);

CREATE INDEX ON vehicle_carried_agents (carried_agent_id, carried_agent_type);
