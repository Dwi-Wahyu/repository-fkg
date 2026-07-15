import { mkdir, unlink, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import * as yup from "yup";
import { getUserFromSession } from "./auth";
import { db } from "./db";
import { programStudiMap, submissions } from "./db/schema";

// Yup validation schema for texts
export const submissionValidationSchema = yup.object().shape({
	namaLengkap: yup
		.string()
		.required("Nama Lengkap wajib diisi")
		.min(3, "Minimal 3 karakter"),
	nim: yup
		.string()
		.required("NIM wajib diisi")
		.min(5, "Minimal 5 karakter")
		.matches(
			/^[a-zA-Z0-9.\-/]+$/,
			"NIM hanya boleh huruf, angka, titik, strip, dan slash",
		),
	dosenPembimbingPenguji: yup
		.string()
		.required("Dosen Pembimbing & Penguji wajib diisi")
		.min(5, "Minimal 5 karakter"),
	judulSkripsi: yup
		.string()
		.required("Judul Skripsi/KTI/Tesis/Disertasi wajib diisi")
		.min(5, "Minimal 5 karakter"),
	alamatLengkap: yup
		.string()
		.required("Alamat Lengkap wajib diisi")
		.min(10, "Minimal 10 karakter"),
	noTelp: yup
		.string()
		.required("Nomor Telepon wajib diisi")
		.matches(/^[0-9+\s\-()]+$/, "Format nomor telepon tidak valid")
		.min(9, "Nomor telepon minimal 9 digit"),
	programStudi: yup
		.string()
		.required("Program Studi wajib diisi")
		.oneOf(Object.keys(programStudiMap), "Program Studi tidak terdaftar"),
	email: yup
		.string()
		.required("Email wajib diisi")
		.email("Format email tidak valid"),
	sumbanganBuku: yup
		.string()
		.oneOf(["individu", "kelompok", "tidak_ada"])
		.optional()
		.default("tidak_ada"),
});

async function ensureUploadDirs() {
	const base = join(process.cwd(), "uploads");
	await mkdir(join(base, "kartu-mahasiswa"), { recursive: true });
	await mkdir(join(base, "skripsi"), { recursive: true });
}

export const createSubmissionFn = createServerFn({ method: "POST" })
	.validator((d: any) => d)
	.handler(async ({ data }) => {
		if (!(data instanceof FormData)) {
			throw new Error("Invalid request content type, expected FormData");
		}
		await ensureUploadDirs();

		const namaLengkap = data.get("namaLengkap") as string;
		const nim = data.get("nim") as string;
		const dosenPembimbingPenguji = data.get("dosenPembimbingPenguji") as string;
		const judulSkripsi = data.get("judulSkripsi") as string;
		const alamatLengkap = data.get("alamatLengkap") as string;
		const noTelp = data.get("noTelp") as string;
		const programStudi = data.get("programStudi") as any;
		const email = data.get("email") as string;
		const sumbanganBuku = (data.get("sumbanganBuku") || "tidak_ada") as any;

		// Validate texts
		await submissionValidationSchema.validate(
			{
				namaLengkap,
				nim,
				dosenPembimbingPenguji,
				judulSkripsi,
				alamatLengkap,
				noTelp,
				programStudi,
				email,
				sumbanganBuku,
			},
			{ abortEarly: false },
		);

		// File validation
		const kartuMahasiswa = data.get("kartuMahasiswa") as File | null;
		const skripsi = data.get("skripsi") as File | null;

		if (!kartuMahasiswa || kartuMahasiswa.size === 0) {
			throw new Error("Kartu Mahasiswa wajib diunggah");
		}
		if (kartuMahasiswa.size > 10 * 1024 * 1024) {
			throw new Error("Ukuran file Kartu Mahasiswa maksimal 10 MB");
		}
		const validKMTypes = ["application/pdf", "image/jpeg", "image/png"];
		if (!validKMTypes.includes(kartuMahasiswa.type)) {
			throw new Error("Format Kartu Mahasiswa harus PDF, JPG, atau PNG");
		}

		if (!skripsi || skripsi.size === 0) {
			throw new Error("File Skripsi wajib diunggah");
		}
		if (skripsi.size > 10 * 1024 * 1024) {
			throw new Error("Ukuran file Skripsi maksimal 10 MB");
		}
		if (skripsi.type !== "application/pdf") {
			throw new Error("Format File Skripsi harus PDF");
		}

		// Generate trackingCode: BP-YYYYMMDD-XXXX
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
		const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
		const trackingCode = `BP-${dateStr}-${randStr}`;

		const timestamp = Date.now();
		const getExt = (filename: string, mime: string) => {
			const ext = filename.split(".").pop();
			if (ext && ext.length <= 4) return ext.toLowerCase();
			if (mime === "application/pdf") return "pdf";
			if (mime === "image/jpeg") return "jpg";
			if (mime === "image/png") return "png";
			return "bin";
		};

		const kmExt = getExt(kartuMahasiswa.name, kartuMahasiswa.type);
		const skripsiExt = getExt(skripsi.name, skripsi.type);

		const kmFileName = `${trackingCode}-kartu-${timestamp}.${kmExt}`;
		const skripsiFileName = `${trackingCode}-skripsi-${timestamp}.${skripsiExt}`;

		const kmRelPath = join("uploads", "kartu-mahasiswa", kmFileName);
		const skripsiRelPath = join("uploads", "skripsi", skripsiFileName);

		const kmAbsPath = join(process.cwd(), kmRelPath);
		const skripsiAbsPath = join(process.cwd(), skripsiRelPath);

		// Write files to local storage
		const kmArrayBuffer = await kartuMahasiswa.arrayBuffer();
		await writeFile(kmAbsPath, Buffer.from(kmArrayBuffer));

		const skripsiArrayBuffer = await skripsi.arrayBuffer();
		await writeFile(skripsiAbsPath, Buffer.from(skripsiArrayBuffer));

		// Save record in database
		await db.insert(submissions).values({
			trackingCode,
			namaLengkap,
			nim,
			dosenPembimbingPenguji,
			judulSkripsi,
			alamatLengkap,
			noTelp,
			programStudi,
			email,
			kartuMahasiswaPath: kmRelPath,
			kartuMahasiswaOriginalName: kartuMahasiswa.name,
			skripsiPath: skripsiRelPath,
			skripsiOriginalName: skripsi.name,
			sumbanganBuku,
			status: "pending",
		});

		return { success: true, trackingCode };
	},
);

export const getSubmissionsFn = createServerFn({ method: "GET" })
	.validator(
		(
			d: {
				search?: string;
				status?: "pending" | "diverifikasi" | "ditolak";
				programStudi?: string;
				sortBy?: string;
				sortOrder?: "asc" | "desc";
				page?: number;
				pageSize?: number;
			} = {},
		) => d,
	)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const {
			search,
			status,
			programStudi,
			sortBy,
			sortOrder,
			page = 1,
			pageSize = 10,
		} = data;

		const conditions = [];
		if (search) {
			conditions.push(
				or(
					like(submissions.namaLengkap, `%${search}%`),
					like(submissions.nim, `%${search}%`),
					like(submissions.judulSkripsi, `%${search}%`),
					like(submissions.trackingCode, `%${search}%`),
				),
			);
		}
		if (status) {
			conditions.push(eq(submissions.status, status));
		}
		if (programStudi) {
			conditions.push(eq(submissions.programStudi, programStudi as any));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		let order;
		if (sortBy === "namaLengkap") {
			order =
				sortOrder === "desc"
					? desc(submissions.namaLengkap)
					: asc(submissions.namaLengkap);
		} else if (sortBy === "nim") {
			order =
				sortOrder === "desc" ? desc(submissions.nim) : asc(submissions.nim);
		} else if (sortBy === "programStudi") {
			order =
				sortOrder === "desc"
					? desc(submissions.programStudi)
					: asc(submissions.programStudi);
		} else if (sortBy === "status") {
			order =
				sortOrder === "desc"
					? desc(submissions.status)
					: asc(submissions.status);
		} else if (sortBy === "createdAt") {
			order =
				sortOrder === "desc"
					? desc(submissions.createdAt)
					: asc(submissions.createdAt);
		} else {
			order = desc(submissions.id);
		}

		const countRes = await db
			.select({ count: sql`count(*)` })
			.from(submissions)
			.where(whereClause);
		const totalItems = Number(countRes[0]?.count || 0);

		const items = await db
			.select()
			.from(submissions)
			.where(whereClause)
			.orderBy(order)
			.limit(pageSize)
			.offset((page - 1) * pageSize);

		return {
			items,
			totalItems,
			totalPages: Math.ceil(totalItems / pageSize),
			page,
			pageSize,
		};
	});

