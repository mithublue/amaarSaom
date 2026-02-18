-- AlterTable
ALTER TABLE `users` ADD COLUMN `city_name` VARCHAR(100) NULL DEFAULT 'Dhaka',
    ADD COLUMN `country_name` VARCHAR(100) NULL DEFAULT 'Bangladesh';
