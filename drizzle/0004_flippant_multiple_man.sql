CREATE TABLE `channel_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`mentions` text,
	`replyToId` int,
	`isEdited` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lobby_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyId` int NOT NULL,
	`targetCount` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`reward` varchar(255),
	`reachedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lobby_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lobby_timeline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lobbyId` int NOT NULL,
	`type` enum('created','milestone','update','media','response','concluded') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`mediaUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lobby_timeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lobbies` ADD `goalCount` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `lobbies` ADD `lobbyStatus` enum('mobilization','pressure','processing','concluded') DEFAULT 'mobilization' NOT NULL;--> statement-breakpoint
ALTER TABLE `lobbies` ADD `evidenceUrls` text;--> statement-breakpoint
ALTER TABLE `lobbies` ADD `targetParlamentarians` text;