export const getSubmissionDetailFn = createServerFn({ method: "GET" })
	.validator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const list = await db
			.select()
			.from(submissions)
			.where(eq(submissions.id, data.id));
		if (list.length === 0) {
			throw new Error("Pengajuan tidak ditemukan");
		}
		return list[0];
	});

export const getSubmissionStatusFn = createServerFn({ method: "GET" })
	.validator((d: { nim?: string; trackingCode?: string }) => d)
	.handler(async ({ data }) => {
		const { nim, trackingCode } = data;
		if (!nim && !trackingCode) {
			throw new Error("NIM atau Kode Tracking harus diisi");
		}

		const conditions = [];
		if (nim) {
			conditions.push(eq(submissions.nim, nim));
		}
		if (trackingCode) {
			conditions.push(eq(submissions.trackingCode, trackingCode));
		}

		const list = await db
			.select({
				id: submissions.id,
				trackingCode: submissions.trackingCode,
				namaLengkap: submissions.namaLengkap,
				nim: submissions.nim,
				programStudi: submissions.programStudi,
				judulSkripsi: submissions.judulSkripsi,
				status: submissions.status,
				catatanAdmin: submissions.catatanAdmin,
				createdAt: submissions.createdAt,
				verifiedAt: submissions.verifiedAt,
			})
			.from(submissions)
			.where(and(...conditions))
			.orderBy(desc(submissions.createdAt));

		return list;
	});

