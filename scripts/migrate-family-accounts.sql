-- Run after migrate-users.sql and migrate-student-dashboard.sql.
-- Existing student user IDs are retained as profile IDs so documents,
-- payments, and applications remain attached to the same students.
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NULL,
  ADD COLUMN phone VARCHAR(20) NULL,
  ADD UNIQUE KEY uq_users_phone (phone);

CREATE TABLE student_profiles (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  nama VARCHAR(255) NOT NULL,
  nisn VARCHAR(10) NOT NULL,
  jenjang VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_profiles_nisn (nisn),
  KEY ix_student_profiles_user (user_id),
  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO student_profiles (id, user_id, nama, nisn, jenjang)
SELECT id, id, nama, nisn, jenjang
FROM users
WHERE role = 'calon_siswa' AND nisn IS NOT NULL AND jenjang IS NOT NULL;

ALTER TABLE student_applications
  DROP FOREIGN KEY fk_student_applications_user,
  CHANGE COLUMN user_id student_id INT NOT NULL,
  ADD CONSTRAINT fk_student_applications_profile
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;

ALTER TABLE student_documents
  DROP FOREIGN KEY fk_student_documents_user,
  CHANGE COLUMN user_id student_id INT NOT NULL,
  ADD CONSTRAINT fk_student_documents_profile
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;

ALTER TABLE student_payments
  DROP FOREIGN KEY fk_student_payments_user,
  CHANGE COLUMN user_id student_id INT NOT NULL,
  ADD CONSTRAINT fk_student_payments_profile
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE;

CREATE TABLE announcements (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  author_user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_announcements_created (created_at),
  CONSTRAINT fk_announcements_author
    FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE RESTRICT
);
