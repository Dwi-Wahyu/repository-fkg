import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "../../components/mode-toggle";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/useToast";
import { getSessionFn, logoutFn } from "../../server/authFunctions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getSessionFn();
    if (user?.role !== "admin") {
      toast.error("Akses ditolak. Anda harus masuk sebagai Admin.");
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AdminLayoutComponent,
});

function AdminLayoutComponent() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutFn();
    toast.success("Keluar dari Admin Panel.");
    await router.invalidate();
    router.navigate({ to: "/login" });
  };

  const sidebarContent = (onLinkClick?: () => void) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="admin-logo flex items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            <img
              src="/logo.webp"
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-foreground">
                Perpustakaan
              </span>
              <span className=" font-medium text-muted-foreground mt-0.5">
                FKG Unhas
              </span>
            </div>
          </div>
        </div>
        <ul className="admin-menu space-y-2 w-full">
          <li className="admin-menu-item">
            <Link
              to="/admin"
              onClick={onLinkClick}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all font-medium w-full"
              activeProps={{
                className:
                  "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-l-2 border-indigo-500 rounded-l-none font-semibold",
              }}
              activeOptions={{ exact: true }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </li>

          <li className="admin-menu-item">
            <Link
              to="/admin/pengajuan"
              search={{}}
              onClick={onLinkClick}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all font-medium w-full"
              activeProps={{
                className:
                  "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-l-2 border-indigo-500 rounded-l-none font-semibold",
              }}
            >
              <ClipboardList size={18} />
              <span>Bebas Pustaka</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="admin-layout flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar Navigation */}
      <aside className="admin-sidebar w-64 border-r border-border bg-card/45 backdrop-blur-md p-6 hidden md:flex flex-col shrink-0">
        {sidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative flex w-64 max-w-xs flex-col bg-card border-r border-border p-6 shadow-2xl animate-slide-in">
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 mt-4">
              {sidebarContent(() => setIsSidebarOpen(false))}
            </div>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Admin Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-card/45 backdrop-blur-md px-6 py-3 sticky top-0 z-30 h-14 w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden h-9 w-9 bg-card border-border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-9 px-4"
            >
              <LogOut size={14} className="mr-2" />
              <span>Keluar</span>
            </Button>
          </div>
        </header>

        {/* Main Content View */}
        <main className="admin-content flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
