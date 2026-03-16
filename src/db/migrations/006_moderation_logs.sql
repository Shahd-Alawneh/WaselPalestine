-- 006_moderation_logs.sql
CREATE TABLE IF NOT EXISTS moderation_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT NOT NULL,
  action ENUM('APPROVE','REJECT','MERGE','MARK_SPAM','CLOSE') NOT NULL,
  target_type ENUM('REPORT') NOT NULL,
  target_id BIGINT NOT NULL,
  reason TEXT NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_moderation_target (target_type, target_id),
  CONSTRAINT fk_moderation_logs_actor_user
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
