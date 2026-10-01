INSERT INTO
    user_statuses (status_code)
VALUES ('pending'),
    ('active'),
    ('disabled'),
    ('locked'),
    ('deleted')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    identifier_types (type_code)
VALUES ('email'),
    ('username'),
    ('phone')
ON DUPLICATE KEY UPDATE
    type_code = VALUES(type_code);

INSERT INTO
    preference_data_types (type_code)
VALUES ('string'),
    ('boolean'),
    ('integer'),
    ('json')
ON DUPLICATE KEY UPDATE
    type_code = VALUES(type_code);

INSERT INTO
    auth_method_categories (category_code)
VALUES ('primary'),
    ('second_factor'),
    ('recovery')
ON DUPLICATE KEY UPDATE
    category_code = VALUES(category_code);

INSERT INTO
    user_auth_method_statuses (status_code)
VALUES ('active'),
    ('disabled'),
    ('revoked')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    credential_statuses (status_code)
VALUES ('pending'),
    ('active'),
    ('revoked')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    authenticator_attachments (attachment_code)
VALUES ('platform'),
    ('cross_platform')
ON DUPLICATE KEY UPDATE
    attachment_code = VALUES(attachment_code);

INSERT INTO
    transport_types (transport_code)
VALUES ('usb'),
    ('nfc'),
    ('ble'),
    ('internal'),
    ('hybrid')
ON DUPLICATE KEY UPDATE
    transport_code = VALUES(transport_code);

INSERT INTO
    totp_algorithms (algorithm_code)
VALUES ('SHA1'),
    ('SHA256'),
    ('SHA512')
ON DUPLICATE KEY UPDATE
    algorithm_code = VALUES(algorithm_code);

INSERT INTO
    platforms (platform_code)
VALUES ('ios'),
    ('android'),
    ('web'),
    ('desktop'),
    ('other')
ON DUPLICATE KEY UPDATE
    platform_code = VALUES(platform_code);

INSERT INTO
    location_sources (source_code)
VALUES ('ip_geolocation'),
    ('gps'),
    ('user_provided')
ON DUPLICATE KEY UPDATE
    source_code = VALUES(source_code);

INSERT INTO
    session_statuses (status_code)
VALUES ('active'),
    ('revoked'),
    ('expired')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    refresh_token_statuses (status_code)
VALUES ('active'),
    ('rotated'),
    ('revoked'),
    ('reuse_detected')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    login_attempt_statuses (status_code)
VALUES ('pending'),
    ('mfa_pending'),
    ('completed'),
    ('failed'),
    ('expired'),
    ('cancelled')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    login_attempt_step_statuses (status_code)
VALUES ('pending'),
    ('succeeded'),
    ('failed')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    actor_types (actor_type_code)
VALUES ('user'),
    ('system'),
    ('admin')
ON DUPLICATE KEY UPDATE
    actor_type_code = VALUES(actor_type_code);

INSERT INTO
    auth_methods (
        method_code,
        display_name,
        auth_method_category_id,
        is_phishing_resistant
    )
SELECT 'password', 'Password', auth_method_category_id, FALSE
FROM auth_method_categories
WHERE
    category_code = 'primary'
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO
    auth_methods (
        method_code,
        display_name,
        auth_method_category_id,
        is_phishing_resistant
    )
SELECT 'webauthn', 'Passkey / Security Key', auth_method_category_id, TRUE
FROM auth_method_categories
WHERE
    category_code = 'primary'
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO
    auth_methods (
        method_code,
        display_name,
        auth_method_category_id,
        is_phishing_resistant
    )
SELECT 'totp', 'Authenticator App (TOTP)', auth_method_category_id, FALSE
FROM auth_method_categories
WHERE
    category_code = 'second_factor'
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO
    auth_methods (
        method_code,
        display_name,
        auth_method_category_id,
        is_phishing_resistant
    )
SELECT 'oauth_google', 'Google Sign-In', auth_method_category_id, FALSE
FROM auth_method_categories
WHERE
    category_code = 'primary'
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO
    auth_methods (
        method_code,
        display_name,
        auth_method_category_id,
        is_phishing_resistant
    )
SELECT 'recovery_code', 'Recovery Code', auth_method_category_id, FALSE
FROM auth_method_categories
WHERE
    category_code = 'recovery'
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name);

INSERT INTO
    global_auth_policy (
        global_auth_policy_id,
        password_login_enabled_by_default,
        mfa_required_by_default,
        require_phishing_resistant_factor
    )
VALUES (1, TRUE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE
    password_login_enabled_by_default = VALUES(
        password_login_enabled_by_default
    ),
    mfa_required_by_default = VALUES(mfa_required_by_default),
    require_phishing_resistant_factor = VALUES(
        require_phishing_resistant_factor
    );

INSERT INTO
    auth_method_global_settings (
        auth_method_id,
        is_enabled_globally,
        allowed_as_sole_factor
    )
SELECT auth_methods.auth_method_id, TRUE, auth_method_categories.category_code = 'primary'
FROM
    auth_methods
    INNER JOIN auth_method_categories ON auth_method_categories.auth_method_category_id = auth_methods.auth_method_category_id
ON DUPLICATE KEY UPDATE
    is_enabled_globally = VALUES(is_enabled_globally),
    allowed_as_sole_factor = VALUES(allowed_as_sole_factor);

INSERT INTO
    preference_definitions (
        preference_key,
        preference_data_type_id,
        default_value_json,
        description
    )
SELECT 'display_name', preference_data_type_id, NULL, 'Nazwa użytkownika.'
FROM preference_data_types
WHERE
    type_code = 'string'
ON DUPLICATE KEY UPDATE
    description = VALUES(description);