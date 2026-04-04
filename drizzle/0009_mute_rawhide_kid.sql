CREATE TABLE `content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`contentType` enum('lobby','post','comment','user') NOT NULL,
	`contentId` int NOT NULL,
	`reason` enum('hate_speech','criminal_content','fake_news','spam','harassment','other') NOT NULL,
	`description` text,
	`status` enum('pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueId` int NOT NULL,
	`moderatorId` int NOT NULL,
	`action` enum('approve','reject','escalate','request_edit') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('lobby','post','comment') NOT NULL,
	`contentId` int NOT NULL,
	`contentTitle` varchar(255),
	`contentText` text,
	`userId` int NOT NULL,
	`status` enum('pending','approved','rejected','escalated') NOT NULL DEFAULT 'pending',
	`aiScore` decimal(5,2),
	`aiFlags` text,
	`aiReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileVisibility` enum('public','followers','private') NOT NULL DEFAULT 'public',
	`showLocation` boolean NOT NULL DEFAULT true,
	`showActivity` boolean NOT NULL DEFAULT true,
	`showPoints` boolean NOT NULL DEFAULT true,
	`allowAnonymous` boolean NOT NULL DEFAULT false,
	`anonymousAlias` varchar(50),
	`dataConsentAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `privacy_settings_userId_unique` UNIQUE(`userId`)
);
