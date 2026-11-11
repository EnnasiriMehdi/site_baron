CREATE TABLE `realisations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`photo_path` text NOT NULL,
	`photo_alt` text NOT NULL,
	`related_service_slug` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
