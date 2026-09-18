"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PancawaluyaLogo from "@/app/components/common/Logo";
import { logoutUser } from "@/services/auth.service";
import { useApp } from "@/app/context/AppContext";
import { API_URL, fetchApi } from "@/lib/api";

type SubNavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: string;
  subItems?: SubNavItem[];
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

const subIconProps = {
  className: "h-4 w-4",
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
  settings: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
  
  general: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  preferences: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  security: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  notifications: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  progress: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  grid: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  clock: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  checkCircle: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  plusCircle: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reply: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  info: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  help: (
    <svg {...subIconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getSettingsSubItems(t: (id: string, en: string) => string): SubNavItem[] {
  return [
    { label: t("General Information", "General Information"), href: "/settings?tab=general", icon: ICONS.general },
    { label: t("Preferences", "Preferences"), href: "/settings?tab=preferences", icon: ICONS.preferences },
    { label: t("Security", "Security"), href: "/settings?tab=security", icon: ICONS.security },
    { label: t("Notifications", "Notifications"), href: "/settings?tab=notifications", icon: ICONS.notifications },
  ];
}

function getProfileSubItems(t: (id: string, en: string) => string): SubNavItem[] {
  return [
    { label: t("Data Pribadi & Instansi", "Personal Data & Institution"), href: "/profile?tab=personal", icon: ICONS.general },
    { label: t("Progres Modul (1)", "Module Progress (1)"), href: "/profile?tab=progress", icon: ICONS.progress },
    { label: t("Keamanan Akun", "Account Security"), href: "/profile?tab=security", icon: ICONS.security },
  ];
}

function getModulesSubItems(t: (id: string, en: string) => string): SubNavItem[] {
  return [
    { label: t("Semua Modul", "All Modules"), href: "/modules?filter=all", icon: ICONS.grid },
    { label: t("Sedang Dipelajari", "In Progress"), href: "/modules?filter=in-progress", icon: ICONS.clock },
    { label: t("Selesai", "Completed"), href: "/modules?filter=completed", icon: ICONS.checkCircle },
  ];
}

function getHelpdeskSubItems(t: (id: string, en: string) => string): SubNavItem[] {
  return [
    { label: t("Cara membuat tiket", "How to create a ticket"), href: "/helpdesk#create-ticket", icon: ICONS.plusCircle },
    { label: t("Cara melihat dan membalas tiket", "How to view and reply to tickets"), href: "/helpdesk#view-ticket", icon: ICONS.reply },
    { label: t("Arti status tiket", "Ticket status meanings"), href: "/helpdesk#ticket-status", icon: ICONS.info },
    { label: t("Kapan sebaiknya membuat tiket", "When to create a ticket"), href: "/helpdesk#when-to-create", icon: ICONS.help },
  ];
}

function getNavSections(role: string, t: (id: string, en: string) => string): NavSection[] {
  const settingsItem: NavItem = {
    id: "settings",
    label: t("Pengaturan", "Settings"),
    icon: ICONS.settings,
    subItems: getSettingsSubItems(t),
  };

  const profileItem: NavItem = {
    id: "profile",
    label: t("Profil", "Profile"),
    icon: ICONS.profile,
    subItems: getProfileSubItems(t),
  };

  const modulesItem: NavItem = {
    id: "modules",
    label: t("Modul Pembelajaran", "Learning Modules"),
    icon: ICONS.modules,
    subItems: getModulesSubItems(t),
  };

  const helpdeskItem: NavItem = {
    id: "helpdesk",
    label: t("Bantuan", "Help Center"),
    icon: ICONS.helpdesk,
    subItems: getHelpdeskSubItems(t),
  };

  if (role === "admin") {
    return [
      { items: [{ id: "dashboard", label: t("Dashboard", "Dashboard"), href: "/admin", icon: ICONS.dashboard }] },
      {
        title: t("Manajemen Sistem", "System Management"),
        items: [
          { label: t("Kelola Course", "Manage Courses"), href: "/admin/courses", icon: ICONS.modules, id: "admin-courses" },
          { label: t("Kelola Modul Pembelajaran", "Manage Learning Modules"), href: "/admin/modules", icon: ICONS.modules, id: "admin-modules" },
          { label: t("Kelola Akun Guru", "Manage Teacher Accounts"), href: "/admin/users", icon: ICONS.users, id: "admin-users" },
          { label: t("Kelola Item Checklist", "Manage Checklist Items"), href: "/admin/checklist", icon: ICONS.checklist, id: "admin-checklist" },
          { label: t("Manajemen Sertifikat", "Certificate Management"), href: "/admin/certificates", icon: ICONS.document, id: "admin-certificates" },
        ],
      },
      {
        title: t("Pemantauan & Pembinaan", "Monitoring & Mentoring"),
        items: [
          { label: t("Monitoring Pengerjaan", "Progress Monitoring"), href: "/admin/checklist/report", icon: ICONS.monitoring, id: "admin-monitoring" },
          { label: t("RTL", "Action Plan (RTL)"), href: "/admin/rtl", icon: ICONS.document, id: "admin-rtl" },
          { label: t("Diskusi/Komentar Modul", "Module Discussions"), href: "/admin/diskusi", icon: ICONS.chat, id: "admin-diskusi" },
        ],
      },
      {
        title: t("Layanan", "Services"),
        items: [
          { ...helpdeskItem, href: "/admin/helpdesk", badge: t("Baru V1", "New V1") },
        ],
      },
      {
        title: t("Preferensi", "Preferences"),
        items: [
          settingsItem,
          profileItem,
        ],
      },
    ];
  }

  if (role === "pengajar") {
    return [
      { items: [{ id: "dashboard", label: t("Dashboard", "Dashboard"), href: "/pengajar", icon: ICONS.dashboard }] },
      {
        title: t("Pembinaan Guru", "Teacher Mentoring"),
        items: [
          { label: t("Kelola Course", "Manage Courses"), href: "/admin/courses", icon: ICONS.modules, id: "pengajar-courses" },
          { label: t("Kelola Modul Pembelajaran", "Manage Learning Modules"), href: "/admin/modules", icon: ICONS.modules, id: "pengajar-modules" },
          { label: t("Kelola Guru", "Manage Teachers"), href: "/pengajar/guru", icon: ICONS.users, id: "pengajar-guru" },
          { label: t("Monitoring Pengerjaan Modul", "Module Progress Monitoring"), href: "/pengajar/monitoring", icon: ICONS.monitoring, id: "pengajar-monitoring" },
          { label: t("RTL", "Action Plan (RTL)"), href: "/pengajar/rtl", icon: ICONS.document, id: "pengajar-rtl" },
          { label: t("Diskusi/Komentar Modul", "Module Discussions"), href: "/pengajar/diskusi", icon: ICONS.chat, id: "pengajar-diskusi" },
        ],
      },
      {
        title: t("Layanan", "Services"),
        items: [
          helpdeskItem,
        ],
      },
      {
        title: t("Preferensi", "Preferences"),
        items: [
          settingsItem,
          profileItem,
        ],
      },
    ];
  }

  return [
    {
      items: [
        { id: "dashboard", label: t("Dashboard", "Dashboard"), href: "/dashboard", icon: ICONS.dashboard },
        modulesItem,
        helpdeskItem,
      ],
    },
    {
      title: t("Preferensi", "Preferences"),
      items: [
        settingsItem,
        profileItem,
      ],
    },
  ];
}

function resolveActiveHref(pathname: string, searchParamsString: string, hrefs: string[]): string {
  let best = "";
  const currentFull = pathname + (searchParamsString ? `?${searchParamsString}` : "");

  for (const href of hrefs) {
    if (!href) continue;
    if (href.includes("?")) {
      if (currentFull === href || currentFull.startsWith(`${href}&`)) {
        if (href.length > best.length) best = href;
      }
    } else {
      const cleanHref = href.split("#")[0];
      const matches = pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
      if (matches && cleanHref.length > best.length) best = cleanHref;
    }
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

export default function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const router = useRouter();
  const { t } = useApp();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
          const res = await fetchApi(`${API_URL}/api/users/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const result = await res.json().catch(() => ({}));
            const userData = result.data || result;
            if (userData && Object.keys(userData).length > 0) {
              setUser((prev) => ({ ...prev, ...userData }));
              const existingUser = raw ? JSON.parse(raw) : {};
              localStorage.setItem("user", JSON.stringify({ ...existingUser, ...userData }));
            }
          }
        } catch (err) {
          console.warn("Gagal terhubung ke server untuk sinkronisasi profil:", err);
        }
      }
    }

    syncAndReadUser();
    window.addEventListener("authChange", syncAndReadUser);
    return () => window.removeEventListener("authChange", syncAndReadUser);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pathname.startsWith("/settings")) setOpenDropdowns((p) => ({ ...p, settings: true }));
    if (pathname.startsWith("/profile")) setOpenDropdowns((p) => ({ ...p, profile: true }));
    if (pathname.startsWith("/modules")) setOpenDropdowns((p) => ({ ...p, modules: true }));
    if (pathname.startsWith("/helpdesk")) setOpenDropdowns((p) => ({ ...p, helpdesk: true }));
  }, [pathname]);

  const sections = getNavSections(user?.role ?? "", t);
  const allHrefs = sections.flatMap((s) =>
    s.items.flatMap((i) => (i.subItems ? i.subItems.map((sub) => sub.href) : [i.href ?? ""]))
  );
  const activeHref = resolveActiveHref(pathname ?? "", searchParamsString, allHrefs);

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
    const isOpen = !!openDropdowns[item.id];

    if (item.subItems) {
      const isAnySubActive = item.subItems.some((sub) => {
        const currentTab = searchParams.get("tab");
        const defaultActiveTab = sub.href === "/settings?tab=general" && pathname === "/settings" && !currentTab;
        return sub.href === activeHref || defaultActiveTab;
      });

      return (
        <li key={item.id} className="space-y-1">
          <button
            type="button"
            onClick={() => toggleDropdown(item.id)}
            title={collapsed ? item.label : undefined}
            className={`group flex w-full items-center rounded-xl text-sm transition-all ${
              collapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            } ${
              isAnySubActive
                ? "bg-[#0047A5]/10 text-[#0047A5] dark:bg-blue-500/20 dark:text-blue-400 font-semibold"
                : "font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <span
                className={`shrink-0 ${
                  isAnySubActive
                    ? "text-[#0047A5] dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            </div>

            {!collapsed && (
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="shrink-0 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {item.badge}
                  </span>
                )}
                <svg
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </button>

          {isOpen && !collapsed && (
            <ul className="ml-3 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-2 mt-1">
              {item.subItems.map((sub) => {
                const currentTab = searchParams.get("tab");
                const defaultActiveTab = sub.href === "/settings?tab=general" && pathname === "/settings" && !currentTab;
                const isSubActive = sub.href === activeHref || defaultActiveTab;

                return (
                  <li key={sub.href}>
                    <Link
                      href={sub.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                        isSubActive
                          ? "bg-[#0047A5] text-white shadow-sm font-semibold"
                          : "font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {sub.icon && (
                        <span className={`shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}>
                          {sub.icon}
                        </span>
                      )}
                      <span className="truncate">{sub.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    const isActive = activeHref === item.href;
    return (
      <li key={item.id}>
        <Link
          href={item.href ?? "#"}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          aria-current={isActive ? "page" : undefined}
          className={`group flex items-center rounded-xl text-sm transition-all ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          } ${
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
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
          {!collapsed && item.badge ? (
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
      <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 py-4 ${collapsed ? "flex-col gap-3 px-3" : "px-5"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <PancawaluyaLogo className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-display)] text-base font-semibold leading-tight text-slate-900 dark:text-white">
                LMS Pancawaluya
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{roleTitle(user?.role)}</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? t("Perluas menu", "Expand menu") : t("Ciutkan menu", "Collapse menu")}
            aria-expanded={!collapsed}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section, idx) => (
          <div key={section.title ?? `section-${idx}`} className="space-y-1">
            {section.title && !collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-1">{section.items.map(renderNavItem)}</ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 p-3">
        {!collapsed && (
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
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? t("Keluar", "Logout") : undefined}
          aria-label={collapsed ? t("Keluar", "Logout") : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && t("Keluar", "Logout")}
        </button>
      </div>
    </aside>
  );
}
