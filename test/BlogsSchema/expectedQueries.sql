SELECT users.*
FROM users
JOIN user_followed_users ON user_followed_users.followed_user_id = users.id
WHERE user_followed_users.user_id = ?;

SELECT users.*
FROM users
JOIN user_followed_users ON user_followed_users.user_id = users.id
WHERE user_followed_users.followed_user_id = ?;

SELECT posts.*
FROM posts
WHERE posts.authored_by_user_id = ?;

SELECT comments.*
FROM comments
WHERE comments.authored_by_user_id = ?;

SELECT posts.*
FROM posts
JOIN users ON users.id = posts.authored_by_user_id
JOIN user_followed_users ON user_followed_users.followed_user_id = users.id
WHERE user_followed_users.user_id = ?;

SELECT users.*
FROM users
WHERE users.id = ?;

SELECT comments.*
FROM comments
WHERE comments.inspired_by_post_id = ?;

SELECT users.*
FROM users
WHERE users.id = ?;

SELECT posts.*
FROM posts
WHERE posts.id = ?;
