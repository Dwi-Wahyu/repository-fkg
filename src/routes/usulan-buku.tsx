import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	BookPlus,
	Calendar,
	CheckCircle2,
	Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "../components/ui/useToast";
import {
	createBookSuggestionFn,
	getBookSuggestionCooldownFn,
} from "../server/bookSuggestionFunctions";

export const Route = createFileRoute("/usulan-buku")({
	component: UsulanBukuComponent,
});

interface LocalHistoryItem {
	id: number;
	judulBuku: string;
	createdAt: string;
}

function UsulanBukuComponent() {
	const [judulBuku, setJudulBuku] = useState("");
	const [penerbit, setPenerbit] = useState("");
	const [coverBuku, setCoverBuku] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [history, setHistory] = useState<LocalHistoryItem[]>([]);

	// Cooldown state from server
	const [cooldown, setCooldown] = useState<{
		canSubmit: boolean;
		remainingSeconds: number;
		lastSubmittedAt: string | null;
	}>({
		canSubmit: true,
		remainingSeconds: 0,
		lastSubmittedAt: null,
	});

	// Load local history and sync cooldown on mount
	useEffect(() => {
		// 1. Local history
		try {
			const saved = localStorage.getItem("usulan-buku-riwayat");
			if (saved) {
				setHistory(JSON.parse(saved));
			}
		} catch (e) {
			console.error("Gagal memuat riwayat usulan lokal", e);
		}

		// 2. Cooldown status
		syncCooldown();
	}, []);

	const syncCooldown = async () => {
		try {
			const res = await getBookSuggestionCooldownFn();
			setCooldown(res);
		} catch (err) {
			console.error("Gagal mendapatkan status cooldown", err);
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (!judulBuku.trim()) {
			newErrors.judulBuku = "Judul Buku wajib diisi";
		} else if (judulBuku.trim().length < 3) {
			newErrors.judulBuku = "Judul Buku minimal 3 karakter";
		} else if (judulBuku.trim().length > 500) {
			newErrors.judulBuku = "Judul Buku maksimal 500 karakter";
		}

		if (coverBuku) {
			if (!coverBuku.type.startsWith("image/")) {
				newErrors.coverBuku = "File harus berupa gambar";
			} else if (coverBuku.size > 5 * 1024 * 1024) {
				newErrors.coverBuku = "Ukuran file maksimal 5 MB";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("judulBuku", judulBuku.trim());
			if (penerbit.trim()) {
				formData.append("penerbit", penerbit.trim());
			}
			if (coverBuku) {
				formData.append("coverBuku", coverBuku);
			}

			const res = await createBookSuggestionFn({
				data: formData,
			});

			if (res.success) {
				toast.success("Usulan buku berhasil dikirim!");

				// Add to local history
				const newItem: LocalHistoryItem = {
					id: res.id,
					judulBuku: res.judulBuku,
					createdAt: res.createdAt,
				};
				const updatedHistory = [newItem, ...history];
				setHistory(updatedHistory);
				localStorage.setItem(
					"usulan-buku-riwayat",
					JSON.stringify(updatedHistory),
				);

				// Reset form and sync cooldown
				setJudulBuku("");
				setPenerbit("");
				setCoverBuku(null);
				syncCooldown();
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal mengirim usulan");
			// Re-sync cooldown in case it failed due to server cooldown check
			syncCooldown();
		} finally {
			setLoading(false);
		}
	};

	// Determine unlock date/time if on cooldown
	const getUnlockTimeString = () => {
		if (cooldown.canSubmit || !cooldown.lastSubmittedAt) return null;
		const lastDate = new Date(cooldown.lastSubmittedAt);
		const unlockDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
		return unlockDate.toLocaleString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getCooldownHoursMins = () => {
		if (cooldown.canSubmit || cooldown.remainingSeconds <= 0) return "";
		const hrs = Math.floor(cooldown.remainingSeconds / 3600);
		const mins = Math.ceil((cooldown.remainingSeconds % 3600) / 60);
		return `${hrs} jam ${mins} menit`;
	};

	const unlockTime = getUnlockTimeString();
	const remainingTimeStr = getCooldownHoursMins();

	return (
		<div className="min-h-svh w-full bg-background text-foreground pb-20 relative overflow-x-hidden">
			{/* Decorative Blobs */}
			<div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>
			<div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/2 rounded-full blur-3xl pointer-events-none"></div>

			{/* Navbar/Back Link */}
			<div className="max-w-2xl mx-auto px-4 pt-8 pb-4 relative z-10 flex items-center justify-between">
				<Button asChild variant="ghost">
					<Link to="/">
						<ArrowLeft />
						Kembali
					</Link>
				</Button>
			</div>

			<div className="max-w-2xl mx-auto px-4 relative z-10 space-y-6">
				{/* Header Section */}
				<div>
					<h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
						Usulan Buku
					</h1>
					<p className="text-muted-foreground mt-1.5">
						Bantu kami memperluas koleksi perpustakaan Fakultas Kedokteran Gigi
						Universitas Hasanuddin dengan menyarankan judul buku baru yang Anda
						butuhkan.
					</p>
				</div>

				{/* Cooldown Alert Banner */}
				{!cooldown.canSubmit && (
					<div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
						<AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
						<div>
							<strong>Batas Harian Tercapai:</strong> Anda sudah mengajukan
							usulan buku hari ini. Silakan coba lagi besok setelah{" "}
							<strong>{unlockTime}</strong> (sekitar {remainingTimeStr} lagi).
						</div>
					</div>
				)}

				{/* Form Card */}
				<Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg">Kirim Usulan Judul Buku</CardTitle>
						<CardDescription>
							Satu usulan diperbolehkan per setiap 24 jam.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="judulBuku">
									Judul Buku <span className="text-destructive">*</span>
								</Label>
								<Input
									id="judulBuku"
									placeholder="Masukkan judul buku, penulis, atau edisi yang diusulkan..."
									value={judulBuku}
									onChange={(e) => {
										setJudulBuku(e.target.value);
										if (errors.judulBuku) {
											setErrors((prev) => {
												const { judulBuku, ...rest } = prev;
												return rest;
											});
										}
									}}
									aria-invalid={!!errors.judulBuku}
									disabled={!cooldown.canSubmit || loading}
									className="bg-background/50"
								/>
								{errors.judulBuku && (
									<p className="text-xs text-destructive mt-1 flex items-center gap-1">
										<AlertCircle className="h-3 w-3" />
										{errors.judulBuku}
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="penerbit">
									Penerbit{" "}
									<span className="text-muted-foreground text-xs">
										(Opsional)
									</span>
								</Label>
								<Input
									id="penerbit"
									placeholder="Masukkan nama penerbit..."
									value={penerbit}
									onChange={(e) => setPenerbit(e.target.value)}
									disabled={!cooldown.canSubmit || loading}
									className="bg-background/50"
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="coverBuku" className="flex items-center gap-1">
									Cover Buku{" "}
									<span className="text-muted-foreground text-xs">
										(Opsional, Gambar Maks 5 MB)
									</span>
								</Label>
								<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-6 bg-background/10 transition-colors relative">
									<input
										type="file"
										id="coverBuku"
										accept="image/*"
										disabled={!cooldown.canSubmit || loading}
										onChange={(e) => {
											const file = e.target.files?.[0] || null;
											setCoverBuku(file);
											if (errors.coverBuku) {
												setErrors((prev) => {
													const { coverBuku, ...rest } = prev;
													return rest;
												});
											}
										}}
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
									/>
									<Upload className="h-8 w-8 text-muted-foreground mb-2" />
									<span className="text-xs font-semibold text-muted-foreground text-center">
										{coverBuku
											? coverBuku.name
											: "Klik atau seret file gambar cover ke sini"}
									</span>
									{coverBuku && (
										<span className="text-[10px] text-indigo-500 font-medium mt-1">
											{(coverBuku.size / (1024 * 1024)).toFixed(2)} MB
										</span>
									)}
								</div>
								{errors.coverBuku && (
									<p className="text-xs text-destructive mt-1 flex items-center gap-1">
										<AlertCircle className="h-3 w-3" />
										{errors.coverBuku}
									</p>
								)}
							</div>

							<Button
								type="submit"
								disabled={!cooldown.canSubmit || loading}
								className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl py-5 h-auto cursor-pointer font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading
									? "Mengirim..."
									: !cooldown.canSubmit
										? "Batas Harian Tercapai"
										: "Kirim Usulan Buku"}
							</Button>

							<p className="text-[10px] text-muted-foreground text-center mt-2">
								* mohon digunakan secara bijak.
							</p>
						</form>
					</CardContent>
				</Card>

				{/* Local History Card */}
				<Card className="border-border bg-card/45 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<BookOpen className="h-4 w-4 text-indigo-500" /> Riwayat
							Pengusulan Anda
						</CardTitle>
						<CardDescription>
							Daftar usulan buku yang pernah Anda.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{history.length === 0 ? (
							<div className="py-10 text-center flex flex-col items-center justify-center space-y-2 text-muted-foreground">
								<div className="p-3 bg-muted/30 rounded-full">
									<BookOpen className="h-6 w-6 text-muted-foreground" />
								</div>
								<p className="text-xs font-medium">
									Anda belum pernah mengusulkan buku.
								</p>
							</div>
						) : (
							<div className="divide-y divide-border/60">
								{history.map((item) => (
									<div
										key={item.id}
										className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
									>
										<div className="space-y-1">
											<p className="font-semibold text-foreground leading-snug">
												{item.judulBuku}
											</p>
											<div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
												<Calendar size={11} />
												<span>
													{new Date(item.createdAt).toLocaleDateString(
														"id-ID",
														{
															day: "numeric",
															month: "long",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
