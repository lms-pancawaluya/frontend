"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourseById } from "@/services/course.service";

interface CourseModule {
  id: string;
  judul?: string;
  isLocked?: boolean;
  status?: string;
}

interface Course {
  id: string;
  judul?: string;
  deskripsi?: string;
  mode?: string;
  hasCertificate?: boolean;
  lokasi?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  modules?: CourseModule[];
  [key: string]: unknown;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

export default function AdminCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    if (!course || !window.confirm(`Yakin ingin menghapus course "${course.judul || "ini"}"?`)) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCourse(id);
      router.push("/admin/courses");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus course.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await getCourseById(id);
        setCourse(data as Course);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail course.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCourse();
  }, [id]);

  if (loading) {
    return <p className="mt-16 text-center text-gray-500">Memuat detail course...</p>;
  }

  if (error || !course) {
    return (
      <div className="mx-auto mt-16 max-w-md p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error || "Course tidak ditemukan."}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          ← Kembali ke daftar course
        </button>
        <Link
          href={`/admin/courses/${id}/edit`}
          className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-sm text-[var(--color-navy)] transition hover:bg-gray-50"
        >
          Edit Course
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400"
        >
          {deleting ? "Menghapus..." : "Hapus Course"}
        </button>
      </div>
      {deleteError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</div>}

      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase text-emerald-300">{course.mode || "Course"}</span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{course.judul || "Tanpa judul"}</h1>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{course.hasCertificate ? "Dengan sertifikat" : "Tanpa sertifikat"}</span>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{course.deskripsi || "Tidak ada deskripsi."}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lokasi</p>
          <p className="mt-2 text-sm text-slate-800">{course.lokasi || "—"}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Periode</p>
          <p className="mt-2 text-sm text-slate-800">{formatDate(course.tanggalMulai)} — {formatDate(course.tanggalSelesai)}</p>
        </div>
      </div>

      {course.modules ? (
        <div className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5">
          <h2 className="font-semibold text-[var(--color-navy)]">Module Course</h2>
          {course.modules.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Belum ada module dalam course ini.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {course.modules.map((module) => (
                <li key={module.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span>{module.judul || module.id}</span>
                  <span className="text-xs text-slate-500">{module.status || (module.isLocked ? "Terkunci" : "Tersedia")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
