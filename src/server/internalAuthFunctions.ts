import { createServerFn } from "@tanstack/react-start";
import {
	clearInternalAccessCookie,
	computeInternalToken,
	hasInternalAccess,
	setInternalAccessCookie,
} from "./lib/internalAccess";

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

		const token = await computeInternalToken();
		setInternalAccessCookie(token);

		return { success: true };
	});

export const internalLogoutFn = createServerFn({ method: "POST" }).handler(
	async () => {
		clearInternalAccessCookie();
		return { success: true };
	},
);

export const getInternalAccessStatusFn = createServerFn({ method: "GET" })
	.validator((data: any) => data)
	.handler(async () => {
		const granted = await hasInternalAccess();
		return { granted };
	});
