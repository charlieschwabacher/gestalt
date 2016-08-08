SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'players' AND
    member_joined_teams.member_id = $1;
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'coaches' AND
    member_joined_teams.member_id = $1;
SELECT players.*, coaches.* FROM member_joined_teams
  LEFT JOIN players ON
    member_joined_teams.member_type = 'players' AND
    players.id = member_joined_teams.member_id
  LEFT JOIN coaches ON
    member_joined_teams.member_type = 'coaches' AND
    coaches.id = member_joined_teams.member_id
  WHERE member_joined_teams.team_id = $1;
