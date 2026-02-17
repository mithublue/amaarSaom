-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_bn` VARCHAR(100) NULL,
    `name_ar` VARCHAR(100) NULL,
    `code` VARCHAR(3) NOT NULL,

    UNIQUE INDEX `countries_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_id` INTEGER NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `name_bn` VARCHAR(100) NULL,
    `name_ar` VARCHAR(100) NULL,

    INDEX `divisions_country_id_idx`(`country_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `division_id` INTEGER NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `name_bn` VARCHAR(100) NULL,
    `name_ar` VARCHAR(100) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,

    INDEX `districts_division_id_idx`(`division_id`),
    INDEX `districts_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `image` TEXT NULL,
    `country_id` INTEGER NULL,
    `division_id` INTEGER NULL,
    `district_id` INTEGER NULL,
    `preferred_language` VARCHAR(5) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_country_id_division_id_district_id_idx`(`country_id`, `division_id`, `district_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `provider_account_id` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `accounts_provider_provider_account_id_key`(`provider`, `provider_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `predefined_good_deeds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(100) NOT NULL,
    `name_bn` VARCHAR(100) NULL,
    `name_ar` VARCHAR(100) NULL,
    `category` VARCHAR(20) NOT NULL DEFAULT 'other',
    `tier` VARCHAR(20) NOT NULL DEFAULT 'easy',
    `points` INTEGER NOT NULL DEFAULT 10,
    `time_estimate_minutes` INTEGER NULL,
    `icon` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `description_en` TEXT NULL,
    `description_bn` TEXT NULL,
    `description_ar` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_goals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `good_deed_id` INTEGER NULL,
    `custom_deed_name` VARCHAR(200) NULL,
    `goal_type` VARCHAR(20) NOT NULL,
    `target_count` INTEGER NOT NULL DEFAULT 1,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_goals_user_id_goal_type_start_date_idx`(`user_id`, `goal_type`, `start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `completed_deeds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `good_deed_id` INTEGER NULL,
    `custom_deed_name` VARCHAR(200) NULL,
    `base_points` INTEGER NOT NULL DEFAULT 10,
    `bonus_points` INTEGER NOT NULL DEFAULT 0,
    `multiplier` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    `total_points` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date` DATE NOT NULL,
    `notes` TEXT NULL,
    `is_streak_bonus` BOOLEAN NOT NULL DEFAULT false,
    `is_power_day` BOOLEAN NOT NULL DEFAULT false,

    INDEX `completed_deeds_user_id_date_idx`(`user_id`, `date`),
    INDEX `completed_deeds_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaderboard_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `scope_type` VARCHAR(20) NOT NULL,
    `scope_id` INTEGER NULL,
    `total_points` INTEGER NOT NULL DEFAULT 0,
    `rank` INTEGER NULL,
    `date` DATE NOT NULL,
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leaderboard_cache_period_scope_type_scope_id_rank_idx`(`period`, `scope_type`, `scope_id`, `rank`),
    UNIQUE INDEX `leaderboard_cache_user_id_period_scope_type_scope_id_date_key`(`user_id`, `period`, `scope_type`, `scope_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `calculation_method` VARCHAR(20) NOT NULL DEFAULT 'Karachi',
    `juristic_method` VARCHAR(20) NOT NULL DEFAULT 'Hanafi',
    `enable_notifications` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `prayer_settings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `divisions` ADD CONSTRAINT `divisions_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_division_id_fkey` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_country_id_fkey` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_division_id_fkey` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_district_id_fkey` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_goals` ADD CONSTRAINT `user_goals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_goals` ADD CONSTRAINT `user_goals_good_deed_id_fkey` FOREIGN KEY (`good_deed_id`) REFERENCES `predefined_good_deeds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `completed_deeds` ADD CONSTRAINT `completed_deeds_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `completed_deeds` ADD CONSTRAINT `completed_deeds_good_deed_id_fkey` FOREIGN KEY (`good_deed_id`) REFERENCES `predefined_good_deeds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaderboard_cache` ADD CONSTRAINT `leaderboard_cache_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_settings` ADD CONSTRAINT `prayer_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
