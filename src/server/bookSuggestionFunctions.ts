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

export const createBookSuggestionFn = createServerFn({ method: "POST" })
	.validator((d: { judulBuku: string }) => d)
	.handler(async ({ data }) => {
		// 1. Validate inputs
		const validated = await bookSuggestionValidationSchema.validate(data);
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

		// 3. Insert record in database
		const result = await db.insert(bookSuggestions).values({
			judulBuku: judulBukuTrimmed,
		});

		const insertId = result[0].insertId;

		// 4. Set cooldown cookie for 24 hours
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

		await db.delete(bookSuggestions).where(eq(bookSuggestions.id, id));
		return { success: true };
	});
