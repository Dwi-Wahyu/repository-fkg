CREATE TABLE `book_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`judul_buku` varchar(500) NOT NULL,
	`penerbit` varchar(255),
	`cover_buku_path` varchar(500),
	`cover_buku_original_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `book_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `letter_sequence` (
	`id` int NOT NULL,
	`current_number` int NOT NULL DEFAULT 199,
	CONSTRAINT `letter_sequence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tracking_code` varchar(20) NOT NULL,
	`nama_lengkap` varchar(255) NOT NULL,
	`nim` varchar(50) NOT NULL,
	`dosen_pembimbing_penguji` text,
	`judul_skripsi` varchar(500) NOT NULL,
	`alamat_lengkap` text,
	`no_telp` varchar(50),
	`program_studi` enum('s1_gigi','profesi_gigi','ppdgs_prostodonsia','ppdgs_konservasi','ppdgs_periodonsia','ppdgs_bedah_mulut','ppdgs_ortodonsia','ppdgs_anak','ppdgs_radiologi','ppdgs_penyakit_mulut','s2_gigi','s3_gigi') NOT NULL,
	`email` varchar(255),
	`kartu_mahasiswa_path` varchar(500),
	`kartu_mahasiswa_original_name` varchar(255),
	`skripsi_path` varchar(500) NOT NULL,
	`skripsi_original_name` varchar(255),
	`skripsi_thumbnail_path` varchar(500),
	`sumbangan_buku` enum('individu','kelompok','tidak_ada') DEFAULT 'tidak_ada',
	`status` enum('pending','diverifikasi','ditolak') NOT NULL DEFAULT 'pending',
	`source_type` enum('form','import_legacy') NOT NULL DEFAULT 'form',
	`catatan_admin` text,
	`verified_by_user_id` int,
	`verified_at` timestamp,
	`surat_nomor` varchar(100),
	`surat_path` varchar(500),
	`surat_generated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `submissions_tracking_code_unique` UNIQUE(`tracking_code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` text NOT NULL,
	`role` enum('admin') NOT NULL DEFAULT 'admin',
	`email` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_verified_by_user_id_users_id_fk` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;