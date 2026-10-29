CREATE TABLE IF NOT EXISTS student_applications (
  user_id INT NOT NULL,
  registration_code VARCHAR(32) NOT NULL,
  application_status ENUM('draft', 'submitted', 'revision', 'verified') NOT NULL DEFAULT 'draft',
  selection_status ENUM('not_started', 'scheduled', 'passed', 'failed') NOT NULL DEFAULT 'not_started',
  final_status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_student_application_code (registration_code),
  CONSTRAINT fk_student_applications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_documents (
  user_id INT NOT NULL,
  document_type VARCHAR(40) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_data MEDIUMBLOB NOT NULL,
  verification_status ENUM('pending', 'verified', 'revision') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(500) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (user_id, document_type),
  CONSTRAINT fk_student_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_payments (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount INT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  proof_data MEDIUMBLOB NOT NULL,
  payment_status ENUM('pending', 'paid', 'rejected') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_student_payments_user_created (user_id, created_at),
  CONSTRAINT fk_student_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);