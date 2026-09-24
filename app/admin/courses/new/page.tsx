"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/services/course.service";
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

const initialForm: CourseForm = {
  judul: "",
  deskripsi: "",
  mode: "online",
  hasCertificate: false,
  lokasi: "",
  tanggalMulai: "",
  tanggalSelesai: "",
};

export default function NewCoursePage() {
  const router = useRouter();
  const { t } = useApp();
  const [formData, setFormData] = useState<CourseForm>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      await createCourse(formData);
      router.push("/admin/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Gagal menambahkan course.", "Failed to add course."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <button
        type="button"
        onClick={() => router.push("/admin/courses")}
        className="mb-6 text-sm text-[var(--color-accent)] hover:underline dark:text-blue-400"
      >
        ← {t("Kembali ke daftar course", "Back to course list")}
      </button>

      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] dark:text-slate-100">
        {t("Tambah Course Baru", "Add New Course")}
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

        <button type="submit" disabled={loading} className="mt-2 rounded-full bg-[var(--color-navy)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:bg-gray-400">
          {loading ? t("Menyimpan...", "Saving...") : t("Simpan Course", "Save Course")}
        </button>
      </form>
    </div>
  );
}
