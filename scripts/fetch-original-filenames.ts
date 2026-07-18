import fs from "fs";
import csv from "csv-parser";

// Input: CSV yang sudah punya kartuUrlOriginal & skripsiUrlOriginal
const INPUT_CSV = "scripts/READY_TO_SEED_DATA.csv";
const OUTPUT_CSV = "scripts/READY_TO_SEED_DATA_WITH_FILENAMES.csv";

const DELAY_MS = 800; // jeda antar request, hindari rate-limit Google

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Ambil file ID dari berbagai bentuk URL Google Drive
function extractDriveId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchOriginalFileName(
  url: string,
): Promise<{ name: string | null; status: string }> {
  const id = extractDriveId(url);
  if (!id) return { name: null, status: "invalid_url" };

  const viewUrl = `https://drive.google.com/file/d/${id}/view`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(viewUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) {
        if (attempt === 3) return { name: null, status: `http_${res.status}` };
        await sleep(DELAY_MS * attempt);
        continue;
      }
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/is);
      if (!titleMatch) return { name: null, status: "no_title_found" };

      let title = decodeHtmlEntities(titleMatch[1].trim());
      title = title.replace(/\s*-\s*Google Drive\s*$/i, "").trim();

      if (!title || title.toLowerCase().includes("google drive")) {
        return { name: null, status: "title_unparseable" };
      }
      return { name: title, status: "ok" };
    } catch (err: any) {
      if (attempt === 3) return { name: null, status: `error_${err.message}` };
      await sleep(DELAY_MS * attempt);
    }
  }
  return { name: null, status: "unknown_error" };
}

// CSV writer sederhana (handle koma/kutip/newline)
function csvEscape(val: any): string {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function run() {
  const rows: any[] = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on("data", (d) => rows.push(d))
      .on("end", () => resolve())
      .on("error", reject);
  });

  console.log(`Ditemukan ${rows.length} baris. Mulai fetch nama file asli...`);

  const originalHeaders = Object.keys(rows[0]);
  const newHeaders = [
    ...originalHeaders,
    "kartuActualFileName",
    "kartuFetchStatus",
    "skripsiActualFileName",
    "skripsiFetchStatus",
  ];

  const outputLines: string[] = [newHeaders.map(csvEscape).join(",")];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nim = row.nim || "TIDAK_ADA";
    console.log(`[${i + 1}/${rows.length}] ${nim}...`);

    let kartuActualFileName = "";
    let kartuFetchStatus = "skipped_no_url";
    if (row.kartuUrlOriginal) {
      const result = await fetchOriginalFileName(row.kartuUrlOriginal);
      kartuActualFileName = result.name || "";
      kartuFetchStatus = result.status;
      await sleep(DELAY_MS);
    }

    let skripsiActualFileName = "";
    let skripsiFetchStatus = "skipped_no_url";
    if (row.skripsiUrlOriginal) {
      const result = await fetchOriginalFileName(row.skripsiUrlOriginal);
      skripsiActualFileName = result.name || "";
      skripsiFetchStatus = result.status;
      await sleep(DELAY_MS);
    }

    const outRow = {
      ...row,
      kartuActualFileName,
      kartuFetchStatus,
      skripsiActualFileName,
      skripsiFetchStatus,
    };
    outputLines.push(newHeaders.map((h) => csvEscape(outRow[h])).join(","));

    // Tulis progresif tiap 50 baris, biar aman kalau proses terhenti di tengah
    if (i % 50 === 0) {
      fs.writeFileSync(OUTPUT_CSV, outputLines.join("\n"));
    }
  }

  fs.writeFileSync(OUTPUT_CSV, outputLines.join("\n"));
  console.log(`Selesai. Hasil disimpan di ${OUTPUT_CSV}`);

  const failed = rows.length;
  console.log(
    "Cek kolom kartuFetchStatus/skripsiFetchStatus di CSV output untuk baris yang gagal (bukan 'ok' atau 'skipped_no_url').",
  );
}

run();
