import { createServerFn } from "@tanstack/react-start";

const COOKIE_NAME = "internal_access_token";

async function computeInternalToken(): Promise<string> {
	const secret = process.env.INTERNAL_PASSWORD || "";
	// Bypass bundler analysis
	const cryptoName = "node:crypto";
	const { createHmac } = (await import(cryptoName)) as typeof import("node:crypto");
	return createHmac("sha256", secret)
		.update("internal-access-granted")
		.digest("hex");
}

export async function hasInternalAccess(): Promise<boolean> {
	const secret = process.env.INTERNAL_PASSWORD;
	if (!secret) return false;
	const serverName = "@tanstack/react-start/server";
	const { getCookie } = (await import(serverName)) as typeof import("@tanstack/react-start/server");
	const token = getCookie(COOKIE_NAME);
	if (!token) return false;
	const computed = await computeInternalToken();
	return token === computed;
}

export const internalLoginFn = createServerFn({ method: "POST" })
	.validator((data: Record<string, unknown>) => {
		if (!data.username || typeof data.username !== "string") {
			throw new Error("Username wajib diisi");
		}
		if (!data.password || typeof data.password !== "string") {
			throw new Error("Password wajib diisi");
		}
		return data as { username: string; password: string };
	})
	.handler(async ({ data }) => {
		const validUsername = process.env.INTERNAL_USERNAME;
		const validPassword = process.env.INTERNAL_PASSWORD;
		if (!validUsername || !validPassword) {
			throw new Error("Login komputer internal belum dikonfigurasi di server");
		}
		if (data.username !== validUsername || data.password !== validPassword) {
			throw new Error("Username atau password salah");
		}

		const serverName = "@tanstack/react-start/server";
		const { setCookie } = (await import(serverName)) as typeof import("@tanstack/react-start/server");
		const token = await computeInternalToken();
		setCookie(COOKIE_NAME, token, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 hari
		});

		return { success: true };
	});

export const internalLogoutFn = createServerFn({ method: "POST" }).handler(
	async () => {
		const serverName = "@tanstack/react-start/server";
		const { setCookie } = (await import(serverName)) as typeof import("@tanstack/react-start/server");
		setCookie(COOKIE_NAME, "", {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 0,
		});
		return { success: true };
	},
);

export const getInternalAccessStatusFn = createServerFn({
	method: "GET",
}).handler(async () => {
	const granted = await hasInternalAccess();
	return { granted };
});
