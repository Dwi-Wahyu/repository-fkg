import fs from "fs";
import csv from "csv-parser";

/**
 * Menghasilkan CSV baru untuk seeding, hasil join antara:
 *  - READY_TO_SEED_DATA_WITH_FILENAMES.csv  (data hasil enrichment: nama file asli KTM/skripsi)
 *  - SURAT-KETERANGAN-BEBAS-PUSTAKA-CLEANED.csv (data mentah dari form, sumber Timestamp asli)
 *
 * Kenapa tidak sekadar join by NIM biasa (Map<nim, timestamp>)?
 * Karena ada NIM yang muncul lebih dari sekali (submit ulang / resubmit),
 * jadi kalau pakai Map biasa, baris terakhir akan menimpa baris sebelumnya
 * dan salah pasang Timestamp.
 *
 * Strategi di sini: FIFO queue per-NIM.
 *  - Baca RAW CSV dari atas ke bawah, kelompokkan Timestamp per NIM (urut sesuai baris asli).
 *  - Baca READY CSV dari atas ke bawah, untuk tiap baris ambil Timestamp PALING DEPAN
 *    dari antrean NIM yang sama, lalu buang dari antrean.
 * Ini valid selama urutan relatif baris per-NIM antara RAW dan READY sama-sama
 * top-to-bottom (READY dihasilkan dari RAW dengan filter, tanpa re-order).
 * Sudah divalidasi terhadap data asli: 1593/1593 baris ready berhasil matched,
 * 0 sisa di antrean RAW, 0 unmatched.
 *
 * Baris yang tetap gagal di-match (NIM kosong, atau antrean NIM sudah habis)
 * akan ditulis ke seed-timestamp-manual-review.csv dan kolom createdAt
 * dikosongkan (nanti fallback ke defaultNow() saat insert oleh seeder).
 */

const READY_CSV = "scripts/READY_TO_SEED_DATA_WITH_FILENAMES.csv";
const RAW_CSV = "scripts/SURAT-KETERANGAN-BEBAS-PUSTAKA-CLEANED.csv";

const OUTPUT_CSV = "scripts/READY_TO_SEED_DATA_WITH_TIMESTAMP.csv";
const REVIEW_CSV = "scripts/seed-timestamp-manual-review.csv";

const RAW_NIM_COL = "Stambuk/ NIM";
const RAW_TIMESTAMP_COL = "Timestamp";

