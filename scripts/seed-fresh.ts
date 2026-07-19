import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../src/server/db";
import { submissions } from "../src/server/db/schema";

/**
 * Seeder untuk DATABASE BARU / KOSONG.
 *
 * Berbeda dari scripts/seeder.ts:
 *  - createdAt DIAMBIL LANGSUNG dari kolom `createdAt` di CSV (sudah di-generate
 *    oleh scripts/build-seed-with-timestamp.ts, hasil join dengan Timestamp asli
 *    di SURAT-KETERANGAN-BEBAS-PUSTAKA-CLEANED.csv). Tidak ada lagi logic join
 *    NIM -> Timestamp di sini.
 *  - TIDAK ADA pengecekan data yang sudah ada di database (tidak SELECT dulu,
 *    tidak upsert, tidak skip-if-exists). Setiap baris CSV langsung di-INSERT.
 *    Ini aman dipakai HANYA kalau tabel `submissions` masih kosong / database
 *    baru dengan data yang sudah benar. Kalau dijalankan dua kali di database
 *    yang sama, datanya akan dobel (karena trackingCode memang unique, insert
 *    kedua akan gagal per-baris, tapi tetap sebaiknya jangan dijalankan ulang).
 */

const SEED_FILE = "scripts/READY_TO_SEED_DATA_WITH_TIMESTAMP.csv";

const KTM_DIR = path.join(process.cwd(), "uploads", "kartu-mahasiswa");
const DOKUMEN_DIR = path.join(process.cwd(), "uploads", "skripsi");

const TARGET_KTM_DIR = path.join(process.cwd(), "uploads", "kartu-mahasiswa");
const TARGET_SKRIPSI_DIR = path.join(process.cwd(), "uploads", "skripsi");

const THUMBNAIL_DIR = path.join(process.cwd(), "uploads", "thumbnail-skripsi");
const TARGET_THUMBNAIL_DIR = path.join(
	process.cwd(),
	"uploads",
	"thumbnail-skripsi",
);

const UNRESOLVED_REPORT = "scripts/seed-fresh-manual-review.csv";

const NO_FILE_SENTINEL = "data_legacy_tanpa_file";
const NEEDS_REVIEW_SENTINEL = "PERLU_VERIFIKASI_MANUAL";

function getExt(filename: string): string {
	const ext = filename.split(".").pop();
	return ext && ext.length <= 4 ? ext.toLowerCase() : "bin";
}

async function readCsv(filePath: string): Promise<any[]> {
	const rows: any[] = [];
	await new Promise<void>((resolve, reject) => {
		fs.createReadStream(filePath)
			.pipe(csv())
			.on("data", (d) => rows.push(d))
			.on("end", () => resolve())
			.on("error", reject);
	});
	return rows;
}

// Bangun index: nama file (lowercase, trimmed) -> daftar absolute path yang cocok
function buildFileIndex(dir: string): Map<string, string[]> {
	const index = new Map<string, string[]>();
	if (!fs.existsSync(dir)) return index;

	for (const filename of fs.readdirSync(dir)) {
		// Normalisasi: hapus suffix duplikat Chrome " (1)", " (2)", dst.
		const normalized = filename
			.replace(/ \(\d+\)(?=\.[^.]+$)/, "")
			.trim()
			.toLowerCase();

		const list = index.get(normalized) || [];
		list.push(path.join(dir, filename));
		index.set(normalized, list);
	}
	return index;
}

// Cari satu file yang match unik. Return null kalau tidak ketemu / ambigu.
function resolveFile(
	actualFileName: string,
	index: Map<string, string[]>,
): { path: string | null; reason: string } {
	if (!actualFileName) return { path: null, reason: "no_filename" };

	const key = actualFileName.trim().toLowerCase();
	const candidates = index.get(key);

	if (!candidates || candidates.length === 0) {
		return { path: null, reason: "file_not_found" };
	}
	if (candidates.length > 1) {
		return { path: null, reason: `ambiguous_${candidates.length}_candidates` };
	}
	return { path: candidates[0], reason: "ok" };
}

