import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../src/server/db";
import { submissions } from "../src/server/db/schema";

const SEED_FILE = "scripts/READY_TO_SEED_DATA_WITH_FILENAMES.csv";
const RAW_CSV = "scripts/SURAT-KETERANGAN-BEBAS-PUSTAKA-CLEANED.csv"; // untuk join Timestamp asli

const KTM_DIR = path.join(process.cwd(), "uploads", "raw-file", "ktm");
const DOKUMEN_DIR = path.join(process.cwd(), "uploads", "raw-file", "dokumen");

const TARGET_KTM_DIR = path.join(process.cwd(), "uploads", "kartu-mahasiswa");
const TARGET_SKRIPSI_DIR = path.join(process.cwd(), "uploads", "skripsi");

const UNRESOLVED_REPORT = "scripts/seed-manual-review.csv";

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
  // Path relatif yang disimpan ke DB (sesuai konvensi submissionFunctions.ts)
  return path.join("uploads", kind === "kartu" ? "kartu-mahasiswa" : "skripsi", fileName);
}

async function seed() {
  console.log("Membaca CSV hasil enrichment...");
  const rows = await readCsv(SEED_FILE);

  console.log("Membaca CSV mentah untuk join Timestamp...");
  const rawRows = await readCsv(RAW_CSV);

  // index nim -> Timestamp (untuk createdAt). Tandai nim yang muncul >1 kali (nim tidak reliable, jangan dipakai).
  const timestampByNim = new Map<string, string>();
  const nimSeenCount = new Map<string, number>();
  for (const r of rawRows) {
    const nim = (r["Stambuk/ NIM"] || "").trim();
    if (!nim) continue;
    nimSeenCount.set(nim, (nimSeenCount.get(nim) || 0) + 1);
    timestampByNim.set(nim, r["Timestamp"]);
  }

  const ktmIndex = buildFileIndex(KTM_DIR);
  const dokumenIndex = buildFileIndex(DOKUMEN_DIR);

  const unresolvedRows: string[] = [
    "trackingCode,nim,namaLengkap,field,reason",
  ];

  let insertedCount = 0;
  let reviewCount = 0;

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

    // ---- Resolve createdAt ----
    let createdAt: Date | undefined = undefined;
    const isNimReliable = nim && nim !== "1" && (nimSeenCount.get(nim) || 0) === 1;
    if (isNimReliable && timestampByNim.has(nim)) {
      const raw = timestampByNim.get(nim)!;
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) createdAt = parsed;
    }

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
      sourceType: row.sourceType,
      status: row.status,
      suratNomor: row.suratNomor || null,
    };
    if (createdAt) mappedData.createdAt = createdAt;

    try {
      await db.insert(submissions).values(mappedData);
      insertedCount++;
      console.log(`✅ ${row.nim} — kartu: ${kartuMahasiswaPath ?? "-"}, skripsi: ${skripsiPath}`);
    } catch (dbError) {
      console.error(`❌ Gagal insert data untuk ${row.nim}:`, dbError);
    }
  }

  fs.writeFileSync(UNRESOLVED_REPORT, unresolvedRows.join("\n"));

  console.log("\n================================================");
  console.log(`Seeding selesai. Berhasil insert: ${insertedCount}`);
  console.log(`Butuh review manual: ${reviewCount} (lihat ${UNRESOLVED_REPORT})`);
  console.log("================================================");
  process.exit(0);
}

seed();
