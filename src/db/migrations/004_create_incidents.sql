CREATE TABLE IF NOT EXISTS incidents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    checkpoint_id BIGINT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    type ENUM('closure','delay','accident','weather_hazard','other') NOT NULL,
    severity ENUM('low','medium','high','critical') NOT NULL,

    status ENUM('open','verified','closed') NOT NULL DEFAULT 'open',

    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,

    created_by BIGINT NOT NULL,
    verified_by BIGINT NULL,
    closed_by BIGINT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_checkpoint
        FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_incident_creator
        FOREIGN KEY (created_by) REFERENCES users(id),

    CONSTRAINT fk_incident_verifier
        FOREIGN KEY (verified_by) REFERENCES users(id),

    CONSTRAINT fk_incident_closer
        FOREIGN KEY (closed_by) REFERENCES users(id),

    INDEX idx_incident_status (status),
    INDEX idx_incident_type (type),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_checkpoint (checkpoint_id),
    INDEX idx_incident_created (created_at)
);