CREATE TABLE IF NOT EXISTS song_statuses (
    song_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (song_status_id),
    UNIQUE KEY unique_song_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS song_sources (
    song_source_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    source_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (song_source_id),
    UNIQUE KEY unique_song_sources_code (source_code)
);

CREATE TABLE IF NOT EXISTS genres (
    genre_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    genre_code VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    PRIMARY KEY (genre_id),
    UNIQUE KEY unique_genres_code (genre_code)
);

CREATE TABLE IF NOT EXISTS artist_roles (
    artist_role_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    role_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (artist_role_id),
    UNIQUE KEY unique_artist_roles_code (role_code)
);

CREATE TABLE IF NOT EXISTS audio_formats (
    audio_format_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    format_code VARCHAR(16) NOT NULL,
    PRIMARY KEY (audio_format_id),
    UNIQUE KEY unique_audio_formats_code (format_code)
);

CREATE TABLE IF NOT EXISTS storage_backends (
    storage_backend_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    backend_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (storage_backend_id),
    UNIQUE KEY unique_storage_backends_code (backend_code)
);

CREATE TABLE IF NOT EXISTS audio_file_statuses (
    audio_file_status_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    status_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (audio_file_status_id),
    UNIQUE KEY unique_audio_file_statuses_code (status_code)
);

CREATE TABLE IF NOT EXISTS artists (
    artist_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (artist_id),
    UNIQUE KEY unique_artists_public_id (public_id),
    KEY index_artists_display_name (display_name)
);

CREATE TABLE IF NOT EXISTS albums (
    album_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_date DATE NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (album_id),
    UNIQUE KEY unique_albums_public_id (public_id)
);

CREATE TABLE IF NOT EXISTS album_artists (
    album_id INT UNSIGNED NOT NULL,
    artist_id INT UNSIGNED NOT NULL,
    artist_role_id INT UNSIGNED NOT NULL,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (
        album_id,
        artist_id,
        artist_role_id
    )
);

CREATE TABLE IF NOT EXISTS songs (
    song_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    album_id INT UNSIGNED NULL,
    duration_ms INT UNSIGNED NULL,
    isrc CHAR(12) NULL,
    explicit BOOLEAN NOT NULL DEFAULT FALSE,
    release_date DATE NULL,
    song_status_id INT UNSIGNED NOT NULL,
    added_by_user_id INT UNSIGNED NULL,
    added_by_actor_type_id INT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (song_id),
    UNIQUE KEY unique_songs_public_id (public_id),
    UNIQUE KEY unique_songs_isrc (isrc),
    KEY index_songs_album (album_id),
    KEY index_songs_status (song_status_id),
    KEY index_songs_title (title)
);

CREATE TABLE IF NOT EXISTS song_artists (
    song_id INT UNSIGNED NOT NULL,
    artist_id INT UNSIGNED NOT NULL,
    artist_role_id INT UNSIGNED NOT NULL,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (
        song_id,
        artist_id,
        artist_role_id
    ),
    KEY index_song_artists_artist (artist_id)
);

CREATE TABLE IF NOT EXISTS song_genres (
    song_id INT UNSIGNED NOT NULL,
    genre_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (song_id, genre_id)
);

CREATE TABLE IF NOT EXISTS song_external_ids (
    song_id INT UNSIGNED NOT NULL,
    song_source_id INT UNSIGNED NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    external_url VARCHAR(1024) NULL,
    imported_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (song_id, song_source_id),
    UNIQUE KEY unique_song_external_source_id (song_source_id, external_id)
);

CREATE TABLE IF NOT EXISTS song_audio_files (
    song_audio_file_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    song_id INT UNSIGNED NOT NULL,
    audio_format_id INT UNSIGNED NOT NULL,
    storage_backend_id INT UNSIGNED NOT NULL,
    audio_file_status_id INT UNSIGNED NOT NULL,
    storage_location VARCHAR(1024) NOT NULL,
    bitrate_kbps SMALLINT UNSIGNED NULL,
    sample_rate_hz INT UNSIGNED NULL,
    channels TINYINT UNSIGNED NULL,
    duration_ms INT UNSIGNED NULL,
    file_size_bytes BIGINT UNSIGNED NULL,
    checksum_sha256 BINARY(32) NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (song_audio_file_id),
    KEY index_song_audio_files_song (song_id),
    KEY index_song_audio_files_status (audio_file_status_id)
);

ALTER TABLE album_artists
ADD CONSTRAINT foreign_key_album_artists_album FOREIGN KEY (album_id) REFERENCES albums (album_id);

ALTER TABLE album_artists
ADD CONSTRAINT foreign_key_album_artists_artist FOREIGN KEY (artist_id) REFERENCES artists (artist_id);

ALTER TABLE album_artists
ADD CONSTRAINT foreign_key_album_artists_role FOREIGN KEY (artist_role_id) REFERENCES artist_roles (artist_role_id);

ALTER TABLE songs
ADD CONSTRAINT foreign_key_songs_album FOREIGN KEY (album_id) REFERENCES albums (album_id);

ALTER TABLE songs
ADD CONSTRAINT foreign_key_songs_status FOREIGN KEY (song_status_id) REFERENCES song_statuses (song_status_id);

ALTER TABLE songs
ADD CONSTRAINT foreign_key_songs_added_by_user FOREIGN KEY (added_by_user_id) REFERENCES users (user_id);

ALTER TABLE songs
ADD CONSTRAINT foreign_key_songs_added_by_actor_type FOREIGN KEY (added_by_actor_type_id) REFERENCES actor_types (actor_type_id);

ALTER TABLE song_artists
ADD CONSTRAINT foreign_key_song_artists_song FOREIGN KEY (song_id) REFERENCES songs (song_id);

ALTER TABLE song_artists
ADD CONSTRAINT foreign_key_song_artists_artist FOREIGN KEY (artist_id) REFERENCES artists (artist_id);

ALTER TABLE song_artists
ADD CONSTRAINT foreign_key_song_artists_role FOREIGN KEY (artist_role_id) REFERENCES artist_roles (artist_role_id);

ALTER TABLE song_genres
ADD CONSTRAINT foreign_key_song_genres_song FOREIGN KEY (song_id) REFERENCES songs (song_id);

ALTER TABLE song_genres
ADD CONSTRAINT foreign_key_song_genres_genre FOREIGN KEY (genre_id) REFERENCES genres (genre_id);

ALTER TABLE song_external_ids
ADD CONSTRAINT foreign_key_song_external_ids_song FOREIGN KEY (song_id) REFERENCES songs (song_id);

ALTER TABLE song_external_ids
ADD CONSTRAINT foreign_key_song_external_ids_source FOREIGN KEY (song_source_id) REFERENCES song_sources (song_source_id);

ALTER TABLE song_audio_files
ADD CONSTRAINT foreign_key_song_audio_files_song FOREIGN KEY (song_id) REFERENCES songs (song_id);

ALTER TABLE song_audio_files
ADD CONSTRAINT foreign_key_song_audio_files_format FOREIGN KEY (audio_format_id) REFERENCES audio_formats (audio_format_id);

ALTER TABLE song_audio_files
ADD CONSTRAINT foreign_key_song_audio_files_backend FOREIGN KEY (storage_backend_id) REFERENCES storage_backends (storage_backend_id);

ALTER TABLE song_audio_files
ADD CONSTRAINT foreign_key_song_audio_files_status FOREIGN KEY (audio_file_status_id) REFERENCES audio_file_statuses (audio_file_status_id);

INSERT INTO
    song_statuses (status_code)
VALUES ('draft'),
    ('pending_review'),
    ('active'),
    ('archived'),
    ('removed')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);

