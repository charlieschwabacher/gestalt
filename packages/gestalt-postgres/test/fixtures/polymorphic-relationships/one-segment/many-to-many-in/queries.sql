SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'Player' AND
    member_joined_teams.member_id = ANY ($1);
SELECT teams.* FROM teams
  JOIN member_joined_teams ON member_joined_teams.joined_team_id = teams.id
  WHERE
    member_joined_teams.member_type = 'Coach' AND
    member_joined_teams.member_id = ANY ($1);
SELECT players.*, coaches.* FROM member_joined_teams
  LEFT JOIN players ON
    member_joined_teams.member_type = 'Player' AND
    member_joined_teams.member_id = players.id
  LEFT JOIN coaches ON
    member_joined_teams.member_type = 'Coach' AND
    member_joined_teams.member_id = coaches.id
  WHERE member_joined_teams.team_id = ANY $(1);
