SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'players' AND
    team_included_members.included_member_id = $1;
SELECT teams.* FROM teams
  JOIN team_included_members ON team_included_members.team_id = teams.id
  WHERE
    team_included_members.included_member_type = 'coaches' AND
    team_included_members.included_member_id = $1;
SELECT players.*, coaches.* FROM team_included_members
  LEFT JOIN players ON
    team_included_members.included_member_type = 'players' AND
    players.id = team_included_members.included_member_id
  LEFT JOIN coaches ON
    team_included_members.included_member_type = 'coaches' AND
    coaches.id = team_included_members.member_id
  WHERE team_included_members.team_id = $1;
