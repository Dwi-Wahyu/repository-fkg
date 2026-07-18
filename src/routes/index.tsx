import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  BookPlus,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentListSkeleton } from "../components/skeletons/document-list-skeleton";
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
import { useDebouncedValue } from "../lib/useDebouncedEffect";
import { getSessionFn } from "../server/authFunctions";
import { programStudiMap } from "../server/db/schema";
import { getPublicDocumentsFn } from "../server/submissionFunctions";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || undefined,
    programStudi: (search.programStudi as string) || undefined,
    jenisDokumen: (search.jenisDokumen as string) || undefined,
    page: search.page ? Number(search.page) || 1 : 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [user, result] = await Promise.all([
      getSessionFn({ data: { cb: Date.now() } }),
      getPublicDocumentsFn({ data: deps }),
    ]);
    return { user, ...result };
  },
  pendingComponent: HomePendingComponent,
  component: HomeComponent,
});

function HomePendingComponent() {
  return <HomeLayout isLoading={true} />;
}

function HomeComponent() {
  return <HomeLayout isLoading={false} />;
}

function HomeLayout({ isLoading }: { isLoading: boolean }) {
  const data = Route.useLoaderData({ select: (d) => d, throwOnError: false });
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const user = data?.user;
  const documents = data?.items || [];
  const page = data?.page || 1;
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || 0;

  const [searchText, setSearchText] = useState(searchParams.search || "");
  const debouncedSearchText = useDebouncedValue(searchText, 400);

  useEffect(() => {
    if (debouncedSearchText !== searchParams.search) {
      navigate({
        search: (prev) => ({
          ...prev,
          search: debouncedSearchText || undefined,
          page: 1,
        }),
      });
    }
  }, [debouncedSearchText, searchParams.search, navigate]);

  useEffect(() => {
    document.documentElement.classList.add("custom-scrollbar");
    return () => {
      document.documentElement.classList.remove("custom-scrollbar");
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev) => ({
        ...prev,
        search: searchText || undefined,
        page: 1,
      }),
    });
  };

  return (
    <div className="bg-background text-foreground font-body-md flex flex-col pt-16 md:pt-0 md:pb-0">
      {/* Top Nav Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#840000] shadow-md flex items-center justify-between px-6 md:px-12 h-16 md:h-20 max-w-full mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" className="h-6 w-6 md:h-8 md:w-8" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Button asChild variant="secondary" size="sm">
              <Link to="/admin">Dashboard Admin</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link to="/login">Login Admin</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-grow w-full max-w-full mx-auto">
        {/* Desktop Hero Section */}
        <section className="flex relative overflow-hidden min-h-svh items-center justify-center w-full">
          {/* Background Video with Dark Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/welcome_video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/60 z-10" />
          </div>

          <div className="max-w-3xl w-full text-center relative z-20 space-y-6 px-6">
            <div className="space-y-2">
              <h2 className=" text-3xl md:text-5xl font-bold leading-tight text-white tracking-wide">
                Perpustakaan FKG
              </h2>
              <p className=" text-xl md:text-2xl font-semibold opacity-90 text-white tracking-wider">
                Universitas Hasanuddin
              </p>
            </div>
            <p className="max-w-2xl mx-auto text-sm md:text-base opacity-80 leading-relaxed text-white font-sans">
              Portal administrasi bebas pustaka mandiri untuk mahasiswa Fakultas
              Kedokteran Gigi Unhas. Unggah kelengkapan sumbangsih karya ilmiah
              Anda dan pantau status verifikasi secara real-time.
            </p>
            <div className="hidden md:flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button asChild size="lg">
                <Link to="/ajukan">
                  <FileText className="mr-2 h-4 w-4" />
                  Ajukan Bebas Pustaka
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/status" search={{}}>
                  <Search className="mr-2 h-4 w-4" />
                  Cek Status Pengajuan
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/usulan-buku">
                  <BookPlus className="mr-2 h-4 w-4" />
                  Usulan Buku
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mobile CTA section */}
        <section className="hidden max-md:flex bg-[#840000] px-6 py-8 flex-col gap-3">
          <Button
            asChild
            className="w-full bg-white text-[#840000] hover:bg-slate-100 font-semibold py-4 shadow-md transition-transform flex items-center justify-center gap-2"
          >
            <Link to="/ajukan">
              <FileText className="h-5 w-5" />
              Ajukan Bebas Pustaka
            </Link>
          </Button>
          <Button
            asChild
            className="w-full bg-white text-[#840000] hover:bg-slate-100 font-semibold py-4 shadow-md transition-transform flex items-center justify-center gap-2"
          >
            <Link to="/status" search={{}}>
              <Search className="h-5 w-5" />
              Cek Status Pengajuan
            </Link>
          </Button>
          <Button
            asChild
            className="w-full bg-white text-[#840000] hover:bg-slate-100 font-semibold py-4 shadow-md transition-transform flex items-center justify-center gap-2"
          >
            <Link to="/usulan-buku">
              <BookPlus className="h-5 w-5" />
              Usulan Buku
            </Link>
          </Button>
        </section>

        {/* Filters & Results */}
        <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
          <section className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full md:w-auto relative">
              <label className="block text-xs font-semibold text-[#5c403b] mb-1">
                Pencarian
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#916f6a] h-4 w-4" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Cari judul, penulis..."
                  className="w-full pl-10 pr-4 py-2 border border-[#e6bdb7] rounded bg-white focus:ring-2 focus:ring-[#840000] focus:border-[#840000] text-sm text-[#191c1d]"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-xs font-semibold text-[#5c403b] mb-1">
                Program Studi
              </label>
              <Select
                value={searchParams.programStudi || "all"}
                onValueChange={(value) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      programStudi: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  })
                }
              >
                <SelectTrigger className="w-full border-[#e6bdb7] bg-white text-[#191c1d]">
                  <SelectValue placeholder="Semua Program Studi" />
                </SelectTrigger>
                <SelectContent className="border-[#e6bdb7] bg-white">
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {Object.entries(programStudiMap).map(([slug, label]) => (
                    <SelectItem key={slug} value={slug}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-xs font-semibold text-[#5c403b] mb-1">
                Jenis Dokumen
              </label>
              <Select
                value={searchParams.jenisDokumen || "all"}
                onValueChange={(value) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      jenisDokumen: value === "all" ? undefined : value,
                      page: 1,
                    }),
                  })
                }
              >
                <SelectTrigger className="w-full border-[#e6bdb7] bg-white text-[#191c1d]">
                  <SelectValue placeholder="Semua Jenis Dokumen" />
                </SelectTrigger>
                <SelectContent className="border-[#e6bdb7] bg-white">
                  <SelectItem value="all">Semua Jenis Dokumen</SelectItem>
                  <SelectItem value="skripsi">Skripsi</SelectItem>
                  <SelectItem value="tesis">Tesis</SelectItem>
                  <SelectItem value="disertasi">Disertasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Document Grid */}
          <div className="space-y-4">
            {isLoading ? (
              <DocumentListSkeleton />
            ) : documents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => (
                    <Link
                      key={doc.id}
                      to="/dokumen/$id"
                      params={{ id: String(doc.id) }}
                      className="group bg-white border border-[#e6bdb7] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-32 bg-slate-50 flex items-center justify-center border-b border-[#e6bdb7] group-hover:bg-slate-100 transition-colors">
                        <FileText className="h-12 w-12 text-[#916f6a] opacity-50" />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-[#ffdad4] text-[#410000] border-none text-[10px] uppercase font-semibold">
                            {doc.programStudi === "s2_gigi"
                              ? "Tesis"
                              : doc.programStudi === "s3_gigi"
                                ? "Disertasi"
                                : "Skripsi"}
                          </Badge>
                          <span className="text-xs text-[#5c403b]">
                            {programStudiMap[
                              doc.programStudi as keyof typeof programStudiMap
                            ] || doc.programStudi}
                          </span>
                        </div>
                        <h3 className="text-[#840000] font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#b00000] transition-colors">
                          {doc.judulSkripsi}
                        </h3>
                        <p className="text-sm text-[#5c403b] mb-4 flex-grow">
                          Oleh: {doc.namaLengkap}
                        </p>
                        <div className="mt-auto flex justify-between items-center border-t border-[#e6bdb7] pt-4">
                          <span className="text-xs text-[#5c403b]">
                            Lihat Detail
                          </span>
                          <ChevronRight className="h-5 w-5 text-[#003793] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-[#5c403b] hidden sm:block">
                      Menampilkan{" "}
                      <span className="font-medium text-[#191c1d]">
                        {(page - 1) * 10 + 1}
                      </span>{" "}
                      hingga{" "}
                      <span className="font-medium text-[#191c1d]">
                        {Math.min(page * 10, totalItems)}
                      </span>{" "}
                      dari{" "}
                      <span className="font-medium text-[#191c1d]">
                        {totalItems}
                      </span>{" "}
                      dokumen
                    </p>
                    <div className="flex items-center gap-4 mx-auto sm:mx-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({
                            search: (prev) => ({ ...prev, page: page - 1 }),
                            resetScroll: false,
                          })
                        }
                        disabled={page <= 1}
                        className="border-[#e6bdb7] text-[#191c1d] hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <span className="text-sm font-medium text-[#191c1d]">
                        Halaman {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({
                            search: (prev) => ({ ...prev, page: page + 1 }),
                            resetScroll: false,
                          })
                        }
                        disabled={page >= totalPages}
                        className="border-[#e6bdb7] text-[#191c1d] hover:bg-slate-50"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-[#5c403b] space-y-2 border border-dashed border-[#e6bdb7] rounded-2xl bg-white/50">
                <FileText className="h-10 w-10 mx-auto text-[#916f6a]/50" />
                <p className="text-sm font-semibold">Dokumen tidak ditemukan</p>
                <p className="text-xs max-w-md mx-auto">
                  Coba cari dengan kata kunci lain atau ubah filter pencarian
                  Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
