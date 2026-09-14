"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourseById } from "@/services/course.service";
import { createModule, deleteModule, getModules, updateModule } from "@/services/module.service";

interface CourseModule {
  id: string;
  judul?: string;
  deskripsi?: string;
  aspekPancawaluya?: string;
  urutan?: number;
  courseId?: string;
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
  const [moduleForm, setModuleForm] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
  });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [existingModules, setExistingModules] = useState<CourseModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [moduleSaving, setModuleSaving] = useState(false);
  const [existingModuleSaving, setExistingModuleSaving] = useState(false);
  const [moduleDeletingId, setModuleDeletingId] = useState<string | null>(null);
  const [moduleError, setModuleError] = useState("");

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

  const availableExistingModules = existingModules.filter(
    (module) => !course?.modules?.some((courseModule) => courseModule.id === module.id)
  );

  function resetModuleForm() {
    setEditingModuleId(null);
    setModuleForm({ judul: "", deskripsi: "", aspekPancawaluya: "cageur", urutan: 1 });
  }

  function startEditModule(module: CourseModule) {
    setEditingModuleId(module.id);
    setModuleError("");
    setModuleForm({
      judul: module.judul || "",
      deskripsi: module.deskripsi || "",
      aspekPancawaluya: module.aspekPancawaluya || "cageur",
      urutan: module.urutan || 1,
    });
  }

  function handleModuleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setModuleForm((previous) => ({ ...previous, [name]: name === "urutan" ? Number(value) : value }));
  }

  async function handleModuleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setModuleSaving(true);
    setModuleError("");
    const payload = { ...moduleForm, courseId: id };

    try {
      if (editingModuleId) {
        const updated = await updateModule(editingModuleId, payload);
        setCourse((previous) => previous ? {
          ...previous,
          modules: (previous.modules || []).map((module) =>
            module.id === editingModuleId ? { ...module, ...payload, ...(updated || {}) } : module
          ),
        } : previous);
      } else {
        const created = await createModule(payload);
        if (!created?.id) {
          const refreshed = await getCourseById(id);
          setCourse(refreshed as Course);
        } else {
          setCourse((previous) => previous ? {
            ...previous,
            modules: [...(previous.modules || []), { ...payload, ...created }],
          } : previous);
        }
      }
      resetModuleForm();
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : "Gagal menyimpan module.");
    } finally {
      setModuleSaving(false);
    }
  }

  async function handleExistingModuleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedModuleId) return;

    const selectedModule = existingModules.find((module) => module.id === selectedModuleId);
    if (!selectedModule) return;

    setExistingModuleSaving(true);
    setModuleError("");
    try {
      await updateModule(selectedModule.id, { courseId: id });
      const refreshed = await getCourseById(id);
      setCourse(refreshed as Course);
      setSelectedModuleId("");
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : "Gagal menambahkan module existing.");
    } finally {
      setExistingModuleSaving(false);
    }
  }

  async function handleModuleDelete(module: CourseModule) {
    if (!window.confirm(`Yakin ingin menghapus module "${module.judul || module.id}"?`)) return;

    setModuleDeletingId(module.id);
    setModuleError("");
    try {
      await deleteModule(module.id);
      setCourse((previous) => previous ? {
        ...previous,
        modules: (previous.modules || []).filter((item) => item.id !== module.id),
      } : previous);
      if (editingModuleId === module.id) resetModuleForm();
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : "Gagal menghapus module.");
    } finally {
      setModuleDeletingId(null);
    }
  }

  useEffect(() => {
    async function loadCourse() {
      try {
        const [courseData, modulesData] = await Promise.all([getCourseById(id), getModules()]);
        setCourse(courseData as Course);
        setExistingModules(modulesData as CourseModule[]);
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
        <div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase text-emerald-300">{course.mode || "Course"}</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{course.judul || "Tanpa judul"}</h1>
        </div>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Mode</p>
            <p className="mt-1 font-medium capitalize">{course.mode || "—"}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Sertifikat</p>
            <p className="mt-1 font-medium">{course.hasCertificate ? "Tersedia" : "Tidak tersedia"}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">Periode</p>
            <p className="mt-1 font-medium">{formatDate(course.tanggalMulai)} — {formatDate(course.tanggalSelesai)}</p>
          </div>
          {course.mode?.toLowerCase() === "offline" && (
            <div className="rounded-xl bg-white/10 p-3 sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-slate-400">Lokasi</p>
              <p className="mt-1 font-medium">{course.lokasi || "—"}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5">
        <h2 className="font-semibold text-[var(--color-navy)]">Tentang Course</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{course.deskripsi || "Tidak ada deskripsi."}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--color-navy)]">Module dalam Course</h2>
            {course.modules && <span className="text-sm text-slate-500">{course.modules.length} module</span>}
          </div>
          <button
            type="button"
            onClick={() => { resetModuleForm(); setModuleError(""); }}
            className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            + Tambah Module
          </button>
        </div>

        {moduleError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{moduleError}</div>}

        {!editingModuleId && (
          <form onSubmit={handleExistingModuleSubmit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto]">
            <select value={selectedModuleId} onChange={(event) => setSelectedModuleId(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Pilih module existing</option>
              {availableExistingModules.map((module) => <option key={module.id} value={module.id}>{module.judul || module.id}</option>)}
            </select>
            <button type="submit" disabled={!selectedModuleId || existingModuleSaving} className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white disabled:bg-gray-400">{existingModuleSaving ? "Menambahkan..." : "Tambah Existing"}</button>
          </form>
        )}

        <form onSubmit={handleModuleSubmit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <input name="judul" value={moduleForm.judul} onChange={handleModuleChange} placeholder="Judul module baru" required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          <select name="aspekPancawaluya" value={moduleForm.aspekPancawaluya} onChange={handleModuleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize">
            {['cageur', 'bageur', 'bener', 'pinter', 'singer'].map((aspek) => <option key={aspek} value={aspek}>{aspek}</option>)}
          </select>
          <textarea name="deskripsi" value={moduleForm.deskripsi} onChange={handleModuleChange} placeholder="Deskripsi module" required rows={3} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2" />
          <input name="urutan" type="number" min={1} value={moduleForm.urutan} onChange={handleModuleChange} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={moduleSaving} className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white disabled:bg-gray-400">{moduleSaving ? "Menyimpan..." : editingModuleId ? "Simpan Perubahan" : "Simpan Module Baru"}</button>
            {editingModuleId && <button type="button" onClick={resetModuleForm} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">Batal</button>}
          </div>
        </form>

        {!course.modules || course.modules.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada module dalam course ini.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {course.modules.map((module) => (
              <li key={module.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{module.judul || module.id}</p>
                  {module.deskripsi && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{module.deskripsi}</p>}
                  <span className="text-xs text-slate-500">{module.status || (module.isLocked ? "Terkunci" : "Tersedia")}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => startEditModule(module)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-[var(--color-navy)]">Edit</button>
                  <button type="button" onClick={() => handleModuleDelete(module)} disabled={moduleDeletingId === module.id} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 disabled:text-gray-400">{moduleDeletingId === module.id ? "Menghapus..." : "Hapus"}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
