"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourseById } from "@/services/course.service";
import { createModule, deleteModule, getModules, updateModule } from "@/services/module.service";
import { canManageCourse, getCourseModulePermissions } from "@/lib/rbac";
import { useApp } from "@/app/context/AppContext";

interface CourseModule {
  id: string;
  judul?: string;
  nama?: string;
  title?: string;
  name?: string;
  deskripsi?: string;
  aspekPancawaluya?: string;
  urutan?: number;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
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
  createdBy?: string | null;
  schoolId?: string | null;
  isGlobal?: boolean;
  modules?: CourseModule[];
  [key: string]: unknown;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function getModuleTitle(module: CourseModule) {
  return module.judul || module.nama || module.title || module.name || module.id;
}

export default function AdminCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useApp();
  const id = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  // Guard ownership: Pengajar hanya boleh mengelola Course miliknya.
  const [accessDenied, setAccessDenied] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
    tanggalMulai: "",
    tanggalSelesai: "",
  });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleAddMode, setModuleAddMode] = useState<"create" | "existing" | null>(null);
  const [existingModules, setExistingModules] = useState<CourseModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [existingModuleListOpen, setExistingModuleListOpen] = useState(false);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [existingModuleSaving, setExistingModuleSaving] = useState(false);
  const [moduleDeletingId, setModuleDeletingId] = useState<string | null>(null);
  const [moduleError, setModuleError] = useState("");

  async function handleDelete() {
    if (!course || !window.confirm(t(`Yakin ingin menghapus course "${course.judul || t("ini", "this one")}"?`, `Are you sure you want to delete the course "${course.judul || t("ini", "this one")}"?`))) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCourse(id);
      router.push("/admin/courses");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("Gagal menghapus course.", "Failed to delete course."));
    } finally {
      setDeleting(false);
    }
  }

  const moduleSearchValue = moduleSearch.trim().toLowerCase();
  const availableExistingModules = existingModules.filter((module) => {
    if (course?.modules?.some((courseModule) => courseModule.id === module.id)) return false;
    if (!moduleSearchValue) return true;

    return getModuleTitle(module).toLowerCase().includes(moduleSearchValue);
  });

  function resetModuleForm() {
    setEditingModuleId(null);
    setModuleForm({
      judul: "",
      deskripsi: "",
      aspekPancawaluya: "cageur",
      urutan: 1,
      tanggalMulai: "",
      tanggalSelesai: "",
    });
  }

  function selectExistingModule(module: CourseModule) {
    setSelectedModuleId(module.id);
    setModuleSearch(getModuleTitle(module));
    setExistingModuleListOpen(false);
  }

  function handleModuleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setModuleForm((previous) => ({ ...previous, [name]: name === "urutan" ? Number(value) : value }));
  }

  async function handleModuleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setModuleError("");
    if (moduleForm.tanggalMulai && moduleForm.tanggalSelesai && moduleForm.tanggalSelesai <= moduleForm.tanggalMulai) {
      setModuleError(t("Tanggal selesai modul harus setelah tanggal mulai.", "Module end date must be after start date."));
      return;
    }
    if (moduleForm.tanggalMulai && course?.tanggalSelesai && moduleForm.tanggalMulai >= course.tanggalSelesai.slice(0, 10)) {
      setModuleError(t("Tanggal mulai modul harus sebelum tanggal selesai Course.", "Module start date must be before the Course end date."));
      return;
    }
    setModuleSaving(true);
    const payload = {
      ...moduleForm,
      courseId: id,
      tanggalMulai: moduleForm.tanggalMulai || null,
      tanggalSelesai: moduleForm.tanggalSelesai || null,
    };

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
      setModuleAddMode(null);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : t("Gagal menyimpan module.", "Failed to save module."));
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
      setModuleSearch("");
      setExistingModuleListOpen(false);
      setModuleAddMode(null);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : t("Gagal menambahkan module existing.", "Failed to add existing module."));
    } finally {
      setExistingModuleSaving(false);
    }
  }

  async function handleModuleDelete(module: CourseModule) {
    if (!window.confirm(t(`Yakin ingin menghapus module "${module.judul || module.id}"?`, `Are you sure you want to delete the module "${module.judul || module.id}"?`))) return;

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
      setModuleError(err instanceof Error ? err.message : t("Gagal menghapus module.", "Failed to delete module."));
    } finally {
      setModuleDeletingId(null);
    }
  }

  useEffect(() => {
    async function loadCourse() {
      // Tentukan ownership dari data user + response Course (BE source of truth).
      let currentUser: { role?: string; id?: string } = {};
      try {
        const raw = localStorage.getItem("user");
        currentUser = raw ? JSON.parse(raw) : {};
      } catch {
        currentUser = {};
      }

      try {
        const [courseData, modulesData] = await Promise.all([getCourseById(id), getModules()]);
        const loadedCourse = courseData as Course;

        // Pengajar tidak boleh mengelola Course milik pengajar lain / Global Course.
        if (!canManageCourse(currentUser.role, currentUser.id, loadedCourse)) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        setCanDelete(getCourseModulePermissions(currentUser.role).canDelete);
        setCourse(loadedCourse);
        setExistingModules(modulesData as CourseModule[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Gagal memuat detail course.", "Failed to load course detail."));
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCourse();
  }, [id, t]);

  if (loading) {
    return <p className="mt-16 text-center text-gray-500 dark:text-slate-400">{t("Memuat detail course...", "Loading course detail...")}</p>;
  }

  if (accessDenied) {
    return (
      <div className="mx-auto mt-16 max-w-md p-6 text-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {t("Course ini bukan milik Anda, sehingga tidak dapat dikelola. Hubungi Admin jika perlu.", "This course does not belong to you, so it cannot be managed. Contact an Admin if needed.")}
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="mt-4 text-sm text-[var(--color-accent)] hover:underline dark:text-blue-400"
        >
          ← {t("Kembali ke daftar course", "Back to course list")}
        </button>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto mt-16 max-w-md p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error || t("Course tidak ditemukan.", "Course not found.")}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="text-sm text-[var(--color-accent)] hover:underline dark:text-blue-400"
        >
          ← {t("Kembali ke daftar course", "Back to course list")}
        </button>
        <Link
          href={`/admin/courses/${id}/edit`}
          className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-sm text-[var(--color-navy)] transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("Edit Course", "Edit Course")}
        </Link>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 dark:disabled:border-slate-700 dark:disabled:text-slate-600"
          >
            {deleting ? t("Menghapus...", "Deleting...") : t("Hapus Course", "Delete Course")}
          </button>
        )}
      </div>
      {deleteError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{deleteError}</div>}

      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-10">
        <div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase text-emerald-300">{course.mode || t("Course", "Course")}</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{course.judul || t("Tanpa judul", "Untitled")}</h1>
        </div>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{t("Mode", "Mode")}</p>
            <p className="mt-1 font-medium capitalize">{course.mode || "—"}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{t("Sertifikat", "Certificate")}</p>
            <p className="mt-1 font-medium">{course.hasCertificate ? t("Tersedia", "Available") : t("Tidak tersedia", "Not available")}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-xs text-slate-400">{t("Periode", "Period")}</p>
            <p className="mt-1 font-medium">{formatDate(course.tanggalMulai)} — {formatDate(course.tanggalSelesai)}</p>
          </div>
          {course.mode?.toLowerCase() === "offline" && (
            <div className="rounded-xl bg-white/10 p-3 sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-slate-400">{t("Lokasi", "Location")}</p>
              <p className="mt-1 font-medium">{course.lokasi || "—"}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 dark:bg-slate-900">
        <h2 className="font-semibold text-[var(--color-navy)] dark:text-slate-100">{t("Tentang Course", "About Course")}</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{course.deskripsi || t("Tidak ada deskripsi.", "No description.")}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--color-navy)] dark:text-slate-100">{t("Module dalam Course", "Modules in Course")}</h2>
            {course.modules && <span className="text-sm text-slate-500 dark:text-slate-400">{course.modules.length} {t("module", "modules")}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { resetModuleForm(); setSelectedModuleId(""); setModuleSearch(""); setExistingModuleListOpen(false); setModuleAddMode("create"); setModuleError(""); }}
              className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white transition hover:opacity-90"
            >
              {t("Buat Modul Baru", "Create New Module")}
            </button>
            <button
              type="button"
              onClick={() => { resetModuleForm(); setSelectedModuleId(""); setModuleSearch(""); setExistingModuleListOpen(true); setModuleAddMode("existing"); setModuleError(""); }}
              className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-sm text-[var(--color-navy)] transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("Tambah Modul yang Ada", "Add Existing Module")}
            </button>
          </div>
        </div>

        {moduleError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{moduleError}</div>}

        {moduleAddMode === "existing" && (
          <form onSubmit={handleExistingModuleSubmit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] dark:bg-slate-800">
            <div className="relative">
              <input
                value={moduleSearch}
                onChange={(event) => { setModuleSearch(event.target.value); setSelectedModuleId(""); setExistingModuleListOpen(true); }}
                onFocus={() => setExistingModuleListOpen(true)}
                placeholder={t("Cari dan pilih module", "Search and select a module")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              {existingModuleListOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {availableExistingModules.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{t("Tidak ada module yang cocok.", "No matching modules.")}</p>
                  ) : availableExistingModules.map((module) => (
                    <button key={module.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectExistingModule(module)} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      {getModuleTitle(module)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={!selectedModuleId || existingModuleSaving} className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white disabled:bg-gray-400">{existingModuleSaving ? t("Menambahkan...", "Adding...") : t("Tambah Existing", "Add Existing")}</button>
          </form>
        )}

        {moduleAddMode === "create" && (
          <form onSubmit={handleModuleSubmit} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800">
            <input name="judul" value={moduleForm.judul} onChange={handleModuleChange} placeholder={t("Judul module baru", "New module title")} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            <select name="aspekPancawaluya" value={moduleForm.aspekPancawaluya} onChange={handleModuleChange} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {['cageur', 'bageur', 'bener', 'pinter', 'singer'].map((aspek) => <option key={aspek} value={aspek}>{aspek}</option>)}
            </select>
            <textarea name="deskripsi" value={moduleForm.deskripsi} onChange={handleModuleChange} placeholder={t("Deskripsi module", "Module description")} required rows={3} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            <input name="urutan" type="number" min={1} value={moduleForm.urutan} onChange={handleModuleChange} required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            <div>
              <label htmlFor="tanggalMulai" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{t("Tanggal Mulai (Opsional)", "Start Date (Optional)")}</label>
              <input id="tanggalMulai" name="tanggalMulai" type="date" value={moduleForm.tanggalMulai} onChange={handleModuleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </div>
            <div>
              <label htmlFor="tanggalSelesai" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{t("Tanggal Selesai (Opsional)", "End Date (Optional)")}</label>
              <input id="tanggalSelesai" name="tanggalSelesai" type="date" value={moduleForm.tanggalSelesai} onChange={handleModuleChange} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2 dark:text-slate-400">{t("Kosongkan jadwal modul jika ingin mengikuti jadwal Course.", "Leave module schedule blank to follow Course schedule.")}</p>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={moduleSaving} className="rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white disabled:bg-gray-400">{moduleSaving ? t("Menyimpan...", "Saving...") : t("Simpan Module Baru", "Save New Module")}</button>
              <button type="button" onClick={() => { resetModuleForm(); setModuleAddMode(null); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{t("Batal", "Cancel")}</button>
            </div>
          </form>
        )}

        {!course.modules || course.modules.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t("Belum ada module dalam course ini.", "No modules in this course yet.")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {course.modules.map((module) => (
              <li key={module.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800 dark:text-slate-300">
                <div className="min-w-0">
                  <p className="font-medium">{getModuleTitle(module)}</p>
                  {module.deskripsi && <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{module.deskripsi}</p>}
                  <span className="text-xs text-slate-500 dark:text-slate-400">{module.status || (module.isLocked ? t("Terkunci", "Locked") : t("Tersedia", "Available"))}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/admin/modules/${module.id}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-[var(--color-navy)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{t("Edit", "Edit")}</Link>
                  <button type="button" onClick={() => handleModuleDelete(module)} disabled={moduleDeletingId === module.id} className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 disabled:text-gray-400 dark:border-red-800 dark:bg-slate-900 dark:text-red-400 dark:disabled:text-slate-600">{moduleDeletingId === module.id ? t("Menghapus...", "Deleting...") : t("Hapus", "Delete")}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
