CREATE TABLE `visitor_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitor_id` varchar(100) NOT NULL,
	`path` varchar(255),
	`visited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_logs_id` PRIMARY KEY(`id`)
);
