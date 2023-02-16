CREATE TABLE IF NOT EXISTS packages (
    `package_id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    `app_id` varchar(50) NOT NULL UNIQUE,
    `name` varchat(50) NOT NULL DEFAULT '',
    `platform` varchar(7) NOT NULL DEFAULT 'Android',
    `type` varchar(6) NOT NULL DEFAULT 'app',
    `version` varchar(50) NOT NULL DEFAULT '',
    `version_code` INTEGER NOT NULL DEFAULT 0,
    `description` varchar(255) NOT NULL DEFAULT '',
    `apk_hash` varchar(64) NOT NULL DEFAULT '',
    `apk_size` INTEGER NOT NULL DEFAULT 0,
    `os_requirements` varchar(10) NOT NULL DEFAULT '',
    `tak_prereq` varchar(50) NOT NULL DEFAULT '',
    `image` BLOB NOT NULL DEFAULT ''
);