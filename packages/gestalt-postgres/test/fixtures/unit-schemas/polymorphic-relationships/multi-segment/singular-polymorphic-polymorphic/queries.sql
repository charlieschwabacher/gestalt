SELECT landscapes.*, still_lives.* FROM artwork_depicted_subjects
  LEFT JOIN landscapes ON
    artwork_depicted_subjects.depicted_subject_type = 'Landscape' AND
    landscapes.id = artwork_depicted_subjects.depicted_subject_id
  LEFT JOIN still_lives ON
    artwork_depicted_subjects.depicted_subject_type = 'StillLife' AND
    still_lives.id = artwork_depicted_subjects.depicted_subject_id
  WHERE
    artwork_depicted_subjects.artwork_type = 'Photo' AND
    artwork_depicted_subjects.artwork_id = ANY ($1);
