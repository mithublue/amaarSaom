/*
  Warnings:

  - You are about to drop the column `prayer_reminder` on the `notification_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `notification_preferences` DROP COLUMN `prayer_reminder`,
    ADD COLUMN `asr_reminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `dhuhr_reminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `fajr_reminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isha_reminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `maghrib_reminder` BOOLEAN NOT NULL DEFAULT true;
