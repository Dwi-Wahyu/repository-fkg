import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import * as yup from "yup";
import { getUserFromSession } from "./auth";
import { db } from "./db";
import { bookSuggestions } from "./db/schema";

// Validation schema for book suggestions
export const bookSuggestionValidationSchema = yup.object().shape({
	judulBuku: yup
		.string()
		.required("Judul Buku wajib diisi")
		.min(3, "Judul buku minimal 3 karakter")
		.max(500, "Judul buku maksimal 500 karakter"),
});

async function ensureCoverDirs() {
	const base = join(process.cwd(), "uploads");
	await mkdir(join(base, "cover-buku"), { recursive: true });
}

export const createBookSuggestionFn = createServerFn({ method: "POST" })
	.validator((d: any) => d)
	.handler(async ({ data }) => {
		if (!(data instanceof FormData)) {
			throw new Error("Invalid request content type, expected FormData");
		}
		await ensureCoverDirs();

		const judulBuku = data.get("judulBuku") as string;
		const penerbit = (data.get("penerbit") as string || "").trim() || null;
		const coverBuku = data.get("coverBuku") as File | null;

		// 1. Validate inputs
		const validated = await bookSuggestionValidationSchema.validate({ judulBuku });
		const judulBukuTrimmed = validated.judulBuku.trim();

		// 2. Cooldown check (24 hours) via server cookie
		const lastUsulanAtStr = getCookie("last_usulan_buku_at");
		if (lastUsulanAtStr) {
			const lastUsulanAt = parseInt(lastUsulanAtStr);
			if (!isNaN(lastUsulanAt)) {
				const now = Date.now();
				const elapsed = now - lastUsulanAt;
				const cooldownMs = 86400 * 1000; // 24 hours
				if (elapsed < cooldownMs) {
					const remainingMs = cooldownMs - elapsed;
					const remainingHrs = Math.floor(remainingMs / (3600 * 1000));
					const remainingMins = Math.ceil((remainingMs % (3600 * 1000)) / (60 * 1000));
					throw new Error(
						`Anda sudah mengusulkan buku hari ini. Coba lagi dalam ${remainingHrs} jam ${remainingMins} menit.`,
					);
				}
			}
		}

		let coverBukuPath: string | null = null;
		let coverBukuOriginalName: string | null = null;

		// 3. File validation
		if (coverBuku && coverBuku.size > 0) {
			if (coverBuku.size > 5 * 1024 * 1024) {
				throw new Error("Ukuran file cover buku maksimal 5 MB");
			}
			if (!coverBuku.type.startsWith("image/")) {
				throw new Error("Format file cover buku harus berupa gambar");
			}

			const getExt = (filename: string, mime: string) => {
				const ext = filename.split(".").pop();
				if (ext && ext.length <= 4) return ext.toLowerCase();
				if (mime === "image/png") return "png";
				if (mime === "image/jpeg") return "jpg";
				if (mime === "image/webp") return "webp";
				if (mime === "image/gif") return "gif";
				return "img";
			};

			const timestamp = Date.now();
			const ext = getExt(coverBuku.name, coverBuku.type);
			const fileName = `cover-${timestamp}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
			const relPath = join("uploads", "cover-buku", fileName);
			const absPath = join(process.cwd(), relPath);

			const arrayBuffer = await coverBuku.arrayBuffer();
			await writeFile(absPath, Buffer.from(arrayBuffer));

			coverBukuPath = relPath;
			coverBukuOriginalName = coverBuku.name;
		}

		// 4. Insert record in database
		const result = await db.insert(bookSuggestions).values({
			judulBuku: judulBukuTrimmed,
			penerbit,
			coverBukuPath,
			coverBukuOriginalName,
		});

		const insertId = result[0].insertId;

		// 5. Set cooldown cookie for 24 hours
		setCookie("last_usulan_buku_at", Date.now().toString(), {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 86400, // 1 day
		});

		return {
			success: true,
			id: insertId,
			judulBuku: judulBukuTrimmed,
			createdAt: new Date().toISOString(),
		};
	});

export const getBookSuggestionCooldownFn = createServerFn({ method: "GET" })
	.handler(async () => {
		const lastUsulanAtStr = getCookie("last_usulan_buku_at");
		if (!lastUsulanAtStr) {
			return { canSubmit: true, remainingSeconds: 0, lastSubmittedAt: null };
		}

		const lastUsulanAt = parseInt(lastUsulanAtStr);
		if (isNaN(lastUsulanAt)) {
			return { canSubmit: true, remainingSeconds: 0, lastSubmittedAt: null };
		}

		const now = Date.now();
		const elapsed = now - lastUsulanAt;
		const cooldownMs = 86400 * 1000; // 24 hours

		if (elapsed >= cooldownMs) {
			return {
				canSubmit: true,
				remainingSeconds: 0,
				lastSubmittedAt: new Date(lastUsulanAt).toISOString(),
			};
		}

		const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
		return {
			canSubmit: false,
			remainingSeconds,
			lastSubmittedAt: new Date(lastUsulanAt).toISOString(),
		};
	});

export const getBookSuggestionsFn = createServerFn({ method: "GET" })
	.validator(
		(
			d: {
				search?: string;
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
			sortOrder = "desc",
			page = 1,
			pageSize = 10,
		} = data;

		const conditions = [];
		if (search) {
			conditions.push(like(bookSuggestions.judulBuku, `%${search}%`));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const order =
			sortOrder === "asc"
				? asc(bookSuggestions.createdAt)
				: desc(bookSuggestions.createdAt);

		const countRes = await db
			.select({ count: sql`count(*)` })
			.from(bookSuggestions)
			.where(whereClause);
		const totalItems = Number(countRes[0]?.count || 0);
		const totalPages = Math.ceil(totalItems / pageSize);
		const offset = (page - 1) * pageSize;

		const items = await db
			.select()
			.from(bookSuggestions)
			.where(whereClause)
			.orderBy(order)
			.limit(pageSize)
			.offset(offset);

		return {
			items,
			totalItems,
			totalPages,
			page,
			pageSize,
		};
	});

export const deleteBookSuggestionFn = createServerFn({ method: "POST" })
	.validator((id: number) => id)
	.handler(async ({ data: id }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const list = await db
			.select()
			.from(bookSuggestions)
			.where(eq(bookSuggestions.id, id));
		const suggestion = list[0];
		if (!suggestion) {
			throw new Error("Usulan buku tidak ditemukan");
		}

		// Delete cover image if exists
		if (suggestion.coverBukuPath) {
			try {
				await unlink(join(process.cwd(), suggestion.coverBukuPath));
			} catch (e) {
				console.error("Failed to delete cover book file:", e);
			}
		}

		await db.delete(bookSuggestions).where(eq(bookSuggestions.id, id));
		return { success: true };
	});

export const downloadBookCoverFn = createServerFn({ method: "POST" })
	.validator((id: number) => id)
	.handler(async ({ data: id }) => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const list = await db
			.select()
			.from(bookSuggestions)
			.where(eq(bookSuggestions.id, id));
		const suggestion = list[0];
		if (!suggestion) {
			throw new Error("Usulan buku tidak ditemukan");
		}

		if (!suggestion.coverBukuPath) {
			throw new Error("Cover buku tidak ditemukan");
		}

		const absPath = join(process.cwd(), suggestion.coverBukuPath);
		let fileBuffer: Buffer;
		try {
			fileBuffer = await readFile(absPath);
		} catch {
			throw new Error("File tidak ditemukan di server");
		}

		const base64 = fileBuffer.toString("base64");
		let mimeType = "image/jpeg";
		if (suggestion.coverBukuPath.toLowerCase().endsWith(".png")) {
			mimeType = "image/png";
		} else if (suggestion.coverBukuPath.toLowerCase().endsWith(".webp")) {
			mimeType = "image/webp";
		} else if (suggestion.coverBukuPath.toLowerCase().endsWith(".gif")) {
			mimeType = "image/gif";
		}

		return {
			base64,
			mimeType,
			fileName: suggestion.coverBukuOriginalName || "cover.jpg",
		};
	});
