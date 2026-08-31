"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";

// Routes that render fully standalone (no Header, no Sidebar) — they ship their
// own full-screen visual treatment.
const AUTH_ROUTES = ["/login", "/register", "/otp", "/forgot-password"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// Desktop sidebar collapse state lives in localStorage so it persists across
// navigation and reloads. Read via useSyncExternalStore (SSR snapshot = expanded)
// to stay hydration-safe and lint-clean; cross-tab sync comes free via "storage".
const COLLAPSE_KEY = "sidebarCollapsed";
const collapseSubscribers = new Set<() => void>();

function subscribeCollapsed(callback: () => void): () => void {
  collapseSubscribers.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    collapseSubscribers.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function toggleCollapsedStore(): void {
  const next = localStorage.getItem(COLLAPSE_KEY) === "1" ? "0" : "1";
  localStorage.setItem(COLLAPSE_KEY, next);
  collapseSubscribers.forEach((cb) => cb());
}

// The application shell decides the chrome per route:
//   - Landing ("/")            → shared Header + Footer (public marketing page)
//   - Auth pages               → standalone (children only)
//   - Everything else (app)    → shared role-based Sidebar (Guru/Pengajar/Admin)
// The global Header never renders on authenticated application pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop icon-only collapse — persisted; SSR/first-paint snapshot is expanded.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    () => localStorage.getItem(COLLAPSE_KEY) === "1",
    () => false,
  );

  const isLanding = pathname === "/";
  const isAuth = isAuthRoute(pathname);

  // Close the mobile drawer whenever the route changes (React-recommended
  // "adjust state during render" pattern instead of a setState-in-effect).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }

  // While the drawer is open: lock body scroll and allow Escape to close it.
  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  if (isAuth) {
    return <>{children}</>;
  }

  if (isLanding) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Authenticated application shell: Sidebar + page content.
  return (
    <div className="flex min-h-[100dvh] w-full">
      {/* Desktop: persistent sidebar (expanded or icon-only) */}
      <aside
        className={`sticky top-0 hidden h-[100dvh] shrink-0 self-start overflow-y-auto border-r border-[var(--color-border-soft)] transition-[width] duration-300 min-[801px]:block ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsedStore} />
      </aside>

      {/* Mobile/tablet: off-canvas drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 min-[801px]:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="app-sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Aplikasi"
            className="absolute inset-y-0 left-0 w-72 max-w-[82%] overflow-y-auto border-r border-[var(--color-border-soft)] bg-white shadow-2xl"
          >
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/tablet: single menu trigger (hidden on desktop) */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] bg-white/80 px-4 py-2.5 backdrop-blur min-[801px]:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={drawerOpen}
            aria-controls="app-sidebar-drawer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border-soft)] px-3 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-pale)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu</span>
          </button>
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--color-navy)]">
            LMS Pancawaluya
          </span>
        </div>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
