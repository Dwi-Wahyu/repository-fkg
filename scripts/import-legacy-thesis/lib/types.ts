export interface StagingEntry {
	originalFileName: string;
	sourceFilePath: string; // path in source-pdf/
	extracted: {
		judulSkripsi: string | null;
		namaLengkap: string | null;
		nim: string | null;
		programStudi: string | null; // slug matching programStudiMap key, or null
		tahun: string | null;
		dosenPembimbingPenguji: string | null;
	};
	confidence: {
		judulSkripsi: "extracted" | "not_found";
		namaLengkap: "extracted" | "not_found";
		nim: "extracted" | "not_found";
		programStudi: "extracted" | "not_found";
		dosenPembimbingPenguji: "extracted" | "not_found";
	};
	needsManualReview: boolean; // true if any required field is missing or format is non-standard
	rawCoverTextSnippet: string; // snippet of page 1 text for quick visual verification
	reviewedAndApproved: boolean; // false by default, changed to true by admin after review
}
