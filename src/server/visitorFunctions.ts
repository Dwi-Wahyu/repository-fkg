import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { gte, sql } from "drizzle-orm";
import { getUserFromSession } from "./auth";
import { db } from "./db";
import { visitorLogs } from "./db/schema";

const VISITOR_COOKIE = "visitor_id";
const ONE_DAY_SECONDS = 86400;

/**
 * Call once per public page load (from the root loader).
 * - If the visitor cookie already exists -> no-op, no DB write.
 *   (This is what prevents a new "visitor" being logged on every click.)
 * - If it doesn't exist -> mint one, set a 1-day cookie, write one log row.
 * Never throws — a tracking failure must not break page rendering.
 */
export const trackVisitFn = createServerFn({ method: "POST" })
	.validator((data: { path?: string } | undefined) => data ?? {})
	.handler(async ({ data }) => {
		try {
			const existing = getCookie(VISITOR_COOKIE);
			if (existing) {
				return { tracked: false };
			}

			const visitorId = randomUUID();
			setCookie(VISITOR_COOKIE, visitorId, {
				path: "/",
				httpOnly: true,
				sameSite: "lax",
				maxAge: ONE_DAY_SECONDS,
			});

			await db.insert(visitorLogs).values({
				visitorId,
				path: data.path?.slice(0, 255),
			});

			return { tracked: true };
		} catch (err) {
			console.error("trackVisitFn failed:", err);
			return { tracked: false };
		}
	});

export interface VisitorStats {
	today: number;
	thisMonth: number;
	total: number;
}

export const getVisitorStatsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<VisitorStats> => {
		const user = await getUserFromSession();
		if (!user || user.role !== "admin") {
			throw new Error("Unauthorized");
		}

		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const [[todayRow], [monthRow], [totalRow]] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)` })
				.from(visitorLogs)
				.where(gte(visitorLogs.visitedAt, startOfDay)),
			db
				.select({ count: sql<number>`count(*)` })
				.from(visitorLogs)
				.where(gte(visitorLogs.visitedAt, startOfMonth)),
			db.select({ count: sql<number>`count(*)` }).from(visitorLogs),
		]);

		return {
			today: Number(todayRow?.count ?? 0),
			thisMonth: Number(monthRow?.count ?? 0),
			total: Number(totalRow?.count ?? 0),
		};
	},
);
