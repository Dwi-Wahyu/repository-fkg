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
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  deleteSubmissionFn,
  downloadSubmissionFileFn,
  getSubmissionsFn,
  rejectSubmissionFn,
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
      page: (search.page as number) || 1,
      pageSize: (search.pageSize as number) || 10,
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
                  colSpan={7}
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
        <DialogContent className="max-w-xl bg-card border-border shadow-2xl overflow-y-auto max-h-[85vh] rounded-3xl">
          <DialogHeader>
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

          {selectedSub && (
            <div className="space-y-6 pt-4 text-sm">
              {/* Status banner */}
              <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border border-border/60">
                <span className="font-semibold">Status Saat Ini</span>
                {getStatusBadge(selectedSub.status)}
              </div>

              {selectedSub.status === "ditolak" && selectedSub.catatanAdmin && (
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
                <div className="grid grid-cols-3 gap-y-2">
                  <span className="text-muted-foreground text-xs">
                    Nama Lengkap
                  </span>
                  <span className="col-span-2 font-semibold">
                    {selectedSub.namaLengkap}
                  </span>

                  <span className="text-muted-foreground text-xs">
                    Stambuk/NIM
                  </span>
                  <span className="col-span-2 font-mono font-semibold">
                    {selectedSub.nim}
                  </span>

                  <span className="text-muted-foreground text-xs">
                    Program Studi
                  </span>
                  <span className="col-span-2">
                    {programStudiMap[
                      selectedSub.programStudi as keyof typeof programStudiMap
                    ] || selectedSub.programStudi}
                  </span>

                  <span className="text-muted-foreground text-xs">Email</span>
                  <span className="col-span-2 flex items-center gap-1.5">
                    <Mail size={12} className="text-muted-foreground" />
                    {selectedSub.email}
                  </span>

                  <span className="text-muted-foreground text-xs">
                    No. Telepon
                  </span>
                  <span className="col-span-2 flex items-center gap-1.5">
                    <Phone size={12} className="text-muted-foreground" />
                    {selectedSub.noTelp}
                  </span>

                  <span className="text-muted-foreground text-xs">Alamat</span>
                  <span className="col-span-2 flex items-start gap-1">
                    <MapPin
                      size={12}
                      className="text-muted-foreground shrink-0 mt-0.5"
                    />
                    <span>{selectedSub.alamatLengkap}</span>
                  </span>
                </div>
              </div>

              {/* Academic Karya Ilmiah Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border/50 pb-1.5">
                  <BookOpen size={13} /> Karya Ilmiah & Studi
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-y-2">
                    <span className="text-muted-foreground text-xs">
                      Dosen Penguji
                    </span>
                    <span className="col-span-2 whitespace-pre-wrap">
                      {selectedSub.dosenPembimbingPenguji}
                    </span>

                    <span className="text-muted-foreground text-xs">
                      Sumbangan Buku
                    </span>
                    <span className="col-span-2 capitalize">
                      {selectedSub.sumbanganBuku?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs block">
                      Judul Karya Ilmiah
                    </span>
                    <p className="text-xs bg-muted/20 border border-border/40 p-2.5 rounded-lg italic font-medium leading-relaxed">
                      "{selectedSub.judulSkripsi}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Download Section */}
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
                    onClick={() => handleDownloadFile(selectedSub.id, "kartu")}
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
                          {selectedSub.kartuMahasiswaOriginalName || "KTM.pdf"}
                        </span>
                      </div>
                    </div>
                    <Download
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                  </Button>

                  {/* Skripsi Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-between border-border hover:bg-indigo-500/5 hover:border-indigo-500/30 cursor-pointer h-12"
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
                          {selectedSub.skripsiOriginalName || "Skripsi.pdf"}
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

              {/* Verification Info Footer if processed */}
              {selectedSub.status !== "pending" && selectedSub.verifiedAt && (
                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 pt-2 border-t border-border/40">
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
          )}

          <DialogFooter className="flex sm:justify-between items-center border-t border-border/40 pt-4 mt-6 gap-2">
            <div>
              {selectedSub && selectedSub.status === "pending" && (
                <Button
                  variant="destructive"
                  className="cursor-pointer hover:bg-rose-600 rounded-xl"
                  onClick={() => {
                    setActionId(selectedSub.id);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  <X className="mr-1.5 h-4 w-4" /> Tolak
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-border rounded-xl cursor-pointer"
                onClick={() => setIsDetailOpen(false)}
              >
                Tutup
              </Button>
              {selectedSub && selectedSub.status === "pending" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl cursor-pointer"
                  onClick={() => {
                    setActionId(selectedSub.id);
                    setIsVerifyAlertOpen(true);
                  }}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Verifikasi Pengajuan
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
            <AlertDialogCancel
              className="border-border rounded-xl cursor-pointer"
              disabled={loadingAction}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              disabled={loadingAction}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer"
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
              className="border-border rounded-xl cursor-pointer flex-1"
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
              className="border-border rounded-xl cursor-pointer"
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
              className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer"
            >
              {loadingAction ? "Memproses..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
