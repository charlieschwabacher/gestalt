SELECT posts.* FROM posts WHERE posts.authored_by_user_id = ANY ($1);
SELECT users.* FROM users WHERE users.id = ANY ($1);
