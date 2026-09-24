"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getModuleById, getModuleContents } from "@/services/module.service";
import { completeContent, getModuleProgress } from "@/services/progress.service";
import { buildPdfFileName, downloadPdfFile, loadPdfPreviewObjectUrl } from "@/lib/pdf";
import { isMaterialEntryCompleted, readMaterialStatus, type MaterialProgressEntry } from "@/lib/contentProgress";
import ModuleStageGuard from "@/app/components/common/ModuleStageGuard";
import MaterialStatusBadge from "@/app/components/common/MaterialStatusBadge";
import {
  getMaterialRoute,
  isTextMaterial,
  isVideoMaterial,
  sortMaterialsByUrutan,
  type ModuleMaterial,
} from "@/lib/materials";
import { useApp } from "@/app/context/AppContext";

interface ModuleContent {
  id?: string;
  judul?: string;
  tipe?: string;
  konten?: string;
  urutan?: number;
}

export default function ModuleTextPage() {
  const { t } = useApp();
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-500 dark:text-slate-400">{t("Memuat materi...", "Loading material...")}</div>}>
      <ModuleStageGuardWrapper />
    </Suspense>
  );
}

function ModuleStageGuardWrapper() {
  const params = useParams();
  const moduleId = params.id as string;

  return (
    <ModuleStageGuard moduleId={moduleId} stage="material">
      <ModuleTextPageContent />
    </ModuleStageGuard>
  );
}

function ModuleTextPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useApp();
  const moduleId = params.id as string;

  const [material, setMaterial] = useState<ModuleContent | null>(null);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moduleDescription, setModuleDescription] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewRequestRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  // Progress/status per material dari BE (single source of truth).
  const [materialStatus, setMaterialStatus] = useState<Record<string, MaterialProgressEntry>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);

  const refreshMaterialStatus = useCallback(async () => {
    const data = await getModuleProgress(moduleId);
    if (data) {
      setMaterialStatus(readMaterialStatus(data));
    }
  }, [moduleId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    async function loadMaterial() {
      try {
        const [contents, moduleData] = await Promise.all([
          getModuleContents(moduleId),
          getModuleById(moduleId).catch(() => null),
        ]);
        const foundCourseId = moduleData?.courseId || moduleData?.course_id || null;
        if (foundCourseId) {
          setCourseId(foundCourseId);
        }

        const ordered = sortMaterialsByUrutan(contents as ModuleMaterial[]);
        setMaterials(ordered);
        void refreshMaterialStatus();

        if (!ordered || ordered.length === 0) {
          router.replace(foundCourseId ? `/modules/courses/${foundCourseId}` : "/modules");
          return;
        }

        const requestedIndex = Number(searchParams.get("i"));
        const index = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < ordered.length ? requestedIndex : 0;
        setCurrentIndex(index);

        const active = ordered[index];
        if (active && isVideoMaterial(active.tipe)) {
          // Video memiliki halaman/ renderer khusus — arahkan ke sana.
          router.replace(getMaterialRoute(moduleId, ordered, index));
          return;
        }
        setMaterial(active || null);
        if (moduleData && moduleData.deskripsi) {
          setModuleDescription(moduleData.deskripsi);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterial();
  }, [moduleId, searchParams, router, refreshMaterialStatus]);

  function closePreview() {
    previewRequestRef.current += 1;
    setPreviewOpen(false);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewLoading(false);
  }

  async function handleDownload() {
    if (!material?.konten) return;
    setDownloadError("");
    setDownloading(true);
    try {
      await downloadPdfFile(material.konten, buildPdfFileName(material.judul, material.konten));
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : t("Gagal mengunduh file PDF.", "Failed to download the PDF file."));
    } finally {
      setDownloading(false);
    }
  }

  // Tandai material selesai (PDF/Text/Link) setelah Guru menyelesaikannya.
  // BE yang menegakkan syarat Mini Quiz / Interactive Question.
  async function handleComplete() {
    if (!material?.id) return;
    setCompleteError("");
    setIsCompleting(true);
    try {
      await completeContent(material.id);
      await refreshMaterialStatus();
      router.push(getMaterialRoute(moduleId, materials, currentIndex + 1));
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : t("Gagal menandai materi selesai.", "Failed to mark the material as complete."));
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleTogglePreview() {
    if (previewOpen) {
      closePreview();
      return;
    }
    if (!material?.konten) return;

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewError("");
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const objectUrl = await loadPdfPreviewObjectUrl(material.konten);
      if (previewRequestRef.current !== requestId) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } catch (err) {
      if (previewRequestRef.current === requestId) {
        setPreviewError(err instanceof Error ? err.message : t("Gagal memuat pratinjau PDF.", "Failed to load the PDF preview."));
      }
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-xs text-slate-500 dark:text-slate-400">{t("Memuat materi...", "Loading material...")}</div>;

  const tipe = material?.tipe;
  const isText = isTextMaterial(tipe);
  const isPdf = tipe === "pdf";
  const isLink = tipe === "link";
  const currentStatus = material?.id ? materialStatus[material.id] : undefined;
  const isMaterialCompleted = isMaterialEntryCompleted(currentStatus);

  const courseDetailUrl = courseId ? `/modules/courses/${courseId}` : "/modules";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => router.push(courseDetailUrl)}
        className="text-xs font-semibold text-slate-500 hover:underline dark:text-slate-400"
      >
        ← {t("Kembali ke Detail Course", "Back to Course Detail")}
      </button>

      {moduleDescription && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line dark:text-slate-300">
            {moduleDescription}
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {material?.judul || (isPdf ? t("Materi PDF", "PDF Material") : isLink ? t("Tautan Materi", "Material Link") : t("Materi Bacaan", "Reading Material"))}
          </h1>
          <MaterialStatusBadge entry={currentStatus} />
        </div>

        {!material ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("Belum ada materi yang dapat ditampilkan untuk modul ini.", "No material can be displayed for this module yet.")}</p>
        ) : isText ? (
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line space-y-4 dark:text-slate-300">
            {material.konten || t("Konten bacaan tidak ditemukan.", "Reading content not found.")}
          </div>
        ) : isPdf ? (
          <div className="space-y-3">
            {!material.konten && (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                {t("File PDF belum tersedia untuk materi ini.", "The PDF file is not available for this material yet.")}
              </p>
            )}
            {material.konten && previewOpen && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {previewLoading ? (
                  <div className="flex h-[480px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">{t("Memuat pratinjau PDF...", "Loading PDF preview...")}</div>
                ) : previewError ? (
                  <div className="flex h-[480px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">{previewError}</p>
                    <a
                      href={material.konten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {t("Buka PDF di tab baru", "Open PDF in new tab")}
                    </a>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[480px]"
                    title={material.judul || t("Pratinjau PDF", "PDF Preview")}
                  />
                ) : null}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!material.konten || downloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {downloading ? t("Mengunduh...", "Downloading...") : t("Download PDF", "Download PDF")}
              </button>
              {material.konten && (
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  disabled={previewLoading && previewOpen}
                  aria-expanded={previewOpen}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {previewOpen ? t("Tutup Preview", "Close Preview") : previewLoading ? t("Memuat...", "Loading...") : t("Preview PDF", "Preview PDF")}
                </button>
              )}
            </div>
            {downloadError && <p className="text-xs text-red-600 dark:text-red-400">{downloadError}</p>}
          </div>
        ) : isLink ? (
          <div className="space-y-3">
            {material.konten ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("Tautan Eksternal", "External Link")}</p>
                <p className="mt-1 text-sm text-slate-700 break-all dark:text-slate-300">{material.konten}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                {t("URL link belum tersedia untuk materi ini.", "The link URL is not available for this material yet.")}
              </p>
            )}
            {material.konten && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={material.konten}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  {t("Buka Link", "Open Link")}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("Belum ada materi yang dapat ditampilkan untuk modul ini.", "No material can be displayed for this module yet.")}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex flex-col gap-1">
          {material && !isMaterialCompleted && (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-md transition disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              {isCompleting ? t("Menyimpan...", "Saving...") : t("Tandai Materi Selesai", "Mark Material as Complete")}
            </button>
          )}
          {isMaterialCompleted && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {t("Materi ini sudah selesai", "This material is already completed")}
            </span>
          )}
          {completeError && <p className="text-xs text-red-600 dark:text-red-400">{completeError}</p>}
        </div>

        <button
          onClick={() => router.push(getMaterialRoute(moduleId, materials, currentIndex + 1))}
          className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {currentIndex + 1 < materials.length ? t("Materi Berikutnya", "Next Material") : t("Kembali ke Detail Course", "Back to Course Detail")}
        </button>
      </div>
    </div>
  );
}
