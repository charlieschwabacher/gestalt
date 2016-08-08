CREATE TABLE users (id text PRIMARY KEY);
CREATE TABLE bots (id text PRIMARY KEY);
CREATE TABLE blogs (id text PRIMARY KEY);
CREATE TABLE tweets (id text PRIMARY KEY);
CREATE TABLE user_followed_agents (
  user_id text NOT NULL REFERENCES users (id),
  followed_agent_id text NOT NULL,
  followed_agent_type _agent_type NOT NULL,
  UNIQUE (user_id, followed_agent_id, followed_agent_type)
);
CREATE TABLE agent_authored_pieces (
  agent_id text NOT NULL,
  agent_type _agent_type NOT NULL,
  authored_piece_id text NOT NULL,
  authored_piece_type _piece_type NOT NULL,
  UNIQUE (agent_id, agent_type, authored_piece_id, authored_piece_type)
);
