CREATE TABLE `pressure_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lobbyId` int NOT NULL,
	`channel` enum('whatsapp','email','twitter','instagram','phone','copy') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pressure_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smart_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyId` int NOT NULL,
	`targetCount` int NOT NULL,
	`action` varchar(500) NOT NULL,
	`description` text,
	`achieved` boolean NOT NULL DEFAULT false,
	`achievedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smart_milestones_id` PRIMARY KEY(`id`)
);
