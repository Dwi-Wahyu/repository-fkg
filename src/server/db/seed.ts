import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./index";
import { submissions, users } from "./schema";

async function main() {
	console.log("🚀 Seeding MySQL database...");
	const totalStartTime = Date.now();

	// Ensure upload dirs exist
	const base = join(process.cwd(), "uploads");
	await mkdir(join(base, "kartu-mahasiswa"), { recursive: true });
	await mkdir(join(base, "skripsi"), { recursive: true });

	// Create dummy files
	const dummyPdfContent = "%PDF-1.4 ... dummy pdf content ...";
	const kmDummyPath = join(base, "kartu-mahasiswa", "dummy.pdf");
	const skripsiDummyPath = join(base, "skripsi", "dummy.pdf");
	await Bun.write(kmDummyPath, dummyPdfContent);
	await Bun.write(skripsiDummyPath, dummyPdfContent);

	console.log("👤 Finding admin user...");
	let adminId = 1;
	const existingAdmin = await db.query.users.findFirst({
		where: (u, { eq }) => eq(u.username, "admin"),
	});
	if (existingAdmin) {
		adminId = existingAdmin.id;
		console.log(`✅ Admin user found with ID: ${adminId}`);
	} else {
		console.log("⚠️ Admin user not found. Using default adminId = 1.");
	}

	console.log("📄 Seeding mock submissions...");
	// Clear submissions first
	await db.delete(submissions);

	const mockSubmissions = [
		{
			namaLengkap: "Andi Ahmad",
			nim: "I011201001",
			dosenPembimbingPenguji:
				"Prof. Dr. drg. Sudirman, M.S.\ndrg. Rahmawati, Sp.Pros",
			judulSkripsi:
				"Analisis Efektivitas Penggunaan Dental Implan Berbahan Titanium pada Pasien Usia Lanjut",
			alamatLengkap: "Jl. Perintis Kemerdekaan KM 10, Tamalanrea, Makassar",
			noTelp: "081234567890",
			programStudi: "s1_gigi",
			email: "andi.ahmad@student.unhas.ac.id",
			status: "diverifikasi",
			catatanAdmin: "Berkas lengkap dan sesuai.",
			verifiedByUserId: adminId,
			verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
			createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
		},
		{
			namaLengkap: "Budi Santoso",
			nim: "I011201015",
			dosenPembimbingPenguji: "drg. Hasanuddin, Sp.KGA\ndrg. Fatimah, Sp.Perio",
			judulSkripsi:
				"Hubungan Kebersihan Gigi dan Mulut terhadap Karies Gigi Anak Sekolah Dasar di Kota Makassar",
			alamatLengkap: "Perumahan Dosen Unhas Tamalanrea Blok B/12, Makassar",
			noTelp: "082199887766",
			programStudi: "s1_gigi",
			email: "budi.santoso@student.unhas.ac.id",
			status: "pending",
			catatanAdmin: null,
			verifiedByUserId: null,
			verifiedAt: null,
			createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
		},
		{
			namaLengkap: "Citra Amelia",
			nim: "I021211005",
			dosenPembimbingPenguji: "drg. Yusuf Sp.BM\ndrg. Zainuddin Sp.Pros",
			judulSkripsi:
				"Penatalaksanaan Odontektomi Gigi Molar Ketiga Impaksi: Studi Kasus di RSGM Unhas",
			alamatLengkap: "Jl. Sunu No. 45, Makassar",
			noTelp: "085244556677",
			programStudi: "profesi_gigi",
			email: "citra.amelia@student.unhas.ac.id",
			status: "ditolak",
			catatanAdmin:
				"File Skripsi yang diunggah belum ditandatangani oleh Dosen Pembimbing.",
			verifiedByUserId: adminId,
			verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
			createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
		},
		{
			namaLengkap: "Dian Pratama",
			nim: "I031221008",
			dosenPembimbingPenguji: "Prof. drg. Mansur, Ph.D\ndrg. Hermawan Sp.Ort",
			judulSkripsi:
				"Evaluasi Perawatan Ortodonti Cekat Menggunakan Metode Peer Assessment Rating (PAR) Index",
			alamatLengkap: "Jl. Hertasning Baru No. 88, Makassar",
			noTelp: "081398765432",
			programStudi: "ppdgs_ortodonsia",
			email: "dian.pratama@student.unhas.ac.id",
			status: "pending",
			catatanAdmin: null,
			verifiedByUserId: null,
			verifiedAt: null,
			createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
		},
		{
			namaLengkap: "Eka Wulandari",
			nim: "I041212003",
			dosenPembimbingPenguji: "drg. Sri Wahyuni Sp.KG\ndrg. Nurul Sp.KGA",
			judulSkripsi:
				"Perbandingan Kekuatan Tekan Resin Komposit Nano Hybrid dengan Resin Komposit Bulk-Fill",
			alamatLengkap: "Jl. Alauddin No. 120, Rappocini, Makassar",
			noTelp: "089654321098",
			programStudi: "ppdgs_konservasi",
			email: "eka.wulandari@student.unhas.ac.id",
			status: "diverifikasi",
			catatanAdmin: "Sumbangsih buku sudah diterima di perpustakaan.",
			verifiedByUserId: adminId,
			verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
			createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
		},
		{
			namaLengkap: "Fahri Ramadhan",
			nim: "I051221010",
			dosenPembimbingPenguji: "drg. Ridwan Sp.BM\ndrg. Aminah M.Kes",
			judulSkripsi:
				"Prevalensi Karang Gigi Pada Pasien Diabetes Melitus Tipe 2 di RSUP Dr. Wahidin Sudirohusodo",
			alamatLengkap: "Jl. Racing Centre No. 15, Makassar",
			noTelp: "081299001122",
			programStudi: "ppdgs_radiologi",
			email: "fahri.ramadhan@student.unhas.ac.id",
			status: "pending",
			catatanAdmin: null,
			verifiedByUserId: null,
			verifiedAt: null,
			createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
		},
	];

	let idx = 0;
	for (const data of mockSubmissions) {
		const trackingCode = `BP-2026071${5 - idx}-00${idx + 1}`;
		try {
			await db.insert(submissions).values({
				namaLengkap: data.namaLengkap,
				nim: data.nim,
				dosenPembimbingPenguji: data.dosenPembimbingPenguji,
				judulSkripsi: data.judulSkripsi,
				alamatLengkap: data.alamatLengkap,
				noTelp: data.noTelp,
				programStudi: data.programStudi as any,
				email: data.email,
				status: data.status as any,
				catatanAdmin: data.catatanAdmin,
				verifiedByUserId: data.verifiedByUserId,
				verifiedAt: data.verifiedAt,
				createdAt: data.createdAt,
				trackingCode,
				kartuMahasiswaPath: "uploads/kartu-mahasiswa/dummy.pdf",
				kartuMahasiswaOriginalName: "kartu-mahasiswa-asli.pdf",
				skripsiPath: "uploads/skripsi/dummy.pdf",
				skripsiOriginalName: "skripsi-final-ttd.pdf",
				sumbanganBuku: "tidak_ada",
			});
			console.log(`✅ Submission for '${data.namaLengkap}' seeded.`);
		} catch (e) {
			console.error(`⚠️ Submission '${data.namaLengkap}' seeding failed:`, e);
		}
		idx++;
	}

	const totalDuration = (Date.now() - totalStartTime) / 1000;
	console.log(`\n🎉 SEEDING COMPLETED IN ${totalDuration.toFixed(2)} SECONDS!`);
	process.exit(0);
}

main().catch((err) => {
	console.error("❌ Seeding failed:", err);
	process.exit(1);
});
