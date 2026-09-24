"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourseById, updateCourse } from "@/services/course.service";
import { canManageCourse } from "@/lib/rbac";
import { useApp } from "@/app/context/AppContext";

type CourseForm = {
  judul: string;
  deskripsi: string;
  mode: string;
  hasCertificate: boolean;
  lokasi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
};

const emptyForm: CourseForm = {
  judul: "",
  deskripsi: "",
  mode: "online",
  hasCertificate: false,
  lokasi: "",
  tanggalMulai: "",
  tanggalSelesai: "",
};

function dateInputValue(value?: string) {
  return value ? value.slice(0, 10) : "";
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useApp();
  const id = params.id as string;
  const [formData, setFormData] = useState<CourseForm>(emptyForm);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      // Guard ownership: Pengajar hanya boleh mengedit Course miliknya.
      let currentUser: { role?: string; id?: string } = {};
      try {
        const raw = localStorage.getItem("user");
        currentUser = raw ? JSON.parse(raw) : {};
      } catch {
        currentUser = {};
      }

      try {
        const course = await getCourseById(id);

        if (!canManageCourse(currentUser.role, currentUser.id, course)) {
          setAccessDenied(true);
          return;
        }

        setFormData({
          judul: course?.judul || "",
          deskripsi: course?.deskripsi || "",
          mode: course?.mode || "online",
          hasCertificate: Boolean(course?.hasCertificate),
          lokasi: course?.lokasi || "",
          tanggalMulai: dateInputValue(course?.tanggalMulai),
          tanggalSelesai: dateInputValue(course?.tanggalSelesai),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Gagal memuat data course.", "Failed to load course data."));
      } finally {
        setLoadingData(false);
      }
    }

    if (id) loadCourse();
  }, [id, t]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateCourse(id, formData);
      router.push(`/admin/courses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal memperbarui course.", "Failed to update course."));
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return <p className="mt-16 text-center text-gray-500 dark:text-slate-400">{t("Memuat data course...", "Loading course data...")}</p>;
  }

  if (accessDenied) {
    return (
      <div className="mx-auto mt-16 max-w-md p-6 text-center">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {t("Course ini bukan milik Anda, sehingga tidak dapat diedit. Hubungi Admin jika perlu.", "This course does not belong to you, so it cannot be edited. Contact an Admin if needed.")}
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

  return (
    <div className="mx-auto max-w-xl p-6">
      <button
        type="button"
        onClick={() => router.push(`/admin/courses/${id}`)}
        className="mb-6 text-sm text-[var(--color-accent)] hover:underline dark:text-blue-400"
      >
        ← {t("Kembali ke detail course", "Back to course detail")}
      </button>

      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] dark:text-slate-100">
        {t("Edit Course", "Edit Course")}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

        <div>
          <label htmlFor="judul" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Judul", "Title")}</label>
          <input id="judul" name="judul" value={formData.judul} onChange={handleChange} required className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200" />
        </div>

        <div>
          <label htmlFor="deskripsi" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Deskripsi", "Description")}</label>
          <textarea id="deskripsi" name="deskripsi" value={formData.deskripsi} onChange={handleChange} required rows={4} className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200" />
        </div>

        <div>
          <label htmlFor="mode" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Mode", "Mode")}</label>
          <select id="mode" name="mode" value={formData.mode} onChange={handleChange} required className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 capitalize focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200">
            <option value="online">{t("Online", "Online")}</option>
            <option value="offline">{t("Offline", "Offline")}</option>
          </select>
        </div>

        {formData.mode === "offline" && (
          <div>
            <label htmlFor="lokasi" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Lokasi", "Location")}</label>
            <input id="lokasi" name="lokasi" value={formData.lokasi} onChange={handleChange} required className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200" />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-[var(--color-navy)] dark:text-slate-200">
          <input type="checkbox" name="hasCertificate" checked={formData.hasCertificate} onChange={handleChange} className="h-4 w-4 rounded border-slate-300" />
          {t("Menyediakan sertifikat", "Provides certificate")}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tanggalMulai" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Tanggal Mulai", "Start Date")}</label>
            <input id="tanggalMulai" type="date" name="tanggalMulai" value={formData.tanggalMulai} onChange={handleChange} required className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          <div>
            <label htmlFor="tanggalSelesai" className="mb-1 block text-sm font-medium text-[var(--color-navy)] dark:text-slate-200">{t("Tanggal Selesai", "End Date")}</label>
            <input id="tanggalSelesai" type="date" name="tanggalSelesai" value={formData.tanggalSelesai} onChange={handleChange} required className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="mt-2 rounded-full bg-[var(--color-navy)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:bg-gray-400">
          {saving ? t("Menyimpan...", "Saving...") : t("Simpan Perubahan", "Save Changes")}
        </button>
      </form>
    </div>
  );
}
