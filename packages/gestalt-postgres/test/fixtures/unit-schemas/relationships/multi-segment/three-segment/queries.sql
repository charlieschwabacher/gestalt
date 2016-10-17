SELECT comments.* FROM comments
  JOIN posts ON posts.id = comments.inspired_by_post_id
  JOIN user_followed_pages ON user_followed_pages.followed_page_id = posts.made_by_page_id
  WHERE user_followed_pages.user_id = ANY ($1);
SELECT users.* FROM users
  JOIN user_followed_pages ON user_followed_pages.user_id = users.id
  JOIN posts ON posts.made_by_page_id = user_followed_pages.followed_page_id
  WHERE posts.id = ANY ($1);
