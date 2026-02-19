-- AlterTable
ALTER TABLE `predefined_good_deeds` ADD COLUMN `category_ar` VARCHAR(100) NULL,
    ADD COLUMN `category_bn` VARCHAR(100) NULL,
    ADD COLUMN `category_en` VARCHAR(100) NULL,
    MODIFY `category` VARCHAR(50) NOT NULL DEFAULT 'other';
