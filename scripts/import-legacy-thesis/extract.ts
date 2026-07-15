import fs from "node:fs/promises";
import { join, basename } from "node:path";
import { PDFParse } from "pdf-parse";
import { parseCoverPage } from "./lib/parseCoverPage";
import type { StagingEntry } from "./lib/types";

const SOURCE_DIR = join(process.cwd(), "source-pdf");
const STAGING_DIR = join(process.cwd(), "staging");
const REPORT_PATH = join(STAGING_DIR, "legacy-thesis-report.json");

// Document non-standard indicators in filename
const NON_STANDARD_KEYWORDS = [
	"article text",
	"manuscript",
	"review article",
	"template",
	"draft",
];

async function main() {
	console.log("🚀 Starting Fase A: Metadata Extraction from PDF covers...");

	// Ensure directories exist
	await fs.mkdir(STAGING_DIR, { recursive: true });

	try {
		await fs.access(SOURCE_DIR);
	} catch {
		console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
		process.exit(1);
	}

	// Read source files
	const allFiles = await fs.readdir(SOURCE_DIR);
	const pdfFiles = allFiles.filter(
		(f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("._"),
	);

	console.log(`📂 Found ${pdfFiles.length} PDF files to process in ${SOURCE_DIR}`);

	const stagingEntries: StagingEntry[] = [];
	let successCount = 0;
	let manualReviewCount = 0;

	for (let i = 0; i < pdfFiles.length; i++) {
		const filename = pdfFiles[i];
		const filePath = join(SOURCE_DIR, filename);
		const progress = `[${i + 1}/${pdfFiles.length}]`;

		console.log(`${progress} Processing: ${filename}`);

		const lowercaseName = filename.toLowerCase();
		const isNonStandardFilename = NON_STANDARD_KEYWORDS.some((kw) =>
			lowercaseName.includes(kw),
		);

		let parser: PDFParse | null = null;
		try {
			const buffer = await fs.readFile(filePath);
			parser = new PDFParse({ data: buffer });

			// 1. Extract cover page (page 1) text
			const page1Data = await parser.getText({ first: 1, last: 1 });
			const page1Text = page1Data.text || "";

			// 2. Extract first 4 pages text (for adviser research)
			const pages1to4Data = await parser.getText({ first: 1, last: 4 });
			const fullText = pages1to4Data.text || "";

			// 3. Run heuristics
			const result = parseCoverPage(page1Text, fullText);

			// 4. Determine confidence flags
			const confidence = {
				judulSkripsi: result.judulSkripsi ? ("extracted" as const) : ("not_found" as const),
				namaLengkap: result.namaLengkap ? ("extracted" as const) : ("not_found" as const),
				nim: result.nim ? ("extracted" as const) : ("not_found" as const),
				programStudi: result.programStudi ? ("extracted" as const) : ("not_found" as const),
				dosenPembimbingPenguji: result.dosenPembimbingPenguji ? ("extracted" as const) : ("not_found" as const),
			};

			// Required fields for validation: judul, nama, nim, prodi, tahun
			const missingRequired =
				!result.judulSkripsi ||
				!result.namaLengkap ||
				!result.nim ||
				!result.programStudi ||
				!result.tahun;

			const needsManualReview = isNonStandardFilename || missingRequired;

			if (needsManualReview) {
				manualReviewCount++;
			} else {
				successCount++;
			}

			// Capture clean raw cover text snippet (first 1000 characters)
			const rawCoverTextSnippet = page1Text
				.replace(/\s+/g, " ")
				.substring(0, 1000)
				.trim();

			stagingEntries.push({
				originalFileName: filename,
				sourceFilePath: join("source-pdf", filename),
				extracted: {
					judulSkripsi: result.judulSkripsi,
					namaLengkap: result.namaLengkap,
					nim: result.nim,
					programStudi: result.programStudi,
					tahun: result.tahun,
					dosenPembimbingPenguji: result.dosenPembimbingPenguji,
				},
				confidence,
				needsManualReview,
				rawCoverTextSnippet,
				reviewedAndApproved: false, // Default is false, manual verification required
			});
		} catch (err: any) {
			console.error(`⚠️ Error parsing ${filename}:`, err.message);
			manualReviewCount++;
			stagingEntries.push({
				originalFileName: filename,
				sourceFilePath: join("source-pdf", filename),
				extracted: {
					judulSkripsi: null,
					namaLengkap: null,
					nim: null,
					programStudi: null,
					tahun: null,
					dosenPembimbingPenguji: null,
				},
				confidence: {
					judulSkripsi: "not_found",
					namaLengkap: "not_found",
					nim: "not_found",
					programStudi: "not_found",
					dosenPembimbingPenguji: "not_found",
				},
				needsManualReview: true,
				rawCoverTextSnippet: `ERROR: ${err.message}`,
				reviewedAndApproved: false,
			});
		} finally {
			if (parser) {
				await parser.destroy();
			}
		}
	}

	// Write staging report JSON pretty-printed
	await fs.writeFile(REPORT_PATH, JSON.stringify(stagingEntries, null, 2));

	console.log("\n================================================");
	console.log(`✅ Extraction Completed!`);
	console.log(`📁 Report Saved: ${REPORT_PATH}`);
	console.log(`📊 Statistics:`);
	console.log(`   - Total Files Processed: ${stagingEntries.length}`);
	console.log(`   - High Confidence (No manual review needed): ${successCount}`);
	console.log(`   - Low Confidence / Needs Review: ${manualReviewCount}`);
	console.log("\n👉 Please review staging/legacy-thesis-report.json, adjust any missing fields, and set reviewedAndApproved to true before committing.");
	console.log("================================================");
}

main().catch((err) => {
	console.error("❌ Extraction script failed:", err);
});
