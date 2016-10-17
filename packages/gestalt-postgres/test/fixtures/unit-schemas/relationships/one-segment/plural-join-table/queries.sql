SELECT posts.* FROM posts
  JOIN user_authored_posts ON user_authored_posts.authored_post_id = posts.id
  WHERE user_authored_posts.user_id = ANY ($1);
SELECT users.* FROM users
  JOIN user_authored_posts ON user_authored_posts.user_id = users.id
  WHERE user_authored_posts.authored_post_id = ANY ($1);
