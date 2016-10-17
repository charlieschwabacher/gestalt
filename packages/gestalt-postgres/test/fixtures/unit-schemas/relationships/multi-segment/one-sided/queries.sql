SELECT posts.* FROM posts
  JOIN page_authored_posts ON page_authored_posts.authored_post_id = posts.id
  JOIN user_followed_pages ON user_followed_pages.followed_page_id = page_authored_posts.page_id
  WHERE user_followed_pages.user_id = ANY ($1);
