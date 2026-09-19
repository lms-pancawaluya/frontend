// lib/rbac.ts
//
// Aturan akses Course & Module sesuai panduan backend:
//   - Guru      : GET saja (read-only)
//   - Pengajar  : GET, POST, PUT
//   - Admin     : GET, POST, PUT, DELETE
//
// Helper ini dipakai di halaman/komponen untuk menampilkan atau
// menyembunyikan aksi (tombol tambah/edit/hapus) berdasarkan role user
// yang tersimpan di localStorage("user").

export type AppRole = "admin" | "pengajar" | "guru" | string;

export interface CourseModulePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/** Ambil objek user yang tersimpan di localStorage (aman untuk SSR). */
export function getStoredUser(): { role?: AppRole; [key: string]: unknown } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Normalisasi role ke lowercase agar perbandingan konsisten. */
export function normalizeRole(role?: AppRole): string {
  return String(role || "").toLowerCase();
}

/**
 * Hitung permission Course & Module berdasarkan role.
 * Semua role yang sudah login bisa GET (read), jadi canView selalu true
 * selama role dikenali (admin/pengajar/guru).
 */
export function getCourseModulePermissions(role?: AppRole): CourseModulePermissions {
  const r = normalizeRole(role);

  return {
    canView: r === "admin" || r === "pengajar" || r === "guru",
    canCreate: r === "admin" || r === "pengajar",
    canEdit: r === "admin" || r === "pengajar",
    canDelete: r === "admin",
  };
}

/** Shortcut: ambil permission langsung dari user yang sedang login. */
export function useStoredPermissions(): CourseModulePermissions {
  const user = getStoredUser();
  return getCourseModulePermissions(user?.role as AppRole);
}

export interface CourseOwnershipShape {
  createdBy?: string | null;
  schoolId?: string | null;
}

/**
 * Apakah user boleh MENGELOLA (edit/manage) sebuah Course.
 *
 * Mencerminkan scope ownership yang tetap ditegakkan BE:
 *   - Admin   : semua Course.
 *   - Pengajar: hanya Course yang dibuat sendiri (`createdBy === user.id`).
 *               Global Course (`schoolId === null`) dan Course milik pengajar
 *               lain TIDAK dapat dikelola.
 *   - Guru    : tidak mengelola.
 *
 * Guna menentukan `userId`, gunakan id canonical dari response/localStorage
 * (`user.id`), bukan nama/sekolah. BE tetap source of truth untuk authorization.
 */
export function canManageCourse(
  role: AppRole | undefined,
  userId: string | undefined,
  course: CourseOwnershipShape | null | undefined
): boolean {
  const r = normalizeRole(role);
  if (r === "admin") return true;
  if (r !== "pengajar") return false;
  if (!userId || !course?.createdBy) return false;
  return course.createdBy === userId;
}

/**
 * Kumpulan id Course yang dapat dikelola user (dipakai untuk Module yang
 * mewarisi ownership dari parent Course). Admin dianggap mengelola semua.
 */
export function buildManageableCourseIdSet(
  role: AppRole | undefined,
  userId: string | undefined,
  courses: Array<CourseOwnershipShape & { id: string }>
): Set<string> {
  const set = new Set<string>();
  if (normalizeRole(role) === "admin") {
    for (const course of courses) if (course?.id) set.add(course.id);
    return set;
  }
  for (const course of courses) {
    if (course?.id && canManageCourse(role, userId, course)) set.add(course.id);
  }
  return set;
}