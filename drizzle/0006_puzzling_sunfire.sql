CREATE TABLE `lobby_plebiscites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','approved','rejected','expired') NOT NULL DEFAULT 'active',
	`yesVotes` int NOT NULL DEFAULT 0,
	`noVotes` int NOT NULL DEFAULT 0,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lobby_plebiscites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `national_plebiscite_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plebisciteId` int NOT NULL,
	`userId` int NOT NULL,
	`vote` enum('yes','no') NOT NULL,
	`state` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `national_plebiscite_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `national_plebiscites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('active','closed','sent_to_chamber') NOT NULL DEFAULT 'active',
	`yesVotes` int NOT NULL DEFAULT 0,
	`noVotes` int NOT NULL DEFAULT 0,
	`endsAt` timestamp NOT NULL,
	`sentToChamberAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `national_plebiscites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plebiscite_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plebisciteId` int NOT NULL,
	`userId` int NOT NULL,
	`vote` enum('yes','no') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plebiscite_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `power_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalCitizens` int NOT NULL DEFAULT 0,
	`electoratePercent` decimal(5,2) NOT NULL DEFAULT '0',
	`billsInfluenced` int NOT NULL DEFAULT 0,
	`victories` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `power_metrics_id` PRIMARY KEY(`id`)
);
