ALTER TABLE users
ADD CONSTRAINT foreign_key_users_status FOREIGN KEY (user_status_id) REFERENCES user_statuses (user_status_id);

ALTER TABLE user_login_identifiers
ADD CONSTRAINT foreign_key_user_login_identifiers_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE user_login_identifiers
ADD CONSTRAINT foreign_key_user_login_identifiers_type FOREIGN KEY (identifier_type_id) REFERENCES identifier_types (identifier_type_id);

ALTER TABLE preference_definitions
ADD CONSTRAINT foreign_key_preference_definitions_data_type FOREIGN KEY (preference_data_type_id) REFERENCES preference_data_types (preference_data_type_id);

ALTER TABLE user_preferences
ADD CONSTRAINT foreign_key_user_preferences_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE user_preferences
ADD CONSTRAINT foreign_key_user_preferences_definition FOREIGN KEY (preference_definition_id) REFERENCES preference_definitions (preference_definition_id);

ALTER TABLE auth_methods
ADD CONSTRAINT foreign_key_auth_methods_category FOREIGN KEY (auth_method_category_id) REFERENCES auth_method_categories (auth_method_category_id);

ALTER TABLE user_auth_methods
ADD CONSTRAINT foreign_key_user_auth_methods_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE user_auth_methods
ADD CONSTRAINT foreign_key_user_auth_methods_method FOREIGN KEY (auth_method_id) REFERENCES auth_methods (auth_method_id);

ALTER TABLE user_auth_methods
ADD CONSTRAINT foreign_key_user_auth_methods_status FOREIGN KEY (user_auth_method_status_id) REFERENCES user_auth_method_statuses (user_auth_method_status_id);

ALTER TABLE password_credentials
ADD CONSTRAINT foreign_key_password_credentials_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE password_credentials
ADD CONSTRAINT foreign_key_password_credentials_user_auth_method FOREIGN KEY (user_auth_method_id) REFERENCES user_auth_methods (user_auth_method_id);

ALTER TABLE webauthn_credentials
ADD CONSTRAINT foreign_key_webauthn_credentials_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE webauthn_credentials
ADD CONSTRAINT foreign_key_webauthn_credentials_user_auth_method FOREIGN KEY (user_auth_method_id) REFERENCES user_auth_methods (user_auth_method_id);

ALTER TABLE webauthn_credentials
ADD CONSTRAINT foreign_key_webauthn_credentials_attachment FOREIGN KEY (authenticator_attachment_id) REFERENCES authenticator_attachments (authenticator_attachment_id);

ALTER TABLE webauthn_credential_transports
ADD CONSTRAINT foreign_key_webauthn_credential_transports_credential FOREIGN KEY (webauthn_credential_id) REFERENCES webauthn_credentials (webauthn_credential_id);

ALTER TABLE webauthn_credential_transports
ADD CONSTRAINT foreign_key_webauthn_credential_transports_type FOREIGN KEY (transport_type_id) REFERENCES transport_types (transport_type_id);

ALTER TABLE oauth_identities
ADD CONSTRAINT foreign_key_oauth_identities_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE oauth_identities
ADD CONSTRAINT foreign_key_oauth_identities_user_auth_method FOREIGN KEY (user_auth_method_id) REFERENCES user_auth_methods (user_auth_method_id);

ALTER TABLE totp_credentials
ADD CONSTRAINT foreign_key_totp_credentials_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE totp_credentials
ADD CONSTRAINT foreign_key_totp_credentials_user_auth_method FOREIGN KEY (user_auth_method_id) REFERENCES user_auth_methods (user_auth_method_id);

ALTER TABLE totp_credentials
ADD CONSTRAINT foreign_key_totp_credentials_algorithm FOREIGN KEY (totp_algorithm_id) REFERENCES totp_algorithms (totp_algorithm_id);

