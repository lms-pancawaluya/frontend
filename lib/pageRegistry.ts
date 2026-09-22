// lib/pageRegistry.ts
//
// Daftar statis halaman internal LMS yang bisa dicari lewat search bar
// di Header (dashboard). Dipakai oleh komponen Header untuk quick navigation
// mirip command palette (ketik nama halaman → Enter/klik → pindah halaman).

export type AppRole = "admin" | "pengajar" | "guru" | string;

export interface SearchablePage {
  label: string;
  href: string;
  /** Kata kunci tambahan supaya lebih mudah ditemukan (sinonim, singkatan, dll). */
  keywords?: string[];
  /** Deskripsi singkat, ditampilkan kecil di bawah label pada dropdown hasil. */
  description?: string;
  /** Role yang bisa melihat halaman ini. Kosongkan agar tampil untuk semua role yang login. */
  roles?: AppRole[];
}

export const PAGE_REGISTRY: SearchablePage[] = [
  // ===== Umum (semua role yang login) =====
  { label: "Profil", href: "/profile", keywords: ["akun", "biodata"], description: "Lihat & edit profil Anda" },
  { label: "Pengaturan", href: "/settings", keywords: ["setting", "preferensi", "tema", "bahasa"], description: "Preferensi akun & tampilan" },

  // ===== Guru =====
  { label: "Dashboard Guru", href: "/dashboard", keywords: ["beranda", "home"], roles: ["guru"] },
  { label: "Modul Pembelajaran", href: "/modules", keywords: ["modul", "belajar", "course", "materi"], roles: ["guru"] },
  { label: "Bantuan / Helpdesk", href: "/helpdesk", keywords: ["bantuan", "tiket", "keluhan", "support"], roles: ["guru"] },

  // ===== Pengajar =====
  { label: "Dashboard Pengajar", href: "/pengajar", keywords: ["beranda", "home"], roles: ["pengajar"] },
  { label: "Monitoring", href: "/pengajar/monitoring", keywords: ["pemantauan", "progres guru"], roles: ["pengajar"] },
  { label: "Diskusi", href: "/pengajar/diskusi", keywords: ["forum", "tanya jawab"], roles: ["pengajar"] },
  { label: "Data Guru", href: "/pengajar/guru", keywords: ["guru", "peserta"], roles: ["pengajar"] },

  // ===== Admin =====
  { label: "Dashboard Admin", href: "/admin", keywords: ["beranda", "home"], roles: ["admin"] },
  { label: "Kelola Course", href: "/admin/courses", keywords: ["course", "program pembelajaran"], roles: ["admin"] },
  { label: "Kelola Modul", href: "/admin/modules", keywords: ["modul", "materi"], roles: ["admin"] },
  { label: "Kelola Pengguna", href: "/admin/users", keywords: ["user", "akun", "guru", "pengajar"], roles: ["admin"] },
  { label: "Manajemen Sertifikat", href: "/admin/certificates", keywords: ["sertifikat", "certificate", "template"], roles: ["admin"] },
  { label: "Diskusi", href: "/admin/diskusi", keywords: ["forum", "tanya jawab"], roles: ["admin"] },
  { label: "Helpdesk", href: "/admin/helpdesk", keywords: ["bantuan", "tiket", "keluhan", "support"], roles: ["admin"] },
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
    const haystack = [page.label, page.description, ...(page.keywords || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}