INSERT INTO
    song_sources (source_code)
VALUES ('spotify'),
    ('youtube'),
    ('soundcloud'),
    ('apple_music'),
    ('manual'),
    ('other')
ON DUPLICATE KEY UPDATE
    source_code = VALUES(source_code);

INSERT INTO
    artist_roles (role_code)
VALUES ('primary'),
    ('featured'),
    ('composer'),
    ('producer'),
    ('remixer'),
    ('writer')
ON DUPLICATE KEY UPDATE
    role_code = VALUES(role_code);

INSERT INTO
    audio_formats (format_code)
VALUES ('mp3'),
    ('aac'),
    ('flac'),
    ('ogg_vorbis'),
    ('opus'),
    ('wav')
ON DUPLICATE KEY UPDATE
    format_code = VALUES(format_code);

INSERT INTO
    storage_backends (backend_code)
VALUES ('local_disk'),
    ('s3'),
    ('cloudflare_r2'),
    ('external_url'),
    ('youtube_stream'),
    ('spotify_stream')
ON DUPLICATE KEY UPDATE
    backend_code = VALUES(backend_code);

INSERT INTO
    audio_file_statuses (status_code)
VALUES ('pending'),
    ('processing'),
    ('ready'),
    ('failed'),
    ('archived')
ON DUPLICATE KEY UPDATE
    status_code = VALUES(status_code);