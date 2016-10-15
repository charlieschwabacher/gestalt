SELECT images.* FROM images WHERE images.inspired_by_subject_type = 'User' AND images.inspired_by_subject_id = ANY ($1);
SELECT images.* FROM images WHERE images.inspired_by_subject_type = 'Post' AND images.inspired_by_subject_id = ANY ($1);
SELECT users.* FROM users WHERE users.id = ANY ($1);
