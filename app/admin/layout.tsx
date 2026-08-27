"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

// Shared sidebar shell for the whole Admin area (/admin/*). The global Header +
// Footer (from the root layout) stay untouched; this only adds the persistent
// sidebar on desktop and an off-canvas drawer on mobile/tablet. The header on
// desktop is ~65px tall, which the sticky sidebar offsets against.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes. Adjusting state during
  // render (by comparing against the previous pathname) is React's recommended
  // alternative to a setState-in-effect here — it avoids a cascading re-render.
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

  return (
    <div className="flex min-h-[calc(100dvh-65px)] w-full">
      {/* Desktop: persistent sidebar */}
      <aside className="sticky top-[65px] hidden h-[calc(100dvh-65px)] w-64 shrink-0 self-start overflow-y-auto border-r border-[var(--color-border-soft)] min-[801px]:block">
        <AdminSidebar />
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
            id="admin-sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Panel Admin"
            className="absolute inset-y-0 left-0 w-72 max-w-[82%] overflow-y-auto border-r border-[var(--color-border-soft)] bg-white shadow-2xl"
          >
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile/tablet: toggle bar for the drawer (hidden on desktop) */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] bg-white/80 px-4 py-2.5 backdrop-blur min-[801px]:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu Panel Admin"
            aria-expanded={drawerOpen}
            aria-controls="admin-sidebar-drawer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border-soft)] px-3 text-sm font-medium text-[var(--color-navy)] transition hover:bg-[var(--color-pale)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu Admin</span>
          </button>
        </div>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
