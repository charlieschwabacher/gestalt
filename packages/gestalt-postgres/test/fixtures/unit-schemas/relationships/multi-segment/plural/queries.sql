SELECT posts.* FROM posts
  JOIN user_authored_posts ON user_authored_posts.authored_post_id = posts.id
  JOIN user_followed_users ON user_followed_users.followed_user_id = user_authored_posts.user_id
  WHERE user_followed_users.user_id = ANY ($1);
SELECT users.* FROM users
  JOIN user_followed_users ON user_followed_users.user_id = users.id
  JOIN user_authored_posts ON user_authored_posts.user_id = user_followed_users.followed_user_id
  WHERE user_authored_posts.authored_post_id = ANY ($1);