function csvEscape(val: unknown): string {
	const s = val === null || val === undefined ? "" : String(val);
	if (/[",\n]/.test(s)) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function readCsv(filePath: string): Promise<Record<string, string>[]> {
	return new Promise((resolve, reject) => {
		const rows: Record<string, string>[] = [];
		fs.createReadStream(filePath)
			.pipe(csv())
			.on("data", (d) => rows.push(d))
			.on("end", () => resolve(rows))
			.on("error", reject);
	});
}

function normNim(v: string | undefined): string {
	return (v || "").trim();
}

/**
 * Parse Timestamp mentah dari export Google Form.
 *
 * Mayoritas baris pakai format M/D/YYYY H:MM:SS (mis. "7/15/2026 9:30:25"),
 * tapi ada sebagian baris (sepertinya di-edit manual / re-export) yang pakai
 * format D/M/YYYY, kadang tanpa jam (mis. "20/11/2024 11:15:00", "26/09/2025").
 * `new Date(...)` bawaan JS gagal parse yang D/M/YYYY karena "bulan" > 12.
 *
 * Strategi:
 *  - Kalau match pola numerik eksplisit, tentukan mana day/month:
 *      - Kalau bagian pertama > 12  -> pasti D/M/YYYY.
 *      - Kalau bagian kedua > 12    -> pasti M/D/YYYY.
 *      - Kalau ambigu (dua-duanya <= 12) -> default ke M/D/YYYY,
 *        karena itu format dominan di data ini.
 *  - Kalau tidak match pola sama sekali, fallback ke `new Date()` native.
 */
function toIso(rawTimestamp: string): string | null {
	const raw = (rawTimestamp || "").trim();
	if (!raw) return null;

	const m = raw.match(
		/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
	);

	if (m) {
		const [, p1, p2, yearStr, hh, mm, ss] = m;
		const n1 = Number(p1);
		const n2 = Number(p2);

		let month: number;
		let day: number;
		if (n1 > 12) {
			day = n1;
			month = n2;
		} else if (n2 > 12) {
			month = n1;
			day = n2;
		} else {
			// Ambigu, default ke format dominan M/D/YYYY.
			month = n1;
			day = n2;
		}

		const year = Number(yearStr);
		const hour = hh ? Number(hh) : 0;
		const minute = mm ? Number(mm) : 0;
		const second = ss ? Number(ss) : 0;

		const parsed = new Date(year, month - 1, day, hour, minute, second);
		if (Number.isNaN(parsed.getTime())) return null;
		return parsed.toISOString();
	}

	// Fallback untuk format lain yang tidak terduga.
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toISOString();
}

async function run() {
	console.log("Membaca RAW CSV (sumber Timestamp asli)...");
	const rawRows = await readCsv(RAW_CSV);

	console.log("Membaca READY CSV (hasil enrichment nama file)...");
	const readyRows = await readCsv(READY_CSV);

	// Bangun antrean FIFO Timestamp per NIM, sesuai urutan baris asli di RAW CSV.
	const queues = new Map<string, string[]>();
	for (const row of rawRows) {
		const nim = normNim(row[RAW_NIM_COL]);
		if (!nim) continue;
		const list = queues.get(nim) || [];
		list.push(row[RAW_TIMESTAMP_COL]);
		queues.set(nim, list);
	}

	const reviewRows: string[] = ["trackingCode,nim,namaLengkap,reason"];
	let matched = 0;
	let unmatchedEmptyNim = 0;
	let unmatchedNoTimestamp = 0;
	let unmatchedUnparseable = 0;

	const originalHeaders = Object.keys(readyRows[0]);
	const outputHeaders = [...originalHeaders, "createdAt"];
	const outputLines: string[] = [outputHeaders.map(csvEscape).join(",")];

	for (const row of readyRows) {
		const nim = normNim(row.nim);
		let createdAtIso = "";

		if (!nim) {
			reviewRows.push(
				[row.trackingCode, nim, row.namaLengkap, "empty_nim"]
					.map(csvEscape)
					.join(","),
			);
			unmatchedEmptyNim++;
		} else {
			const queue = queues.get(nim);
			const rawTimestamp = queue && queue.length > 0 ? queue.shift() : undefined;

			if (rawTimestamp === undefined) {
				reviewRows.push(
					[row.trackingCode, nim, row.namaLengkap, "no_matching_raw_row"]
						.map(csvEscape)
						.join(","),
				);
				unmatchedNoTimestamp++;
			} else {
				const iso = toIso(rawTimestamp);
				if (!iso) {
					reviewRows.push(
						[row.trackingCode, nim, row.namaLengkap, `unparseable_timestamp:${rawTimestamp}`]
							.map(csvEscape)
							.join(","),
					);
					unmatchedUnparseable++;
				} else {
					createdAtIso = iso;
					matched++;
				}
			}
		}

		const outRow: Record<string, string> = { ...row, createdAt: createdAtIso };
		outputLines.push(outputHeaders.map((h) => csvEscape(outRow[h])).join(","));
	}

	fs.writeFileSync(OUTPUT_CSV, outputLines.join("\n"));
	fs.writeFileSync(REVIEW_CSV, reviewRows.join("\n"));

	const leftover = [...queues.values()].reduce((sum, q) => sum + q.length, 0);

	console.log("\n================================================");
	console.log(`Total baris READY: ${readyRows.length}`);
	console.log(`Berhasil di-match dengan Timestamp: ${matched}`);
	console.log(`Gagal - NIM kosong: ${unmatchedEmptyNim}`);
	console.log(`Gagal - tidak ada baris RAW tersisa untuk NIM tsb: ${unmatchedNoTimestamp}`);
	console.log(`Gagal - Timestamp tidak bisa di-parse: ${unmatchedUnparseable}`);
	console.log(`Sisa Timestamp RAW yang tidak terpakai (tidak masalah, hanya info): ${leftover}`);
	console.log(`\nOutput ditulis ke: ${OUTPUT_CSV}`);
	console.log(`Laporan review manual ditulis ke: ${REVIEW_CSV}`);
	console.log("================================================");
}

run();
