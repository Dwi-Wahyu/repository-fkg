import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Lock,
  ShieldAlert,
  User,
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
import { toast } from "../components/ui/useToast";
import { programStudiMap } from "../server/db/schema";
import {
  checkDocumentAccessFn,
  downloadDocumentFn,
  getPublicDocumentDetailFn,
} from "../server/submissionFunctions";

export const Route = createFileRoute("/dokumen/$id")({
  component: DokumenDetailComponent,
});

interface PublicDocument {
  id: number;
  trackingCode: string;
  namaLengkap: string;
  nim: string;
  judulSkripsi: string;
  programStudi: string;
  dosenPembimbingPenguji: string | null;
  createdAt: string;
}

function DokumenDetailComponent() {
  const { id } = Route.useParams();
  const docId = parseInt(id, 10);

  const [doc, setDoc] = useState<PublicDocument | null>(null);
  const [access, setAccess] = useState<{ allowed: boolean } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingDoc(true);
        const fetchedDoc = await getPublicDocumentDetailFn({
          data: { id: docId },
        });
        setDoc(fetchedDoc);
      } catch (err: unknown) {
        console.error(err);
        const errMsg =
          err instanceof Error ? err.message : "Gagal memuat detail dokumen";
        setError(errMsg);
      } finally {
        setLoadingDoc(false);
      }

      try {
        setLoadingAccess(true);
        const accessStatus = await checkDocumentAccessFn();
        setAccess(accessStatus);
      } catch (err) {
        console.error("Gagal memeriksa akses dokumen:", err);
      } finally {
        setLoadingAccess(false);
      }
    }

    loadData();
  }, [docId]);

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

  if (loadingDoc) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          <p className="text-sm text-muted-foreground">
            Memuat detail dokumen...
          </p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground p-6">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-rose-500" />
          <h2 className="text-xl font-bold">Dokumen Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">
            {error ||
              "Dokumen tidak ditemukan atau belum diverifikasi bebas pustaka."}
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
                    NIM: {doc.nim}
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

          {/* Right: Access & Download Card */}
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
              {loadingAccess ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                  <p>Memeriksa hak akses...</p>
                </div>
              ) : access?.allowed ? (
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
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full h-11 rounded-xl gap-2 font-bold cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? "Mengunduh..." : "Unduh Dokumen PDF"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-amber-650 dark:text-amber-400">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="text-xs font-medium space-y-1">
                      <p className="font-bold">Akses Terbatas</p>
                      <p className="opacity-90 leading-relaxed">
                        Naskah lengkap hanya dapat diakses melalui komputer
                        internal Perpustakaan Fakultas Kedokteran Gigi.
                      </p>
                    </div>
                  </div>

                  {/* <Button
                    disabled
                    variant="secondary"
                    className="w-full h-11 rounded-xl gap-2 text-muted-foreground opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    Akses Terbatas
                  </Button> */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="w-full text-center py-6 border-t border-border bg-card/25 text-muted-foreground text-xs relative z-10 mt-auto">
        <p>
          © {new Date().getFullYear()} Perpustakaan Fakultas Kedokteran Gigi
          Universitas Hasanuddin. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
