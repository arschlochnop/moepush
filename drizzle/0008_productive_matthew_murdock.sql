PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_endpoint_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_endpoint_groups`("id", "name", "description", "user_id", "created_at", "updated_at") SELECT "id", "name", "description", "user_id", "created_at", "updated_at" FROM `endpoint_groups`;--> statement-breakpoint
DROP TABLE `endpoint_groups`;--> statement-breakpoint
ALTER TABLE `__new_endpoint_groups` RENAME TO `endpoint_groups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;