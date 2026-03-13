CREATE TABLE IF NOT EXISTS incident_updates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT NOT NULL,
    action ENUM('created','updated','verified','closed') NOT NULL,
    actor_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_update_incident
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_update_actor
        FOREIGN KEY (actor_id) REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_incident_updates (incident_id, created_at DESC)
);