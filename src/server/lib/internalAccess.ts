import { createHmac } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";

export const COOKIE_NAME = "internal_access_token";

export async function computeInternalToken(): Promise<string> {
	const secret = process.env.INTERNAL_PASSWORD || "";
	return createHmac("sha256", secret)
		.update("internal-access-granted")
		.digest("hex");
}

export async function hasInternalAccess(): Promise<boolean> {
	const secret = process.env.INTERNAL_PASSWORD;
	if (!secret) return false;
	const token = getCookie(COOKIE_NAME);
	if (!token) return false;
	const computed = await computeInternalToken();
	return token === computed;
}

export function setInternalAccessCookie(token: string) {
	setCookie(COOKIE_NAME, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 30, // 30 hari
	});
}

export function clearInternalAccessCookie() {
	setCookie(COOKIE_NAME, "", {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: 0,
	});
}