export const verifySubmissionFn = createServerFn({ method: "POST" })
	.validator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		await db
			.update(submissions)
			.set({
				status: "diverifikasi",
				verifiedByUserId: user.id,
				verifiedAt: new Date(),
			})
			.where(eq(submissions.id, data.id));

		return { success: true };
	});

export const rejectSubmissionFn = createServerFn({ method: "POST" })
	.validator((d: { id: number; catatanAdmin: string }) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		if (!data.catatanAdmin || data.catatanAdmin.trim().length === 0) {
			throw new Error("Catatan penolakan wajib diisi");
		}

		await db
			.update(submissions)
			.set({
				status: "ditolak",
				catatanAdmin: data.catatanAdmin,
				verifiedByUserId: user.id,
				verifiedAt: new Date(),
			})
			.where(eq(submissions.id, data.id));

		return { success: true };
	});

export const deleteSubmissionFn = createServerFn({ method: "POST" })
	.validator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const list = await db
			.select()
			.from(submissions)
			.where(eq(submissions.id, data.id));
		const sub = list[0];
		if (!sub) {
			throw new Error("Pengajuan tidak ditemukan");
		}

		// Delete files if they exist
		try {
			if (sub.kartuMahasiswaPath) {
				await unlink(join(process.cwd(), sub.kartuMahasiswaPath));
			}
		} catch (e) {
			console.error("Failed to delete kartu mahasiswa file:", e);
		}

		try {
			if (sub.skripsiPath) {
				await unlink(join(process.cwd(), sub.skripsiPath));
			}
		} catch (e) {
			console.error("Failed to delete skripsi file:", e);
		}

		await db.delete(submissions).where(eq(submissions.id, data.id));

		return { success: true };
	});

export const downloadSubmissionFileFn = createServerFn({ method: "POST" })
	.validator((d: { id: number; fileType: "kartu" | "skripsi" }) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const list = await db
			.select()
			.from(submissions)
			.where(eq(submissions.id, data.id));
		const sub = list[0];
		if (!sub) {
			throw new Error("Pengajuan tidak ditemukan");
		}

		const fileRelPath =
			data.fileType === "kartu" ? sub.kartuMahasiswaPath : sub.skripsiPath;
		const originalName =
			data.fileType === "kartu"
				? sub.kartuMahasiswaOriginalName
				: sub.skripsiOriginalName;

		if (!fileRelPath) {
			throw new Error("File tidak ditemukan");
		}

		const absPath = join(process.cwd(), fileRelPath);
		let fileBuffer: Buffer;
		try {
			fileBuffer = await readFile(absPath);
		} catch {
			throw new Error("File tidak ditemukan di server");
		}

		const base64 = fileBuffer.toString("base64");
		let mimeType = "application/pdf";
		if (fileRelPath.toLowerCase().endsWith(".png")) {
			mimeType = "image/png";
		} else if (fileRelPath.toLowerCase().endsWith(".jpg") || fileRelPath.toLowerCase().endsWith(".jpeg")) {
			mimeType = "image/jpeg";
		}

		return {
			base64,
			mimeType,
			fileName:
				originalName ||
				(data.fileType === "kartu" ? "kartu-mahasiswa.pdf" : "skripsi.pdf"),
		};
	});

