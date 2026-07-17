import fs from "fs";
import csv from "csv-parser";
import { db } from "../src/server/db";
import { submissions } from "../src/server/db/schema";

const SEED_FILE = "scripts/READY_TO_SEED_DATA.csv";

async function seed() {
  const results: any[] = [];

  console.log("Membaca file data mentah...");

  fs.createReadStream(SEED_FILE)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log(
        `Mulai melakukan seeding ${results.length} data ke database...`,
      );

      for (const row of results) {
        // Karena ada perbedaan format CSV (dari string kembali ke boolean/null)
        const mappedData = {
          trackingCode: row.trackingCode,
          namaLengkap: row.namaLengkap,
          nim: row.nim,
          dosenPembimbingPenguji: row.dosenPembimbingPenguji || null,
          judulSkripsi: row.judulSkripsi,
          alamatLengkap: row.alamatLengkap || null,
          noTelp: row.noTelp || null,
          programStudi: row.programStudi as any, // Enum type assertion
          email: row.email || null,
          sumbanganBuku: row.sumbanganBuku as any, // Enum type assertion
          kartuMahasiswaPath: row.kartuExpectedFileName || null,
          kartuMahasiswaOriginalName: row.kartuUrlOriginal
            ? "Legacy File Drive"
            : null,
          skripsiPath: row.skripsiExpectedFileName || "data_legacy_tanpa_file",
          skripsiOriginalName: row.skripsiUrlOriginal
            ? "Legacy File Drive"
            : null,
          sourceType: row.sourceType as any, // Enum type assertion
          status: row.status as any, // Enum type assertion
          suratNomor: row.suratNomor || null,
        };

        try {
          await db.insert(submissions).values(mappedData);
          console.log(`✅ Berhasil insert data: ${row.nim}`);
        } catch (dbError) {
          console.error(`❌ Gagal insert data untuk ${row.nim}:`, dbError);
        }
      }

      console.log("Seeding selesai!");
      process.exit(0);
    });
}

seed();
