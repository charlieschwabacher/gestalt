SELECT images.* FROM images
  JOIN profiles ON profiles.depicted_by_image_id = images.id
  WHERE profiles.created_by_user_id = ANY ($1);
SELECT users.* FROM users
  JOIN profiles ON profiles.created_by_user_id = users.id
  WHERE profiles.depicted_by_image_id = ANY ($1);
