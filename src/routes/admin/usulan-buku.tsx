import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	BookOpen,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Search,
	Trash2,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Image,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../components/ui/table";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "../../components/ui/useToast";
import {
	deleteBookSuggestionFn,
	getBookSuggestionsFn,
	downloadBookCoverFn,
} from "../../server/bookSuggestionFunctions";

export const Route = createFileRoute("/admin/usulan-buku")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			search: (search.search as string) || undefined,
			sortOrder: (search.sortOrder as "asc" | "desc") || "desc",
			page: (search.page as number) || 1,
			pageSize: (search.pageSize as number) || 10,
		} as {
			search?: string;
			sortOrder?: "asc" | "desc";
			page?: number;
			pageSize?: number;
		};
	},
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		return await getBookSuggestionsFn({ data: deps });
	},
	component: AdminUsulanBukuComponent,
});

function AdminUsulanBukuComponent() {
	const navigate = useNavigate({ from: "/admin/usulan-buku" });
	const { items, totalItems, totalPages, page, pageSize } = Route.useLoaderData();
	const searchParams = Route.useSearch();

	// Local states
	const [searchText, setSearchText] = useState(searchParams.search || "");
	const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
	const [targetId, setTargetId] = useState<number | null>(null);
	const [loadingAction, setLoadingAction] = useState(false);

	const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false);
	const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
	const [loadingCover, setLoadingCover] = useState(false);

	const handleShowCover = async (itemId: number) => {
		setLoadingCover(true);
		setIsCoverDialogOpen(true);
		try {
			const res = await downloadBookCoverFn({ data: itemId });
			const binaryString = window.atob(res.base64);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: res.mimeType });
			const url = window.URL.createObjectURL(blob);
			setSelectedCoverUrl(url);
		} catch (err: any) {
			toast.error(err.message || "Gagal memuat cover buku");
			setIsCoverDialogOpen(false);
		} finally {
			setLoadingCover(false);
		}
	};

	const handleCloseCoverDialog = () => {
		setIsCoverDialogOpen(false);
		if (selectedCoverUrl) {
			window.URL.revokeObjectURL(selectedCoverUrl);
			setSelectedCoverUrl(null);
		}
	};

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

	const handlePageChange = (newPage: number) => {
		navigate({
			search: {
				...searchParams,
				page: newPage,
			},
		});
	};

	const toggleSortOrder = () => {
		const nextOrder = searchParams.sortOrder === "asc" ? "desc" : "asc";
		navigate({
			search: {
				...searchParams,
				sortOrder: nextOrder,
				page: 1,
			},
		});
	};

	const handleDelete = async () => {
		if (targetId === null) return;
		setLoadingAction(true);
		try {
			const res = await deleteBookSuggestionFn({ data: targetId });
			if (res.success) {
				toast.success("Usulan buku berhasil dihapus.");
				setIsDeleteAlertOpen(false);
				setTargetId(null);
				navigate({
					search: searchParams,
					replace: true, // Reload data
				});
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menghapus usulan");
		} finally {
			setLoadingAction(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top header block */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-3xl font-extrabold tracking-tight">
						Usulan Buku
					</h2>
					<p className="text-muted-foreground mt-1">
						Daftar usulan judul buku baru dari pengunjung perpustakaan FKG Unhas.
					</p>
				</div>
			</div>

			{/* Search & Filter controls */}
			<div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
				<form onSubmit={handleSearch} className="flex-1 flex gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Cari judul usulan buku..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className="pl-9 bg-background/50"
						/>
					</div>
					<Button type="submit" variant="secondary" className="cursor-pointer">
						Cari
					</Button>
				</form>
			</div>

			{/* Table Container */}
			<div className="rounded-xl border border-border bg-card/35 backdrop-blur-md overflow-hidden shadow-sm">
				<Table>
					<TableHeader className="bg-muted/15">
						<TableRow>
							<TableHead className="font-bold py-4">Judul Buku</TableHead>
							<TableHead className="font-bold py-4">Penerbit</TableHead>
							<TableHead className="font-bold text-center py-4">Cover</TableHead>
							<TableHead className="w-[220px] font-bold py-4">
								<button
									type="button"
									onClick={toggleSortOrder}
									className="flex items-center gap-1.5 hover:text-foreground cursor-pointer"
								>
									Tanggal Diusulkan
									{searchParams.sortOrder === "asc" ? (
										<ArrowUp className="h-3.5 w-3.5" />
									) : (
										<ArrowDown className="h-3.5 w-3.5" />
									)}
								</button>
							</TableHead>
							<TableHead className="w-[100px] font-bold text-center py-4">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
									<div className="flex flex-col items-center justify-center space-y-2">
										<BookOpen className="h-8 w-8 text-muted-foreground/55" />
										<p className="text-xs font-semibold">Belum ada usulan buku yang ditemukan.</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							items.map((item: any) => (
								<TableRow key={item.id} className="hover:bg-muted/5 transition-colors">
									<TableCell className="font-medium align-middle py-3.5">
										{item.judulBuku}
									</TableCell>
									<TableCell className="align-middle py-3.5 text-xs text-muted-foreground">
										{item.penerbit || "-"}
									</TableCell>
									<TableCell className="align-middle py-3.5 text-center">
										{item.coverBukuPath ? (
											<Button
												variant="outline"
												size="sm"
												className="cursor-pointer gap-1 h-8 rounded-lg"
												onClick={() => handleShowCover(item.id)}
											>
												<Image className="h-3.5 w-3.5" /> Lihat Cover
											</Button>
										) : (
											<span className="text-muted-foreground text-xs font-semibold">-</span>
										)}
									</TableCell>
									<TableCell className="text-muted-foreground align-middle font-mono py-3.5">
										<div className="flex items-center gap-1.5 text-xs">
											<Calendar className="h-3.5 w-3.5 text-muted-foreground/75" />
											<span>
												{new Date(item.createdAt).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "long",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center align-middle py-3.5">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
											onClick={() => {
												setTargetId(item.id);
												setIsDeleteAlertOpen(true);
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Table Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between border-t border-border/40 pt-4">
					<span className="text-xs text-muted-foreground">
						Menampilkan {(page - 1) * pageSize + 1} -{" "}
						{Math.min(page * pageSize, totalItems)} dari {totalItems} usulan
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

			{/* Delete Confirmation Alert Dialog */}
			<AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
				<AlertDialogContent className="bg-card border-border shadow-2xl rounded-3xl max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Usulan Buku?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Usulan buku ini akan dihapus secara permanen dari sistem.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="border-border rounded-xl cursor-pointer">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={loadingAction}
							className="bg-rose-600 hover:bg-rose-500 text-white border-0 rounded-xl cursor-pointer disabled:opacity-50"
						>
							{loadingAction ? "Menghapus..." : "Ya, Hapus"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cover Preview Dialog */}
			<Dialog open={isCoverDialogOpen} onOpenChange={(val) => { if (!val) handleCloseCoverDialog(); }}>
				<DialogContent className="max-w-lg bg-card border-border rounded-3xl overflow-hidden p-6">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold">Preview Cover Buku</DialogTitle>
					</DialogHeader>
					<div className="flex items-center justify-center p-2 min-h-64 bg-muted/10 border border-border rounded-2xl overflow-hidden mt-4">
						{loadingCover ? (
							<div className="text-sm text-muted-foreground animate-pulse">Memuat gambar cover...</div>
						) : selectedCoverUrl ? (
							<img
								src={selectedCoverUrl}
								alt="Cover Buku"
								className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md"
							/>
						) : (
							<div className="text-sm text-muted-foreground">Cover buku tidak dapat dimuat</div>
						)}
					</div>
					<div className="flex justify-end pt-4 mt-2">
						<Button
							variant="outline"
							className="border-border rounded-xl cursor-pointer"
							onClick={handleCloseCoverDialog}
						>
							Tutup
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
