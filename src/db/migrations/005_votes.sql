-- 005_votes.sql
CREATE TABLE IF NOT EXISTS votes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  report_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  value TINYINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_votes_report_user (report_id, user_id),
  INDEX idx_votes_report (report_id),
  CONSTRAINT chk_votes_value CHECK (value IN (-1, 1)),
  CONSTRAINT fk_votes_report
    FOREIGN KEY (report_id) REFERENCES reports(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_votes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
