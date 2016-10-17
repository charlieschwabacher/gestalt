SELECT blogs.*, tweets.* FROM agent_authored_pieces
  LEFT JOIN blogs ON
    agent_authored_peices.authored_piece_type = 'Blog' AND
    blogs.id = agent_authored_peices.authored_piece_id
  LEFT JOIN tweets ON
    agent_authored_peices.authored_piece_type = 'Tweet' AND
    tweets.id = agent_authored_peices.authored_piece_id
  JOIN user_followed_agents ON
    user_followed_agents.followed_agent_id = agent_authored_pieces.agent_id AND
    user_followed_agents.followed_agent_type = agent_authored_pieces.agent_type
  WHERE user_followed_agents.user_id = ANY ($1);
