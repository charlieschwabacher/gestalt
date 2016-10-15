SELECT images.* FROM images WHERE inspired_by_subject_type = 'User' AND inspired_by_subject_id = ANY ($1);
SELECT images.* FROM images WHERE inspired_by_subject_type = 'Post' AND inspired_by_subject_id = ANY ($1);
SELECT users.* FROM users WHERE users.id = ANY ($1);
