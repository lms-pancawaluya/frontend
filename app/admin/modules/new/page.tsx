"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createModule } from "@/services/module.service";
import { getCourses } from "@/services/course.service";
import { canManageCourse, getCourseModulePermissions } from "@/lib/rbac";
import type { Course } from "@/types/course";
import { useApp } from "@/app/context/AppContext";

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer", "umum"];

function NewModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useApp();
  const preselectedCourseId = searchParams.get("courseId") || "";

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [formData, setFormData] = useState({
    courseId: preselectedCourseId,
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
    tanggalMulai: "",
    tanggalSelesai: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAccess() {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    const perms = getCourseModulePermissions(currentUser?.role);

    // Guru read-only tidak boleh mengakses halaman tambah modul.
    if (!perms.canCreate) {
      router.push("/admin/modules");
      return;
    }

    await Promise.resolve();
    setCheckingAccess(false);
    }

    checkAccess();
  }, [router]);

  useEffect(() => {
    if (checkingAccess) return;

    async function fetchCourses() {
      let currentUser: { role?: string; id?: string } = {};
      try {
        const raw = localStorage.getItem("user");
        currentUser = raw ? JSON.parse(raw) : {};
      } catch {
        currentUser = {};
      }
      const data = await getCourses();
      // Module harus terikat ke Course. Untuk Pengajar, hanya Course miliknya yang
      // boleh dipilih sebagai target (Module mewarisi ownership parent Course).
      const manageable = (data as Course[]).filter((course) =>
        canManageCourse(currentUser.role, currentUser.id, course)
      );
      setCourses(manageable);
      setLoadingCourses(false);
    }
    fetchCourses();
  }, [checkingAccess]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.courseId) {
      setError(t("Pilih course terlebih dahulu — setiap modul harus terhubung ke sebuah course.", "Select a course first — every module must be linked to a course."));
      return;
    }
    if (formData.tanggalMulai && formData.tanggalSelesai && formData.tanggalSelesai <= formData.tanggalMulai) {
      setError(t("Tanggal selesai modul harus setelah tanggal mulai.", "Module end date must be after start date."));
      return;
    }
    const course = courses.find((item) => item.id === formData.courseId);
    if (formData.tanggalMulai && course?.tanggalSelesai && formData.tanggalMulai >= course.tanggalSelesai.slice(0, 10)) {
      setError(t("Tanggal mulai modul harus sebelum tanggal selesai Course.", "Module start date must be before the Course end date."));
      return;
    }

    setLoading(true);

    try {
      await createModule({
        ...formData,
        tanggalMulai: formData.tanggalMulai || null,
        tanggalSelesai: formData.tanggalSelesai || null,
      });
      router.push("/admin/modules");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("Gagal menambahkan modul.", "Failed to add module."));
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAccess) {
    return <p className="text-center mt-16 text-gray-500 dark:text-slate-400">{t("Memeriksa akses...", "Checking access...")}</p>;
  }

  return (
  <div className="max-w-xl mx-auto p-6">
    <button
      onClick={() => router.push("/admin/modules")}
      className="text-sm text-[var(--color-accent)] hover:underline mb-6 dark:text-blue-400"
    >
      ← {t("Kembali ke daftar modul", "Back to module list")}
    </button>

    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-6 dark:text-slate-100">
      {t("Tambah Modul Baru", "Add New Module")}
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Course", "Course")}</label>
        <select
          name="courseId"
          value={formData.courseId}
          onChange={handleChange}
          disabled={loadingCourses}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          required
        >
          <option value="" disabled>
            {loadingCourses ? t("Memuat daftar course...", "Loading course list...") : t("Pilih course", "Select course")}
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.judul}
            </option>
          ))}
        </select>
        {!loadingCourses && courses.length === 0 && (
          <p className="text-xs text-amber-600 mt-1 dark:text-amber-400">
            {t("Belum ada course. Buat course terlebih dahulu sebelum menambah modul.", "No courses yet. Create a course first before adding a module.")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Judul Modul", "Module Title")}</label>
        <input
          type="text"
          name="judul"
          value={formData.judul}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          placeholder={t("Modul Bageur - Percaya Diri & Kolaborasi", "Modul Bageur - Confidence & Collaboration")}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Deskripsi", "Description")}</label>
        <textarea
          name="deskripsi"
          value={formData.deskripsi}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          rows={4}
          placeholder={t("Jelaskan isi modul ini secara singkat...", "Briefly describe this module's content...")}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Aspek Pancawaluya", "Pancawaluya Aspect")}</label>
        <select
          name="aspekPancawaluya"
          value={formData.aspekPancawaluya}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
        >
          {aspekOptions.map((aspek) => (
            <option key={aspek} value={aspek} className="capitalize">
              {aspek}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Urutan", "Order")}</label>
        <input
          type="number"
          name="urutan"
          value={formData.urutan}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          min={1}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Tanggal Mulai (Opsional)", "Start Date (Optional)")}</label>
          <input
            type="date"
            name="tanggalMulai"
            value={formData.tanggalMulai}
            onChange={handleChange}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Tanggal Selesai (Opsional)", "End Date (Optional)")}</label>
          <input
            type="date"
            name="tanggalSelesai"
            value={formData.tanggalSelesai}
            onChange={handleChange}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("Kosongkan jadwal modul jika ingin mengikuti jadwal Course.", "Leave module schedule blank to follow Course schedule.")}
      </p>

      <button
        type="submit"
        disabled={loading || loadingCourses}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? t("Menyimpan...", "Saving...") : t("Simpan Modul", "Save Module")}
      </button>
    </form>
  </div>
);
}

export default function NewModulePage() {
  const { t } = useApp();

  return (
    <Suspense fallback={<p className="text-center mt-16 text-gray-500 dark:text-slate-400">{t("Memuat halaman...", "Loading page...")}</p>}>
      <NewModuleForm />
    </Suspense>
  );
}
