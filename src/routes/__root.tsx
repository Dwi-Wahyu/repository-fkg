import { type ReactNode, useEffect, useState } from "react";
import "../styles.css";
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useLocation,
	useRouter,
} from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { ThemeProvider } from "../components/theme-provider";
import { Button } from "../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ToastContainer } from "../components/ui/Toast";
import { toast } from "../components/ui/useToast";
import { getSessionFn, logoutFn } from "../server/authFunctions";
import { trackVisitFn } from "../server/visitorFunctions";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "theme-color",
				content: "#840000",
			},
			{
				title: "Repository FKG Unhas",
			},
		],

		links: [
			{ rel: "icon", type: "image/png", href: "/favicon.png" },
			{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
			{ rel: "manifest", href: "/manifest.webmanifest" },
			{ rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
		],
	}),
	loader: async ({ location }) => {
		const user = await getSessionFn({ data: { cb: Date.now() } });

		// Only count real public visits — exclude admin panel, auth, and the
		// internal-access gate so staff/internal traffic never inflates visitor stats.
		const path = location.pathname;
		const isTrackable =
			!path.startsWith("/admin") &&
			path !== "/login" &&
			path !== "/akses-internal";

		if (isTrackable) {
			await trackVisitFn({ data: { path } });
		}

		return { user };
	},
	component: RootComponent,
	errorComponent: ({ error }) => {
		return (
			<div className="min-h-screen flex items-center justify-center p-10 bg-slate-950 text-rose-500">
				<div className="border border-rose-500/20 bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl max-w-xl w-full">
					<h2 className="text-2xl font-bold mb-4">
						Terjadi Kesalahan pada Server
					</h2>
					<p className="text-slate-400 mb-4 text-sm">
						Berikut adalah detail kesalahan untuk diagnosis:
					</p>
					<pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-xs font-mono mb-4 text-rose-400">
						{error instanceof Error ? error.message : String(error)}
					</pre>
					<pre className="p-4 bg-black/40 rounded-lg overflow-x-auto text-xs font-mono text-slate-500">
						{error instanceof Error ? error.stack : ""}
					</pre>
				</div>
			</div>
		);
	},
	notFoundComponent: () => {
		return (
			<div className="min-h-screen flex items-center justify-center p-10 bg-slate-950 text-slate-200">
				<div className="border border-slate-800 bg-slate-900/50 backdrop-blur-md p-8 rounded-2xl text-center max-w-md w-full">
					<span className="text-5xl block mb-4">🔍</span>
					<h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
					<p className="text-slate-400 mb-6">
						Maaf, halaman yang Anda cari tidak tersedia atau telah dihapus.
					</p>
					<Link
						to="/"
						className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
					>
						Kembali
					</Link>
				</div>
			</div>
		);
	},
});

function RootComponent() {
	const { user } = Route.useLoaderData();
	const location = useLocation();
	const router = useRouter();

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const isAdminRoute = location.pathname.startsWith("/admin");
	const isAuthRoute = location.pathname === "/login";
	const isPublicRoute =
		["/", "/ajukan", "/status", "/usulan-buku", "/akses-internal"].includes(
			location.pathname,
		) || location.pathname.startsWith("/dokumen");

	const handleLogout = async () => {
		await logoutFn();
		toast.success("Anda telah keluar.");
		await router.invalidate();
		router.navigate({ to: "/login" });
	};

	return (
		<RootDocument>
			{!isAdminRoute && !isAuthRoute && !isPublicRoute && (
				<header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
					<div className="container flex h-14 items-center justify-between px-6">
						<Link
							to="/"
							className="flex items-center gap-2.5 font-bold text-lg text-foreground hover:text-foreground/80 transition-colors"
						>
							<img
								src="/logo.webp"
								alt="Logo"
								className="h-7 w-auto object-contain"
							/>
							<span className="text-base tracking-tight font-extrabold">
								Bebas Pustaka FKG Unhas
							</span>
						</Link>
						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center gap-6">
							<Link
								to="/"
								className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground"
								activeProps={{ className: "text-foreground font-semibold" }}
								activeOptions={{ exact: true }}
							>
								Beranda
							</Link>

							{user ? (
								<div className="flex items-center gap-4">
									{user.role === "admin" && (
										<Link
											to="/admin"
											className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3"
										>
											<LayoutDashboard size={14} className="mr-2" />
											<span>Dashboard Admin</span>
										</Link>
									)}
									<span className="text-sm text-muted-foreground">
										Halo, <strong>{user.username}</strong>
									</span>
									<button
										type="button"
										className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
										onClick={handleLogout}
									>
										<LogOut size={14} className="mr-2" />
										<span>Keluar</span>
									</button>
								</div>
							) : (
								<Link
									to="/login"
									className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-4"
								>
									Masuk
								</Link>
							)}
						</nav>

						{/* Mobile Navigation Dropdown */}
						<div className="flex md:hidden items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="h-9 w-9 bg-card border-border"
									>
										<Menu className="h-5 w-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-56 bg-popover border-border text-popover-foreground"
								>
									<DropdownMenuLabel>Menu Navigasi</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-border/50" />
									<DropdownMenuItem asChild>
										<Link
											to="/"
											className="w-full flex items-center justify-between cursor-pointer"
										>
											Beranda
										</Link>
									</DropdownMenuItem>
									{user ? (
										<>
											{user.role === "admin" && (
												<DropdownMenuItem asChild>
													<Link
														to="/admin"
														className="w-full flex items-center gap-2 cursor-pointer text-indigo-650 dark:text-indigo-400"
													>
														<LayoutDashboard size={14} />
														Dashboard Admin
													</Link>
												</DropdownMenuItem>
											)}
											<DropdownMenuSeparator className="bg-border/50" />
											<DropdownMenuLabel className="font-normal text-xs text-muted-foreground py-1">
												Halo, <strong>{user.username}</strong>
											</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={handleLogout}
												className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer"
											>
												<LogOut size={14} className="mr-2" />
												Keluar
											</DropdownMenuItem>
										</>
									) : (
										<>
											<DropdownMenuSeparator className="bg-border/50" />
											<DropdownMenuItem asChild>
												<Link
													to="/login"
													className="w-full flex items-center justify-center bg-primary text-primary-foreground font-semibold py-1.5 rounded cursor-pointer"
												>
													Masuk
												</Link>
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</header>
			)}

			<main
				className={
					isAdminRoute || isPublicRoute || isAuthRoute
						? ""
						: "container py-6 px-6"
				}
			>
				<Outlet />
			</main>

			<ToastContainer />
		</RootDocument>
	);
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	const isProd = process.env.NODE_ENV === "production";

	return (
		<html lang="id" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				<ThemeProvider defaultTheme="system" storageKey="theme">
					{children}
				</ThemeProvider>
				<script
					dangerouslySetInnerHTML={{
						__html: isProd
							? `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function (err) {
                console.error('SW registration failed:', err);
              });
            });
          }
        `
							: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (regs) {
              regs.forEach(function (r) { r.unregister(); });
            });
          }
          if ('caches' in window) {
            caches.keys().then(function (keys) {
              keys.forEach(function (k) { caches.delete(k); });
            });
          }
        `,
					}}
				/>
				<Scripts />
			</body>
		</html>
	);
}
