SELECT users.* FROM users WHERE users.id = ANY ($1);
