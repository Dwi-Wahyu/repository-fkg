import { getRequestHeader } from "@tanstack/react-start/server";

export function getClientIp(): string {
	// Reverse proxy (Nginx/Cloudflare) — ambil IP asli client
	const cfIp = getRequestHeader("cf-connecting-ip");
	if (cfIp) return cfIp.trim();
	const xForwardedFor = getRequestHeader("x-forwarded-for");
	if (xForwardedFor) return xForwardedFor.split(",")[0]?.trim();
	const xRealIp = getRequestHeader("x-real-ip");
	if (xRealIp) return xRealIp.trim();
	return "";
}

export function isIpWhitelisted(ip: string): boolean {
	const list = (process.env.WHITELIST_IP_ACCESS || "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	return list.includes(ip);
}

export function checkAccess(): boolean {
	return isIpWhitelisted(getClientIp());
}
