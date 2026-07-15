import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUri =
	process.env.DATABASE_URL || "mysql://root:password@localhost:3306/db";

// Use a global pool to prevent connection leaks during development HMR
let pool: mysql.Pool;

const globalWithPool = globalThis as typeof globalThis & {
	__mysql_pool?: mysql.Pool;
};

if (globalWithPool.__mysql_pool) {
	pool = globalWithPool.__mysql_pool;
} else {
	pool = mysql.createPool({
		uri: connectionUri,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
	});
	globalWithPool.__mysql_pool = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
