SELECT landscapes.*, still_lives.* FROM artwork_depicted_subjects
  LEFT JOIN landscapes ON
    artwork_depicted_subjects.depicted_subject_type = 'landscapes' AND
    landscapes.id = artwork_depicted_subjects.depicted_subject_id
  LEFT JOIN still_lives ON
    artwork_depicted_subjects.depicted_subject_type = 'still_lifes' AND
    still_lifes.id = artwork_depicted_subjects.depicted_subject_id
  WHERE
    artwork_depicted_subjects.artwork_id = $1 AND
    artwork_depicted_subjects.artwork_type = $2;
