SELECT humans.* FROM humans
  JOIN humans humans2 ON humans2.raised_by_human_id = humans.id
  WHERE humans2.id = ANY ($1);
SELECT humans.* FROM humans
  JOIN humans humans2 ON humans2.id = humans.raised_by_human_id
  WHERE humans2.raised_by_human_id = ANY ($1);
