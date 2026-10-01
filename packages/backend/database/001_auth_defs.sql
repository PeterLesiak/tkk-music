CREATE TABLE IF NOT EXISTS user_statuses (
    user_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_status_id),
    UNIQUE KEY unique_user_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS identifier_types (
    identifier_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (identifier_type_id),
    UNIQUE KEY unique_identifier_types_code (type_code)
);

CREATE TABLE IF NOT EXISTS preference_data_types (
    preference_data_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    type_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (preference_data_type_id),
    UNIQUE KEY unique_preference_data_types_code (type_code)
);

CREATE TABLE IF NOT EXISTS auth_method_categories (
    auth_method_category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (auth_method_category_id),
    UNIQUE KEY unique_auth_method_categories_code (category_code)
);

CREATE TABLE IF NOT EXISTS user_auth_method_statuses (
    user_auth_method_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_auth_method_status_id),
    UNIQUE KEY unique_user_auth_method_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS credential_statuses (
    credential_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (credential_status_id),
    UNIQUE KEY unique_credential_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS authenticator_attachments (
    authenticator_attachment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    attachment_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (authenticator_attachment_id),
    UNIQUE KEY unique_authenticator_attachments_code (attachment_code)
);

CREATE TABLE IF NOT EXISTS transport_types (
    transport_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    transport_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (transport_type_id),
    UNIQUE KEY unique_transport_types_code (transport_code)
);

CREATE TABLE IF NOT EXISTS totp_algorithms (
    totp_algorithm_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    algorithm_code VARCHAR(16) NOT NULL,
    PRIMARY KEY (totp_algorithm_id),
    UNIQUE KEY unique_totp_algorithms_code (algorithm_code)
);

CREATE TABLE IF NOT EXISTS platforms (
    platform_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    platform_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (platform_id),
    UNIQUE KEY unique_platforms_code (platform_code)
);

CREATE TABLE IF NOT EXISTS location_sources (
    location_source_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (location_source_id),
    UNIQUE KEY unique_location_sources_code (source_code)
);

CREATE TABLE IF NOT EXISTS session_statuses (
    session_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (session_status_id),
    UNIQUE KEY unique_session_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS refresh_token_statuses (
    refresh_token_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (refresh_token_status_id),
    UNIQUE KEY unique_refresh_token_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS login_attempt_statuses (
    login_attempt_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (login_attempt_status_id),
    UNIQUE KEY unique_login_attempt_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS login_attempt_step_statuses (
    login_attempt_step_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (login_attempt_step_status_id),
    UNIQUE KEY unique_login_attempt_step_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS actor_types (
    actor_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_type_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (actor_type_id),
    UNIQUE KEY unique_actor_types_code (actor_type_code)
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    user_status_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    disabled_at DATETIME(6) NULL,
    locked_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY unique_users_public_id (public_id)
);

CREATE TABLE IF NOT EXISTS user_login_identifiers (
    login_identifier_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    identifier_type_id INT UNSIGNED NOT NULL,
    identifier_value VARCHAR(320) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    retired_at DATETIME(6) NULL,
    PRIMARY KEY (login_identifier_id),
    UNIQUE KEY unique_login_identifier_type_value (
        identifier_type_id,
        identifier_value
    ),
    KEY index_login_identifiers_user (user_id)
);

CREATE TABLE IF NOT EXISTS preference_definitions (
    preference_definition_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    preference_key VARCHAR(128) NOT NULL,
    preference_data_type_id INT UNSIGNED NOT NULL,
    default_value_json JSON NULL,
    description VARCHAR(512) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (preference_definition_id),
    UNIQUE KEY unique_preference_key (preference_key)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_preference_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    preference_definition_id INT UNSIGNED NOT NULL,
    value_json JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_preference_id),
    UNIQUE KEY unique_user_preference (
        user_id,
        preference_definition_id
    )
);

CREATE TABLE IF NOT EXISTS auth_methods (
    auth_method_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    method_code VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    auth_method_category_id INT UNSIGNED NOT NULL,
    is_phishing_resistant BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (auth_method_id),
    UNIQUE KEY unique_auth_method_code (method_code)
);

CREATE TABLE IF NOT EXISTS user_auth_methods (
    user_auth_method_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    auth_method_id INT UNSIGNED NOT NULL,
    user_auth_method_status_id INT UNSIGNED NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    enrolled_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    disabled_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (user_auth_method_id),
    UNIQUE KEY unique_user_auth_method (user_id, auth_method_id)
);

CREATE TABLE IF NOT EXISTS password_credentials (
    password_credential_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    user_auth_method_id INT UNSIGNED NOT NULL,
    argon2id_hash VARBINARY(512) NOT NULL,
    must_change_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (password_credential_id),
    UNIQUE KEY unique_password_credential_user (user_id)
);

CREATE TABLE IF NOT EXISTS webauthn_credentials (
    webauthn_credential_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    user_auth_method_id INT UNSIGNED NOT NULL,
    credential_id VARBINARY(1024) NOT NULL,
    public_key VARBINARY(1024) NOT NULL,
    sign_count INT UNSIGNED NOT NULL DEFAULT 0,
    aaguid BINARY(16) NULL,
    authenticator_attachment_id INT UNSIGNED NULL,
    backup_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    backup_state BOOLEAN NOT NULL DEFAULT FALSE,
    display_name VARCHAR(128) NULL,
    registered_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_used_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (webauthn_credential_id),
    UNIQUE KEY unique_webauthn_credential_id (credential_id (255)),
    KEY index_webauthn_credentials_user (user_id)
);

CREATE TABLE IF NOT EXISTS webauthn_credential_transports (
    webauthn_credential_id INT UNSIGNED NOT NULL,
    transport_type_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (
        webauthn_credential_id,
        transport_type_id
    )
);

CREATE TABLE IF NOT EXISTS oauth_identities (
    oauth_identity_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    user_auth_method_id INT UNSIGNED NOT NULL,
    provider VARCHAR(64) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    email VARCHAR(320) NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE, -- pytanie czy to poczebne? maila mamy na domenie tkk jak cos
    linked_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_used_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (oauth_identity_id),
    UNIQUE KEY unique_oauth_issuer_subject (issuer, subject),
    KEY index_oauth_identities_user (user_id)
);

CREATE TABLE IF NOT EXISTS totp_credentials (
    totp_credential_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    user_auth_method_id INT UNSIGNED NOT NULL,
    encrypted_secret VARBINARY(512) NOT NULL,
    kms_key_identifier VARCHAR(255) NOT NULL,
    totp_algorithm_id INT UNSIGNED NOT NULL,
    digits TINYINT UNSIGNED NOT NULL DEFAULT 6,
    period_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    label VARCHAR(128) NULL,
    credential_status_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    confirmed_at DATETIME(6) NULL,
    last_used_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (totp_credential_id),
    KEY index_totp_credentials_user (user_id)
);

CREATE TABLE IF NOT EXISTS recovery_codes (
    recovery_code_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    user_auth_method_id INT UNSIGNED NOT NULL,
    code_hash BINARY(32) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    used_at DATETIME(6) NULL,
    PRIMARY KEY (recovery_code_id),
    UNIQUE KEY unique_recovery_code_hash (code_hash),
    KEY index_recovery_codes_user (user_id)
);

CREATE TABLE IF NOT EXISTS global_auth_policy (
    global_auth_policy_id TINYINT UNSIGNED NOT NULL,
    password_login_enabled_by_default BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_required_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    require_phishing_resistant_factor BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (global_auth_policy_id),
    CONSTRAINT check_global_auth_policy_singleton CHECK (global_auth_policy_id = 1)
);

CREATE TABLE IF NOT EXISTS auth_method_global_settings (
    auth_method_id INT UNSIGNED NOT NULL,
    is_enabled_globally BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_as_sole_factor BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (auth_method_id)
);

CREATE TABLE IF NOT EXISTS user_auth_policies (
    user_id INT UNSIGNED NOT NULL,
    password_login_enabled BOOLEAN NULL,
    mfa_required BOOLEAN NULL,
    require_phishing_resistant_factor BOOLEAN NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS devices (
    device_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    user_id INT UNSIGNED NULL,
    device_token_hash BINARY(32) NOT NULL,
    display_name VARCHAR(128) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (device_id),
    UNIQUE KEY unique_devices_public_id (public_id),
    UNIQUE KEY unique_devices_token_hash (device_token_hash),
    KEY index_devices_user (user_id)
);

CREATE TABLE IF NOT EXISTS device_webauthn_credentials (
    device_id INT UNSIGNED NOT NULL,
    webauthn_credential_id INT UNSIGNED NOT NULL,
    associated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (
        device_id,
        webauthn_credential_id
    )
);

CREATE TABLE IF NOT EXISTS device_client_profiles (
    device_client_profile_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id INT UNSIGNED NOT NULL,
    platform_id INT UNSIGNED NOT NULL,
    operating_system VARCHAR(64) NULL,
    operating_system_version VARCHAR(64) NULL,
    application_version VARCHAR(64) NULL,
    browser_family VARCHAR(64) NULL,
    browser_version VARCHAR(64) NULL,
    device_model VARCHAR(128) NULL,
    first_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (device_client_profile_id),
    KEY index_device_client_profiles_device (device_id),
    KEY index_device_client_profiles_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS device_ip_observations (
    device_ip_observation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id INT UNSIGNED NOT NULL,
    ip_address VARBINARY(16) NOT NULL,
    ip_version TINYINT UNSIGNED NOT NULL,
    autonomous_system_number INT UNSIGNED NULL,
    was_forwarded BOOLEAN NOT NULL DEFAULT FALSE,
    first_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (
        device_ip_observation_id,
        expires_at
    ),
    UNIQUE KEY unique_device_ip (
        device_id,
        ip_address,
        expires_at
    ),
    KEY index_device_ip_observations_expires (expires_at)
)
PARTITION BY
    RANGE (TO_DAYS(expires_at)) (
        PARTITION p_before
        VALUES
            LESS THAN (TO_DAYS('2026-09-01')),
            PARTITION p2026_09
        VALUES
            LESS THAN (TO_DAYS('2026-10-01')),
            PARTITION p2026_10
        VALUES
            LESS THAN (TO_DAYS('2026-11-01')),
            PARTITION p2026_11
        VALUES
            LESS THAN (TO_DAYS('2026-12-01')),
            PARTITION p2026_12
        VALUES
            LESS THAN (TO_DAYS('2027-01-01')),
            PARTITION p2027_01
        VALUES
            LESS THAN (TO_DAYS('2027-02-01')),
            PARTITION p2027_02
        VALUES
            LESS THAN (TO_DAYS('2027-03-01')),
            PARTITION p2027_03
        VALUES
            LESS THAN (TO_DAYS('2027-04-01')),
            PARTITION p2027_04
        VALUES
            LESS THAN (TO_DAYS('2027-05-01')),
            PARTITION p2027_05
        VALUES
            LESS THAN (TO_DAYS('2027-06-01')),
            PARTITION p2027_06
        VALUES
            LESS THAN (TO_DAYS('2027-07-01')),
            PARTITION p2027_07
        VALUES
            LESS THAN (TO_DAYS('2027-08-01')),
            PARTITION p2027_08
        VALUES
            LESS THAN (TO_DAYS('2027-09-01')),
            PARTITION p2027_09
        VALUES
            LESS THAN (TO_DAYS('2027-10-01')),
            PARTITION p2027_10
        VALUES
            LESS THAN (TO_DAYS('2027-11-01')),
            PARTITION p2027_11
        VALUES
            LESS THAN (TO_DAYS('2027-12-01')),
            PARTITION p2027_12
        VALUES
            LESS THAN (TO_DAYS('2028-01-01')),
            PARTITION p2028_01
        VALUES
            LESS THAN (TO_DAYS('2028-02-01')),
            PARTITION p2028_02
        VALUES
            LESS THAN (TO_DAYS('2028-03-01')),
            PARTITION p2028_03
        VALUES
            LESS THAN (TO_DAYS('2028-04-01')),
            PARTITION p2028_04
        VALUES
            LESS THAN (TO_DAYS('2028-05-01')),
            PARTITION p2028_05
        VALUES
            LESS THAN (TO_DAYS('2028-06-01')),
            PARTITION p2028_06
        VALUES
            LESS THAN (TO_DAYS('2028-07-01')),
            PARTITION p2028_07
        VALUES
            LESS THAN (TO_DAYS('2028-08-01')),
            PARTITION p2028_08
        VALUES
            LESS THAN (TO_DAYS('2028-09-01')),
            PARTITION p2028_09
        VALUES
            LESS THAN (TO_DAYS('2028-10-01')),
            PARTITION p2028_10
        VALUES
            LESS THAN (TO_DAYS('2028-11-01')),
            PARTITION p2028_11
        VALUES
            LESS THAN (TO_DAYS('2028-12-01')),
            PARTITION p2028_12
        VALUES
            LESS THAN (TO_DAYS('2029-01-01')),
            PARTITION p_future
        VALUES
            LESS THAN (MAXVALUE)
    );

CREATE TABLE IF NOT EXISTS device_location_observations (
    device_location_observation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id INT UNSIGNED NOT NULL,
    location_source_id INT UNSIGNED NOT NULL,
    country_code CHAR(2) NULL,
    region VARCHAR(128) NULL,
    city VARCHAR(128) NULL,
    latitude DECIMAL(9, 6) NULL,
    longitude DECIMAL(9, 6) NULL,
    confidence TINYINT UNSIGNED NULL,
    observed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (
        device_location_observation_id,
        expires_at
    ),
    KEY index_device_location_observations_device (device_id),
    KEY index_device_location_observations_expires (expires_at)
)
PARTITION BY
    RANGE (TO_DAYS(expires_at)) (
        PARTITION p_before
        VALUES
            LESS THAN (TO_DAYS('2026-09-01')),
            PARTITION p2026_09
        VALUES
            LESS THAN (TO_DAYS('2026-10-01')),
            PARTITION p2026_10
        VALUES
            LESS THAN (TO_DAYS('2026-11-01')),
            PARTITION p2026_11
        VALUES
            LESS THAN (TO_DAYS('2026-12-01')),
            PARTITION p2026_12
        VALUES
            LESS THAN (TO_DAYS('2027-01-01')),
            PARTITION p2027_01
        VALUES
            LESS THAN (TO_DAYS('2027-02-01')),
            PARTITION p2027_02
        VALUES
            LESS THAN (TO_DAYS('2027-03-01')),
            PARTITION p2027_03
        VALUES
            LESS THAN (TO_DAYS('2027-04-01')),
            PARTITION p2027_04
        VALUES
            LESS THAN (TO_DAYS('2027-05-01')),
            PARTITION p2027_05
        VALUES
            LESS THAN (TO_DAYS('2027-06-01')),
            PARTITION p2027_06
        VALUES
            LESS THAN (TO_DAYS('2027-07-01')),
            PARTITION p2027_07
        VALUES
            LESS THAN (TO_DAYS('2027-08-01')),
            PARTITION p2027_08
        VALUES
            LESS THAN (TO_DAYS('2027-09-01')),
            PARTITION p2027_09
        VALUES
            LESS THAN (TO_DAYS('2027-10-01')),
            PARTITION p2027_10
        VALUES
            LESS THAN (TO_DAYS('2027-11-01')),
            PARTITION p2027_11
        VALUES
            LESS THAN (TO_DAYS('2027-12-01')),
            PARTITION p2027_12
        VALUES
            LESS THAN (TO_DAYS('2028-01-01')),
            PARTITION p2028_01
        VALUES
            LESS THAN (TO_DAYS('2028-02-01')),
            PARTITION p2028_02
        VALUES
            LESS THAN (TO_DAYS('2028-03-01')),
            PARTITION p2028_03
        VALUES
            LESS THAN (TO_DAYS('2028-04-01')),
            PARTITION p2028_04
        VALUES
            LESS THAN (TO_DAYS('2028-05-01')),
            PARTITION p2028_05
        VALUES
            LESS THAN (TO_DAYS('2028-06-01')),
            PARTITION p2028_06
        VALUES
            LESS THAN (TO_DAYS('2028-07-01')),
            PARTITION p2028_07
        VALUES
            LESS THAN (TO_DAYS('2028-08-01')),
            PARTITION p2028_08
        VALUES
            LESS THAN (TO_DAYS('2028-09-01')),
            PARTITION p2028_09
        VALUES
            LESS THAN (TO_DAYS('2028-10-01')),
            PARTITION p2028_10
        VALUES
            LESS THAN (TO_DAYS('2028-11-01')),
            PARTITION p2028_11
        VALUES
            LESS THAN (TO_DAYS('2028-12-01')),
            PARTITION p2028_12
        VALUES
            LESS THAN (TO_DAYS('2029-01-01')),
            PARTITION p_future
        VALUES
            LESS THAN (MAXVALUE)
    );

CREATE TABLE IF NOT EXISTS device_user_agent_observations (
    device_user_agent_observation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id INT UNSIGNED NOT NULL,
    user_agent VARCHAR(1024) NOT NULL,
    first_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (
        device_user_agent_observation_id,
        expires_at
    ),
    UNIQUE KEY unique_device_user_agent (
        device_id,
        user_agent (255),
        expires_at
    ),
    KEY index_device_user_agent_observations_expires (expires_at)
)
PARTITION BY
    RANGE (TO_DAYS(expires_at)) (
        PARTITION p_before
        VALUES
            LESS THAN (TO_DAYS('2026-09-01')),
            PARTITION p2026_09
        VALUES
            LESS THAN (TO_DAYS('2026-10-01')),
            PARTITION p2026_10
        VALUES
            LESS THAN (TO_DAYS('2026-11-01')),
            PARTITION p2026_11
        VALUES
            LESS THAN (TO_DAYS('2026-12-01')),
            PARTITION p2026_12
        VALUES
            LESS THAN (TO_DAYS('2027-01-01')),
            PARTITION p2027_01
        VALUES
            LESS THAN (TO_DAYS('2027-02-01')),
            PARTITION p2027_02
        VALUES
            LESS THAN (TO_DAYS('2027-03-01')),
            PARTITION p2027_03
        VALUES
            LESS THAN (TO_DAYS('2027-04-01')),
            PARTITION p2027_04
        VALUES
            LESS THAN (TO_DAYS('2027-05-01')),
            PARTITION p2027_05
        VALUES
            LESS THAN (TO_DAYS('2027-06-01')),
            PARTITION p2027_06
        VALUES
            LESS THAN (TO_DAYS('2027-07-01')),
            PARTITION p2027_07
        VALUES
            LESS THAN (TO_DAYS('2027-08-01')),
            PARTITION p2027_08
        VALUES
            LESS THAN (TO_DAYS('2027-09-01')),
            PARTITION p2027_09
        VALUES
            LESS THAN (TO_DAYS('2027-10-01')),
            PARTITION p2027_10
        VALUES
            LESS THAN (TO_DAYS('2027-11-01')),
            PARTITION p2027_11
        VALUES
            LESS THAN (TO_DAYS('2027-12-01')),
            PARTITION p2027_12
        VALUES
            LESS THAN (TO_DAYS('2028-01-01')),
            PARTITION p2028_01
        VALUES
            LESS THAN (TO_DAYS('2028-02-01')),
            PARTITION p2028_02
        VALUES
            LESS THAN (TO_DAYS('2028-03-01')),
            PARTITION p2028_03
        VALUES
            LESS THAN (TO_DAYS('2028-04-01')),
            PARTITION p2028_04
        VALUES
            LESS THAN (TO_DAYS('2028-05-01')),
            PARTITION p2028_05
        VALUES
            LESS THAN (TO_DAYS('2028-06-01')),
            PARTITION p2028_06
        VALUES
            LESS THAN (TO_DAYS('2028-07-01')),
            PARTITION p2028_07
        VALUES
            LESS THAN (TO_DAYS('2028-08-01')),
            PARTITION p2028_08
        VALUES
            LESS THAN (TO_DAYS('2028-09-01')),
            PARTITION p2028_09
        VALUES
            LESS THAN (TO_DAYS('2028-10-01')),
            PARTITION p2028_10
        VALUES
            LESS THAN (TO_DAYS('2028-11-01')),
            PARTITION p2028_11
        VALUES
            LESS THAN (TO_DAYS('2028-12-01')),
            PARTITION p2028_12
        VALUES
            LESS THAN (TO_DAYS('2029-01-01')),
            PARTITION p_future
        VALUES
            LESS THAN (MAXVALUE)
    );

CREATE TABLE IF NOT EXISTS sessions (
    session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    device_id INT UNSIGNED NOT NULL,
    session_status_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_used_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    idle_expires_at DATETIME(6) NOT NULL,
    absolute_expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NULL,
    revoked_reason VARCHAR(255) NULL,
    PRIMARY KEY (session_id),
    UNIQUE KEY unique_sessions_public_id (public_id),
    KEY index_sessions_user (user_id),
    KEY index_sessions_device (device_id)
);

CREATE TABLE IF NOT EXISTS session_tokens (
    session_token_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    token_hash BINARY(32) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    last_used_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (session_token_id),
    UNIQUE KEY unique_session_token_hash (token_hash),
    KEY index_session_tokens_session (session_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    refresh_token_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    session_token_id BIGINT UNSIGNED NOT NULL,
    previous_refresh_token_id BIGINT UNSIGNED NULL,
    token_family_id BINARY(16) NOT NULL,
    token_hash BINARY(32) NOT NULL,
    refresh_token_status_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    rotated_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    PRIMARY KEY (refresh_token_id),
    UNIQUE KEY unique_refresh_token_hash (token_hash),
    UNIQUE KEY unique_refresh_token_session_token (session_token_id),
    KEY index_refresh_tokens_session (session_id),
    KEY index_refresh_tokens_family (token_family_id)
);

CREATE TABLE IF NOT EXISTS login_attempts (
    login_attempt_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    nonce_hash BINARY(32) NOT NULL,
    user_id INT UNSIGNED NULL,
    device_id INT UNSIGNED NULL,
    login_attempt_status_id INT UNSIGNED NOT NULL,
    current_auth_method_id INT UNSIGNED NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    PRIMARY KEY (login_attempt_id),
    UNIQUE KEY unique_login_attempts_public_id (public_id),
    UNIQUE KEY unique_login_attempts_nonce_hash (nonce_hash),
    KEY index_login_attempts_user (user_id),
    KEY index_login_attempts_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS login_attempt_steps (
    login_attempt_step_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    login_attempt_id BIGINT UNSIGNED NOT NULL,
    auth_method_id INT UNSIGNED NOT NULL,
    login_attempt_step_status_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    PRIMARY KEY (login_attempt_step_id),
    KEY index_login_attempt_steps_attempt (login_attempt_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    audit_event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NULL,
    actor_type_id INT UNSIGNED NOT NULL,
    event_category VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    device_id INT UNSIGNED NULL,
    session_id BIGINT UNSIGNED NULL,
    ip_address VARBINARY(16) NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (audit_event_id, created_at),
    KEY index_audit_events_user (user_id),
    KEY index_audit_events_created (created_at),
    KEY index_audit_events_category_type (event_category, event_type)
)
PARTITION BY
    RANGE (TO_DAYS(created_at)) (
        PARTITION p_before
        VALUES
            LESS THAN (TO_DAYS('2026-09-01')),
            PARTITION p2026_09
        VALUES
            LESS THAN (TO_DAYS('2026-10-01')),
            PARTITION p2026_10
        VALUES
            LESS THAN (TO_DAYS('2026-11-01')),
            PARTITION p2026_11
        VALUES
            LESS THAN (TO_DAYS('2026-12-01')),
            PARTITION p2026_12
        VALUES
            LESS THAN (TO_DAYS('2027-01-01')),
            PARTITION p2027_01
        VALUES
            LESS THAN (TO_DAYS('2027-02-01')),
            PARTITION p2027_02
        VALUES
            LESS THAN (TO_DAYS('2027-03-01')),
            PARTITION p2027_03
        VALUES
            LESS THAN (TO_DAYS('2027-04-01')),
            PARTITION p2027_04
        VALUES
            LESS THAN (TO_DAYS('2027-05-01')),
            PARTITION p2027_05
        VALUES
            LESS THAN (TO_DAYS('2027-06-01')),
            PARTITION p2027_06
        VALUES
            LESS THAN (TO_DAYS('2027-07-01')),
            PARTITION p2027_07
        VALUES
            LESS THAN (TO_DAYS('2027-08-01')),
            PARTITION p2027_08
        VALUES
            LESS THAN (TO_DAYS('2027-09-01')),
            PARTITION p2027_09
        VALUES
            LESS THAN (TO_DAYS('2027-10-01')),
            PARTITION p2027_10
        VALUES
            LESS THAN (TO_DAYS('2027-11-01')),
            PARTITION p2027_11
        VALUES
            LESS THAN (TO_DAYS('2027-12-01')),
            PARTITION p2027_12
        VALUES
            LESS THAN (TO_DAYS('2028-01-01')),
            PARTITION p2028_01
        VALUES
            LESS THAN (TO_DAYS('2028-02-01')),
            PARTITION p2028_02
        VALUES
            LESS THAN (TO_DAYS('2028-03-01')),
            PARTITION p2028_03
        VALUES
            LESS THAN (TO_DAYS('2028-04-01')),
            PARTITION p2028_04
        VALUES
            LESS THAN (TO_DAYS('2028-05-01')),
            PARTITION p2028_05
        VALUES
            LESS THAN (TO_DAYS('2028-06-01')),
            PARTITION p2028_06
        VALUES
            LESS THAN (TO_DAYS('2028-07-01')),
            PARTITION p2028_07
        VALUES
            LESS THAN (TO_DAYS('2028-08-01')),
            PARTITION p2028_08
        VALUES
            LESS THAN (TO_DAYS('2028-09-01')),
            PARTITION p2028_09
        VALUES
            LESS THAN (TO_DAYS('2028-10-01')),
            PARTITION p2028_10
        VALUES
            LESS THAN (TO_DAYS('2028-11-01')),
            PARTITION p2028_11
        VALUES
            LESS THAN (TO_DAYS('2028-12-01')),
            PARTITION p2028_12
        VALUES
            LESS THAN (TO_DAYS('2029-01-01')),
            PARTITION p_future
        VALUES
            LESS THAN (MAXVALUE)
    );