ALTER TABLE totp_credentials
ADD CONSTRAINT foreign_key_totp_credentials_status FOREIGN KEY (credential_status_id) REFERENCES credential_statuses (credential_status_id);

ALTER TABLE recovery_codes
ADD CONSTRAINT foreign_key_recovery_codes_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE recovery_codes
ADD CONSTRAINT foreign_key_recovery_codes_user_auth_method FOREIGN KEY (user_auth_method_id) REFERENCES user_auth_methods (user_auth_method_id);

ALTER TABLE auth_method_global_settings
ADD CONSTRAINT foreign_key_auth_method_global_settings_method FOREIGN KEY (auth_method_id) REFERENCES auth_methods (auth_method_id);

ALTER TABLE user_auth_policies
ADD CONSTRAINT foreign_key_user_auth_policies_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE devices
ADD CONSTRAINT foreign_key_devices_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE device_webauthn_credentials
ADD CONSTRAINT foreign_key_device_webauthn_credentials_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE;

ALTER TABLE device_webauthn_credentials
ADD CONSTRAINT foreign_key_device_webauthn_credentials_credential FOREIGN KEY (webauthn_credential_id) REFERENCES webauthn_credentials (webauthn_credential_id);

ALTER TABLE device_client_profiles
ADD CONSTRAINT foreign_key_device_client_profiles_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE;

ALTER TABLE device_client_profiles
ADD CONSTRAINT foreign_key_device_client_profiles_platform FOREIGN KEY (platform_id) REFERENCES platforms (platform_id);

ALTER TABLE sessions
ADD CONSTRAINT foreign_key_sessions_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE sessions
ADD CONSTRAINT foreign_key_sessions_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE;

ALTER TABLE sessions
ADD CONSTRAINT foreign_key_sessions_status FOREIGN KEY (session_status_id) REFERENCES session_statuses (session_status_id);

ALTER TABLE session_tokens
ADD CONSTRAINT foreign_key_session_tokens_session FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
ADD CONSTRAINT foreign_key_refresh_tokens_session FOREIGN KEY (session_id) REFERENCES sessions (session_id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
ADD CONSTRAINT foreign_key_refresh_tokens_session_token FOREIGN KEY (session_token_id) REFERENCES session_tokens (session_token_id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
ADD CONSTRAINT foreign_key_refresh_tokens_previous_token FOREIGN KEY (previous_refresh_token_id) REFERENCES refresh_tokens (refresh_token_id) ON DELETE SET NULL;

ALTER TABLE refresh_tokens
ADD CONSTRAINT foreign_key_refresh_tokens_status FOREIGN KEY (refresh_token_status_id) REFERENCES refresh_token_statuses (refresh_token_status_id);

ALTER TABLE login_attempts
ADD CONSTRAINT foreign_key_login_attempts_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE login_attempts
ADD CONSTRAINT foreign_key_login_attempts_device FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE;

ALTER TABLE login_attempts
ADD CONSTRAINT foreign_key_login_attempts_status FOREIGN KEY (login_attempt_status_id) REFERENCES login_attempt_statuses (login_attempt_status_id);

ALTER TABLE login_attempts
ADD CONSTRAINT foreign_key_login_attempts_current_auth_method FOREIGN KEY (current_auth_method_id) REFERENCES auth_methods (auth_method_id);

ALTER TABLE login_attempt_steps
ADD CONSTRAINT foreign_key_login_attempt_steps_attempt FOREIGN KEY (login_attempt_id) REFERENCES login_attempts (login_attempt_id) ON DELETE CASCADE;

ALTER TABLE login_attempt_steps
ADD CONSTRAINT foreign_key_login_attempt_steps_method FOREIGN KEY (auth_method_id) REFERENCES auth_methods (auth_method_id);

ALTER TABLE login_attempt_steps
ADD CONSTRAINT foreign_key_login_attempt_steps_status FOREIGN KEY (login_attempt_step_status_id) REFERENCES login_attempt_step_statuses (login_attempt_step_status_id);