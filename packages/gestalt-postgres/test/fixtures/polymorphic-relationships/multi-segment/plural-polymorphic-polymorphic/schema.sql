CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE _agent_type AS ENUM ('User', 'Bot');

CREATE TYPE _piece_type AS ENUM ('Blog', 'Tweet');

CREATE TABLE users (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE bots (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE blogs (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE tweets (
  seq SERIAL NOT NULL UNIQUE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE user_followed_agents (
  user_id uuid NOT NULL,
  followed_agent_id uuid NOT NULL,
  followed_agent_type _agent_type NOT NULL,
  UNIQUE (user_id, followed_agent_id, followed_agent_type)
);

CREATE TABLE agent_authored_pieces (
  agent_id uuid NOT NULL,
  agent_type _agent_type NOT NULL,
  authored_piece_id uuid NOT NULL,
  authored_piece_type _piece_type NOT NULL,
  UNIQUE (agent_id, agent_type, authored_piece_id, authored_piece_type)
);

ALTER TABLE user_followed_agents ADD CONSTRAINT user_followed_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) MATCH FULL;

CREATE INDEX ON user_followed_agents (followed_agent_id, followed_agent_type);

CREATE INDEX ON agent_authored_pieces (authored_piece_id, authored_piece_type);
