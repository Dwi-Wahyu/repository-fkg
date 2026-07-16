import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createReport } from "docx-templates";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { letterSequence } from "../db/schema";

const ROMAWI = [
	"I",
	"II",
	"III",
	"IV",
	"V",
	"VI",
	"VII",
	"VIII",
	"IX",
	"X",
	"XI",
	"XII",
];

async function nextNomorSurat(): Promise<number> {
	// atomic increment, aman untuk concurrent approve
	await db.execute(
		sql`UPDATE letter_sequence SET current_number = current_number + 1 WHERE id = 1`,
	);
	const [row] = await db
		.select()
		.from(letterSequence)
		.where(eq(letterSequence.id, 1));
	return row?.currentNumber;
}

export async function generateSuratBebasPustaka(params: {
	trackingCode: string;
	nama: string;
	stambuk: string;
	programStudi: string;
	alamat: string;
}) {
	const now = new Date();
	const nomor = await nextNomorSurat();
	const nomorSurat = `${nomor}/PERPUS.FKG.UH/${ROMAWI[now.getMonth()]}/${now.getFullYear()}`;
	const tanggal = now.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const template = await readFile(
		join(process.cwd(), "public", "template-surat-bebas-pustaka.docx"),
	);
	const buffer = await createReport({
		template,
		cmdDelimiter: ["{", "}"],
		data: {
			nomorSurat,
			nama: params.nama,
			stambuk: params.stambuk,
			programStudi: params.programStudi,
			alamat: params.alamat,
			tanggal,
		},
	});

	const dir = join(process.cwd(), "uploads", "sertifikat");
	await mkdir(dir, { recursive: true });
	const docxFileName = `${params.trackingCode}-bebas-pustaka.docx`;
	const docxPath = join(dir, docxFileName);
	await writeFile(docxPath, Buffer.from(buffer));

	// Convert DOCX to PDF using Gotenberg
	let pdfPath = "";
	try {
		const gotenbergUrl = process.env.GOTENBERG_URL || "http://localhost:4000";
		const formData = new FormData();
		formData.append("files", new Blob([buffer]), docxFileName);

		const response = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Gotenberg conversion failed: ${response.statusText}`);
		}

		const pdfBuffer = await response.arrayBuffer();
		const pdfFileName = `${params.trackingCode}-bebas-pustaka.pdf`;
		pdfPath = join("uploads", "sertifikat", pdfFileName);
		await writeFile(join(process.cwd(), pdfPath), Buffer.from(pdfBuffer));
	} catch (err) {
		console.error("Gagal mengubah surat ke PDF via Gotenberg:", err);
		// Fallback to docx path
		pdfPath = join("uploads", "sertifikat", docxFileName);
	}

	return {
		suratNomor: nomorSurat,
		suratPath: pdfPath,
	};
}
