// lib/pageRegistry.ts
//
// Daftar statis halaman internal LMS yang bisa dicari lewat search bar
// di Header (dashboard). Dipakai oleh komponen Header untuk quick navigation
// mirip command palette (ketik nama halaman → Enter/klik → pindah halaman).

export type AppRole = "admin" | "pengajar" | "guru" | string;

export type TranslateFn = (idText: string, enText: string) => string;

export interface SearchablePage {
  label: string;
  labelEn: string;
  href: string;
  /** Kata kunci tambahan supaya lebih mudah ditemukan (sinonim, singkatan, dll). */
  keywords?: string[];
  /** Deskripsi singkat, ditampilkan kecil di bawah label pada dropdown hasil. */
  description: string;
  descriptionEn: string;
  /** Role yang bisa melihat halaman ini. Kosongkan agar tampil untuk semua role yang login. */
  roles?: AppRole[];
}

export const PAGE_REGISTRY: SearchablePage[] = [
  // ===== Umum (semua role yang login) =====
  { label: "Profil", labelEn: "Profile", href: "/profile", keywords: ["akun", "biodata"], description: "Lihat & edit profil Anda", descriptionEn: "View & edit your profile" },
  { label: "Pengaturan", labelEn: "Settings", href: "/settings", keywords: ["setting", "preferensi", "tema", "bahasa"], description: "Preferensi akun & tampilan", descriptionEn: "Account & display preferences" },

  // ===== Guru =====
  { label: "Dashboard Guru", labelEn: "Teacher Dashboard", href: "/dashboard", keywords: ["beranda", "home"], roles: ["guru"], description: "", descriptionEn: "" },
  { label: "Modul Pembelajaran", labelEn: "Learning Modules", href: "/modules", keywords: ["modul", "belajar", "course", "materi"], roles: ["guru"], description: "", descriptionEn: "" },
  { label: "Bantuan / Helpdesk", labelEn: "Help / Helpdesk", href: "/helpdesk", keywords: ["bantuan", "tiket", "keluhan", "support"], roles: ["guru"], description: "", descriptionEn: "" },

  // ===== Pengajar =====
  { label: "Dashboard Pengajar", labelEn: "Instructor Dashboard", href: "/pengajar", keywords: ["beranda", "home"], roles: ["pengajar"], description: "", descriptionEn: "" },
  { label: "Monitoring", labelEn: "Monitoring", href: "/pengajar/monitoring", keywords: ["pemantauan", "progres guru"], roles: ["pengajar"], description: "", descriptionEn: "" },
  { label: "Diskusi", labelEn: "Discussion", href: "/pengajar/diskusi", keywords: ["forum", "tanya jawab"], roles: ["pengajar"], description: "", descriptionEn: "" },
  { label: "Data Guru", labelEn: "Teacher Data", href: "/pengajar/guru", keywords: ["guru", "peserta"], roles: ["pengajar"], description: "", descriptionEn: "" },

  // ===== Admin =====
  { label: "Dashboard Admin", labelEn: "Admin Dashboard", href: "/admin", keywords: ["beranda", "home"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Kelola Course", labelEn: "Manage Courses", href: "/admin/courses", keywords: ["course", "program pembelajaran"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Kelola Modul", labelEn: "Manage Modules", href: "/admin/modules", keywords: ["modul", "materi"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Kelola Pengguna", labelEn: "Manage Users", href: "/admin/users", keywords: ["user", "akun", "guru", "pengajar"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Manajemen Sertifikat", labelEn: "Certificate Management", href: "/admin/certificates", keywords: ["sertifikat", "certificate", "template"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Diskusi", labelEn: "Discussion", href: "/admin/diskusi", keywords: ["forum", "tanya jawab"], roles: ["admin"], description: "", descriptionEn: "" },
  { label: "Helpdesk", labelEn: "Helpdesk", href: "/admin/helpdesk", keywords: ["bantuan", "tiket", "keluhan", "support"], roles: ["admin"], description: "", descriptionEn: "" },
];

/** Ambil daftar halaman yang boleh dilihat oleh sebuah role. */
export function getPagesForRole(role?: AppRole): SearchablePage[] {
  return PAGE_REGISTRY.filter((page) => !page.roles || page.roles.includes(role || ""));
}

/** Filter halaman berdasarkan query pencarian (label, deskripsi, atau keywords). */
export function searchPages(pages: SearchablePage[], query: string): SearchablePage[] {
  const q = query.trim().toLowerCase();
  if (!q) return pages;

  return pages.filter((page) => {
    const haystack = [page.label, page.labelEn, page.description, page.descriptionEn, ...(page.keywords || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** Terjemahkan label & description dari registry sesuai bahasa aktif. */
export function localizePage(page: SearchablePage, t: TranslateFn): SearchablePage {
  return {
    ...page,
    label: t(page.label, page.labelEn),
    description: t(page.description, page.descriptionEn),
  };
}