function buildThumbnailIndex(dir: string): Map<string, string[]> {
	const index = new Map<string, string[]>();
	if (!fs.existsSync(dir)) return index;

	for (const filename of fs.readdirSync(dir)) {
		const withoutExt = filename.replace(/\.jpg$/i, "");
		const normalized = withoutExt
			.replace(/ \(\d+\)$/, "") // suffix duplikat Chrome
			.trim()
			.toLowerCase();

		const list = index.get(normalized) || [];
		list.push(path.join(dir, filename));
		index.set(normalized, list);
	}
	return index;
}

function resolveThumbnail(
	skripsiActualFileName: string,
	index: Map<string, string[]>,
): { path: string | null; reason: string } {
	if (!skripsiActualFileName) return { path: null, reason: "no_filename" };

	// buang ekstensi dari nama file skripsi asli (.pdf/.doc/.docx dll),
	// karena thumbnail selalu disimpan sebagai <nama-tanpa-ekstensi>.jpg
	const withoutExt = skripsiActualFileName.replace(/\.[^./]+$/, "");
	const key = withoutExt.trim().toLowerCase();
	const candidates = index.get(key);

	if (!candidates || candidates.length === 0) {
		return { path: null, reason: "thumbnail_not_found" };
	}
	if (candidates.length > 1) {
		return { path: null, reason: `ambiguous_${candidates.length}_candidates` };
	}
	return { path: candidates[0], reason: "ok" };
}

function copyToTarget(
	sourcePath: string,
	targetDir: string,
	trackingCode: string,
	kind: "kartu" | "skripsi",
): string {
	fs.mkdirSync(targetDir, { recursive: true });
	const ext = getExt(sourcePath);
	const fileName = `${trackingCode}-${kind}.${ext}`;
	const destAbsPath = path.join(targetDir, fileName);
	fs.copyFileSync(sourcePath, destAbsPath);
	return fileName;
}

function parseCreatedAt(value: string | undefined): Date | undefined {
	if (!value) return undefined;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return undefined;
	return parsed;
}

