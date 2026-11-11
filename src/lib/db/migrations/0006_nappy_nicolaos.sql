CREATE TABLE `realisation_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`realisation_id` integer NOT NULL,
	`photo_path` text NOT NULL,
	`photo_alt` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`realisation_id`) REFERENCES `realisations`(`id`) ON UPDATE no action ON DELETE cascade
);
