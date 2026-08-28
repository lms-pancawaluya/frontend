"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PancawaluyaLogo from "@/app/components/common/Logo";
import { logoutUser } from "@/services/auth.service";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  modules: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  checklist: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  helpdesk: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  monitoring: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  profile: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  document: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chat: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4z" />
    </svg>
  ),
};

// Navigation is derived from the authenticated user's role and links ONLY to
// existing routes. Admin gets the management set (refactored from the previous
// AdminSidebar); guru/pengajar get the learner set (mirrors the old Header nav).
function getNavSections(role: string): NavSection[] {
  if (role === "admin") {
    return [
      { items: [{ label: "Dashboard", href: "/admin", icon: ICONS.dashboard }] },
      {
        title: "Manajemen Sistem",
        items: [
          { label: "Kelola Modul Pembelajaran", href: "/admin/modules", icon: ICONS.modules },
          { label: "Kelola Akun Guru", href: "/admin/users", icon: ICONS.users },
          { label: "Kelola Item Checklist", href: "/admin/checklist", icon: ICONS.checklist },
          { label: "Kelola Tiket Bantuan", href: "/admin/helpdesk", icon: ICONS.helpdesk, badge: "Baru V1" },
          { label: "Monitoring Pengerjaan Modul", href: "/admin/checklist/report", icon: ICONS.monitoring },
          { label: "RTL", href: "/admin/rtl", icon: ICONS.document },
          { label: "Diskusi/Komentar Modul", href: "/admin/diskusi", icon: ICONS.chat },
        ],
      },
      { title: "Akun", items: [{ label: "Profil", href: "/profile", icon: ICONS.profile }] },
    ];
  }

  if (role === "pengajar") {
    return [
      { items: [{ label: "Dashboard", href: "/pengajar", icon: ICONS.dashboard }] },
      {
        title: "Pembinaan Guru",
        items: [
          { label: "Kelola Guru", href: "/pengajar/guru", icon: ICONS.users },
          { label: "Monitoring Pengerjaan Modul", href: "/pengajar/monitoring", icon: ICONS.monitoring },
          { label: "RTL", href: "/pengajar/rtl", icon: ICONS.document },
          { label: "Diskusi/Komentar Modul", href: "/pengajar/diskusi", icon: ICONS.chat },
        ],
      },
      { title: "Akun", items: [{ label: "Profil", href: "/profile", icon: ICONS.profile }] },
    ];
  }

  return [
    {
      items: [
        { label: "Dashboard", href: "/dashboard", icon: ICONS.dashboard },
        { label: "Modul Pembelajaran", href: "/modules", icon: ICONS.modules },
        { label: "Bantuan", href: "/helpdesk", icon: ICONS.helpdesk },
        { label: "Profil", href: "/profile", icon: ICONS.profile },
      ],
    },
  ];
}

// Longest-prefix match so nested routes highlight their parent, and
// /admin/checklist/report wins over /admin/checklist.
function resolveActiveHref(pathname: string, hrefs: string[]): string {
  let best = "";
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && href.length > best.length) best = href;
  }
  return best;
}

interface StoredUser {
  nama?: string;
  role?: string;
}

function roleTitle(role?: string): string {
  if (role === "admin") return "Panel Admin";
  if (role === "pengajar") return "Portal Pengajar";
  if (role === "guru") return "Portal Guru";
  return "Portal LMS";
}

function roleLabel(role?: string): string {
  if (!role) return "Pengguna";
  if (role === "admin") return "Administrator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  // Hydration-safe read of the stored user (same pattern as Header/HeroCta):
  // never touch localStorage during render.
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

  const sections = getNavSections(user?.role ?? "");
  const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
  const activeHref = resolveActiveHref(pathname ?? "", allHrefs);

  function handleLogout() {
    logoutUser();
    onNavigate?.();
    router.push("/");
  }

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
            LMS Pancawaluya
          </p>
          <p className="truncate text-[11px] text-gray-500">{roleTitle(user?.role)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section, idx) => (
          <div key={section.title ?? `section-${idx}`} className="space-y-1">
            {section.title ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-1">{section.items.map(renderNavItem)}</ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-[var(--color-border-soft)] p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-pale)]/50 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-sm font-bold uppercase text-white">
            {user?.nama ? user.nama.charAt(0) : "U"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-navy)]">{user?.nama ?? "Pengguna"}</p>
            <p className="truncate text-[11px] text-gray-500">{roleLabel(user?.role)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-soft)] px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
