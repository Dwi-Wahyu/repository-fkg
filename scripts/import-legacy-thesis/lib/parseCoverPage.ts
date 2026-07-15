export function parseCoverPage(page1Text: string, fullText: string) {
	const lines = page1Text.split("\n").map(l => l.trim()).filter(Boolean);
	
	let nim: string | null = null;
	let namaLengkap: string | null = null;
	let judulSkripsi: string | null = null;
	let programStudi: string | null = null;
	let tahun: string | null = null;
	let dosenPembimbingPenguji: string | null = null;

	// 1. Find NIM
	let nimIndex = -1;
	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(/\b([A-Z]\d{8,11})\b/i);
		if (match) {
			nim = match[1].toUpperCase();
			nimIndex = i;
			break;
		}
	}

	// 2. Extract Name and Title based on NIM position
	if (nimIndex > 0) {
		// Student Name is usually the line directly preceding NIM
		let potentialName = lines[nimIndex - 1];
		
		// If the preceding line is "NAMA:" or "OLEH:" or similar, check one line above it
		if (/^(nama|oleh|nim|stambuk)[:\s]*$/i.test(potentialName) && nimIndex > 1) {
			potentialName = lines[nimIndex - 2];
		}
		
		// Clean the name of common prefixes
		potentialName = potentialName
			.replace(/^(nama|oleh)[:\s]*/i, "")
			.replace(/\s+/g, " ")
			.trim();

		namaLengkap = potentialName;
		
		// Judul Skripsi is the lines above the name/NIM block
		const titleLines = lines.slice(0, nimIndex - 1)
			.filter(line => {
				const lower = line.toLowerCase();
				// Exclude generic header tags on cover
				return !lower.startsWith("skripsi") && 
				       !lower.startsWith("karya tulis ilmiah") && 
				       !lower.startsWith("tesis") && 
				       !lower.startsWith("disertasi") &&
				       !lower.startsWith("laporan") &&
				       !lower.startsWith("oleh") &&
				       !lower.startsWith("nama:") &&
				       !lower.startsWith("proposal");
			});

		if (titleLines.length > 0) {
			let rawTitle = titleLines.join(" ");
			// Clean title prefixes
			rawTitle = rawTitle
				.replace(/^(skripsi|karya tulis ilmiah|tesis|disertasi|laporan penelitian|usulan penelitian)[:\s]*/i, "")
				.replace(/^:\s*/, "")
				.trim();
			judulSkripsi = rawTitle;
		}
	}

	// 3. Extract Program Studi
	const textLower = page1Text.toLowerCase();
	if (textLower.includes("prostodonsia")) {
		programStudi = "ppdgs_prostodonsia";
	} else if (textLower.includes("konservasi")) {
		programStudi = "ppdgs_konservasi";
	} else if (textLower.includes("periodonsia")) {
		programStudi = "ppdgs_periodonsia";
	} else if (textLower.includes("bedah mulut") || textLower.includes("maksilofasial")) {
		programStudi = "ppdgs_bedah_mulut";
	} else if (textLower.includes("ortodonsia")) {
		programStudi = "ppdgs_ortodonsia";
	} else if (textLower.includes("anak")) {
		programStudi = "ppdgs_anak";
	} else if (textLower.includes("radiologi")) {
		programStudi = "ppdgs_radiologi";
	} else if (textLower.includes("penyakit mulut")) {
		programStudi = "ppdgs_penyakit_mulut";
	} else if (textLower.includes("profesi") || textLower.includes("drg")) {
		programStudi = "profesi_gigi";
	} else if (textLower.includes("s2") || textLower.includes("magister")) {
		programStudi = "s2_gigi";
	} else if (textLower.includes("s3") || textLower.includes("doktor")) {
		programStudi = "s3_gigi";
	} else if (textLower.includes("s1") || textLower.includes("sarjana") || textLower.includes("dokter gigi")) {
		programStudi = "s1_gigi";
	}

	// Fallback check on fullText if prodi was not found on page 1
	if (!programStudi) {
		const fullTextLower = fullText.toLowerCase();
		if (fullTextLower.includes("prostodonsia")) {
			programStudi = "ppdgs_prostodonsia";
		} else if (fullTextLower.includes("konservasi")) {
			programStudi = "ppdgs_konservasi";
		} else if (fullTextLower.includes("periodonsia")) {
			programStudi = "ppdgs_periodonsia";
		} else if (fullTextLower.includes("bedah mulut") || fullTextLower.includes("maksilofasial")) {
			programStudi = "ppdgs_bedah_mulut";
		} else if (fullTextLower.includes("ortodonsia")) {
			programStudi = "ppdgs_ortodonsia";
		} else if (fullTextLower.includes("anak")) {
			programStudi = "ppdgs_anak";
		} else if (fullTextLower.includes("radiologi")) {
			programStudi = "ppdgs_radiologi";
		} else if (fullTextLower.includes("penyakit mulut")) {
			programStudi = "ppdgs_penyakit_mulut";
		} else if (fullTextLower.includes("program studi profesi") || fullTextLower.includes("profesi dokter gigi") || fullTextLower.includes("profesi")) {
			programStudi = "profesi_gigi";
		} else if (fullTextLower.includes("s2") || fullTextLower.includes("magister")) {
			programStudi = "s2_gigi";
		} else if (fullTextLower.includes("s3") || fullTextLower.includes("doktor")) {
			programStudi = "s3_gigi";
		} else if (fullTextLower.includes("program studi sarjana") || fullTextLower.includes("pendidikan dokter gigi (s1)") || fullTextLower.includes("sarjana")) {
			programStudi = "s1_gigi";
		}
	}

	// 4. Extract Tahun
	// Look for 4 digit numbers at the bottom of the page (usually matching a year like 2010-2026)
	for (let i = lines.length - 1; i >= 0; i--) {
		const match = lines[i].match(/\b(20\d{2}|19\d{2})\b/);
		if (match) {
			tahun = match[1];
			break;
		}
	}

	// 5. Extract Dosen Pembimbing
	// Scan fullText (first 4 pages)
	const pembimbingPatterns = [
		/dibimbing oleh\s*[:\s]*([^\n.]+)/i,
		/dosen pembimbing\s*[:\s]*([^\n.]+)/i,
		/pembimbing\s*:\s*([^\n.]+)/i,
		/pembimbing\s+I\b\s*([^\n.]+)/i,
	];

	for (const pattern of pembimbingPatterns) {
		const match = fullText.match(pattern);
		if (match) {
			let rawNames = match[1].trim();
			// Clean up common suffix patterns
			rawNames = rawNames
				.replace(/\s+/g, " ")
				.replace(/dan\s+pembimbing\s+ii.*/i, "")
				.replace(/pembimbing\s+ii.*/i, "")
				.trim();
			dosenPembimbingPenguji = rawNames;
			break;
		}
	}

	// Final cleaning
	if (judulSkripsi) judulSkripsi = judulSkripsi.replace(/\s+/g, " ").trim();
	if (namaLengkap) namaLengkap = namaLengkap.replace(/\s+/g, " ").trim();

	return {
		judulSkripsi,
		namaLengkap,
		nim,
		programStudi,
		tahun,
		dosenPembimbingPenguji,
	};
}
