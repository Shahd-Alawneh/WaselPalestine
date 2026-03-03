CREATE TABLE IF NOT EXISTS checkpoint_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    checkpoint_id BIGINT NOT NULL,
    status ENUM('open','closed','delayed','hazard','unknown') NOT NULL,
    note TEXT NULL,
    changed_by BIGINT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_checkpoint_status 
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_checkpoint_user
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_checkpoint_history (checkpoint_id, changed_at DESC)
);