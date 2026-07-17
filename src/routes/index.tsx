import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  BookPlus,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { getSessionFn } from "../server/authFunctions";
import { programStudiMap } from "../server/db/schema";
import { getPublicDocumentsFn } from "../server/submissionFunctions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const user = await getSessionFn();
    return { user };
  },
  component: HomeComponent,
});

interface PublicListItem {
  id: number;
  trackingCode: string;
  namaLengkap: string;
  judulSkripsi: string;
  programStudi: string;
  createdAt: string;
}

function HomeComponent() {
  const { user } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [programStudi, setProgramStudi] = useState<string>("all");
  const [jenisDokumen, setJenisDokumen] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<PublicListItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = useCallback(
    async (searchQuery: string, prodi: string, jenis: string) => {
      setLoading(true);
      try {
        const res = await getPublicDocumentsFn({
          data: {
            search: searchQuery || undefined,
            programStudi: prodi === "all" ? undefined : prodi,
            jenisDokumen: jenis === "all" ? undefined : jenis,
          },
        });
        setDocuments(res.items);
        setHasSearched(true);
      } catch (err) {
        console.error("Gagal memuat dokumen:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Run search when filters change or on initial mount, using current search state
  useEffect(() => {
    executeSearch(search, programStudi, jenisDokumen);
  }, [programStudi, jenisDokumen, executeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(search, programStudi, jenisDokumen);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-background text-foreground">
      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between py-4 px-6 md:px-12 border-b border-border bg-card/60 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.webp"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/admin">
                <LayoutDashboard />
                Dashboard Admin
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Login Admin</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Decorative background blobs */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Content Section */}
      <div className="max-w-4xl mx-auto text-center space-y-8 px-4 pt-16 pb-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/80 border border-border text-muted-foreground text-xs font-semibold backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Layanan Bebas Pustaka Digital</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
          Sistem Repository & Bebas Pustaka{" "}
          <span className="bg-gradient-to-r from-indigo-650 via-indigo-500 to-purple-600 dark:from-indigo-200 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent block mt-2 md:mt-3">
            FKG Universitas Hasanuddin
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Portal administrasi bebas pustaka mandiri untuk mahasiswa Fakultas
          Kedokteran Gigi Unhas. Unggah kelengkapan sumbangsih karya ilmiah Anda
          dan pantau status verifikasi secara real-time.
        </p>

        {/* Three Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 max-w-md mx-auto font-semibold sm:max-w-none">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 rounded-2xl font-semibold cursor-pointer"
          >
            <Link to="/ajukan">
              <FileText className="mr-2.5 h-5 w-5" />
              Ajukan Bebas Pustaka
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 px-8 text-base border-border bg-card/65 dark:bg-card/35 backdrop-blur-sm font-semibold rounded-2xl cursor-pointer"
          >
            <Link to="/status" search={{}}>
              <Search className="mr-2.5 h-5 w-5" />
              Cek Status Pengajuan
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 px-8 text-base border-border bg-card/65 dark:bg-card/35 backdrop-blur-sm font-semibold rounded-2xl cursor-pointer"
          >
            <Link to="/usulan-buku">
              <BookPlus className="mr-2.5 h-5 w-5" />
              Usulkan Buku
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Repository Section */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-24 relative z-10">
        <div className="bg-card/40 dark:bg-card/25 backdrop-blur-xl border border-border/85 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Telusuri Repository Dokumen
            </h2>
            <p className="text-sm text-muted-foreground">
              Cari skripsi, tesis, dan disertasi yang telah terverifikasi bebas
              pustaka di lingkungan FKG Universitas Hasanuddin.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <div className="md:col-span-5">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul penelitian atau kata kunci..."
                className="bg-background/50 border-border/60 text-base"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={jenisDokumen} onValueChange={setJenisDokumen}>
                <SelectTrigger className="w-full md:w-fit">
                  <SelectValue placeholder="Semua Jenis Dokumen" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="all">Semua Jenis Dokumen</SelectItem>
                  <SelectItem value="skripsi">Skripsi</SelectItem>
                  <SelectItem value="tesis">Tesis</SelectItem>
                  <SelectItem value="disertasi">Disertasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select value={programStudi} onValueChange={setProgramStudi}>
                <SelectTrigger className="w-full md:w-fit">
                  <SelectValue placeholder="Semua Program Studi" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card animate-in fade-in-50 duration-200">
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {Object.entries(programStudiMap).map(([slug, label]) => (
                    <SelectItem key={slug} value={slug}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer"
              >
                <Search /> <span className="md:hidden">Cari</span>
              </Button>
            </div>
          </form>

          {/* Search Results List */}
          <div className="space-y-3 pt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="text-sm">Memuat dokumen repository...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    to="/dokumen/$id"
                    params={{ id: String(doc.id) }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-background/40 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 border border-border/50 hover:border-indigo-500/40 transition-all duration-300 gap-4"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-indigo-500/5 text-indigo-600 dark:text-indigo-405 border-indigo-500/20 text-[10px] py-0.5 px-2"
                        >
                          {doc.programStudi === "s2_gigi"
                            ? "Tesis"
                            : doc.programStudi === "s3_gigi"
                              ? "Disertasi"
                              : "Skripsi"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {programStudiMap[
                            doc.programStudi as keyof typeof programStudiMap
                          ] || doc.programStudi}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-indigo-650 dark:group-hover:text-indigo-350 transition-colors line-clamp-2">
                        {doc.judulSkripsi}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>Penulis:</span>
                        <span className="font-semibold text-foreground/80">
                          {doc.namaLengkap}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center shrink-0 text-muted-foreground group-hover:text-indigo-500 transition-colors self-end sm:self-center">
                      <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Buka Dokumen
                      </span>
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="text-center py-12 text-muted-foreground space-y-2 border border-dashed border-border/80 rounded-2xl bg-background/10">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-semibold">Dokumen tidak ditemukan</p>
                <p className="text-xs max-w-md mx-auto">
                  Coba cari dengan kata kunci lain atau ubah filter pencarian
                  Anda.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="w-full text-center py-6 border-t border-border bg-card/25 text-muted-foreground text-xs relative z-10">
        <p>
          © {new Date().getFullYear()} Perpustakaan FKG Universitas Hasanuddin.
        </p>
      </footer>
    </div>
  );
}
