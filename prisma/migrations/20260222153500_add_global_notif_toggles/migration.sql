-- AlterTable
ALTER TABLE `system_settings` ADD COLUMN `global_leaderboard_notifications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `global_prayer_notifications` BOOLEAN NOT NULL DEFAULT true;
