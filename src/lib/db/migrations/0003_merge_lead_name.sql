-- Fusionne first_name/last_name en une seule colonne name (CLAUDE.md, 7quater.1 : réduire le nombre de champs).
ALTER TABLE `leads` ADD `name` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `leads` SET `name` = trim(`first_name` || ' ' || `last_name`);--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `first_name`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `last_name`;
