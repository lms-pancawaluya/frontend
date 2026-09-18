"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCourses } from "@/services/course.service";
import { canManageCourse, getCourseModulePermissions } from "@/lib/rbac";

interface Course {
  id: string;
  judul?: string;
  deskripsi?: string;
  mode?: string;
  hasCertificate?: boolean;
  lokasi?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  createdBy?: string | null;
  schoolId?: string | null;
  isGlobal?: boolean;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<{ role?: string; id?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    let parsedUser: { role?: string; id?: string } | null = null;
    try {
      parsedUser = JSON.parse(userData);
    } catch {
      router.push("/login");
      return;
    }

    // Kelola Course memakai permission yang sama dengan Course/Module (BE):
    // Admin & Pengajar boleh mengelola, Guru read-only diarahkan keluar.
    if (!getCourseModulePermissions(parsedUser?.role).canEdit) {
      router.push("/dashboard");
      return;
    }

    async function loadCourses() {
      try {
        setCurrentUser(parsedUser ?? {});
        const data = await getCourses();
        setCourses(Array.isArray(data) ? (data as Course[]) : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar course.");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [router]);

  if (loading) {
    return <p className="mt-16 text-center text-gray-500">Memuat daftar course...</p>;
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-md p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)]">Kelola Course</h1>
          <p className="mt-1 text-sm text-gray-500">Daftar course yang tersedia di sistem.</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="shrink-0 rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white transition hover:opacity-90"
        >
          + Tambah Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-8 text-center text-sm text-gray-500">
          Belum ada course tersedia.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => {
            // Action manage (buka detail) hanya untuk Course yang boleh dikelola
            // user ini (Admin: semua; Pengajar: hanya miliknya). Course lain tetap
            // ditampilkan sebagai informasi, tanpa aksi manage.
            const manageable = canManageCourse(currentUser.role, currentUser.id, course);
            const content = (
              <>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-[var(--color-navy)]">{course.judul || "Tanpa judul"}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{course.deskripsi || "Tidak ada deskripsi."}</p>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                    {course.mode || "—"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span>{course.hasCertificate ? "Dengan sertifikat" : "Tanpa sertifikat"}</span>
                  <span>Mulai: {formatDate(course.tanggalMulai)}</span>
                  <span>Selesai: {formatDate(course.tanggalSelesai)}</span>
                  {!manageable && (
                    <span className="text-amber-600">
                      {course.isGlobal || course.schoolId === null ? "Course Global" : "Course pengajar lain"}
                    </span>
                  )}
                </div>
              </>
            );

            return manageable ? (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 transition hover:shadow-md"
              >
                {content}
              </Link>
            ) : (
              <div
                key={course.id}
                className="rounded-2xl border border-[var(--color-border-soft)] bg-white/70 p-5"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
