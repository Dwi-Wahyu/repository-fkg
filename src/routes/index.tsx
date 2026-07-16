import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  LayoutDashboard,
  Search,
  Shield,
  BookPlus,
} from "lucide-react";
import { ModeToggle } from "../components/mode-toggle";
import { Button } from "../components/ui/button";
import { getSessionFn } from "../server/authFunctions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const user = await getSessionFn();
    return { user };
  },
  component: HomeComponent,
});

function HomeComponent() {
  const { user } = Route.useLoaderData();

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
              className="hidden sm:inline-flex border-border"
            >
              <Link to="/admin">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
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
      <div className="max-w-4xl mx-auto text-center space-y-8 px-4 py-16 relative z-10 my-auto">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 max-w-md mx-auto font-semibold sm:max-w-none">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 rounded-2xl cursor-pointer"
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

      {/* Footer bar */}
      <footer className="w-full text-center py-6 border-t border-border bg-card/25 text-muted-foreground text-xs relative z-10">
        <p>
          © {new Date().getFullYear()} Perpustakaan Fakultas Kedokteran Gigi
          Universitas Hasanuddin. All rights reserved.
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/60 sm:hidden">
          <Link to="/login" className="underline hover:text-foreground">
            Login Admin
          </Link>
        </p>
      </footer>
    </div>
  );
}
