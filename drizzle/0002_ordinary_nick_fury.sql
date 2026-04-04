CREATE TABLE `user_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lobbyId` int,
	`communityId` int,
	`action` enum('view','support','comment','share','join') NOT NULL,
	`petitionCategory` varchar(50),
	`locationState` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topCategories` text,
	`topStates` text,
	`preferredLobbyType` enum('national','local','both') NOT NULL DEFAULT 'both',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `lobbies` ADD `petitionCategory` enum('infrastructure','education','health','security','environment','human_rights','economy','transparency','culture');