CREATE TABLE IF NOT EXISTS audit_actions (
    audit_action_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    action_code VARCHAR(64) NOT NULL,
    PRIMARY KEY (audit_action_id),
    UNIQUE KEY unique_audit_actions_code (action_code)
);

INSERT IGNORE INTO audit_actions (action_code) VALUES
    ('auth.register'),
    ('auth.login.start'),
    ('auth.login.success'),
    ('auth.login.failure'),
    ('auth.login.mfa_required'),
    ('auth.logout'),
    ('auth.refresh_token_reuse'),
    ('permission.denied'),
    ('role.assign'),
    ('role.revoke'),
    ('role.permission.grant'),
    ('role.permission.revoke'),
    ('schedule.static.create'),
    ('schedule.static.update'),
    ('schedule.static.delete');

CREATE TABLE IF NOT EXISTS audit_log (
    audit_log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_action_id INT UNSIGNED NOT NULL,
    actor_type_id INT UNSIGNED NOT NULL,
    actor_user_id INT UNSIGNED NULL,
    target_type VARCHAR(64) NULL,
    target_id VARCHAR(64) NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    old_value_json JSON NULL,
    new_value_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (audit_log_id),
    KEY index_audit_log_created (created_at),
    KEY index_audit_log_actor (actor_user_id, audit_log_id),
    KEY index_audit_log_action (audit_action_id, audit_log_id),
    KEY index_audit_log_target (target_type, target_id)
);
