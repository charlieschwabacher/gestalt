SELECT humans.*, robots.* FROM vehicle_carried_agents
LEFT JOIN humans
  ON vehicle_carried_agents.carried_agent_type = 'Human'
  AND humans.id = vehicle_carried_agents.agent_id
LEFT JOIN robots
  ON vehicle_carried_agents.carried_agent_type = 'Robot'
  AND robots.id = vehicle_carried_agents.agent_id
JOIN agent_operated_vehicles
  ON agent_operated_vehicles.operated_vehicle_id = vehicle_carried_agents.vehicle_id
  AND agent_operated_vehicles.operated_vehicle_type = vehicle_carried_agents.vehicle_type
JOIN team_included_agents
  ON team_included_agents.included_agent_id = agent_operated_vehicles.agent_id
  AND team_included_agents.included_agent_type = agent_operated_vehicles.agent_type
WHERE
  team_included_agents.team_id = ANY ($1);
