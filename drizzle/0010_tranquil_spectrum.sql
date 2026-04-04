CREATE TABLE `press_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyId` int NOT NULL,
	`journalistId` int NOT NULL,
	`alertType` enum('new_lobby','milestone_reached','priority_agenda','bill_submitted') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`opened` boolean NOT NULL DEFAULT false,
	CONSTRAINT `press_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `press_journalists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(200) NOT NULL,
	`outlet` varchar(200) NOT NULL,
	`role` varchar(100),
	`phone` varchar(30),
	`categories` text,
	`regions` text,
	`verified` boolean NOT NULL DEFAULT false,
	`alertsEnabled` boolean NOT NULL DEFAULT true,
	`minSupportThreshold` int NOT NULL DEFAULT 1000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `press_journalists_id` PRIMARY KEY(`id`),
	CONSTRAINT `press_journalists_email_unique` UNIQUE(`email`)
);
