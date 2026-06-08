ALTER TABLE `endpoint_groups` ADD `status` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `endpoint_groups` DROP COLUMN `description`;