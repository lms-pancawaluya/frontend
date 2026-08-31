"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PancawaluyaLogo from "@/app/components/common/Logo";
import { logoutUser } from "@/services/auth.service";
import { useApp } from "@/app/context/AppContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

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

function getNavSections(role: string, t: (id: string, en: string) => string): NavSection[] {
  if (role === "admin") {
    return [
      { items: [{ label: t("Dashboard", "Dashboard"), href: "/admin", icon: ICONS.dashboard }] },
      {
        title: t("Manajemen Sistem", "System Management"),
        items: [
          { label: t("Kelola Modul Pembelajaran", "Manage Learning Modules"), href: "/admin/modules", icon: ICONS.modules },
          { label: t("Kelola Akun Guru", "Manage Teacher Accounts"), href: "/admin/users", icon: ICONS.users },
          { label: t("Kelola Item Checklist", "Manage Checklist Items"), href: "/admin/checklist", icon: ICONS.checklist },
          { label: t("Kelola Tiket Bantuan", "Manage Support Tickets"), href: "/admin/helpdesk", icon: ICONS.helpdesk, badge: t("Baru V1", "New V1") },
          { label: t("Monitoring Pengerjaan Modul", "Module Progress Monitoring"), href: "/admin/checklist/report", icon: ICONS.monitoring },
          { label: t("RTL", "Action Plan (RTL)"), href: "/admin/rtl", icon: ICONS.document },
        ],
      },
      { title: t("Akun", "Account"), items: [{ label: t("Profil", "Profile"), href: "/profile", icon: ICONS.profile }] },
    ];
  }

  if (role === "pengajar") {
    return [
      { items: [{ label: t("Dashboard", "Dashboard"), href: "/pengajar", icon: ICONS.dashboard }] },
      {
        title: t("Pembinaan Guru", "Teacher Mentoring"),
        items: [
          { label: t("Kelola Guru", "Manage Teachers"), href: "/pengajar/guru", icon: ICONS.users },
          { label: t("Monitoring Pengerjaan Modul", "Module Progress Monitoring"), href: "/pengajar/monitoring", icon: ICONS.monitoring },
          { label: t("RTL", "Action Plan (RTL)"), href: "/pengajar/rtl", icon: ICONS.document },
          { label: t("Diskusi/Komentar Modul", "Module Discussions"), href: "/pengajar/diskusi", icon: ICONS.chat },
        ],
      },
      { title: t("Akun", "Account"), items: [{ label: t("Profil", "Profile"), href: "/profile", icon: ICONS.profile }] },
    ];
  }

  return [
    {
      items: [
        { label: t("Dashboard", "Dashboard"), href: "/dashboard", icon: ICONS.dashboard },
        { label: t("Modul Pembelajaran", "Learning Modules"), href: "/modules", icon: ICONS.modules },
        { label: t("Bantuan", "Help Center"), href: "/helpdesk", icon: ICONS.helpdesk },
        { label: t("Profil", "Profile"), href: "/profile", icon: ICONS.profile },
      ],
    },
  ];
}

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
  fotoProfil?: string;
  foto?: string;
  avatar?: string;
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useApp();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    async function syncAndReadUser() {
      const raw = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {
          setUser(null);
        }
      }

      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/users/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await res.json().catch(() => ({}));

          if (res.ok && result) {
            const userData = result.data || result;
            setUser((prev) => ({ ...prev, ...userData }));
            const existingUser = raw ? JSON.parse(raw) : {};
            localStorage.setItem("user", JSON.stringify({ ...existingUser, ...userData }));
          }
        } catch (err) {
          console.error("Gagal sinkronisasi foto profil sidebar:", err);
        }
      }
    }

    syncAndReadUser();
    window.addEventListener("authChange", syncAndReadUser);
    return () => window.removeEventListener("authChange", syncAndReadUser);
  }, []);

  const sections = getNavSections(user?.role ?? "", t);
  const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
  const activeHref = resolveActiveHref(pathname ?? "", allHrefs);

  const avatarUrl = user?.fotoProfil || user?.foto || user?.avatar;

  function roleTitle(role?: string): string {
    if (role === "admin") return t("Panel Admin", "Admin Panel");
    if (role === "pengajar") return t("Portal Pengajar", "Instructor Portal");
    if (role === "guru") return t("Portal Guru", "Teacher Portal");
    return t("Portal LMS", "LMS Portal");
  }

  function roleLabel(role?: string): string {
    if (!role) return t("Pengguna", "User");
    if (role === "admin") return "Administrator";
    if (role === "pengajar") return t("Pengajar", "Instructor");
    if (role === "guru") return t("Guru", "Teacher");
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

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
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
            isActive
              ? "bg-[#0047A5]/10 text-[#0047A5] dark:bg-blue-500/20 dark:text-blue-400 font-semibold"
              : "font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span
            className={`shrink-0 ${
              isActive ? "text-[#0047A5] dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            }`}
          >
            {item.icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="shrink-0 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
              {item.badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <aside className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
        <PancawaluyaLogo className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight text-slate-900 dark:text-white">
            LMS Pancawaluya
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{roleTitle(user?.role)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section, idx) => (
          <div key={section.title ?? `section-${idx}`} className="space-y-1">
            {section.title ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-1">{section.items.map(renderNavItem)}</ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user?.nama || "Profile"}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0047A5] text-sm font-bold uppercase text-white">
              {user?.nama ? user.nama.charAt(0) : "U"}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.nama ?? t("Pengguna", "User")}</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{roleLabel(user?.role)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t("Keluar", "Logout")}
        </button>
      </div>
    </aside>
  );
}