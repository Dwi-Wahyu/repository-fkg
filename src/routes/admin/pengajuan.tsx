import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowUpDown,
	BookOpen,
	Calendar,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	FileText,
	Filter,
	Mail,
	MapPin,
	MoreHorizontal,
	Pencil,
	Phone,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	Upload,
	User,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AdminTableSkeleton } from "../../components/skeletons/admin-table-skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "../../components/ui/useToast";
import { programStudiMap } from "../../server/db/schema";
import {
	createSubmissionFn,
	deleteSubmissionFn,
	downloadSertifikatFn,
	downloadSubmissionFileFn,
	getSubmissionsFn,
	rejectSubmissionFn,
	updateSubmissionFn,
	verifySubmissionFn,
} from "../../server/submissionFunctions";

export const Route = createFileRoute("/admin/pengajuan")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || undefined,
			status:
				(search.status as "pending" | "diverifikasi" | "ditolak") || undefined,
			programStudi: (search.programStudi as string) || undefined,
			sortBy: (search.sortBy as string) || "createdAt",
			sortOrder: (search.sortOrder as "asc" | "desc") || "desc",
			page: search.page ? Number(search.page) || 1 : 1,
			pageSize: search.pageSize ? Number(search.pageSize) || 10 : 10,
		} as {
			search?: string;
			status?: "pending" | "diverifikasi" | "ditolak";
			programStudi?: string;
			sortBy?: string;
			sortOrder?: "asc" | "desc";
			page?: number;
			pageSize?: number;
		};
	},
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		return await getSubmissionsFn({ data: deps });
	},
	pendingComponent: () => <AdminTableSkeleton />,
	component: AdminPengajuanComponent,
});

