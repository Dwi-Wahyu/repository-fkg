import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
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
import { programStudiMap } from "../server/db/schema";
import { getSubmissionStatusFn } from "../server/submissionFunctions";

export const Route = createFileRoute("/status")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      trackingCode: (search.trackingCode as string) || undefined,
      nim: (search.nim as string) || undefined,
    } as { trackingCode?: string; nim?: string };
  },
  component: StatusComponent,
});

function StatusComponent() {
  const { trackingCode: searchCode, nim: searchNim } = Route.useSearch();
  const navigate = useNavigate({ from: "/status" });

  const [method, setMethod] = useState<"code" | "nim">("code");
  const [inputCode, setInputCode] = useState("");
  const [inputNim, setInputNim] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Synchronize search params with local inputs & run query on mount/param change
  useEffect(() => {
    if (searchCode) {
      setMethod("code");
      setInputCode(searchCode);
      runSearch({ trackingCode: searchCode });
    } else if (searchNim) {
      setMethod("nim");
      setInputNim(searchNim);
      runSearch({ nim: searchNim });
    }
  }, [searchCode, searchNim]);

  const runSearch = async (params: { trackingCode?: string; nim?: string }) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await getSubmissionStatusFn({ data: params });
      setResults(res);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat status pengajuan");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "code") {
      if (!inputCode.trim()) {
        toast.error("Kode tracking wajib diisi");
        return;
      }
      navigate({
        search: {
          trackingCode: inputCode.trim().toUpperCase(),
          nim: undefined,
        },
      });
    } else {
      if (!inputNim.trim()) {
        toast.error("NIM/Stambuk wajib diisi");
        return;
      }
      navigate({
        search: { nim: inputNim.trim().toUpperCase(), trackingCode: undefined },
      });
    }
  };

  const getStatusBadge = (status: "pending" | "diverifikasi" | "ditolak") => {
    switch (status) {
      case "diverifikasi":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 py-1 px-2.5 rounded-full font-semibold">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0 inline" />
            Diverifikasi
          </Badge>
        );
      case "ditolak":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/15 py-1 px-2.5 rounded-full font-semibold">
            <XCircle className="mr-1 h-3.5 w-3.5 shrink-0 inline" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 py-1 px-2.5 rounded-full font-semibold">
            <RefreshCw
              className="mr-1 h-3.5 w-3.5 shrink-0 inline animate-spin"
              style={{ animationDuration: "3s" }}
            />
            Menunggu Verifikasi
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground pb-20 relative overflow-x-hidden">
      {/* Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/2 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/2 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back bar */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4 relative z-10 flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          className="text-muted-foreground hover:text-foreground pl-0 cursor-pointer"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground font-semibold">
          Cek Status
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Status Pengajuan
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Masukkan Kode Tracking atau NIM Anda untuk memantau proses
            verifikasi berkas bebas pustaka.
          </p>
        </div>

        {/* Search Panel Card */}
        <Card className="border-border bg-card/45 backdrop-blur-md rounded-2xl">
          <CardHeader className="pb-4">
            {/* Tab buttons */}
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setMethod("code")}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  method === "code"
                    ? "bg-card text-foreground shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Kode Tracking
              </button>
              <button
                type="button"
                onClick={() => setMethod("nim")}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  method === "nim"
                    ? "bg-card text-foreground shadow-sm border border-border/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                NIM / Stambuk
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {method === "code" ? (
                <div className="space-y-2">
                  <Label htmlFor="trackingCodeInput">Kode Tracking</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trackingCodeInput"
                      placeholder="Contoh: BP-20260715-ABCD"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="bg-background/40"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white cursor-pointer px-5"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="nimInput">NIM / Stambuk</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nimInput"
                      placeholder="Contoh: I011201001"
                      value={inputNim}
                      onChange={(e) => setInputNim(e.target.value)}
                      className="bg-background/40"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white cursor-pointer px-5"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results View */}
        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-muted-foreground font-medium">
                Mencari data pengajuan...
              </span>
            </div>
          )}

          {!loading && hasSearched && results && results.length === 0 && (
            <Card className="border-dashed border-border bg-card/15 py-12 text-center rounded-2xl">
              <CardContent className="space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-base">
                    Pengajuan Tidak Ditemukan
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Silakan periksa kembali{" "}
                    {method === "code" ? "Kode Tracking" : "NIM"} yang
                    dimasukkan. Pastikan format penulisan sudah benar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && results && results.length > 0 && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block px-1">
                Hasil Pencarian ({results.length} pengajuan ditemukan)
              </span>

              {results.map((sub) => (
                <Card
                  key={sub.id}
                  className="border-border bg-card/65 dark:bg-card/35 backdrop-blur-md rounded-2xl overflow-hidden shadow-md"
                >
                  {/* Top Header Row */}
                  <div className="px-6 py-4 pt-0 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Kode Tracking
                      </span>
                      <span className="text-sm font-mono font-bold text-foreground bg-muted py-0.5 px-2 rounded border border-border/50">
                        {sub.trackingCode}
                      </span>
                    </div>
                    <div className="sm:text-right shrink-0">
                      {getStatusBadge(sub.status)}
                    </div>
                  </div>

                  {/* Form Content */}
                  <CardContent className="p-6 space-y-5">
                    {/* Ditolak warning banner */}
                    {sub.status === "ditolak" && sub.catatanAdmin && (
                      <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-left">
                        <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <strong className="text-sm text-rose-950 dark:text-rose-300 font-bold block">
                            Alasan Penolakan:
                          </strong>
                          <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed whitespace-pre-wrap">
                            {sub.catatanAdmin}
                          </p>
                          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/60 block pt-1.5">
                            * Silakan ajukan ulang bebas pustaka di halaman
                            utama setelah memperbaiki dokumen sesuai catatan di
                            atas.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Diverifikasi success banner */}
                    {sub.status === "diverifikasi" && (
                      <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 text-left">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <strong className="text-sm text-emerald-950 dark:text-emerald-300 font-bold block">
                            Verifikasi Berhasil!
                          </strong>
                          <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
                            Berkas pengajuan Anda telah diverifikasi oleh
                            Perpustakaan. Syarat bebas pustaka Anda telah
                            terpenuhi. Silakan hubungi loket administrasi
                            perpustakaan jika diperlukan.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Nama Mahasiswa
                        </span>
                        <span className="font-semibold text-foreground">
                          {sub.namaLengkap}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          NIM / Stambuk
                        </span>
                        <span className="font-semibold text-foreground">
                          {sub.nim}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Program Studi
                        </span>
                        <span className="text-foreground">
                          {programStudiMap[
                            sub.programStudi as keyof typeof programStudiMap
                          ] || sub.programStudi}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Tanggal Pengajuan
                        </span>
                        <span className="text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-[11px] text-muted-foreground font-semibold block">
                          Judul Karya Ilmiah
                        </span>
                        <span className="text-foreground text-xs leading-relaxed block bg-muted/20 p-2.5 rounded-lg border border-border/30 italic">
                          "{sub.judulSkripsi}"
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
