import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const CSV_FILE = "scripts/SURAT-KETERANGAN-BEBAS-PUSTAKA-CLEANED.csv";

// Tentukan path untuk masing-masing folder
const RAW_DIR = path.join(process.cwd(), "uploads", "raw-file");
const KTM_DIR = path.join(RAW_DIR, "ktm");
const DOKUMEN_DIR = path.join(RAW_DIR, "dokumen");

// Pastikan kedua direktori upload tersedia
[KTM_DIR, DOKUMEN_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Path untuk eksekusi Brave versi Flatpak (User level)
const BRAVE_EXECUTABLE_PATH =
  "/home/dwiwahyuilahi/.local/share/flatpak/exports/bin/com.brave.Browser";

// Data directory untuk Brave versi Flatpak
const BRAVE_USER_DATA_DIR =
  "/home/dwiwahyuilahi/.var/app/com.brave.Browser/config/BraveSoftware/Brave-Browser";

// Fungsi Download File via Google Drive menggunakan Brave dengan target direktori dinamis
async function downloadFromDrive(page: any, url: string, targetDir: string) {
  if (!url || !url.includes("drive.google.com")) return;

  try {
    // Ubah URL view menjadi direct download link
    const downloadUrl = url
      .replace("open?id=", "uc?export=download&id=")
      .replace("/view", "")
      .replace("file/d/", "uc?export=download&id=");

    const client = await page.target().createCDPSession();
    // Instruksikan browser untuk menyimpan file ke target direktori (KTM / Dokumen)
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: targetDir,
    });

    try {
      // Buka URL. Jika langsung mendownload, Puppeteer akan melempar ERR_ABORTED
      await page.goto(downloadUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
    } catch (navError: any) {
      if (!navError.message.includes("net::ERR_ABORTED")) {
        throw navError;
      }
    }

    // Handle halaman peringatan virus Google Drive jika file besar
    try {
      const downloadAnywayBtn = await page.$("#uc-download-link");
      if (downloadAnywayBtn) {
        await downloadAnywayBtn.click();
      }
    } catch (e) {
      // Abaikan jika elemen tidak ditemukan
    }

    // Jeda paksa 3 detik agar browser memiliki waktu untuk membuat file .crdownload (mencegah error race condition)
    await Bun.sleep(3000);

    // Tunggu hingga tidak ada lagi file sementara (.crdownload) di folder
    let isDownloading = true;
    let waitTime = 0;
    while (isDownloading && waitTime < 60000) {
      // Timeout maksimal 60 detik
      const files = fs.readdirSync(targetDir);
      isDownloading = files.some((file) => file.endsWith(".crdownload"));

      if (isDownloading) {
        await Bun.sleep(2000);
        waitTime += 2000;
      }
    }

    // Beri ekstra jeda agar OS selesai mengubah file dari .crdownload ke nama aslinya
    await Bun.sleep(1000);
  } catch (error) {
    console.error(`Gagal mendownload ${url}:`, error);
  }
}

async function run() {
  console.log("Membuka sesi Brave Browser (Headless Mode)...");
  const browser = await puppeteer.launch({
    executablePath: BRAVE_EXECUTABLE_PATH,
    userDataDir: BRAVE_USER_DATA_DIR,
    headless: true, // Berjalan di latar belakang
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-extensions",
    ],
  });

  const page = await browser.newPage();
  const results: any[] = [];

  // Parse CSV
  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log(
        `Ditemukan ${results.length} baris data. Memulai proses download...`,
      );

      for (const row of results) {
        const nim = row["Stambuk/ NIM"] || "TIDAK_ADA";
        console.log(`Memproses download untuk mahasiswa: ${nim}...`);

        const kartuUrl =
          row["Upload Kartu Mahasiswa/ Kartu Anggota Perpustakaan "];
        const skripsiUrl =
          row[
            "Skripsi/Marin/KTI/Tesis/Disertasi (Soft File yg telah di TTD Dekan/Pembimbing) "
          ];

        // Download KTM ke folder KTM_DIR
        await downloadFromDrive(page, kartuUrl, KTM_DIR);
        // Download Skripsi ke folder DOKUMEN_DIR
        await downloadFromDrive(page, skripsiUrl, DOKUMEN_DIR);
      }

      console.log("Semua proses download selesai.");
      await browser.close();
      process.exit(0);
    });
}

run();
