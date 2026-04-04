CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementKey` enum('pressure_1000','community_1000_members','lobby_became_bill','first_lobby','first_support','first_pressure','invite_5_friends') NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` enum('lobby_support','lobby_create','pressure_action','share_card','invite_friend','lobby_approved') NOT NULL,
	`points` int NOT NULL,
	`referenceId` int,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_points_id` PRIMARY KEY(`id`)
);