export const getDashboardStatsFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		// 1. Total counts
		const counts = await db
			.select({
				status: submissions.status,
				count: sql`count(*)`,
			})
			.from(submissions)
			.groupBy(submissions.status);

		let total = 0;
		let pending = 0;
		let diverifikasi = 0;
		let ditolak = 0;

		for (const row of counts) {
			const c = Number(row.count || 0);
			total += c;
			if (row.status === "pending") pending = c;
			else if (row.status === "diverifikasi") diverifikasi = c;
			else if (row.status === "ditolak") ditolak = c;
		}

		// 2. Program studi breakdown
		const prodiCounts = await db
			.select({
				programStudi: submissions.programStudi,
				count: sql`count(*)`,
			})
			.from(submissions)
			.groupBy(submissions.programStudi);

		const prodiBreakdown = Object.keys(programStudiMap).map((prodi) => {
			const matched = prodiCounts.find((p) => p.programStudi === prodi);
			return {
				programStudi: prodi,
				count: matched ? Number(matched.count || 0) : 0,
			};
		});

		// 3. Submissions per month (last 6 months)
		const monthlyRes = await db
			.select({
				month: sql`DATE_FORMAT(${submissions.createdAt}, '%Y-%m')`,
				count: sql`count(*)`,
			})
			.from(submissions)
			.where(sql`${submissions.createdAt} >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`)
			.groupBy(sql`DATE_FORMAT(${submissions.createdAt}, '%Y-%m')`)
			.orderBy(sql`DATE_FORMAT(${submissions.createdAt}, '%Y-%m')`);

		const last6Months: { month: string; count: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const d = new Date();
			d.setMonth(d.getMonth() - i);
			const monthKey = d.toISOString().slice(0, 7); // "YYYY-MM"
			const match = monthlyRes.find((m) => m.month === monthKey);

			const monthName = d.toLocaleDateString("id-ID", {
				month: "short",
				year: "2-digit",
			});
			last6Months.push({
				month: monthName,
				count: match ? Number(match.count || 0) : 0,
			});
		}

		return {
			total,
			pending,
			diverifikasi,
			ditolak,
			prodiBreakdown,
			monthlyTrend: last6Months,
		};
	},
);

