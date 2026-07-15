import fs from "node:fs/promises";
import { join } from "node:path";
import { db } from "../../src/server/db";
import { submissions } from "../../src/server/db/schema";
import type { StagingEntry } from "./lib/types";

const STAGING_REPORT = join(process.cwd(), "staging", "legacy-thesis-report.json");
const TARGET_SKRIPSI_DIR = join(process.cwd(), "uploads", "skripsi");

async function main() {
	console.log("🚀 Starting Fase C: Committing approved staging entries to database...");

	try {
		await fs.access(STAGING_REPORT);
	} catch {
		console.error(`❌ Staging report not found: ${STAGING_REPORT}`);
		console.log("Please run Phase A (extract.ts) first.");
		process.exit(1);
	}

	const content = await fs.readFile(STAGING_REPORT, "utf-8");
	const entries: StagingEntry[] = JSON.parse(content);

	const approvedEntries = entries.filter((e) => e.reviewedAndApproved === true);
	const skippedCount = entries.length - approvedEntries.length;

	console.log(`📊 Staging report summary:`);
	console.log(`   - Total entries: ${entries.length}`);
	console.log(`   - Approved for commit: ${approvedEntries.length}`);
	console.log(`   - Skipped (not approved yet): ${skippedCount}`);

	if (approvedEntries.length === 0) {
		console.log("\n⚠️ No approved entries found to commit.");
		console.log("👉 Set 'reviewedAndApproved': true in staging/legacy-thesis-report.json for verified entries.");
		process.exit(0);
	}

	// Ensure target upload directory exists
	await fs.mkdir(TARGET_SKRIPSI_DIR, { recursive: true });

	let committedCount = 0;
	let errorCount = 0;

	for (const entry of approvedEntries) {
		const { judulSkripsi, namaLengkap, nim, programStudi, dosenPembimbingPenguji } = entry.extracted;

		// 1. Validation
		if (!judulSkripsi || !namaLengkap || !nim || !programStudi) {
			console.error(`❌ Skip entry for ${entry.originalFileName}: Missing core fields.`);
			console.error(`   Required: judulSkripsi, namaLengkap, nim, programStudi`);
			errorCount++;
			continue;
		}

		try {
			// 2. Idempotency Check
			// Check if a record with the same NIM and Judul exists
			const existing = await db.query.submissions.findFirst({
				where: (s, { and, eq }) =>
					and(eq(s.nim, nim), eq(s.judulSkripsi, judulSkripsi)),
			});

			if (existing) {
				console.log(`⚠️ Skipping duplicate entry (already exists): [${nim}] - ${namaLengkap} - ${judulSkripsi.substring(0, 50)}...`);
				continue;
			}

			// 3. Generate Tracking Code
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
			const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
			const trackingCode = `BP-${dateStr}-${randStr}`;

			// 4. Copy PDF to uploads/skripsi
			const timestamp = Date.now();
			const newFileName = `${trackingCode}-skripsi-${timestamp}.pdf`;
			const newRelPath = join("uploads", "skripsi", newFileName);
			const newAbsPath = join(process.cwd(), newRelPath);

			const sourceAbsPath = join(process.cwd(), entry.sourceFilePath);

			// Copy file
			await fs.copyFile(sourceAbsPath, newAbsPath);

			// 5. Database insert
			await db.insert(submissions).values({
				trackingCode,
				namaLengkap,
				nim,
				judulSkripsi,
				programStudi: programStudi as any,
				dosenPembimbingPenguji,
				skripsiPath: newRelPath,
				skripsiOriginalName: entry.originalFileName,
				status: "diverifikasi",
				sourceType: "import_legacy",
				catatanAdmin: "Data historis — diimpor dari arsip PDF, tidak melalui form pengajuan.",
				createdAt: new Date(),
			});

			console.log(`✅ Successfully committed: ${namaLengkap} (${nim}) - ${trackingCode}`);
			committedCount++;
		} catch (err: any) {
			console.error(`❌ Failed to commit entry ${entry.originalFileName}:`, err.message);
			errorCount++;
		}
	}

	console.log("\n================================================");
	console.log("🎉 DB Commit Phase Finished!");
	console.log(`   - Successfully committed: ${committedCount}`);
	console.log(`   - Skipped/Errors: ${errorCount}`);
	console.log("================================================");
}

main().catch((err) => {
	console.error("❌ Commit script failed:", err);
});
