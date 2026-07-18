import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Lock,
  ShieldAlert,
  User,
} from "lucide-react";
import { useState } from "react";
import { DocumentDetailSkeleton } from "../components/skeletons/document-detail-skeleton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "../components/ui/useToast";
import { programStudiMap } from "../server/db/schema";
import {
  checkDocumentAccessFn,
  downloadDocumentFn,
  getDocumentPreviewFn,
  getPublicDocumentDetailFn,
} from "../server/submissionFunctions";

export const Route = createFileRoute("/dokumen/$id")({
  loader: async ({ params }) => {
    const docId = parseInt(params.id, 10);
    const [doc, access] = await Promise.all([
      getPublicDocumentDetailFn({ data: { id: docId } }),
      checkDocumentAccessFn({ data: { cb: Date.now() } }),
    ]);
    return { doc, access };
  },
  pendingComponent: DocumentDetailSkeleton,
  component: DokumenDetailComponent,
});

function DokumenDetailComponent() {
  const { doc, access } = Route.useLoaderData();
  const [downloading, setDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleOpenPreview = async () => {
    if (!doc) return;
    setIsPreviewOpen(true);
    if (previewUrl) return;

    setLoadingPreview(true);
    try {
      const res = await getDocumentPreviewFn({ data: { id: doc.id } });
      const binaryString = window.atob(res.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pratinjau dokumen");
      setIsPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open && previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDownload = async () => {
    if (!doc) return;
    setDownloading(true);
    toast.success("Mempersiapkan unduhan file dokumen...");
    try {
      const res = await downloadDocumentFn({ data: { id: doc.id } });

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
      toast.success("File dokumen berhasil diunduh.");
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Gagal mengunduh dokumen";
      toast.error(errMsg);
    } finally {
      setDownloading(false);
    }
  };

  if (!doc) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-rose-500" />
          <h2 className="text-xl font-bold">Dokumen Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">
            Dokumen tidak ditemukan atau belum diverifikasi bebas pustaka.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayProdi =
    programStudiMap[doc.programStudi as keyof typeof programStudiMap] ||
    doc.programStudi;
  const isS2 = doc.programStudi === "s2_gigi";
  const isS3 = doc.programStudi === "s3_gigi";
  const docLabel = isS2 ? "Tesis" : isS3 ? "Disertasi" : "Skripsi";

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-background text-foreground">
      {/* Main Page Body */}
      <div className="max-w-4xl w-full mx-auto px-4 py-8 md:py-12 relative z-10 flex-1">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground rounded-lg"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left: Info Card */}
          <Card className="md:col-span-2 border-border/80 bg-card/40 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="space-y-3 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-indigo-500/5 text-indigo-600 dark:text-indigo-405 border-indigo-500/20 text-xs py-0.5 px-2"
                >
                  {docLabel}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold leading-snug">
                {doc.judulSkripsi}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Writer Metadata */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-350 shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">
                    Penulis / Mahasiswa
                  </p>
                  <p className="font-bold text-base">{doc.namaLengkap}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {doc.nim}
                  </p>
                </div>
              </div>

              {/* Study Program Metadata */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-350 shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">
                    Program Studi
                  </p>
                  <p className="font-semibold text-foreground/90">
                    {displayProdi}
                  </p>
                </div>
              </div>

              {/* Pembimbing/Penguji */}
              {doc.dosenPembimbingPenguji && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-350 shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      Dosen Pembimbing & Penguji
                    </p>
                    <p className="text-sm whitespace-pre-line text-foreground/80 leading-relaxed font-medium">
                      {doc.dosenPembimbingPenguji}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {access?.allowed ? (
            <Card className="border-border/80 bg-card/45 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  File Dokumen
                </CardTitle>
                <CardDescription className="text-xs">
                  Akses unduh naskah lengkap karya ilmiah.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div className="text-xs font-medium">
                      <p className="font-bold">Akses Terbuka</p>
                      <p className="opacity-90">
                        Koneksi Anda berada di dalam jaringan Fakultas.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Button
                      onClick={handleOpenPreview}
                      variant="outline"
                      className="w-full h-11 rounded-xl gap-2 font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Eye className="h-4 w-4" />
                      Pratinjau di Browser
                    </Button>
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full h-11 rounded-xl gap-2 font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "Mengunduh..." : "Unduh Dokumen PDF"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-650 dark:text-amber-400">
                <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="text-xs font-medium space-y-1">
                  <p className="font-bold">Akses Terbatas</p>
                  <p className="opacity-90 leading-relaxed">
                    Naskah lengkap hanya dapat diakses melalui komputer internal
                    Perpustakaan Fakultas Kedokteran Gigi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <footer className="w-full text-center py-6 border-t border-border bg-card/25 text-muted-foreground text-xs relative z-10 mt-auto">
        <p>
          © {new Date().getFullYear()} Perpustakaan FKG Universitas Hasanuddin.
        </p>
      </footer>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="min-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] flex flex-col justify-between gap-0 p-0 bg-card border-border shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="px-6 pt-6 border-b border-border/40 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              <span>Pratinjau Dokumen</span>
            </DialogTitle>
            <DialogDescription className="text-xs truncate">
              {doc.skripsiOriginalName || "Dokumen.pdf"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 bg-muted/10 overflow-hidden relative">
            {loadingPreview ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
                <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Membuat pratinjau PDF...
                </p>
              </div>
            ) : previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title="Preview Dokumen"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-muted-foreground">
                Gagal memuat pratinjau.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
