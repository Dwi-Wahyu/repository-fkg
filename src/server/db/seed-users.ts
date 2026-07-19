import bcrypt from "bcryptjs";
import { db } from "./index";
import { users } from "./schema";

async function main() {
	console.log("🚀 Seeding MySQL users...");
	const totalStartTime = Date.now();

	const adminPasswordHash = await bcrypt.hash("admin123", 10);

	console.log("👤 Seeding admin user...");
	try {
		// Clean users first to prevent key collision if seeding multiple times
		await db.delete(users);
		const [insertRes] = await db.insert(users).values({
			username: "admin",
			passwordHash: adminPasswordHash,
			role: "admin",
			email: "admin@antigravity.tech",
		});
		console.log(`✅ Admin user seeded with ID: ${insertRes.insertId}`);
	} catch (e) {
		console.error("❌ Admin user seeding failed:", e);
		process.exit(1);
	}

	const totalDuration = (Date.now() - totalStartTime) / 1000;
	console.log(
		`\n🎉 USER SEEDING COMPLETED IN ${totalDuration.toFixed(2)} SECONDS!`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("❌ User seeding failed:", err);
	process.exit(1);
});
