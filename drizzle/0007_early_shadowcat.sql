ALTER TABLE `lobbies` ADD `isPriorityAgenda` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `lobbies` ADD `priorityAgendaUntil` timestamp;