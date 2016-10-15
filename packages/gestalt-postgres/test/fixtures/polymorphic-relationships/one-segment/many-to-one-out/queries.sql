SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'Player' AND
    team_included_members.included_member_id = ANY ($1);
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'Coach' AND
    team_included_members.included_member_id = ANY ($1);
SELECT players.*, coaches.* FROM team_included_members
  LEFT JOIN players ON
    team_included_members.included_member_type = 'Player' AND
    players.id = team_included_members.included_member_id
  LEFT JOIN coaches ON
    team_included_members.included_member_type = 'Coach' AND
    coaches.id = team_included_members.member_id
  WHERE team_included_members.team_id = ANY ($1);
