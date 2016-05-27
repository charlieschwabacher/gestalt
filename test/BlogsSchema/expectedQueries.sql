SELECT users.*
FROM users
JOIN user_followed_users ON user_followed_users.followed_user_id = users.id
WHERE user_followed_users.user_id = ANY ($1);

SELECT users.*
FROM users
JOIN user_followed_users ON user_followed_users.user_id = users.id
WHERE user_followed_users.followed_user_id = ANY ($1);

SELECT posts.*
FROM posts
WHERE posts.authored_by_user_id = ANY ($1);

SELECT comments.*
FROM comments
WHERE comments.authored_by_user_id = ANY ($1);

SELECT posts.*
FROM posts
JOIN user_followed_users ON user_followed_users.followed_user_id = posts.authored_by_user_id
WHERE user_followed_users.user_id = ANY ($1);

SELECT users.*
FROM users
WHERE users.id = ANY ($1);

SELECT comments.*
FROM comments
WHERE comments.inspired_by_post_id = ANY ($1);

SELECT users.*
FROM users
WHERE users.id = ANY ($1);

SELECT posts.*
FROM posts
WHERE posts.id = ANY ($1);
