SELECT images.* FROM images WHERE depicted_subject_type = 'User' AND depicted_subject_id = ANY ($1);
SELECT images.* FROM images WHERE depicted_subject_type = 'Post' AND depicted_subject_id = ANY ($1);
SELECT users.* FROM users WHERE users.id = ANY ($1);