function AdminPengajuanComponent() {
	const navigate = useNavigate({ from: "/admin/pengajuan" });
	const { items, totalItems, totalPages, page, pageSize } =
		Route.useLoaderData();
	const searchParams = Route.useSearch();

	// Local UI states
	const [searchText, setSearchText] = useState(searchParams.search || "");
	const [selectedSub, setSelectedSub] = useState<any | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isVerifyAlertOpen, setIsVerifyAlertOpen] = useState(false);
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [actionId, setActionId] = useState<number | null>(null);
	const [loadingAction, setLoadingAction] = useState(false);

	// Edit Submission states
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [editNamaLengkap, setEditNamaLengkap] = useState("");
	const [editNim, setEditNim] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editNoTelp, setEditNoTelp] = useState("");
	const [editAlamatLengkap, setEditAlamatLengkap] = useState("");
	const [editProgramStudi, setEditProgramStudi] = useState("");
	const [editDosenPembimbing, setEditDosenPembimbing] = useState("");
	const [editJudulSkripsi, setEditJudulSkripsi] = useState("");
	const [editSumbanganBuku, setEditSumbanganBuku] = useState("");
	const [editStatus, setEditStatus] = useState<
		"pending" | "diverifikasi" | "ditolak"
	>("pending");
	const [editCatatanAdmin, setEditCatatanAdmin] = useState("");
	const [editKtmFile, setEditKtmFile] = useState<File | null>(null);
	const [editSkripsiFile, setEditSkripsiFile] = useState<File | null>(null);
	const [editErrors, setEditErrors] = useState<Record<string, string>>({});

	const validateEditForm = () => {
		const newErrors: Record<string, string> = {};

		// Required fields to match database constraints
		if (!editNamaLengkap.trim())
			newErrors.namaLengkap = "Nama lengkap wajib diisi";
		else if (editNamaLengkap.trim().length < 3)
			newErrors.namaLengkap = "Nama lengkap minimal 3 karakter";

		if (!editNim.trim()) {
			newErrors.nim = "NIM wajib diisi";
		} else if (!/^[a-zA-Z0-9.\-/]+$/.test(editNim.trim())) {
			newErrors.nim = "NIM hanya boleh huruf, angka, titik, strip, dan slash";
		}

		if (!editProgramStudi) {
			newErrors.programStudi = "Program studi wajib diisi";
		}

		if (!editJudulSkripsi.trim()) {
			newErrors.judulSkripsi = "Judul karya ilmiah wajib diisi";
		} else if (editJudulSkripsi.trim().length < 5) {
			newErrors.judulSkripsi = "Judul karya ilmiah minimal 5 karakter";
		}

		if (editEmail.trim()) {
			if (!/\S+@\S+\.\S+/.test(editEmail))
				newErrors.email = "Format email tidak valid";
		}

		if (editNoTelp.trim()) {
			if (!/^[0-9+\s\-()]+$/.test(editNoTelp))
				newErrors.noTelp = "Format nomor telepon tidak valid";
		}

		if (editKtmFile) {
			const validKMTypes = ["application/pdf", "image/jpeg", "image/png"];
			if (!validKMTypes.includes(editKtmFile.type)) {
				newErrors.kartuMahasiswa = "Format file harus PDF, JPG, atau PNG";
			}
			if (editKtmFile.size > 10 * 1024 * 1024) {
				newErrors.kartuMahasiswa = "Ukuran file maksimal 10 MB";
			}
		}

		if (editSkripsiFile) {
			if (editSkripsiFile.type !== "application/pdf") {
				newErrors.skripsi = "Format file harus PDF";
			}
			if (editSkripsiFile.size > 10 * 1024 * 1024) {
				newErrors.skripsi = "Ukuran file maksimal 10 MB";
			}
		}

		setEditErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedSub) return;
		if (!validateEditForm()) {
			toast.error("Silakan lengkapi form edit dengan benar.");
			return;
		}

		setLoadingAction(true);
		try {
			const formData = new FormData();
			formData.append("id", selectedSub.id.toString());
			formData.append("namaLengkap", editNamaLengkap.trim());
			formData.append("nim", editNim.trim().toUpperCase());
			formData.append("email", editEmail.trim());
			formData.append("noTelp", editNoTelp.trim());
			formData.append("alamatLengkap", editAlamatLengkap.trim());
			formData.append("programStudi", editProgramStudi);
			formData.append("dosenPembimbingPenguji", editDosenPembimbing.trim());
			formData.append("judulSkripsi", editJudulSkripsi.trim());
			formData.append("sumbanganBuku", editSumbanganBuku);
			formData.append("status", editStatus);
			formData.append("catatanAdmin", editCatatanAdmin.trim() || "");

			if (editKtmFile) {
				formData.append("kartuMahasiswa", editKtmFile);
			}
			if (editSkripsiFile) {
				formData.append("skripsi", editSkripsiFile);
			}

			const res = await updateSubmissionFn({ data: formData });
			if (res.success) {
				toast.success("Pengajuan berhasil diperbarui!");
				setIsEditOpen(false);
				setSelectedSub(null);
				navigate({ search: searchParams, replace: true });
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memperbarui pengajuan");
		} finally {
			setLoadingAction(false);
		}
	};

	// Add Submission states
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addNamaLengkap, setAddNamaLengkap] = useState("");
	const [addNim, setAddNim] = useState("");
	const [addEmail, setAddEmail] = useState("");
	const [addNoTelp, setAddNoTelp] = useState("");
	const [addAlamatLengkap, setAddAlamatLengkap] = useState("");
	const [addProgramStudi, setAddProgramStudi] = useState("");
	const [addDosenPembimbing, setAddDosenPembimbing] = useState("");
	const [addJudulSkripsi, setAddJudulSkripsi] = useState("");
	const [addSumbanganBuku, setAddSumbanganBuku] = useState("tidak_ada");
	const [addKtmFile, setAddKtmFile] = useState<File | null>(null);
	const [addSkripsiFile, setAddSkripsiFile] = useState<File | null>(null);
	const [addErrors, setAddErrors] = useState<Record<string, string>>({});

	const validateAddForm = () => {
		const newErrors: Record<string, string> = {};

		// Required fields to match database constraints
		if (!addNamaLengkap.trim())
			newErrors.namaLengkap = "Nama lengkap wajib diisi";
		else if (addNamaLengkap.trim().length < 3)
			newErrors.namaLengkap = "Nama lengkap minimal 3 karakter";

		if (!addNim.trim()) {
			newErrors.nim = "NIM wajib diisi";
		} else if (!/^[a-zA-Z0-9.\-/]+$/.test(addNim.trim())) {
			newErrors.nim = "NIM hanya boleh huruf, angka, titik, strip, dan slash";
		}

		if (!addProgramStudi) {
			newErrors.programStudi = "Program studi wajib diisi";
		}

		if (!addJudulSkripsi.trim()) {
			newErrors.judulSkripsi = "Judul karya ilmiah wajib diisi";
		} else if (addJudulSkripsi.trim().length < 5) {
			newErrors.judulSkripsi = "Judul karya ilmiah minimal 5 karakter";
		}

		if (addEmail.trim()) {
			if (!/\S+@\S+\.\S+/.test(addEmail))
				newErrors.email = "Format email tidak valid";
		}

		if (addNoTelp.trim()) {
			if (!/^[0-9+\s\-()]+$/.test(addNoTelp))
				newErrors.noTelp = "Format nomor telepon tidak valid";
		}

		// KTM is optional for admin
		if (addKtmFile) {
			const validKMTypes = ["application/pdf", "image/jpeg", "image/png"];
			if (!validKMTypes.includes(addKtmFile.type)) {
				newErrors.kartuMahasiswa = "Format file harus PDF, JPG, atau PNG";
			}
			if (addKtmFile.size > 10 * 1024 * 1024) {
				newErrors.kartuMahasiswa = "Ukuran file maksimal 10 MB";
			}
		}

		// File Skripsi is always required
		if (!addSkripsiFile) {
			newErrors.skripsi = "File Skripsi wajib diunggah";
		} else {
			if (addSkripsiFile.type !== "application/pdf") {
				newErrors.skripsi = "Format file harus PDF";
			}
			if (addSkripsiFile.size > 10 * 1024 * 1024) {
				newErrors.skripsi = "Ukuran file maksimal 10 MB";
			}
		}

		setAddErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateAddForm()) {
			toast.error("Silakan lengkapi form pengajuan dengan benar.");
			return;
		}

		setLoadingAction(true);
		try {
			const formData = new FormData();
			formData.append("isAdmin", "true");
			formData.append("namaLengkap", addNamaLengkap.trim());
			formData.append("nim", addNim.trim().toUpperCase());
			formData.append("email", addEmail.trim());
			formData.append("noTelp", addNoTelp.trim());
			formData.append("alamatLengkap", addAlamatLengkap.trim());
			formData.append("programStudi", addProgramStudi);
			formData.append("dosenPembimbingPenguji", addDosenPembimbing.trim());
			formData.append("judulSkripsi", addJudulSkripsi.trim());
			formData.append("sumbanganBuku", addSumbanganBuku || "tidak_ada");
			if (addKtmFile) formData.append("kartuMahasiswa", addKtmFile);
			if (addSkripsiFile) formData.append("skripsi", addSkripsiFile);

			const res = await createSubmissionFn({ data: formData });
			if (res.success) {
				toast.success(
					`Pengajuan berhasil ditambahkan! Kode Tracking: ${res.trackingCode}`,
				);
				setIsAddOpen(false);
				// Reset states
				setAddNamaLengkap("");
				setAddNim("");
				setAddEmail("");
				setAddNoTelp("");
				setAddAlamatLengkap("");
				setAddProgramStudi("");
				setAddDosenPembimbing("");
				setAddJudulSkripsi("");
				setAddSumbanganBuku("tidak_ada");
				setAddKtmFile(null);
				setAddSkripsiFile(null);
				setAddErrors({});
				navigate({ search: searchParams, replace: true });
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menambahkan pengajuan");
		} finally {
			setLoadingAction(false);
		}
	};

	// File Previews states
	const [ktmPreviewUrl, setKtmPreviewUrl] = useState<string | null>(null);
	const [skripsiPreviewUrl, setSkripsiPreviewUrl] = useState<string | null>(
		null,
	);
	const [loadingPreview, setLoadingPreview] = useState(false);

	useEffect(() => {
		if (!isDetailOpen || !selectedSub) {
			if (ktmPreviewUrl) window.URL.revokeObjectURL(ktmPreviewUrl);
			if (skripsiPreviewUrl) window.URL.revokeObjectURL(skripsiPreviewUrl);
			setKtmPreviewUrl(null);
			setSkripsiPreviewUrl(null);
			return;
		}

		const fetchPreviews = async () => {
			setLoadingPreview(true);
			try {
				// Fetch KTM
				try {
					const res = await downloadSubmissionFileFn({
						data: { id: selectedSub.id, fileType: "kartu" },
					});
					const binaryString = window.atob(res.base64);
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					const blob = new Blob([bytes], { type: res.mimeType });
					const url = window.URL.createObjectURL(blob);
					setKtmPreviewUrl(url);
				} catch (err) {
					console.error("Gagal load preview KTM", err);
				}

				// Fetch Skripsi
				try {
					const res = await downloadSubmissionFileFn({
						data: { id: selectedSub.id, fileType: "skripsi" },
					});
					const binaryString = window.atob(res.base64);
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					const blob = new Blob([bytes], { type: res.mimeType });
					const url = window.URL.createObjectURL(blob);
					setSkripsiPreviewUrl(url);
				} catch (err) {
					console.error("Gagal load preview Skripsi", err);
				}
			} finally {
				setLoadingPreview(false);
			}
		};

		fetchPreviews();
	}, [isDetailOpen, selectedSub]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		navigate({
			search: {
				...searchParams,
				search: searchText.trim() || undefined,
				page: 1,
			},
		});
	};

	const handleFilterStatus = (status: string) => {
		navigate({
			search: {
				...searchParams,
				status: (status === "all" ? undefined : status) as any,
				page: 1,
			},
		});
	};

	const handleFilterProdi = (prodi: string) => {
		navigate({
			search: {
				...searchParams,
				programStudi: prodi === "all" ? undefined : prodi,
				page: 1,
			},
		});
	};

	const handleSort = (column: string) => {
		const isCurrentSort = searchParams.sortBy === column;
		const newOrder =
			isCurrentSort && searchParams.sortOrder === "asc" ? "desc" : "asc";
		navigate({
			search: {
				...searchParams,
				sortBy: column,
				sortOrder: newOrder,
			},
		});
	};

	const handlePageChange = (newPage: number) => {
		if (newPage < 1 || newPage > totalPages) return;
		navigate({
			search: {
				...searchParams,
				page: newPage,
			},
			resetScroll: false,
		});
	};

	// File Downloader
	const handleDownloadFile = async (
		id: number,
		fileType: "kartu" | "skripsi",
	) => {
		try {
			toast.success("Mempersiapkan unduhan file...");
			const res = await downloadSubmissionFileFn({ data: { id, fileType } });

			// Decode base64
			const binaryString = window.atob(res.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: res.mimeType });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = res.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			toast.success("File berhasil diunduh.");
		} catch (err: any) {
			toast.error(err.message || "Gagal mengunduh file");
		}
	};

	const handleDownloadSertifikat = async (id: number) => {
		try {
			toast.success("Mempersiapkan unduhan sertifikat...");
			const res = await downloadSertifikatFn({ data: { id } });

			// Decode base64
			const binaryString = window.atob(res.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: res.mimeType });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = res.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			toast.success("Sertifikat berhasil diunduh.");
		} catch (err: any) {
			toast.error(err.message || "Gagal mengunduh sertifikat");
		}
	};

	// Actions
	const handleVerify = async () => {
		if (actionId === null) return;
		setLoadingAction(true);
		try {
			const res = await verifySubmissionFn({ data: { id: actionId } });
			if (res.success) {
				toast.success("Pengajuan berhasil diverifikasi!");
				setIsVerifyAlertOpen(false);
				setIsDetailOpen(false);
				navigate({ search: searchParams, replace: true }); // Reload data
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memverifikasi pengajuan");
		} finally {
			setLoadingAction(false);
		}
	};

	const handleReject = async () => {
		if (actionId === null) return;
		if (!rejectReason.trim()) {
			toast.error("Alasan penolakan wajib diisi");
			return;
		}
		setLoadingAction(true);
		try {
			const res = await rejectSubmissionFn({
				data: { id: actionId, catatanAdmin: rejectReason.trim() },
			});
			if (res.success) {
				toast.success("Pengajuan berhasil ditolak.");
				setIsRejectDialogOpen(false);
				setIsDetailOpen(false);
				setRejectReason("");
				navigate({ search: searchParams, replace: true });
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menolak pengajuan");
		} finally {
			setLoadingAction(false);
		}
	};

	const handleDelete = async () => {
		if (actionId === null) return;
		setLoadingAction(true);
		try {
			const res = await deleteSubmissionFn({ data: { id: actionId } });
			if (res.success) {
				toast.success("Pengajuan berhasil dihapus.");
				setIsDeleteAlertOpen(false);
				setIsDetailOpen(false);
				navigate({ search: searchParams, replace: true });
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menghapus pengajuan");
		} finally {
			setLoadingAction(false);
		}
	};

	const getStatusBadge = (status: "pending" | "diverifikasi" | "ditolak") => {
		switch (status) {
			case "diverifikasi":
				return (
					<Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-1 rounded-full font-semibold">
						Terverifikasi
					</Badge>
				);
			case "ditolak":
				return (
					<Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 py-1 rounded-full font-semibold">
						Ditolak
					</Badge>
				);
			default:
				return (
					<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 py-1 rounded-full font-semibold">
						Pending
					</Badge>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top header block */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold tracking-tight">
						Verifikasi Bebas Pustaka
					</h2>
					<p className="text-muted-foreground mt-1">
						Kelola dan verifikasi berkas pengajuan bebas pustaka mahasiswa FKG
						Unhas.
					</p>
				</div>
				<Button
					onClick={() => {
						setAddNamaLengkap("");
						setAddNim("");
						setAddEmail("");
						setAddNoTelp("");
						setAddAlamatLengkap("");
						setAddProgramStudi("");
						setAddDosenPembimbing("");
						setAddJudulSkripsi("");
						setAddSumbanganBuku("tidak_ada");
						setAddKtmFile(null);
						setAddSkripsiFile(null);
						setAddErrors({});
						setIsAddOpen(true);
					}}
				>
					<Plus />
					Tambah Pengajuan
				</Button>
			</div>

			{/* Search & Filter controls */}
			<div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
				{/* Search box */}
				<form onSubmit={handleSearch} className="flex-1 flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Cari nama, NIM, judul skripsi, kode tracking..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className="pl-9 bg-background/50"
						/>
					</div>
					<Button type="submit" variant="secondary" className="cursor-pointer">
						Cari
					</Button>
				</form>

				{/* Filters group */}
				<div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
					{/* Filter Status */}
					<div className="flex items-center gap-1.5 shrink-0">
						<Select
							value={searchParams.status || "all"}
							onValueChange={(val) => handleFilterStatus(val)}
						>
							<SelectTrigger className="h-9 w-[130px] bg-background/40 border-border text-xs rounded-md">
								<SelectValue placeholder="Semua Status" />
							</SelectTrigger>
							<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
								<SelectGroup>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="diverifikasi">Terverifikasi</SelectItem>
									<SelectItem value="ditolak">Ditolak</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>

					{/* Filter Prodi */}
					<Select
						value={searchParams.programStudi || "all"}
						onValueChange={(val) => handleFilterProdi(val)}
					>
						<SelectTrigger className="h-9 w-[180px] bg-background/40 border-border text-xs rounded-md truncate">
							<SelectValue placeholder="Semua Program Studi" />
						</SelectTrigger>
						<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
							<SelectGroup>
								<SelectItem value="all">Semua Program Studi</SelectItem>
								{Object.entries(programStudiMap).map(([slug, label]) => (
									<SelectItem key={slug} value={slug}>
										{label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Submissions Table */}
			<div className="rounded-xl border border-border bg-card/35 backdrop-blur-md overflow-hidden shadow-sm">
				<Table>
					<TableHeader className="bg-muted/15">
						<TableRow>
							<TableHead className="w-[56px]" />
							<TableHead className="w-[100px] font-bold">Kode</TableHead>
							<TableHead className="font-bold">
								<button
									type="button"
									onClick={() => handleSort("namaLengkap")}
									className="flex items-center gap-1 hover:text-foreground cursor-pointer"
								>
									Nama
									<ArrowUpDown className="h-3 w-3" />
								</button>
							</TableHead>
							<TableHead className="font-bold">
								<button
									type="button"
									onClick={() => handleSort("nim")}
									className="flex items-center gap-1 hover:text-foreground cursor-pointer"
								>
									NIM
									<ArrowUpDown className="h-3 w-3" />
								</button>
							</TableHead>
							<TableHead className="font-bold hidden md:table-cell">
								<button
									type="button"
									onClick={() => handleSort("programStudi")}
									className="flex items-center gap-1 hover:text-foreground cursor-pointer"
								>
									Program Studi
									<ArrowUpDown className="h-3 w-3" />
								</button>
							</TableHead>
							<TableHead className="font-bold">
								<button
									type="button"
									onClick={() => handleSort("status")}
									className="flex items-center gap-1 hover:text-foreground cursor-pointer"
								>
									Status
									<ArrowUpDown className="h-3 w-3" />
								</button>
							</TableHead>
							<TableHead className="font-bold hidden sm:table-cell">
								<button
									type="button"
									onClick={() => handleSort("createdAt")}
									className="flex items-center gap-1 hover:text-foreground cursor-pointer"
								>
									Tanggal
									<ArrowUpDown className="h-3.5 w-3.5" />
								</button>
							</TableHead>
							<TableHead className="w-[80px] text-right font-bold">
								Aksi
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
									className="h-24 text-center text-muted-foreground"
								>
									Tidak ada pengajuan ditemukan.
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => (
								<TableRow
									key={item.id}
									className="hover:bg-muted/10 transition-colors"
								>
									<TableCell>
										{item.thumbnailDataUrl ? (
											<img
												src={item.thumbnailDataUrl}
												alt=""
												className="w-10 h-10 rounded-md object-cover border border-border"
											/>
										) : (
											<div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
												<FileText className="w-4 h-4 text-muted-foreground" />
											</div>
										)}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{item.trackingCode}
									</TableCell>
									<TableCell className="font-semibold">
										{item.namaLengkap}
									</TableCell>
									<TableCell>{item.nim}</TableCell>
									<TableCell className="hidden md:table-cell text-xs max-w-[150px] truncate">
										{programStudiMap[
											item.programStudi as keyof typeof programStudiMap
										] || item.programStudi}
									</TableCell>
									<TableCell>{getStatusBadge(item.status)}</TableCell>
									<TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
										{new Date(item.createdAt).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 p-0 cursor-pointer"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="border-border bg-card"
											>
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onClick={() => {
														setSelectedSub(item);
														setIsDetailOpen(true);
													}}
												>
													<Eye size={14} /> Detail
												</DropdownMenuItem>
												{item.status === "diverifikasi" && item.suratPath && (
													<DropdownMenuItem
														className="cursor-pointer gap-2"
														onClick={() => handleDownloadSertifikat(item.id)}
													>
														<Download size={14} /> Sertifikat
													</DropdownMenuItem>
												)}
												{item.status === "pending" && (
													<>
														<DropdownMenuItem
															className="text-emerald-600 dark:text-emerald-400 cursor-pointer gap-2"
															onClick={() => {
																setActionId(item.id);
																setIsVerifyAlertOpen(true);
															}}
														>
															<Check size={14} /> Verifikasi
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-rose-600 dark:text-rose-400 cursor-pointer gap-2"
															onClick={() => {
																setActionId(item.id);
																setIsRejectDialogOpen(true);
															}}
														>
															<X size={14} /> Tolak
														</DropdownMenuItem>
													</>
												)}
												<DropdownMenuItem
													className="cursor-pointer gap-2"
													onClick={() => {
														setSelectedSub(item);
														setEditNamaLengkap(item.namaLengkap);
														setEditNim(item.nim);
														setEditEmail(item.email || "");
														setEditNoTelp(item.noTelp || "");
														setEditAlamatLengkap(item.alamatLengkap || "");
														setEditProgramStudi(item.programStudi);
														setEditDosenPembimbing(
															item.dosenPembimbingPenguji || "",
														);
														setEditJudulSkripsi(item.judulSkripsi);
														setEditSumbanganBuku(
															item.sumbanganBuku || "tidak_ada",
														);
														setEditStatus(item.status);
														setEditCatatanAdmin(item.catatanAdmin || "");
														setEditKtmFile(null);
														setEditSkripsiFile(null);
														setEditErrors({});
														setIsEditOpen(true);
													}}
												>
													<Pencil size={14} /> Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-rose-600 dark:text-rose-400 cursor-pointer gap-2"
													onClick={() => {
														setActionId(item.id);
														setIsDeleteAlertOpen(true);
													}}
												>
													<Trash2 size={14} /> Hapus
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between p-4 border-t border-border bg-muted/5">
						<span className="text-xs text-muted-foreground">
							Menampilkan {items.length} dari {totalItems} pengajuan
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon"
								onClick={() => handlePageChange(page - 1)}
								disabled={page === 1}
								className="h-8 w-8 border-border"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="text-xs font-semibold px-3">
								Halaman {page} dari {totalPages}
							</span>
							<Button
								variant="outline"
								size="icon"
								onClick={() => handlePageChange(page + 1)}
								disabled={page === totalPages}
								className="h-8 w-8 border-border"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Large Detail Dialog */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col justify-between gap-0 p-0 bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
					<DialogHeader className="px-6 pt-6 border-b border-border/40 pb-4">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							Detail Pengajuan Bebas Pustaka
						</DialogTitle>
						<DialogDescription>
							Kode Tracking:{" "}
							<span className="font-mono font-bold">
								{selectedSub?.trackingCode}
							</span>
						</DialogDescription>
					</DialogHeader>

					{/* Scrollable Content Body */}
					<div className="flex-1 overflow-y-auto px-6 py-6">
						{selectedSub && (
							<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-sm">
								{/* Left Column: Identitas & Karya Ilmiah */}
								<div className="lg:col-span-5 space-y-6">
									{/* Status banner */}
									<div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border/60">
										<span className="font-semibold">Status Saat Ini</span>
										<div className="flex items-center gap-2">
											{getStatusBadge(selectedSub.status)}
											{selectedSub.status === "diverifikasi" &&
												selectedSub.suratPath && (
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															handleDownloadSertifikat(selectedSub.id)
														}
													>
														<Download /> Download Sertifikat
													</Button>
												)}
										</div>
									</div>

									{selectedSub.status === "ditolak" &&
										selectedSub.catatanAdmin && (
											<div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-2.5">
												<XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
												<div className="space-y-1">
													<strong className="text-xs text-rose-950 dark:text-rose-300 font-bold block">
														Alasan Penolakan:
													</strong>
													<p className="text-xs text-rose-800 dark:text-rose-400 whitespace-pre-wrap leading-relaxed">
														{selectedSub.catatanAdmin}
													</p>
												</div>
											</div>
										)}

									{/* Student Identitas Section */}
									<div className="space-y-3">
										<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/50 pb-1.5">
											<User size={13} /> Identitas Mahasiswa
										</h3>
										<div className="space-y-3.5">
											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Nama Lengkap
												</span>
												<span className="font-semibold text-foreground text-sm">
													{selectedSub.namaLengkap}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Stambuk / NIM
												</span>
												<span className="font-mono font-semibold text-foreground text-sm">
													{selectedSub.nim}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Program Studi
												</span>
												<span className="font-semibold text-foreground text-sm">
													{programStudiMap[
														selectedSub.programStudi as keyof typeof programStudiMap
													] || selectedSub.programStudi}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Email
												</span>
												<span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
													<Mail size={12} className="text-muted-foreground" />
													{selectedSub.email}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													No. Telepon
												</span>
												<span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
													<Phone size={12} className="text-muted-foreground" />
													{selectedSub.noTelp}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Alamat Lengkap
												</span>
												<span className="font-semibold text-foreground text-sm flex items-start gap-1">
													<MapPin
														size={12}
														className="text-muted-foreground shrink-0 mt-0.5"
													/>
													<span>{selectedSub.alamatLengkap}</span>
												</span>
											</div>
										</div>
									</div>

									{/* Academic Karya Ilmiah Section */}
									<div className="space-y-3">
										<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/50 pb-1.5">
											<BookOpen size={13} /> Karya Ilmiah & Studi
										</h3>
										<div className="space-y-3.5">
											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Dosen Pembimbing & Penguji
												</span>
												<span className="font-semibold text-foreground text-sm whitespace-pre-wrap">
													{selectedSub.dosenPembimbingPenguji}
												</span>
											</div>

											<div className="flex flex-col gap-0.5">
												<span className="text-muted-foreground text-xs font-semibold">
													Sumbangan Buku
												</span>
												<span className="font-semibold text-foreground text-sm capitalize">
													{selectedSub.sumbanganBuku?.replace("_", " ")}
												</span>
											</div>

											<div className="flex flex-col gap-1">
												<span className="text-muted-foreground text-xs font-semibold">
													Judul Karya Ilmiah
												</span>
												<p className="italic font-medium leading-relaxed text-foreground">
													{selectedSub.judulSkripsi}
												</p>
											</div>
										</div>
									</div>

									{/* Verification Info Footer if processed */}
									{selectedSub.status !== "pending" &&
										selectedSub.verifiedAt && (
											<div className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
												<Calendar size={11} />
												<span>
													Diproses pada{" "}
													{new Date(selectedSub.verifiedAt).toLocaleDateString(
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
										)}
								</div>

								{/* Right Column: Berkas Persyaratan & Previews */}
								<div className="lg:col-span-7 space-y-6">
									<div className="space-y-3">
										<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/50 pb-1.5">
											<Download size={13} /> Berkas Persyaratan
										</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
											{/* KTM Button */}
											<Button
												type="button"
												variant="outline"
												className="justify-between border-border hover:bg-indigo-500/5 hover:border-indigo-500/30 cursor-pointer h-12"
												onClick={() =>
													handleDownloadFile(selectedSub.id, "kartu")
												}
											>
												<div className="flex items-center gap-2 text-left truncate pr-2">
													<FileText
														size={15}
														className="text-indigo-500 shrink-0"
													/>
													<div className="truncate">
														<span className="text-[10px] text-muted-foreground block leading-none">
															Kartu Mahasiswa
														</span>
														<span className="text-xs truncate font-semibold block mt-0.5">
															{selectedSub.kartuMahasiswaOriginalName ||
																"KTM.pdf"}
														</span>
													</div>
												</div>
												<Download
													size={14}
													className="text-muted-foreground shrink-0"
												/>
											</Button>

											{/* Skripsi Button */}
											<div className="flex flex-col">
												{selectedSub.thumbnailDataUrl && (
													<img
														src={selectedSub.thumbnailDataUrl}
														alt="Cover skripsi"
														className="w-full max-w-[160px] rounded-lg border border-border shadow-sm mb-3"
													/>
												)}
												<Button
													type="button"
													variant="outline"
													className="justify-between border-border hover:bg-indigo-500/5 hover:border-indigo-500/30 cursor-pointer h-12 w-full"
													onClick={() =>
														handleDownloadFile(selectedSub.id, "skripsi")
													}
												>
													<div className="flex items-center gap-2 text-left truncate pr-2">
														<BookOpen
															size={15}
															className="text-indigo-500 shrink-0"
														/>
														<div className="truncate">
															<span className="text-[10px] text-muted-foreground block leading-none">
																File Skripsi (TTD)
															</span>
															<span className="text-xs truncate font-semibold block mt-0.5">
																{selectedSub.skripsiOriginalName ||
																	"Skripsi.pdf"}
															</span>
														</div>
													</div>
													<Download
														size={14}
														className="text-muted-foreground shrink-0"
													/>
												</Button>
											</div>
										</div>

										{/* Previews group */}
										<div className="space-y-5 pt-3">
											{/* KTM Preview */}
											<div className="space-y-2">
												<span className="text-xs font-bold text-muted-foreground block">
													Preview Kartu Mahasiswa:
												</span>
												{selectedSub.kartuMahasiswaOriginalName
													?.toLowerCase()
													.endsWith(".pdf") ? (
													ktmPreviewUrl ? (
														<div className="w-full h-96 rounded-xl border border-border overflow-hidden bg-muted/10 shadow-inner">
															<iframe
																src={`${ktmPreviewUrl}#toolbar=0`}
																className="w-full h-full"
																title="Preview KTM"
															/>
														</div>
													) : (
														<div className="text-xs text-muted-foreground py-12 text-center border border-dashed border-border rounded-xl bg-muted/5">
															{loadingPreview
																? "Membuat preview KTM PDF..."
																: "Gagal memuat preview KTM PDF"}
														</div>
													)
												) : ktmPreviewUrl ? (
													<div className="w-full h-96 rounded-xl border border-border overflow-hidden bg-muted/10 flex items-center justify-center p-3 shadow-inner">
														<img
															src={ktmPreviewUrl}
															className="max-w-full max-h-88 object-contain rounded-lg shadow-sm"
															alt="KTM Preview"
														/>
													</div>
												) : (
													<div className="text-xs text-muted-foreground py-12 text-center border border-dashed border-border rounded-xl bg-muted/5">
														{loadingPreview
															? "Memuat preview KTM..."
															: "Gagal memuat preview KTM"}
													</div>
												)}
											</div>

											{/* Skripsi Preview */}
											<div className="space-y-2">
												<span className="text-xs font-bold text-muted-foreground block">
													Preview File Skripsi (PDF):
												</span>
												{selectedSub.skripsiOriginalName
													?.toLowerCase()
													.endsWith(".pdf") ? (
													skripsiPreviewUrl ? (
														<div className="w-full h-[500px] rounded-xl border border-border overflow-hidden bg-muted/10 shadow-inner">
															<iframe
																src={`${skripsiPreviewUrl}#toolbar=0`}
																className="w-full h-full"
																title="Preview Skripsi"
															/>
														</div>
													) : (
														<div className="text-xs text-muted-foreground py-20 text-center border border-dashed border-border rounded-xl bg-muted/5">
															{loadingPreview
																? "Membuat preview Skripsi PDF..."
																: "Gagal memuat preview Skripsi PDF"}
														</div>
													)
												) : (
													<div className="text-xs text-muted-foreground py-20 text-center border border-dashed border-border rounded-xl bg-muted/5">
														File skripsi bukan berformat PDF
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="flex sm:justify-between items-center border-t border-border/40 p-6 bg-muted/10 gap-2">
						<div>
							{selectedSub && selectedSub.status === "pending" && (
								<Button
									variant="destructive"
									className="hover:bg-rose-600"
									onClick={() => {
										setActionId(selectedSub.id);
										setIsRejectDialogOpen(true);
									}}
								>
									<X /> Tolak
								</Button>
							)}
						</div>
						<div className="flex items-center gap-2">
							{selectedSub && (
								<Button
									variant="outline"
									onClick={() => {
										setIsDetailOpen(false);
										setEditNamaLengkap(selectedSub.namaLengkap);
										setEditNim(selectedSub.nim);
										setEditEmail(selectedSub.email || "");
										setEditNoTelp(selectedSub.noTelp || "");
										setEditAlamatLengkap(selectedSub.alamatLengkap || "");
										setEditProgramStudi(selectedSub.programStudi);
										setEditDosenPembimbing(
											selectedSub.dosenPembimbingPenguji || "",
										);
										setEditJudulSkripsi(selectedSub.judulSkripsi);
										setEditSumbanganBuku(
											selectedSub.sumbanganBuku || "tidak_ada",
										);
										setEditStatus(selectedSub.status);
										setEditCatatanAdmin(selectedSub.catatanAdmin || "");
										setEditKtmFile(null);
										setEditSkripsiFile(null);
										setEditErrors({});
										setIsEditOpen(true);
									}}
								>
									<Pencil size={14} /> Edit
								</Button>
							)}
							<Button variant="outline" onClick={() => setIsDetailOpen(false)}>
								Tutup
							</Button>
							{selectedSub && selectedSub.status === "pending" && (
								<Button
									onClick={() => {
										setActionId(selectedSub.id);
										setIsVerifyAlertOpen(true);
									}}
								>
									<Check /> Verifikasi Pengajuan
								</Button>
							)}
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Verify Confirmation Alert */}
			<AlertDialog open={isVerifyAlertOpen} onOpenChange={setIsVerifyAlertOpen}>
				<AlertDialogContent className="bg-card border-border rounded-3xl max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-bold flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
							Konfirmasi Verifikasi
						</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin berkas bebas pustaka mahasiswa ini sudah lengkap
							dan valid untuk disetujui?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="pt-2">
						<AlertDialogCancel disabled={loadingAction}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleVerify();
							}}
							disabled={loadingAction}
						>
							{loadingAction ? "Memproses..." : "Ya, Setujui"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Dialogue with TextArea */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent className="max-w-sm bg-card border-border rounded-3xl">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg text-rose-650 dark:text-rose-400 flex items-center gap-2">
							<XCircle className="h-5 w-5 text-rose-500 shrink-0" />
							Tolak Pengajuan
						</DialogTitle>
						<DialogDescription>
							Tuliskan alasan penolakan berkas pengajuan bebas pustaka ini.
							Catatan ini akan ditampilkan ke mahasiswa.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2 pt-3">
						<Label htmlFor="catatanPenolakan" className="font-semibold text-xs">
							Alasan Penolakan (Wajib) <span className="text-rose-500">*</span>
						</Label>
						<Textarea
							id="catatanPenolakan"
							placeholder="Contoh: Berkas skripsi yang diunggah belum dibubuhi tanda tangan Dosen Pembimbing."
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={4}
							disabled={loadingAction}
							className="bg-background/40"
						/>
					</div>

					<DialogFooter className="pt-4 border-t border-border/40 mt-4 flex gap-2">
						<Button
							variant="outline"
							onClick={() => setIsRejectDialogOpen(false)}
							disabled={loadingAction}
						>
							Batal
						</Button>
						<Button
							onClick={handleReject}
							disabled={loadingAction || !rejectReason.trim()}
							className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex-1 cursor-pointer"
						>
							{loadingAction ? "Memproses..." : "Tolak Pengajuan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Alert */}
			<AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
				<AlertDialogContent className="bg-card border-border rounded-3xl max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-bold text-rose-650 dark:text-rose-400 flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-rose-500 shrink-0" />
							Hapus Pengajuan?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-left">
							Tindakan ini bersifat permanen. Berkas fisik kartu mahasiswa dan
							skripsi mahasiswa di server juga akan dihapus. Lanjutkan?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="pt-2">
						<AlertDialogCancel
							className="border-border "
							disabled={loadingAction}
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={loadingAction}
							className="bg-rose-600 hover:bg-rose-500 text-white "
						>
							{loadingAction ? "Memproses..." : "Hapus Permanen"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Fullscreen Edit Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col justify-between gap-0 p-0 bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
					<DialogHeader className="px-6 pt-6 border-b border-border/40 pb-4">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							Edit Pengajuan Bebas Pustaka
						</DialogTitle>
						<DialogDescription>
							Ubah data pengajuan untuk kode tracking:{" "}
							<span className="font-mono font-bold">
								{selectedSub?.trackingCode}
							</span>
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={handleEditSubmit}
						className="flex-1 flex flex-col overflow-hidden"
					>
						{/* Scrollable Content Body */}
						<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
								{/* Left Column: Data Diri & Akademik */}
								<div className="space-y-4">
									<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1.5">
										Identitas & Informasi Akademik
									</h3>

									<div className="space-y-2">
										<Label htmlFor="editNamaLengkap">Nama Lengkap</Label>
										<Input
											id="editNamaLengkap"
											value={editNamaLengkap}
											onChange={(e) => setEditNamaLengkap(e.target.value)}
											className="bg-background/40"
										/>
										{editErrors.namaLengkap && (
											<p className="text-xs text-rose-500">
												{editErrors.namaLengkap}
											</p>
										)}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="editNim">NIM / Stambuk</Label>
											<Input
												id="editNim"
												value={editNim}
												onChange={(e) => setEditNim(e.target.value)}
												className="bg-background/40"
											/>
											{editErrors.nim && (
												<p className="text-xs text-rose-500">
													{editErrors.nim}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="editProgramStudi">Program Studi</Label>
											<Select
												value={editProgramStudi}
												onValueChange={(val) => setEditProgramStudi(val)}
											>
												<SelectTrigger
													id="editProgramStudi"
													className="w-full bg-background/40 border-border text-foreground h-9 rounded-md"
												>
													<SelectValue placeholder="Pilih Program Studi" />
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
											{editErrors.programStudi && (
												<p className="text-xs text-rose-500">
													{editErrors.programStudi}
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="editEmail">Email</Label>
											<Input
												id="editEmail"
												type="email"
												value={editEmail}
												onChange={(e) => setEditEmail(e.target.value)}
												className="bg-background/40"
											/>
											{editErrors.email && (
												<p className="text-xs text-rose-500">
													{editErrors.email}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="editNoTelp">No. Telepon / WA</Label>
											<Input
												id="editNoTelp"
												value={editNoTelp}
												onChange={(e) => setEditNoTelp(e.target.value)}
												className="bg-background/40"
											/>
											{editErrors.noTelp && (
												<p className="text-xs text-rose-500">
													{editErrors.noTelp}
												</p>
											)}
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="editAlamatLengkap">Alamat Lengkap</Label>
										<Textarea
											id="editAlamatLengkap"
											rows={3}
											value={editAlamatLengkap}
											onChange={(e) => setEditAlamatLengkap(e.target.value)}
											className="bg-background/40"
										/>
										{editErrors.alamatLengkap && (
											<p className="text-xs text-rose-500">
												{editErrors.alamatLengkap}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="editDosenPembimbing">
											Dosen Pembimbing & Penguji
										</Label>
										<Textarea
											id="editDosenPembimbing"
											rows={2}
											value={editDosenPembimbing}
											onChange={(e) => setEditDosenPembimbing(e.target.value)}
											className="bg-background/40"
										/>
										{editErrors.dosenPembimbing && (
											<p className="text-xs text-rose-500">
												{editErrors.dosenPembimbing}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="editJudulSkripsi">Judul Karya Ilmiah</Label>
										<Textarea
											id="editJudulSkripsi"
											rows={3}
											value={editJudulSkripsi}
											onChange={(e) => setEditJudulSkripsi(e.target.value)}
											className="bg-background/40 font-mono text-xs"
										/>
										{editErrors.judulSkripsi && (
											<p className="text-xs text-rose-500">
												{editErrors.judulSkripsi}
											</p>
										)}
									</div>
								</div>

								{/* Right Column: Status & Berkas */}
								<div className="space-y-4">
									<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1.5">
										Status & Unggah Berkas
									</h3>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="editStatus">Status Pengajuan</Label>
											<Select
												value={editStatus}
												onValueChange={(val) => setEditStatus(val as any)}
											>
												<SelectTrigger
													id="editStatus"
													className="w-full bg-background/40 border-border text-foreground h-9 rounded-md font-semibold"
												>
													<SelectValue placeholder="Pilih Status" />
												</SelectTrigger>
												<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
													<SelectGroup>
														<SelectItem value="pending">Pending</SelectItem>
														<SelectItem value="diverifikasi">
															Terverifikasi
														</SelectItem>
														<SelectItem value="ditolak">Ditolak</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label htmlFor="editSumbanganBuku">Sumbangan Buku</Label>
											<Select
												value={editSumbanganBuku}
												onValueChange={(val) => setEditSumbanganBuku(val)}
											>
												<SelectTrigger
													id="editSumbanganBuku"
													className="w-full bg-background/40 border-border text-foreground h-9 rounded-md"
												>
													<SelectValue placeholder="Pilih Sumbangan Buku" />
												</SelectTrigger>
												<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
													<SelectGroup>
														<SelectItem value="individu">Individu</SelectItem>
														<SelectItem value="kelompok">Kelompok</SelectItem>
														<SelectItem value="tidak_ada">Tidak Ada</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="editCatatanAdmin">
											Catatan Admin (Alasan jika ditolak)
										</Label>
										<Textarea
											id="editCatatanAdmin"
											rows={3}
											value={editCatatanAdmin}
											onChange={(e) => setEditCatatanAdmin(e.target.value)}
											placeholder="Masukkan catatan atau alasan jika pengajuan ditolak..."
											className="bg-background/40"
										/>
									</div>

									{/* KTM File Input */}
									<div className="space-y-2">
										<Label className="flex items-center gap-1">
											Unggah KTM / Kartu Anggota Baru{" "}
											<span className="text-[10px] text-muted-foreground font-normal">
												(PDF, JPG, PNG - Opsional)
											</span>
										</Label>
										<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-4 bg-background/10 transition-colors relative">
											<input
												type="file"
												id="editKtmFile"
												accept=".pdf,.jpg,.jpeg,.png"
												onChange={(e) => {
													const file = e.target.files?.[0] || null;
													setEditKtmFile(file);
												}}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="h-6 w-6 text-muted-foreground mb-1" />
											<span className="text-xs font-semibold text-muted-foreground text-center">
												{editKtmFile
													? editKtmFile.name
													: "Klik atau seret file ke sini untuk mengganti KTM"}
											</span>
										</div>
										{selectedSub?.kartuMahasiswaOriginalName &&
											!editKtmFile && (
												<p className="text-[10px] text-muted-foreground">
													File saat ini:{" "}
													<span className="font-semibold">
														{selectedSub.kartuMahasiswaOriginalName}
													</span>
												</p>
											)}
										{editErrors.kartuMahasiswa && (
											<p className="text-xs text-rose-500 mt-1">
												{editErrors.kartuMahasiswa}
											</p>
										)}
									</div>

									{/* Skripsi File Input */}
									<div className="space-y-2">
										<Label className="flex items-center gap-1">
											Unggah File Skripsi Baru{" "}
											<span className="text-[10px] text-muted-foreground font-normal">
												(PDF Only - Opsional)
											</span>
										</Label>
										<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-4 bg-background/10 transition-colors relative">
											<input
												type="file"
												id="editSkripsiFile"
												accept=".pdf"
												onChange={(e) => {
													const file = e.target.files?.[0] || null;
													setEditSkripsiFile(file);
												}}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="h-6 w-6 text-muted-foreground mb-1" />
											<span className="text-xs font-semibold text-muted-foreground text-center">
												{editSkripsiFile
													? editSkripsiFile.name
													: "Klik atau seret file ke sini untuk mengganti file Skripsi"}
											</span>
										</div>
										{selectedSub?.skripsiOriginalName && !editSkripsiFile && (
											<p className="text-[10px] text-muted-foreground">
												File saat ini:{" "}
												<span className="font-semibold">
													{selectedSub.skripsiOriginalName}
												</span>
											</p>
										)}
										{editErrors.skripsi && (
											<p className="text-xs text-rose-500 mt-1">
												{editErrors.skripsi}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>

						<DialogFooter className="flex sm:justify-end items-center border-t border-border/40 p-6 bg-muted/10 gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsEditOpen(false);
									setSelectedSub(null);
								}}
								disabled={loadingAction}
							>
								Batal
							</Button>
							<Button type="submit" disabled={loadingAction}>
								{loadingAction ? "Menyimpan..." : "Simpan Perubahan"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Fullscreen Add Submission Dialog */}
			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col justify-between gap-0 p-0 bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
					<DialogHeader className="px-6 pt-6 border-b border-border/40 pb-4">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							Tambah Pengajuan Bebas Pustaka
						</DialogTitle>
						<DialogDescription>
							Isi formulir berikut untuk menambahkan pengajuan bebas pustaka
							baru.
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={handleAddSubmit}
						className="flex-1 flex flex-col overflow-hidden"
					>
						{/* Scrollable Content Body */}
						<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
								{/* Left Column: Data Diri & Akademik */}
								<div className="space-y-4">
									<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1.5">
										Identitas & Informasi Akademik
									</h3>

									<div className="space-y-2">
										<Label htmlFor="addNamaLengkap">Nama Lengkap</Label>
										<Input
											id="addNamaLengkap"
											value={addNamaLengkap}
											onChange={(e) => setAddNamaLengkap(e.target.value)}
											placeholder="Masukkan nama lengkap mahasiswa"
											className="bg-background/40"
										/>
										{addErrors.namaLengkap && (
											<p className="text-xs text-rose-500">
												{addErrors.namaLengkap}
											</p>
										)}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="addNim">NIM / Stambuk</Label>
											<Input
												id="addNim"
												value={addNim}
												onChange={(e) => setAddNim(e.target.value)}
												placeholder="Masukkan NIM"
												className="bg-background/40"
											/>
											{addErrors.nim && (
												<p className="text-xs text-rose-500">{addErrors.nim}</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="addProgramStudi">Program Studi</Label>
											<Select
												value={addProgramStudi}
												onValueChange={(val) => setAddProgramStudi(val)}
											>
												<SelectTrigger
													id="addProgramStudi"
													className="w-full bg-background/40 border-border text-foreground h-9 rounded-md"
												>
													<SelectValue placeholder="Pilih Program Studi" />
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
											{addErrors.programStudi && (
												<p className="text-xs text-rose-500">
													{addErrors.programStudi}
												</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="addEmail">Email</Label>
											<Input
												id="addEmail"
												type="email"
												value={addEmail}
												onChange={(e) => setAddEmail(e.target.value)}
												placeholder="email@example.com"
												className="bg-background/40"
											/>
											{addErrors.email && (
												<p className="text-xs text-rose-500">
													{addErrors.email}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="addNoTelp">No. Telepon / WA</Label>
											<Input
												id="addNoTelp"
												value={addNoTelp}
												onChange={(e) => setAddNoTelp(e.target.value)}
												placeholder="08xxxxxxxxxx"
												className="bg-background/40"
											/>
											{addErrors.noTelp && (
												<p className="text-xs text-rose-500">
													{addErrors.noTelp}
												</p>
											)}
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="addAlamatLengkap">Alamat Lengkap</Label>
										<Textarea
											id="addAlamatLengkap"
											rows={3}
											value={addAlamatLengkap}
											onChange={(e) => setAddAlamatLengkap(e.target.value)}
											placeholder="Masukkan alamat lengkap..."
											className="bg-background/40"
										/>
										{addErrors.alamatLengkap && (
											<p className="text-xs text-rose-500">
												{addErrors.alamatLengkap}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="addDosenPembimbing">
											Dosen Pembimbing & Penguji
										</Label>
										<Textarea
											id="addDosenPembimbing"
											rows={2}
											value={addDosenPembimbing}
											onChange={(e) => setAddDosenPembimbing(e.target.value)}
											placeholder="Nama dosen pembimbing dan penguji..."
											className="bg-background/40"
										/>
										{addErrors.dosenPembimbing && (
											<p className="text-xs text-rose-500">
												{addErrors.dosenPembimbing}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="addJudulSkripsi">Judul Karya Ilmiah</Label>
										<Textarea
											id="addJudulSkripsi"
											rows={3}
											value={addJudulSkripsi}
											onChange={(e) => setAddJudulSkripsi(e.target.value)}
											placeholder="Masukkan judul karya ilmiah..."
											className="bg-background/40 font-mono text-xs"
										/>
										{addErrors.judulSkripsi && (
											<p className="text-xs text-rose-500">
												{addErrors.judulSkripsi}
											</p>
										)}
									</div>
								</div>

								{/* Right Column: Sumbangan Buku & Berkas */}
								<div className="space-y-4">
									<h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-1.5">
										Sumbangan Buku & Unggah Berkas
									</h3>

									<div className="space-y-2">
										<Label htmlFor="addSumbanganBuku">Sumbangan Buku</Label>
										<Select
											value={addSumbanganBuku}
											onValueChange={(val) => setAddSumbanganBuku(val)}
										>
											<SelectTrigger
												id="addSumbanganBuku"
												className="w-full bg-background/40 border-border text-foreground h-9 rounded-md"
											>
												<SelectValue placeholder="Pilih Sumbangan Buku" />
											</SelectTrigger>
											<SelectContent className="bg-popover border border-border rounded-md shadow-md text-popover-foreground">
												<SelectGroup>
													<SelectItem value="individu">Individu</SelectItem>
													<SelectItem value="kelompok">Kelompok</SelectItem>
													<SelectItem value="tidak_ada">Tidak Ada</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>

									{/* KTM File Input */}
									<div className="space-y-2">
										<Label className="flex items-center gap-1">
											Unggah KTM / Kartu Anggota{" "}
											<span className="text-[10px] text-muted-foreground font-normal">
												(PDF, JPG, PNG - Maks 10MB - Opsional)
											</span>
										</Label>
										<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-4 bg-background/10 transition-colors relative">
											<input
												type="file"
												id="addKtmFile"
												accept=".pdf,.jpg,.jpeg,.png"
												onChange={(e) => {
													const file = e.target.files?.[0] || null;
													setAddKtmFile(file);
												}}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="h-6 w-6 text-muted-foreground mb-1" />
											<span className="text-xs font-semibold text-muted-foreground text-center">
												{addKtmFile
													? addKtmFile.name
													: "Klik atau seret file KTM ke sini"}
											</span>
										</div>
										{addErrors.kartuMahasiswa && (
											<p className="text-xs text-rose-500 mt-1">
												{addErrors.kartuMahasiswa}
											</p>
										)}
									</div>

									{/* Skripsi File Input */}
									<div className="space-y-2">
										<Label className="flex items-center gap-1">
											Unggah File Skripsi{" "}
											<span className="text-[10px] text-rose-500 font-semibold">
												*Wajib
											</span>
											<span className="text-[10px] text-muted-foreground font-normal">
												(PDF Only - Maks 10MB)
											</span>
										</Label>
										<div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-indigo-500/40 rounded-xl p-4 bg-background/10 transition-colors relative">
											<input
												type="file"
												id="addSkripsiFile"
												accept=".pdf"
												onChange={(e) => {
													const file = e.target.files?.[0] || null;
													setAddSkripsiFile(file);
												}}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="h-6 w-6 text-muted-foreground mb-1" />
											<span className="text-xs font-semibold text-muted-foreground text-center">
												{addSkripsiFile
													? addSkripsiFile.name
													: "Klik atau seret file Skripsi ke sini"}
											</span>
										</div>
										{addErrors.skripsi && (
											<p className="text-xs text-rose-500 mt-1">
												{addErrors.skripsi}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>

						<DialogFooter className="flex sm:justify-end items-center border-t border-border/40 p-6 bg-muted/10 gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsAddOpen(false);
								}}
								disabled={loadingAction}
							>
								Batal
							</Button>
							<Button type="submit" disabled={loadingAction}>
								{loadingAction ? (
									"Menyimpan..."
								) : (
									<>
										<Plus />
										Tambah Pengajuan
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
