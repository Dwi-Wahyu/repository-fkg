import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, unlink, readFile, writeFile } from "node:fs/promises";
import { extname, basename, join } from "node:path";

const execAsync = promisify(exec);

const THUMBNAIL_DIR_NAME = "thumbnail-skripsi";

function getGotenbergUrl(): string {
	const base = process.env.GOTENBERG_URL;
	if (!base) throw new Error("GOTENBERG_URL belum di-set di .env");
	return `${base.replace(/\/$/, "")}/forms/libreoffice/convert`;
}

/**
 * Generate thumbnail JPEG dari file dokumen (pdf/doc/docx).
 *
 * @param sourceAbsPath  path absolut file sumber (skripsi yang sudah tersimpan di disk)
 * @param outputBaseName nama file output TANPA ekstensi (mis. `${trackingCode}-skripsi-${timestamp}`)
 * @returns path relatif (dari process.cwd()) ke thumbnail yang berhasil dibuat, atau null kalau gagal.
 *          Tidak melempar error — kegagalan generate thumbnail tidak boleh
 *          menggagalkan alur submit/edit pengajuan.
 */
export async function generateSkripsiThumbnail(
	sourceAbsPath: string,
	outputBaseName: string,
): Promise<string | null> {
	const thumbnailDirAbs = join(process.cwd(), "uploads", THUMBNAIL_DIR_NAME);
	await mkdir(thumbnailDirAbs, { recursive: true });

	const outputPrefixAbs = join(thumbnailDirAbs, outputBaseName);
	const ext = extname(sourceAbsPath).toLowerCase();

	try {
		if (ext === ".pdf") {
			await execAsync(
				`pdftocairo -jpeg -f 1 -l 1 -singlefile -scale-to 800 "${sourceAbsPath}" "${outputPrefixAbs}"`,
			);
		} else if (ext === ".doc" || ext === ".docx") {
			const fileData = await readFile(sourceAbsPath);
			const fileBlob = new Blob([fileData]);
			const formData = new FormData();
			formData.append("files", fileBlob, basename(sourceAbsPath));

			const response = await fetch(getGotenbergUrl(), {
				method: "POST",
				body: formData,
			});
			if (!response.ok) {
				throw new Error(`Gotenberg HTTP Error ${response.status}`);
			}

			const tmpPdfPath = `/tmp/${outputBaseName}-${Date.now()}.pdf`;
			try {
				await writeFile(tmpPdfPath, Buffer.from(await response.arrayBuffer()));
				await execAsync(
					`pdftocairo -jpeg -f 1 -l 1 -singlefile -scale-to 800 "${tmpPdfPath}" "${outputPrefixAbs}"`,
				);
			} finally {
				await unlink(tmpPdfPath).catch(() => {});
			}
		} else {
			// Format tidak didukung untuk thumbnail (mis. gambar KTM/format lain)
			return null;
		}

		// pdftocairo -singlefile otomatis menambahkan ekstensi .jpg
		return `${outputBaseName}.jpg`;
	} catch (error) {
		console.error(
			`[generateSkripsiThumbnail] Gagal generate thumbnail untuk ${basename(sourceAbsPath)}:`,
			error,
		);
		return null;
	}
}

/** Hapus file thumbnail (dipanggil saat re-upload skripsi atau hapus pengajuan). */
export async function deleteSkripsiThumbnail(
	thumbnailFileName: string | null | undefined,
): Promise<void> {
	if (!thumbnailFileName) return;
	try {
		await unlink(join(process.cwd(), "uploads", THUMBNAIL_DIR_NAME, thumbnailFileName));
	} catch (error) {
		console.error(
			"[deleteSkripsiThumbnail] Gagal hapus thumbnail lama:",
			error,
		);
	}
}
