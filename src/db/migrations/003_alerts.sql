CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  area_type ENUM('city','governorate','bbox') NOT NULL,
  area_value JSON NOT NULL,
  incident_category VARCHAR(50) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_alert_sub_user (user_id),
  INDEX idx_alert_sub_active (is_active),
  CONSTRAINT fk_alert_sub_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  subscription_id BIGINT NOT NULL,
  incident_id BIGINT NOT NULL,
  status ENUM('created','sent','failed') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_alerts_sub (subscription_id),
  INDEX idx_alerts_incident (incident_id),
  INDEX idx_alerts_status (status),
  CONSTRAINT fk_alerts_sub
    FOREIGN KEY (subscription_id) REFERENCES alert_subscriptions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
