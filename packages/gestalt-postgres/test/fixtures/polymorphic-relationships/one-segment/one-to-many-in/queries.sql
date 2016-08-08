SELECT * FROM images WHERE inspired_by_subject_type = 'users' AND inspired_by_subject_id = $1;
SELECT * FROM images WHERE inspired_by_subject_type = 'posts' AND inspired_by_subject_id = $1;
SELECT * FROM users WHERE id = $1;
