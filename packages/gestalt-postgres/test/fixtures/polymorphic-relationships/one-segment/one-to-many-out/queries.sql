SELECT * FROM images WHERE depicted_subject_type = 'users' AND depicted_subject_id = $1;
SELECT * FROM images WHERE depicted_subject_type = 'posts' AND depicted_subject_id = $1;
SELECT * FROM users WHERE id = $1;