export const updateSubmissionFn = createServerFn({ method: "POST" })
	.validator((d: any) => d)
	.handler(async ({ data }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		if (!(data instanceof FormData)) {
			throw new Error("Invalid request content type, expected FormData");
		}
		await ensureUploadDirs();

		const idStr = data.get("id") as string;
		if (!idStr) throw new Error("ID pengajuan wajib diisi");
		const id = parseInt(idStr);

		const namaLengkap = data.get("namaLengkap") as string;
		const nim = data.get("nim") as string;
		const dosenPembimbingPenguji = data.get("dosenPembimbingPenguji") as string;
		const judulSkripsi = data.get("judulSkripsi") as string;
		const alamatLengkap = data.get("alamatLengkap") as string;
		const noTelp = data.get("noTelp") as string;
		const programStudi = data.get("programStudi") as any;
		const email = data.get("email") as string;
		const sumbanganBuku = (data.get("sumbanganBuku") || "tidak_ada") as any;
		const status = data.get("status") as any;
		const catatanAdmin = data.get("catatanAdmin") as string || null;

		// 1. Fetch existing submission
		const list = await db
			.select()
			.from(submissions)
			.where(eq(submissions.id, id));
		const sub = list[0];
		if (!sub) {
			throw new Error("Pengajuan tidak ditemukan");
		}

		// 2. Validate text inputs using schema
		await submissionValidationSchema.validate(
			{
				namaLengkap,
				nim,
				dosenPembimbingPenguji,
				judulSkripsi,
				alamatLengkap,
				noTelp,
				programStudi,
				email,
				sumbanganBuku,
			},
			{ abortEarly: false },
		);

		if (!["pending", "diverifikasi", "ditolak"].includes(status)) {
			throw new Error("Status tidak valid");
		}

		// 3. File handling
		const kartuMahasiswa = data.get("kartuMahasiswa") as File | null;
		const skripsi = data.get("skripsi") as File | null;

		const updateValues: any = {
			namaLengkap,
			nim,
			dosenPembimbingPenguji,
			judulSkripsi,
			alamatLengkap,
			noTelp,
			programStudi,
			email,
			sumbanganBuku,
			status,
			catatanAdmin,
		};

		if (status !== sub.status) {
			updateValues.verifiedByUserId = user.id;
			updateValues.verifiedAt = new Date();
		}

		const timestamp = Date.now();
		const getExt = (filename: string, mime: string) => {
			const ext = filename.split(".").pop();
			if (ext && ext.length <= 4) return ext.toLowerCase();
			if (mime === "application/pdf") return "pdf";
			if (mime === "image/jpeg") return "jpg";
			if (mime === "image/png") return "png";
			return "bin";
		};

		// If a new KTM is uploaded
		if (kartuMahasiswa && kartuMahasiswa.size > 0) {
			if (kartuMahasiswa.size > 10 * 1024 * 1024) {
				throw new Error("Ukuran file Kartu Mahasiswa maksimal 10 MB");
			}
			const validKMTypes = ["application/pdf", "image/jpeg", "image/png"];
			if (!validKMTypes.includes(kartuMahasiswa.type)) {
				throw new Error("Format Kartu Mahasiswa harus PDF, JPG, atau PNG");
			}

			// Naming
			const kmExt = getExt(kartuMahasiswa.name, kartuMahasiswa.type);
			const kmFileName = `${sub.trackingCode}-kartu-${timestamp}.${kmExt}`;
			const kmRelPath = join("uploads", "kartu-mahasiswa", kmFileName);
			const kmAbsPath = join(process.cwd(), kmRelPath);

			// Write new file
			const kmArrayBuffer = await kartuMahasiswa.arrayBuffer();
			await writeFile(kmAbsPath, Buffer.from(kmArrayBuffer));

			// Delete old file
			if (sub.kartuMahasiswaPath) {
				try {
					await unlink(join(process.cwd(), sub.kartuMahasiswaPath));
				} catch (e) {
					console.error("Failed to delete old kartu mahasiswa file:", e);
				}
			}

			// Add to values
			updateValues.kartuMahasiswaPath = kmRelPath;
			updateValues.kartuMahasiswaOriginalName = kartuMahasiswa.name;
		}

		// If a new Skripsi is uploaded
		if (skripsi && skripsi.size > 0) {
			if (skripsi.size > 10 * 1024 * 1024) {
				throw new Error("Ukuran file Skripsi maksimal 10 MB");
			}
			if (skripsi.type !== "application/pdf") {
				throw new Error("Format File Skripsi harus PDF");
			}

			// Naming
			const skripsiExt = getExt(skripsi.name, skripsi.type);
			const skripsiFileName = `${sub.trackingCode}-skripsi-${timestamp}.${skripsiExt}`;
			const skripsiRelPath = join("uploads", "skripsi", skripsiFileName);
			const skripsiAbsPath = join(process.cwd(), skripsiRelPath);

			// Write new file
			const skripsiArrayBuffer = await skripsi.arrayBuffer();
			await writeFile(skripsiAbsPath, Buffer.from(skripsiArrayBuffer));

			// Delete old file
			if (sub.skripsiPath) {
				try {
					await unlink(join(process.cwd(), sub.skripsiPath));
				} catch (e) {
					console.error("Failed to delete old skripsi file:", e);
				}
			}

			// Add to values
			updateValues.skripsiPath = skripsiRelPath;
			updateValues.skripsiOriginalName = skripsi.name;
		}

		// 4. Update database
		await db
			.update(submissions)
			.set(updateValues)
			.where(eq(submissions.id, id));

		return { success: true };
	});

