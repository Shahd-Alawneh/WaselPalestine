-- 004_reports.sql
CREATE TABLE IF NOT EXISTS reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  grid_key VARCHAR(50) NOT NULL,
  reported_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('PENDING','APPROVED','REJECTED','MERGED','SPAM') NOT NULL DEFAULT 'PENDING',
  duplicate_of_report_id BIGINT NULL,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  source_ip_hash VARCHAR(255) NULL,
  PRIMARY KEY (id),
  INDEX idx_reports_category_grid_time (category, grid_key, created_at),
  INDEX idx_reports_status (status),
  INDEX idx_reports_user (user_id),
  CONSTRAINT fk_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reports_duplicate_of
    FOREIGN KEY (duplicate_of_report_id) REFERENCES reports(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
