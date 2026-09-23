CREATE TABLE IF NOT EXISTS permission_categories (
    permission_category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (permission_category_id),
    UNIQUE KEY unique_permission_categories_code (category_code)
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    permission_code VARCHAR(96) NOT NULL,
    permission_category_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (permission_id),
    UNIQUE KEY unique_permissions_code (permission_code)
);

CREATE TABLE IF NOT EXISTS roles (
    role_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_code VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    description VARCHAR(255) NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE, -- nie edytowalne; UI: ma byc to widoczne!!1!
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (role_id),
    UNIQUE KEY unique_roles_code (role_code)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    granted_by_user_id INT UNSIGNED NULL,
    revoked_at DATETIME(6) NULL,
    revoked_by_user_id INT UNSIGNED NULL,
    PRIMARY KEY (user_id, role_id)
);

ALTER TABLE permissions
ADD CONSTRAINT foreign_key_permissions_category FOREIGN KEY (permission_category_id) REFERENCES permission_categories (permission_category_id);

ALTER TABLE role_permissions
ADD CONSTRAINT foreign_key_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (role_id);

ALTER TABLE role_permissions
ADD CONSTRAINT foreign_key_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (permission_id);

ALTER TABLE user_roles
ADD CONSTRAINT foreign_key_user_roles_user FOREIGN KEY (user_id) REFERENCES users (user_id);

ALTER TABLE user_roles
ADD CONSTRAINT foreign_key_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (role_id);

ALTER TABLE user_roles
ADD CONSTRAINT foreign_key_user_roles_granted_by FOREIGN KEY (granted_by_user_id) REFERENCES users (user_id);

ALTER TABLE user_roles
ADD CONSTRAINT foreign_key_user_roles_revoked_by FOREIGN KEY (revoked_by_user_id) REFERENCES users (user_id);

INSERT INTO
    permission_categories (category_code)
VALUES ('music'),
    ('scheduling'),
    ('queue'),
    ('users'),
    ('permissions'),
    ('system')
ON DUPLICATE KEY UPDATE
    category_code = VALUES(category_code);

INSERT INTO
    permissions (
        permission_code,
        permission_category_id,
        description
    )
SELECT v.code, permission_categories.permission_category_id, v.description
FROM (
        SELECT
            'music.songs.view' AS code, 'music' AS category, 'Wyświetlanie piosenek' AS description
        UNION ALL
        SELECT 'music.songs.create', 'music', 'Dodawanie piosenek'
        UNION ALL
        SELECT 'music.songs.edit', 'music', 'Edytowanie metadanych piosenek'
        UNION ALL
        SELECT 'music.songs.delete', 'music', 'Usuwanie piosenek'
        UNION ALL
        SELECT 'music.audio_files.manage', 'music', 'Zarządzanie plikami audio'
        UNION ALL
        SELECT 'music.artists.manage', 'music', 'Zarządzanie artystami'
        UNION ALL
        SELECT 'scheduling.static.view', 'scheduling', 'Wyświetlanie statycznego planu'
        UNION ALL
        SELECT 'scheduling.static.manage', 'scheduling', 'Edytowanie statycznego planu'
        UNION ALL
        SELECT 'scheduling.dynamic.view', 'scheduling', 'Wyświetlanie dynamicznego planu'
        UNION ALL
        SELECT 'scheduling.dynamic.manage', 'scheduling', 'Zarządzanie dynamicznym planem'
        UNION ALL
        SELECT 'queue.view', 'queue', 'Wyświetlanie kolejki'
        UNION ALL
        SELECT 'queue.manage', 'queue', 'Zarządzanie kolejką'
        UNION ALL
        SELECT 'users.view', 'users', 'Enumeracja uzytkowników'
        UNION ALL
        SELECT 'users.manage', 'users', 'Zarządzanie użytkownkami'
        UNION ALL
        SELECT 'permissions.roles.manage', 'permissions', 'Zarządzanie rolami'
        UNION ALL
        SELECT 'system.audit_log.view', 'system', 'Zobacznie audit log'
    ) AS v
    INNER JOIN permission_categories ON permission_categories.category_code = v.category
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

INSERT INTO
    roles (
        role_code,
        display_name,
        description,
        is_system_role
    )
VALUES (
        'admin',
        'Adminek',
        'Full access.',
        TRUE
    ),
    (
        'music_manager',
        'Manager muzyki',
        'Zarządza piosenkami i plikami.',
        FALSE
    ),
    (
        'scheduler',
        'Scheduler',
        'Zarządza kolejkami.',
        FALSE
    ),
    (
        'viewer',
        'Zjadacz chleba',
        'Dostęp do odczytu.',
        FALSE
    )
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description);

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT roles.role_id, permissions.permission_id
FROM roles, permissions
WHERE
    roles.role_code = 'admin'
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id);

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT roles.role_id, permissions.permission_id
FROM roles
    INNER JOIN permissions ON permissions.permission_code LIKE 'music.%'
WHERE
    roles.role_code = 'music_manager'
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id);

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT roles.role_id, permissions.permission_id
FROM roles
    INNER JOIN permissions ON permissions.permission_code LIKE 'scheduling.%'
    OR permissions.permission_code LIKE 'queue.%'
WHERE
    roles.role_code = 'scheduler'
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id);

INSERT INTO
    role_permissions (role_id, permission_id)
SELECT roles.role_id, permissions.permission_id
FROM roles
    INNER JOIN permissions ON permissions.permission_code LIKE '%.view'
WHERE
    roles.role_code = 'viewer'
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id);