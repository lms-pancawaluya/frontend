"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCourses } from "@/services/course.service";
import {
  getCertificateTemplate,
  uploadCertificateTemplate,
} from "@/services/certificate.service";
import { downloadPdfFile, validatePdfFile } from "@/lib/pdf";
import { useApp } from "@/app/context/AppContext";

interface Course {
  id: string;
  judul?: string;
  deskripsi?: string;
  mode?: string;
  hasCertificate?: boolean;
}

interface TemplateState {
  loading: boolean;
  hasTemplate: boolean;
  url: string | null;
  fileName: string | null;
  error: string;
}

const emptyTemplateState: TemplateState = {
  loading: true,
  hasTemplate: false,
  url: null,
  fileName: null,
  error: "",
};

export default function AdminCertificatesPage() {
  const router = useRouter();
  const { t } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<Record<string, TemplateState>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<Record<string, string>>({});

  const loadTemplate = useCallback(async (courseId: string) => {
    setTemplates((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] || emptyTemplateState), loading: true, error: "" },
    }));
    try {
      const template = await getCertificateTemplate(courseId);
      setTemplates((prev) => ({
        ...prev,
        [courseId]: {
          loading: false,
          hasTemplate: template.hasTemplate,
          url: template.url,
          fileName: template.fileName,
          error: "",
        },
      }));
    } catch (err) {
      setTemplates((prev) => ({
        ...prev,
        [courseId]: {
          loading: false,
          hasTemplate: false,
          url: null,
          fileName: null,
          error: err instanceof Error ? err.message : t("Gagal memuat template.", "Failed to load template."),
        },
      }));
    }
  }, [t]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      if (JSON.parse(userData)?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    async function loadCourses() {
      try {
        const data = await getCourses();
        const list = Array.isArray(data) ? (data as Course[]) : [];
        setCourses(list);
        list.forEach((course) => loadTemplate(course.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Gagal memuat daftar course.", "Failed to load course list."));
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [router, loadTemplate, t]);

  async function handleUpload(courseId: string, file: File) {
    const validationError = validatePdfFile(file);
    if (validationError) {
      setTemplates((prev) => ({
        ...prev,
        [courseId]: { ...(prev[courseId] || emptyTemplateState), error: validationError },
      }));
      return;
    }

    setUploadingId(courseId);
    setTemplates((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] || emptyTemplateState), error: "" },
    }));
    try {
      const template = await uploadCertificateTemplate(courseId, file);
      setTemplates((prev) => ({
        ...prev,
        [courseId]: {
          loading: false,
          hasTemplate: template.hasTemplate || Boolean(template.url),
          url: template.url,
          fileName: template.fileName || file.name,
          error: "",
        },
      }));
    } catch (err) {
      setTemplates((prev) => ({
        ...prev,
        [courseId]: {
          ...(prev[courseId] || emptyTemplateState),
          loading: false,
          error: err instanceof Error ? err.message : t("Gagal mengunggah template.", "Failed to upload template."),
        },
      }));
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDownload(courseId: string, url: string, title?: string) {
    setDownloadError((prev) => ({ ...prev, [courseId]: "" }));
    try {
      const safeName = (title || "template").trim().replace(/[^\w\s.-]/g, "").replace(/\s+/g, "-").toLowerCase();
      await downloadPdfFile(url, `${safeName || "template"}-sertifikat.pdf`);
    } catch (err) {
      setDownloadError((prev) => ({
        ...prev,
        [courseId]: err instanceof Error ? err.message : t("Gagal mengunduh template.", "Failed to download template."),
      }));
    }
  }

  if (loading) {
    return <p className="mt-16 text-center text-gray-500 dark:text-slate-400">{t("Memuat daftar course...", "Loading course list...")}</p>;
  }

  if (error) {
    return (
      <div className="mx-auto mt-16 max-w-md p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] dark:text-slate-100">
          {t("Manajemen Sertifikat", "Certificate Management")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {t("Kelola template sertifikat per course. Unggah file PDF dengan area nama penerima dibiarkan kosong — nama akan ditempel otomatis oleh sistem saat sertifikat dibuat.", "Manage the certificate template per course. Upload a PDF file with the recipient's name area left blank — the name will be inserted automatically by the system when the certificate is created.")}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-8 text-center text-sm text-gray-500 dark:bg-slate-900 dark:text-slate-400">
          {t("Belum ada course tersedia.", "No courses available yet.")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => {
            const template = templates[course.id] || emptyTemplateState;
            const isUploading = uploadingId === course.id;
            const inputId = `certificate-template-${course.id}`;
            return (
              <div
                key={course.id}
                className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 dark:bg-slate-900"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-[var(--color-navy)] dark:text-slate-100">
                      {course.judul || t("Tanpa judul", "Untitled")}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                      {course.deskripsi || t("Tidak ada deskripsi.", "No description.")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {course.hasCertificate ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {t("Course bersertifikat", "Course with certificate")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t("Course tanpa sertifikat", "Course without certificate")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  {template.loading ? (
                    <span>{t("Memuat status template...", "Loading template status...")}</span>
                  ) : template.error ? (
                    <span className="text-red-600 dark:text-red-400">{template.error}</span>
                  ) : template.hasTemplate ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {t("Template tersedia", "Template available")}
                      {template.fileName ? ` — ${template.fileName}` : ""}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">{t("Belum ada template", "No template yet")}</span>
                  )}
                </div>

                {downloadError[course.id] && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{downloadError[course.id]}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label
                    htmlFor={inputId}
                    className={`cursor-pointer rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm text-white transition hover:opacity-90 ${
                      isUploading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {isUploading
                      ? t("Mengunggah...", "Uploading...")
                      : template.hasTemplate
                        ? t("Ganti Template", "Change Template")
                        : t("Unggah Template", "Upload Template")}
                  </label>
                  <input
                    id={inputId}
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={isUploading || template.loading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) handleUpload(course.id, file);
                    }}
                    className="sr-only"
                  />
                  <span className="text-xs text-gray-400 dark:text-slate-500">{t("Format PDF, maksimal 10MB.", "PDF format, maximum 10MB.")}</span>

                  {template.hasTemplate && template.url && (
                    <button
                      type="button"
                      onClick={() => handleDownload(course.id, template.url as string, course.judul)}
                      className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-sm text-[var(--color-navy)] transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t("Unduh Template", "Download Template")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
