SELECT profiles.* FROM profiles WHERE profiles.created_by_user_id = ANY ($1);
SELECT users.* FROM users WHERE users.id = ANY ($1);
