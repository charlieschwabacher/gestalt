SELECT images.* FROM images
  JOIN profiles ON profiles.id = images.uploaded_by_profile_id
  WHERE profiles.created_by_user_id = ANY ($1);
SELECT users.* FROM users
  JOIN profiles ON profiles.created_by_user_id = users.id
  WHERE profiles.id = ANY ($1);
