import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Check,
	CheckCircle2,
	Copy,
	FileText,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { toast } from "../components/ui/useToast";
import { type ProgramStudiSlug, programStudiMap } from "../server/db/schema";
import { createSubmissionFn } from "../server/submissionFunctions";

export const Route = createFileRoute("/ajukan")({
	component: AjukanComponent,
});

function AjukanComponent() {
	const [submittedCode, setSubmittedCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	// Form State
	const [namaLengkap, setNamaLengkap] = useState("");
	const [nim, setNim] = useState("");
	const [email, setEmail] = useState("");
	const [noTelp, setNoTelp] = useState("");
	const [alamatLengkap, setAlamatLengkap] = useState("");
	const [programStudi, setProgramStudi] = useState<ProgramStudiSlug | "">("");
	const [dosenPembimbing, setDosenPembimbing] = useState("");
	const [judulSkripsi, setJudulSkripsi] = useState("");
	const [sumbanganBuku, setSumbanganBuku] = useState<
		"individu" | "kelompok" | "tidak_ada"
	>("tidak_ada");

	// File State
	const [kartuMahasiswa, setKartuMahasiswa] = useState<File | null>(null);
	const [skripsi, setSkripsi] = useState<File | null>(null);

	// Validation Errors
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleCopyCode = () => {
		if (!submittedCode) return;
		navigator.clipboard.writeText(submittedCode);
		setCopied(true);
		toast.success("Kode tracking disalin!");
		setTimeout(() => setCopied(false), 2000);
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!namaLengkap.trim()) newErrors.namaLengkap = "Nama lengkap wajib diisi";
		else if (namaLengkap.trim().length < 3)
			newErrors.namaLengkap = "Nama lengkap minimal 3 karakter";

		if (!nim.trim()) newErrors.nim = "NIM/Stambuk wajib diisi";
		else if (nim.trim().length < 5)
			newErrors.nim = "NIM/Stambuk minimal 5 karakter";
		else if (!/^[a-zA-Z0-9.\-/]+$/.test(nim.trim()))
			newErrors.nim = "NIM hanya boleh huruf, angka, titik, strip, dan slash";

		if (!email.trim()) newErrors.email = "Email wajib diisi";
		else if (!/\S+@\S+\.\S+/.test(email))
			newErrors.email = "Format email tidak valid";

		if (!noTelp.trim()) newErrors.noTelp = "Nomor telepon wajib diisi";
		else if (noTelp.trim().length < 9)
			newErrors.noTelp = "Nomor telepon minimal 9 digit";
		else if (!/^[0-9+\s\-()]+$/.test(noTelp))
			newErrors.noTelp = "Format nomor telepon tidak valid";

		if (!alamatLengkap.trim())
			newErrors.alamatLengkap = "Alamat lengkap wajib diisi";
		else if (alamatLengkap.trim().length < 10)
			newErrors.alamatLengkap = "Alamat lengkap minimal 10 karakter";

		if (!programStudi) newErrors.programStudi = "Program studi wajib dipilih";

		if (!dosenPembimbing.trim())
			newErrors.dosenPembimbing = "Dosen pembimbing & penguji wajib diisi";
		else if (dosenPembimbing.trim().length < 5)
			newErrors.dosenPembimbing = "Minimal 5 karakter";

		if (!judulSkripsi.trim())
			newErrors.judulSkripsi = "Judul skripsi wajib diisi";
		else if (judulSkripsi.trim().length < 5)
			newErrors.judulSkripsi = "Judul skripsi minimal 5 karakter";

		if (!kartuMahasiswa) {
			newErrors.kartuMahasiswa = "Kartu Mahasiswa wajib diunggah";
		} else {
			const validKMTypes = ["application/pdf", "image/jpeg", "image/png"];
			if (!validKMTypes.includes(kartuMahasiswa.type)) {
				newErrors.kartuMahasiswa = "Format file harus PDF, JPG, atau PNG";
			}
			if (kartuMahasiswa.size > 10 * 1024 * 1024) {
				newErrors.kartuMahasiswa = "Ukuran file maksimal 10 MB";
			}
		}

		if (!skripsi) {
			newErrors.skripsi = "File Skripsi wajib diunggah";
		} else {
			if (skripsi.type !== "application/pdf") {
				newErrors.skripsi = "Format file harus PDF";
			}
			if (skripsi.size > 10 * 1024 * 1024) {
				newErrors.skripsi = "Ukuran file maksimal 10 MB";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) {
			toast.error("Silakan lengkapi form dengan benar.");
			setTimeout(() => {
				const firstErrorField = document.querySelector("[aria-invalid='true']");
				if (firstErrorField) {
					firstErrorField.scrollIntoView({
						behavior: "smooth",
						block: "center",
					});
					if (firstErrorField instanceof HTMLElement) {
						firstErrorField.focus();
					}
				}
			}, 50);
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("namaLengkap", namaLengkap.trim());
			formData.append("nim", nim.trim().toUpperCase());
			formData.append("email", email.trim());
			formData.append("noTelp", noTelp.trim());
			formData.append("alamatLengkap", alamatLengkap.trim());
			formData.append("programStudi", programStudi);
			formData.append("dosenPembimbingPenguji", dosenPembimbing.trim());
			formData.append("judulSkripsi", judulSkripsi.trim());
			formData.append("sumbanganBuku", sumbanganBuku);
			if (kartuMahasiswa) formData.append("kartuMahasiswa", kartuMahasiswa);
			if (skripsi) formData.append("skripsi", skripsi);

			const result = await createSubmissionFn({ data: formData });
			if (result.success && result.trackingCode) {
				setSubmittedCode(result.trackingCode);
				toast.success("Pengajuan berhasil dikirim!");
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal mengirim pengajuan. Coba lagi.");
		} finally {
			setLoading(false);
		}
	};

	if (submittedCode) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
				{/* Blobs */}
				<div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
				<div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

				<Card className="w-full max-w-[500px] border-border bg-card/65 backdrop-blur-xl relative z-10 shadow-2xl text-center p-6 rounded-3xl">
					<CardContent className="space-y-6 pt-6">
						<div className="flex justify-center">
							<div className="p-4 bg-emerald-500/15 rounded-full">
								<CheckCircle2 className="h-16 w-16 text-emerald-500" />
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-2xl font-bold tracking-tight">
								Pengajuan Berhasil Dikirim!
							</h2>
							<p className="text-sm text-muted-foreground">
								Terima kasih. Berkas bebas pustaka Anda telah berhasil diunggah
								dan sedang dalam antrean verifikasi oleh Pustakawan.
							</p>
						</div>

						{/* Tracking Code Area */}
						<div className="bg-muted/50 border border-border p-5 rounded-2xl space-y-2.5 relative">
							<span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
								Kode Tracking Anda
							</span>
							<div className="flex items-center justify-center gap-3">
								<code className="text-xl sm:text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">
									{submittedCode}
								</code>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={handleCopyCode}
									className="h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
								>
									{copied ? (
										<Check className="h-4 w-4 text-emerald-500" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="text-xs text-muted-foreground bg-indigo-500/5 border border-indigo-500/10 p-3.5 rounded-xl flex items-start gap-2.5 text-left">
							<AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
							<p>
								<strong>Penting:</strong> Simpan kode tracking di atas dengan
								baik. Kode ini digunakan untuk melacak status verifikasi
								pengajuan bebas pustaka Anda di halaman{" "}
								<strong>Cek Status</strong>.
							</p>
						</div>

						<div className="flex flex-col gap-2 pt-2">
							<Button
								asChild
								className="w-full rounded-xl py-5 h-auto cursor-pointer"
							>
								<Link
									to="/status"
									search={{ trackingCode: submittedCode || undefined }}
								>
									Cek Status Pengajuan
								</Link>
							</Button>
							<Button
								asChild
								variant="ghost"
								className="w-full rounded-xl py-5 h-auto text-muted-foreground hover:text-foreground cursor-pointer"
							>
								<Link to="/">Kembali ke Beranda</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-background text-foreground pb-20 relative overflow-x-hidden">
			{/* Blobs */}
			<div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>
			<div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/2 rounded-full blur-3xl pointer-events-none"></div>

			{/* Navbar/Back */}
			<div className="max-w-2xl mx-auto px-4 pt-8 pb-4 relative z-10 flex items-center justify-between">
				<Button asChild variant="ghost">
					<Link to="/">
						<ArrowLeft />
						Kembali
					</Link>
				</Button>
			</div>

			<div className="max-w-2xl mx-auto px-4 relative z-10 space-y-6">
				<div>
					<h1 className="text-3xl font-extrabold tracking-tight">
						Formulir Bebas Pustaka
					</h1>
					<p className="text-muted-foreground mt-1.5">
						Lengkapi seluruh informasi akademik dan unggah dokumen persyaratan
						bebas pustaka FKG Unhas di bawah ini.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Section 1: Data Diri */}
					<Card className="border-border bg-card/45 backdrop-blur-md rounded-2xl">
						<CardHeader>
							<CardTitle className="text-lg font-bold">
								1. Data Diri Mahasiswa
							</CardTitle>
							<CardDescription>
								Informasi identitas pribadi Anda yang berlaku
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="namaLengkap">
									Nama Lengkap <span className="text-rose-500">*</span>
								</Label>
								<Input
									id="namaLengkap"
									placeholder="Sesuai ijazah tanpa singkatan"
									value={namaLengkap}
									onChange={(e) => setNamaLengkap(e.target.value)}
									disabled={loading}
									aria-invalid={!!errors.namaLengkap}
									className="bg-background/40"
								/>
								{errors.namaLengkap && (
									<p className="text-xs text-rose-500">{errors.namaLengkap}</p>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="email">
										Email <span className="text-rose-500">*</span>
									</Label>
									<Input
										id="email"
										type="email"
										placeholder="contoh@student.unhas.ac.id"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={loading}
										aria-invalid={!!errors.email}
										className="bg-background/40"
									/>
									{errors.email && (
										<p className="text-xs text-rose-500">{errors.email}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="noTelp">
										No. Telp / WhatsApp <span className="text-rose-500">*</span>
									</Label>
									<Input
										id="noTelp"
										placeholder="contoh: 08123456789"
										value={noTelp}
										onChange={(e) => setNoTelp(e.target.value)}
										disabled={loading}
										aria-invalid={!!errors.noTelp}
										className="bg-background/40"
									/>
									{errors.noTelp && (
										<p className="text-xs text-rose-500">{errors.noTelp}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="alamatLengkap">
									Alamat Lengkap <span className="text-rose-500">*</span>
								</Label>
								<textarea
									id="alamatLengkap"
									rows={3}
									placeholder="Alamat domisili saat ini secara lengkap"
									value={alamatLengkap}
									onChange={(e) => setAlamatLengkap(e.target.value)}
									disabled={loading}
									aria-invalid={!!errors.alamatLengkap}
									className="w-full flex rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 border-border text-foreground"
								/>
								{errors.alamatLengkap && (
									<p className="text-xs text-rose-500">
										{errors.alamatLengkap}
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Section 2: Data Akademik */}
					<Card className="border-border bg-card/45 backdrop-blur-md rounded-2xl">
						<CardHeader>
							<CardTitle className="text-lg font-bold">
								2. Informasi Akademik
							</CardTitle>
							<CardDescription>
								Data studi dan karya ilmiah kelulusan
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="nim">
										Stambuk / NIM <span className="text-rose-500">*</span>
									</Label>
									<Input
										id="nim"
										placeholder="contoh: I011201001"
										value={nim}
										onChange={(e) => setNim(e.target.value)}
										disabled={loading}
										aria-invalid={!!errors.nim}
										className="bg-background/40"
									/>
									{errors.nim && (
										<p className="text-xs text-rose-500">{errors.nim}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="programStudi">
										Program Studi <span className="text-rose-500">*</span>
									</Label>
									<Select
										value={programStudi}
										onValueChange={(val) =>
											setProgramStudi(val as ProgramStudiSlug)
										}
										disabled={loading}
									>
										<SelectTrigger
											id="programStudi"
											aria-invalid={!!errors.programStudi}
											className="w-full! flex bg-background/40 border-border text-foreground focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 h-9 rounded-md"
										>
											<SelectValue placeholder="-- Pilih Program Studi --" />
										</SelectTrigger>
										<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
											<SelectGroup>
												{Object.entries(programStudiMap).map(
													([slug, label]) => (
														<SelectItem key={slug} value={slug}>
															{label}
														</SelectItem>
													),
												)}
											</SelectGroup>
										</SelectContent>
									</Select>
									{errors.programStudi && (
										<p className="text-xs text-rose-500">
											{errors.programStudi}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="dosenPembimbing">
									Dosen Pembimbing & Penguji{" "}
									<span className="text-rose-500">*</span>
								</Label>
								<textarea
									id="dosenPembimbing"
									rows={2}
									placeholder="Masukkan nama-nama Dosen Pembimbing dan Penguji skripsi Anda"
									value={dosenPembimbing}
									onChange={(e) => setDosenPembimbing(e.target.value)}
									disabled={loading}
									aria-invalid={!!errors.dosenPembimbing}
									className="w-full flex rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 border-border text-foreground"
								/>
								{errors.dosenPembimbing && (
									<p className="text-xs text-rose-500">
										{errors.dosenPembimbing}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="judulSkripsi">
									Judul Skripsi / KTI / Tesis / Disertasi{" "}
									<span className="text-rose-500">*</span>
								</Label>
								<textarea
									id="judulSkripsi"
									rows={3}
									placeholder="Tuliskan judul lengkap karya ilmiah Anda"
									value={judulSkripsi}
									onChange={(e) => setJudulSkripsi(e.target.value)}
									disabled={loading}
									aria-invalid={!!errors.judulSkripsi}
									className="w-full flex rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 border-border text-foreground"
								/>
								{errors.judulSkripsi && (
									<p className="text-xs text-rose-500">{errors.judulSkripsi}</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Section 3: Upload Berkas */}
					<Card className="border-border bg-card/45 backdrop-blur-md rounded-2xl">
						<CardHeader>
							<CardTitle className="text-lg font-bold">
								3. Unggah Berkas Persyaratan
							</CardTitle>
							<CardDescription>
								Ukuran maksimal berkas masing-masing adalah 10 MB
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* KTM Upload */}
							<div className="space-y-2">
								<Label className="flex items-center gap-1">
									KTM / Kartu Anggota Perpustakaan{" "}
									<span className="text-rose-500">*</span>
									<span className="text-[10px] text-muted-foreground font-normal">
										(PDF, JPG, PNG)
									</span>
								</Label>

								<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-6 bg-background/10 transition-colors relative">
									<input
										type="file"
										id="kartuMahasiswaFile"
										accept=".pdf,.jpg,.jpeg,.png"
										disabled={loading}
										onChange={(e) => {
											const file = e.target.files?.[0] || null;
											setKartuMahasiswa(file);
										}}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
									/>
									<Upload className="h-8 w-8 text-muted-foreground mb-2" />
									<span className="text-xs font-semibold text-muted-foreground">
										{kartuMahasiswa
											? kartuMahasiswa.name
											: "Klik atau seret file ke sini untuk mengunggah"}
									</span>
									{kartuMahasiswa && (
										<span className="text-[10px] text-indigo-500 font-medium mt-1">
											{(kartuMahasiswa.size / (1024 * 1024)).toFixed(2)} MB
										</span>
									)}
								</div>
								{errors.kartuMahasiswa && (
									<p className="text-xs text-rose-500 mt-1">
										{errors.kartuMahasiswa}
									</p>
								)}
							</div>

							{/* Skripsi Upload */}
							<div className="space-y-2">
								<Label className="flex items-center gap-1">
									File Skripsi / Tesis / Disertasi Ber-TTD{" "}
									<span className="text-rose-500">*</span>
									<span className="text-[10px] text-muted-foreground font-normal">
										(PDF Only)
									</span>
								</Label>

								<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-6 bg-background/10 transition-colors relative">
									<input
										type="file"
										id="skripsiFile"
										accept=".pdf"
										disabled={loading}
										onChange={(e) => {
											const file = e.target.files?.[0] || null;
											setSkripsi(file);
										}}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
									/>
									<FileText className="h-8 w-8 text-muted-foreground mb-2" />
									<span className="text-xs font-semibold text-muted-foreground">
										{skripsi
											? skripsi.name
											: "Klik atau seret file ke sini untuk mengunggah"}
									</span>
									{skripsi && (
										<span className="text-[10px] text-indigo-500 font-medium mt-1">
											{(skripsi.size / (1024 * 1024)).toFixed(2)} MB
										</span>
									)}
								</div>
								{errors.skripsi && (
									<p className="text-xs text-rose-500 mt-1">{errors.skripsi}</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Section 4: Sumbang Buku */}
					<Card className="border-border bg-card/45 backdrop-blur-md rounded-2xl">
						<CardHeader>
							<CardTitle className="text-lg font-bold">
								4. Sumbangan Buku Alumni{" "}
								<span className="text-xs text-muted-foreground font-normal">
									(Opsional)
								</span>
							</CardTitle>
							<CardDescription>
								Pilih jenis partisipasi sumbangan buku fisik untuk perpustakaan
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<button
									type="button"
									onClick={() => setSumbanganBuku("individu")}
									className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
										sumbanganBuku === "individu"
											? "border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200"
											: "border-border bg-background/40 hover:border-indigo-500/30 text-muted-foreground"
									}`}
								>
									<span className="font-semibold text-sm">Individu</span>
									<span className="text-[10px] text-muted-foreground leading-tight">
										Menyumbang 1 buah buku fisik secara mandiri
									</span>
								</button>

								<button
									type="button"
									onClick={() => setSumbanganBuku("kelompok")}
									className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
										sumbanganBuku === "kelompok"
											? "border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200"
											: "border-border bg-background/40 hover:border-indigo-500/30 text-muted-foreground"
									}`}
								>
									<span className="font-semibold text-sm">Kelompok</span>
									<span className="text-[10px] text-muted-foreground leading-tight">
										Menyumbang buku fisik bersama kelompok/angkatan
									</span>
								</button>

								<button
									type="button"
									onClick={() => setSumbanganBuku("tidak_ada")}
									className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
										sumbanganBuku === "tidak_ada"
											? "border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200"
											: "border-border bg-background/40 hover:border-indigo-500/30 text-muted-foreground"
									}`}
								>
									<span className="font-semibold text-sm">
										Tidak Menyumbang
									</span>
									<span className="text-[10px] text-muted-foreground leading-tight">
										Tidak berpartisipasi menyumbang buku fisik
									</span>
								</button>
							</div>
						</CardContent>
					</Card>

					{/* Action buttons */}
					<div className="flex gap-4 pt-4">
						<Button
							type="submit"
							disabled={loading}
							className="flex-1 rounded-2xl py-6 h-auto font-bold text-base cursor-pointer shadow-lg"
						>
							{loading ? "Sedang Mengirim..." : "Kirim Pengajuan Bebas Pustaka"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