async function seed() {
	console.log(`Membaca CSV: ${SEED_FILE} ...`);
	const rows = await readCsv(SEED_FILE);

	console.log("🧹 Menghapus data lama di tabel submissions...");
	await db.delete(submissions);

	const ktmIndex = buildFileIndex(KTM_DIR);
	const dokumenIndex = buildFileIndex(DOKUMEN_DIR);
	const thumbIndex = buildThumbnailIndex(THUMBNAIL_DIR);

	const unresolvedRows: string[] = [
		"trackingCode,nim,namaLengkap,field,reason",
	];

	let insertedCount = 0;
	let failedCount = 0;
	let reviewCount = 0;
	let missingCreatedAtCount = 0;

	for (const row of rows) {
		const nim = (row.nim || "").trim();

		// ---- Resolve KTM ----
		let kartuMahasiswaPath: string | null = null;
		let kartuMahasiswaOriginalName: string | null = null;
		if (row.kartuActualFileName) {
			const resolved = resolveFile(row.kartuActualFileName, ktmIndex);
			if (resolved.path) {
				kartuMahasiswaPath = copyToTarget(
					resolved.path,
					TARGET_KTM_DIR,
					row.trackingCode,
					"kartu",
				);
				kartuMahasiswaOriginalName = row.kartuActualFileName;
			} else {
				unresolvedRows.push(
					[row.trackingCode, nim, row.namaLengkap, "kartu", resolved.reason]
						.map((v) => `"${String(v).replace(/"/g, '""')}"`)
						.join(","),
				);
				reviewCount++;
			}
		}

		// ---- Resolve Skripsi (NOT NULL di schema, wajib ada nilai) ----
		let skripsiPath = NO_FILE_SENTINEL;
		let skripsiOriginalName: string | null = null;
		if (row.skripsiActualFileName) {
			const resolved = resolveFile(row.skripsiActualFileName, dokumenIndex);
			if (resolved.path) {
				skripsiPath = copyToTarget(
					resolved.path,
					TARGET_SKRIPSI_DIR,
					row.trackingCode,
					"skripsi",
				);
				skripsiOriginalName = row.skripsiActualFileName;
			} else {
				skripsiPath = NEEDS_REVIEW_SENTINEL;
				unresolvedRows.push(
					[row.trackingCode, nim, row.namaLengkap, "skripsi", resolved.reason]
						.map((v) => `"${String(v).replace(/"/g, '""')}"`)
						.join(","),
				);
				reviewCount++;
			}
		}

		// ---- Resolve Thumbnail ----
		let skripsiThumbnailPath: string | null = null;
		if (
			skripsiPath !== NO_FILE_SENTINEL &&
			skripsiPath !== NEEDS_REVIEW_SENTINEL &&
			row.skripsiActualFileName
		) {
			const resolvedThumb = resolveThumbnail(row.skripsiActualFileName, thumbIndex);
			if (resolvedThumb.path) {
				fs.mkdirSync(TARGET_THUMBNAIL_DIR, { recursive: true });
				const destPath = path.join(
					TARGET_THUMBNAIL_DIR,
					`${row.trackingCode}-skripsi.jpg`,
				);
				fs.copyFileSync(resolvedThumb.path, destPath);
				skripsiThumbnailPath = `${row.trackingCode}-skripsi.jpg`;
			} else {
				// tidak fatal — cukup catat, dokumen tetap ke-seed tanpa thumbnail
				unresolvedRows.push(
					[
						row.trackingCode,
						nim,
						row.namaLengkap,
						"thumbnail",
						resolvedThumb.reason,
					]
						.map((v) => `"${String(v).replace(/"/g, '""')}"`)
						.join(","),
				);
			}
		}

		// ---- createdAt langsung dari CSV (sudah di-join sebelumnya) ----
		const createdAt = parseCreatedAt(row.createdAt);
		if (!createdAt) missingCreatedAtCount++;

		const mappedData: any = {
			trackingCode: row.trackingCode,
			namaLengkap: row.namaLengkap,
			nim: row.nim,
			dosenPembimbingPenguji: row.dosenPembimbingPenguji || null,
			judulSkripsi: row.judulSkripsi,
			alamatLengkap: row.alamatLengkap || null,
			noTelp: row.noTelp || null,
			programStudi: row.programStudi,
			email: row.email || null,
			sumbanganBuku: row.sumbanganBuku,
			kartuMahasiswaPath,
			kartuMahasiswaOriginalName,
			skripsiPath,
			skripsiOriginalName,
			skripsiThumbnailPath,
			sourceType: row.sourceType,
			status: row.status,
			suratNomor: row.suratNomor || null,
		};
		if (createdAt) mappedData.createdAt = createdAt;

		// Insert langsung, tanpa cek data existing / upsert.
		try {
			await db.insert(submissions).values(mappedData);
			insertedCount++;
			console.log(
				`✅ ${row.nim} — createdAt: ${createdAt?.toISOString() ?? "(default now)"}, kartu: ${kartuMahasiswaPath ?? "-"}, skripsi: ${skripsiPath}`,
			);
		} catch (dbError) {
			failedCount++;
			console.error(`❌ Gagal insert data untuk ${row.nim}:`, dbError);
		}
	}

	fs.writeFileSync(UNRESOLVED_REPORT, unresolvedRows.join("\n"));

	console.log("\n================================================");
	console.log(`Total baris CSV: ${rows.length}`);
	console.log(`Berhasil insert: ${insertedCount}`);
	console.log(`Gagal insert (error DB): ${failedCount}`);
	console.log(`createdAt kosong/tak terparse (fallback ke defaultNow): ${missingCreatedAtCount}`);
	console.log(`Butuh review manual file (lihat ${UNRESOLVED_REPORT}): ${reviewCount}`);
	console.log("================================================");
	process.exit(0);
}

seed();
