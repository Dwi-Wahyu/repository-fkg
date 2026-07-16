import { db } from "./index";
import { letterSequence } from "./schema";

async function main() {
	console.log("🔢 Seeding letter sequence...");
	try {
		await db
			.insert(letterSequence)
			.values({
				id: 1,
				currentNumber: 199,
			})
			.onDuplicateKeyUpdate({
				set: { currentNumber: 199 },
			});
		console.log("✅ Letter sequence seeded.");
		process.exit(0);
	} catch (e) {
		console.error("❌ Letter sequence seeding failed:", (e as Error).message);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("❌ Seeding failed:", err);
	process.exit(1);
});
