import {
	int,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
	id: int("id").primaryKey().autoincrement(),
	username: varchar("username", { length: 255 }).notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: mysqlEnum("role", ["admin"]).notNull().default("admin"),
	email: varchar("email", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programStudiMap = {
	s1_gigi: "Pendidikan Dokter Gigi (S1)",
	profesi_gigi: "Pendidikan Profesi Dokter Gigi (DRG)",
	ppdgs_prostodonsia: "PPDGS PROSTODONSIA",
	ppdgs_konservasi: "PPDGS KONSERVASI GIGI",
	ppdgs_periodonsia: "PPDGS PERIODONSIA",
	ppdgs_bedah_mulut: "PPDGS BEDAH MULUT DAN MAKSILOFASIAL",
	ppdgs_ortodonsia: "PPDGS ORTODONSIA",
	ppdgs_anak: "PPDGS KEDOKTERAN GIGI ANAK",
	ppdgs_radiologi: "PPDGS RADIOLOGI KEDOKTERAN GIGI",
	ppdgs_penyakit_mulut: "PPDGS PENYAKIT MULUT",
	s2_gigi: "MAGISTER ILMU KEDOKTERAN GIGI (S2)",
	s3_gigi: "DOKTOR ILMU KEDOKTERAN GIGI (S3)",
} as const;

export type ProgramStudiSlug = keyof typeof programStudiMap;

export const submissions = mysqlTable("submissions", {
	id: int("id").primaryKey().autoincrement(),
	trackingCode: varchar("tracking_code", { length: 20 }).notNull().unique(),
	namaLengkap: varchar("nama_lengkap", { length: 255 }).notNull(),
	nim: varchar("nim", { length: 50 }).notNull(),
	dosenPembimbingPenguji: text("dosen_pembimbing_penguji"),
	judulSkripsi: varchar("judul_skripsi", { length: 500 }).notNull(),
	alamatLengkap: text("alamat_lengkap"),
	noTelp: varchar("no_telp", { length: 30 }),
	programStudi: mysqlEnum("program_studi", [
		"s1_gigi",
		"profesi_gigi",
		"ppdgs_prostodonsia",
		"ppdgs_konservasi",
		"ppdgs_periodonsia",
		"ppdgs_bedah_mulut",
		"ppdgs_ortodonsia",
		"ppdgs_anak",
		"ppdgs_radiologi",
		"ppdgs_penyakit_mulut",
		"s2_gigi",
		"s3_gigi",
	]).notNull(),
	email: varchar("email", { length: 255 }),
	kartuMahasiswaPath: varchar("kartu_mahasiswa_path", {
		length: 500,
	}),
	kartuMahasiswaOriginalName: varchar("kartu_mahasiswa_original_name", {
		length: 255,
	}),
	skripsiPath: varchar("skripsi_path", { length: 500 }).notNull(),
	skripsiOriginalName: varchar("skripsi_original_name", { length: 255 }),
	sumbanganBuku: mysqlEnum("sumbangan_buku", [
		"individu",
		"kelompok",
		"tidak_ada",
	]).default("tidak_ada"),
	status: mysqlEnum("status", ["pending", "diverifikasi", "ditolak"])
		.notNull()
		.default("pending"),
	sourceType: mysqlEnum("source_type", ["form", "import_legacy"])
		.notNull()
		.default("form"),
	catatanAdmin: text("catatan_admin"),
	verifiedByUserId: int("verified_by_user_id").references(() => users.id, {
		onDelete: "set null",
	}),
	verifiedAt: timestamp("verified_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const bookSuggestions = mysqlTable("book_suggestions", {
	id: int("id").primaryKey().autoincrement(),
	judulBuku: varchar("judul_buku", { length: 500 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
