"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PancawaluyaLogo from "@/app/components/common/Logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

const ICONS = {
  dashboard: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  modules: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  checklist: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  helpdesk: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  monitoring: (
    <svg {...iconProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
};

// Sidebar destinations map 1:1 to the EXISTING admin routes/features only.
// No new routes are introduced (the mockup's "Pengaturan Sistem" items have no
// backing pages, so they are intentionally omitted).
const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: ICONS.dashboard },
];

const MANAJEMEN_NAV: NavItem[] = [
  { label: "Kelola Modul Pembelajaran", href: "/admin/modules", icon: ICONS.modules },
  { label: "Kelola Akun Guru", href: "/admin/users", icon: ICONS.users },
  { label: "Kelola Item Checklist", href: "/admin/checklist", icon: ICONS.checklist },
  { label: "Kelola Tiket Bantuan", href: "/admin/helpdesk", icon: ICONS.helpdesk, badge: "Baru V1" },
  { label: "Monitoring Pengerjaan Modul", href: "/admin/checklist/report", icon: ICONS.monitoring },
];

const ALL_HREFS = [...PRIMARY_NAV, ...MANAJEMEN_NAV].map((item) => item.href);

// Longest-prefix match so nested routes (e.g. /admin/modules/[id]/edit) highlight
// their parent, and /admin/checklist/report wins over /admin/checklist.
function resolveActiveHref(pathname: string): string {
  let best = "";
  for (const href of ALL_HREFS) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && href.length > best.length) {
      best = href;
    }
  }
  return best;
}

interface StoredUser {
  nama?: string;
  role?: string;
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const activeHref = resolveActiveHref(pathname ?? "");

  // Read the stored user for the profile card. Same hydration-safe pattern as
  // Header/HeroCta: never touch localStorage during render.
  useEffect(() => {
    function readUser() {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }

    readUser();
    window.addEventListener("authChange", readUser);
    return () => window.removeEventListener("authChange", readUser);
  }, []);

  const roleLabel = user?.role
    ? user.role === "admin"
      ? "Administrator"
      : user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Administrator";

  function renderNavItem(item: NavItem) {
    const isActive = activeHref === item.href;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            isActive
              ? "bg-[var(--color-pale)] font-semibold text-[var(--color-navy)]"
              : "font-medium text-gray-600 hover:bg-gray-50 hover:text-[var(--color-navy)]"
          }`}
        >
          <span
            className={`shrink-0 ${
              isActive ? "text-[var(--color-accent)]" : "text-gray-400 group-hover:text-[var(--color-accent)]"
            }`}
          >
            {item.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              {item.badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-5 py-4">
        <PancawaluyaLogo className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight text-[var(--color-navy)]">
            Panel Admin
          </p>
          <p className="truncate text-[11px] text-gray-500">LMS Pancawaluya</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">{PRIMARY_NAV.map(renderNavItem)}</ul>
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Manajemen Sistem
          </p>
          <ul className="space-y-1">{MANAJEMEN_NAV.map(renderNavItem)}</ul>
        </div>
      </nav>

      <div className="border-t border-[var(--color-border-soft)] p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-pale)]/50 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-navy)]">{user?.nama ?? "Admin"}</p>
            <p className="truncate text-[11px] text-gray-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
