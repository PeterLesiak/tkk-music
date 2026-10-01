CREATE TABLE IF NOT EXISTS queue_statuses (
    queue_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (queue_status_id),
    UNIQUE KEY unique_queue_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS dynamic_schedule_entry_statuses (
    dynamic_schedule_entry_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (
        dynamic_schedule_entry_status_id
    ),
    UNIQUE KEY unique_dynamic_schedule_entry_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS static_schedule_blocks (
    static_schedule_block_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    day_of_week TINYINT UNSIGNED NULL COMMENT '0=Sunday..6=Saturday, NULL=every day',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label VARCHAR(128) NOT NULL,
    description VARCHAR(255) NULL,
    genre_id INT UNSIGNED NULL COMMENT 'Optional hint for what this block should play',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by_user_id INT UNSIGNED NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (static_schedule_block_id),
    KEY index_static_schedule_blocks_day (day_of_week)
);

CREATE TABLE IF NOT EXISTS dynamic_schedule_entries (
    dynamic_schedule_entry_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    static_schedule_block_id INT UNSIGNED NOT NULL,
    schedule_date DATE NOT NULL,
    scheduled_start_at DATETIME(6) NOT NULL,
    scheduled_end_at DATETIME(6) NOT NULL,
    dynamic_schedule_entry_status_id INT UNSIGNED NOT NULL,
    updated_by_user_id INT UNSIGNED NULL,
    updated_by_actor_type_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (dynamic_schedule_entry_id),
    UNIQUE KEY unique_dynamic_schedule_block_date (
        static_schedule_block_id,
        schedule_date
    ),
    KEY index_dynamic_schedule_entries_date (schedule_date),
    KEY index_dynamic_schedule_entries_status (
        dynamic_schedule_entry_status_id
    )
);

CREATE TABLE IF NOT EXISTS song_queue (
    queue_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    song_id INT UNSIGNED NOT NULL,
    queue_status_id INT UNSIGNED NOT NULL,
    queue_position INT UNSIGNED NULL,
    added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    added_by_user_id INT UNSIGNED NULL,
    added_by_actor_type_id INT UNSIGNED NOT NULL,
    allocated_dynamic_schedule_entry_id INT UNSIGNED NULL,
    allocated_position INT UNSIGNED NULL,
    allocated_at DATETIME(6) NULL,
    played_at DATETIME(6) NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (queue_id),
    KEY index_song_queue_status_position (
        queue_status_id,
        queue_position
    ),
    KEY index_song_queue_song (song_id),
    KEY index_song_queue_allocated_entry (
        allocated_dynamic_schedule_entry_id,
        allocated_position
    )
);

ALTER TABLE static_schedule_blocks
ADD CONSTRAINT foreign_key_static_schedule_blocks_genre FOREIGN KEY (genre_id) REFERENCES genres (genre_id);

ALTER TABLE static_schedule_blocks
ADD CONSTRAINT foreign_key_static_schedule_blocks_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (user_id);

ALTER TABLE dynamic_schedule_entries
ADD CONSTRAINT foreign_key_dynamic_schedule_entries_block FOREIGN KEY (static_schedule_block_id) REFERENCES static_schedule_blocks (static_schedule_block_id);

ALTER TABLE dynamic_schedule_entries
ADD CONSTRAINT foreign_key_dynamic_schedule_entries_status FOREIGN KEY (
    dynamic_schedule_entry_status_id
) REFERENCES dynamic_schedule_entry_statuses (
    dynamic_schedule_entry_status_id
);

ALTER TABLE dynamic_schedule_entries
ADD CONSTRAINT foreign_key_dynamic_schedule_entries_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users (user_id);

ALTER TABLE dynamic_schedule_entries
ADD CONSTRAINT foreign_key_dynamic_schedule_entries_updated_by_actor_type FOREIGN KEY (updated_by_actor_type_id) REFERENCES actor_types (actor_type_id);

ALTER TABLE song_queue
ADD CONSTRAINT foreign_key_song_queue_song FOREIGN KEY (song_id) REFERENCES songs (song_id);

ALTER TABLE song_queue
ADD CONSTRAINT foreign_key_song_queue_status FOREIGN KEY (queue_status_id) REFERENCES queue_statuses (queue_status_id);

ALTER TABLE song_queue
ADD CONSTRAINT foreign_key_song_queue_added_by FOREIGN KEY (added_by_user_id) REFERENCES users (user_id);

ALTER TABLE song_queue
ADD CONSTRAINT foreign_key_song_queue_added_by_actor_type FOREIGN KEY (added_by_actor_type_id) REFERENCES actor_types (actor_type_id);

ALTER TABLE song_queue
ADD CONSTRAINT foreign_key_song_queue_allocated_entry FOREIGN KEY (
    allocated_dynamic_schedule_entry_id
) REFERENCES dynamic_schedule_entries (dynamic_schedule_entry_id);

INSERT INTO
    queue_statuses (status_code)
VALUES ('queued'),
    ('allocated'),
    ('playing'),
    ('played'),
    ('skipped'),
    ('removed')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    dynamic_schedule_entry_statuses (status_code)
VALUES ('playable'),
    ('not_playable'),
    ('in_progress'),
    ('completed'),
    ('skipped')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);