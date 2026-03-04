-- AlterTable
ALTER TABLE `notification_preferences` ADD COLUMN `prayer_reminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `quiz_hour` INTEGER NOT NULL DEFAULT 8,
    ADD COLUMN `quiz_minute` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `quiz_reminder` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `push_subscriptions` ADD COLUMN `city_name` VARCHAR(100) NULL,
    ADD COLUMN `country_name` VARCHAR(100) NULL,
    ADD COLUMN `language` VARCHAR(5) NULL DEFAULT 'en',
    ADD COLUMN `timezone` VARCHAR(50) NULL,
    MODIFY `user_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `lifetime_points` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `referral_code` VARCHAR(10) NULL,
    ADD COLUMN `referred_by_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `custom_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `receiver_emails` TEXT NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT 'Prophet''s Companion',
    `content` TEXT NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `is_sent` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referral_rewards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referrer_id` INTEGER NOT NULL,
    `referred_user_id` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `points` INTEGER NOT NULL,
    `deed_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `referral_rewards_referrer_id_idx`(`referrer_id`),
    INDEX `referral_rewards_referred_user_id_idx`(`referred_user_id`),
    INDEX `referral_rewards_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_trophies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `month_name` VARCHAR(100) NOT NULL,
    `month_date` DATE NOT NULL,
    `points` INTEGER NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_trophies_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_bn` TEXT NOT NULL,
    `question_en` TEXT NOT NULL,
    `question_ar` TEXT NULL,
    `options_bn` JSON NOT NULL,
    `options_en` JSON NOT NULL,
    `options_ar` JSON NULL,
    `correct_index` INTEGER NOT NULL,
    `explanation_bn` TEXT NULL,
    `explanation_en` TEXT NULL,
    `explanation_ar` TEXT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    `difficulty` VARCHAR(20) NOT NULL DEFAULT 'normal',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_questions_category_idx`(`category`),
    INDEX `quiz_questions_difficulty_is_active_idx`(`difficulty`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `hijri_month` VARCHAR(50) NULL,
    `total_score` INTEGER NOT NULL DEFAULT 0,
    `total_time_taken_ms` INTEGER NOT NULL DEFAULT 0,
    `streak_multiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `final_score` INTEGER NOT NULL DEFAULT 0,
    `questions_count` INTEGER NOT NULL DEFAULT 3,
    `correct_count` INTEGER NOT NULL DEFAULT 0,
    `is_boss_day` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_attempts_user_id_idx`(`user_id`),
    INDEX `quiz_attempts_hijri_month_idx`(`hijri_month`),
    INDEX `quiz_attempts_date_idx`(`date`),
    UNIQUE INDEX `quiz_attempts_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attempt_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `selected_index` INTEGER NOT NULL,
    `is_correct` BOOLEAN NOT NULL,
    `time_taken_ms` INTEGER NOT NULL,
    `points_awarded` INTEGER NOT NULL DEFAULT 0,
    `used_5050` BOOLEAN NOT NULL DEFAULT false,

    INDEX `quiz_answers_attempt_id_idx`(`attempt_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_quiz_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `current_streak` INTEGER NOT NULL DEFAULT 0,
    `max_streak` INTEGER NOT NULL DEFAULT 0,
    `total_quiz_points` INTEGER NOT NULL DEFAULT 0,
    `season_quiz_points` INTEGER NOT NULL DEFAULT 0,
    `current_hijri_month` VARCHAR(50) NULL,
    `lifelines_5050` INTEGER NOT NULL DEFAULT 1,
    `streak_savers` INTEGER NOT NULL DEFAULT 0,
    `last_played_date` DATE NULL,

    UNIQUE INDEX `user_quiz_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_leaderboard_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `period` VARCHAR(20) NOT NULL,
    `hijri_month` VARCHAR(50) NULL,
    `scopeType` VARCHAR(20) NOT NULL,
    `scope_id` INTEGER NOT NULL DEFAULT 0,
    `total_points` INTEGER NOT NULL DEFAULT 0,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `quiz_leaderboard_cache_period_hijri_month_scopeType_scope_id_idx`(`period`, `hijri_month`, `scopeType`, `scope_id`, `rank`),
    UNIQUE INDEX `quiz_leaderboard_cache_user_id_period_hijri_month_scopeType__key`(`user_id`, `period`, `hijri_month`, `scopeType`, `scope_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quiz_trophies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `hijri_month` VARCHAR(50) NOT NULL,
    `season_points` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `awarded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quiz_trophies_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_referral_code_key` ON `users`(`referral_code`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_referred_by_id_fkey` FOREIGN KEY (`referred_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_rewards` ADD CONSTRAINT `referral_rewards_referrer_id_fkey` FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_rewards` ADD CONSTRAINT `referral_rewards_referred_user_id_fkey` FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_rewards` ADD CONSTRAINT `referral_rewards_deed_id_fkey` FOREIGN KEY (`deed_id`) REFERENCES `completed_deeds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_trophies` ADD CONSTRAINT `user_trophies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_attempt_id_fkey` FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_answers` ADD CONSTRAINT `quiz_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_quiz_profiles` ADD CONSTRAINT `user_quiz_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_leaderboard_cache` ADD CONSTRAINT `quiz_leaderboard_cache_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quiz_trophies` ADD CONSTRAINT `quiz_trophies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

