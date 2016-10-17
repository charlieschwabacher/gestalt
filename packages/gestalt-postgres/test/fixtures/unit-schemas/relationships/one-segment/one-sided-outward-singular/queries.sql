SELECT posts.* FROM posts WHERE posts.id = ANY ($1);
