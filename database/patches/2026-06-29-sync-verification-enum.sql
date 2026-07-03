USE ai_studyhub;

ALTER TABLE users
MODIFY COLUMN verification_status ENUM('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'UNVERIFIED';

ALTER TABLE student_verifications
MODIFY COLUMN status ENUM('UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING';

UPDATE users u
LEFT JOIN student_verifications sv ON sv.user_id = u.id
SET u.verification_status = 'UNVERIFIED'
WHERE u.verification_status = 'PENDING'
  AND sv.id IS NULL;
