"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getModuleById, getModuleContents } from "@/services/module.service";
import { buildPdfFileName, downloadPdfFile, loadPdfPreviewObjectUrl } from "@/lib/pdf";
import {
  getMaterialRoute,
  isTextMaterial,
  isVideoMaterial,
  sortMaterialsByUrutan,
  type ModuleMaterial,
} from "@/lib/materials";

interface ModuleContent {
  id?: string;
  judul?: string;
  tipe?: string;
  konten?: string;
  urutan?: number;
}

export default function ModuleTextPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-slate-500">Memuat materi...</div>}>
      <ModuleTextPageContent />
    </Suspense>
  );
}

function ModuleTextPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
        const ordered = sortMaterialsByUrutan(contents as ModuleContent[]);
        setMaterials(ordered);

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
  }, [moduleId, searchParams, router]);

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
      setDownloadError(err instanceof Error ? err.message : "Gagal mengunduh file PDF.");
    } finally {
      setDownloading(false);
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
        setPreviewError(err instanceof Error ? err.message : "Gagal memuat pratinjau PDF.");
      }
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-xs text-slate-500">Memuat materi...</div>;

  const tipe = material?.tipe;
  const isText = isTextMaterial(tipe);
  const isPdf = tipe === "pdf";
  const isLink = tipe === "link";
  const hasPrevious = currentIndex > 0;
  const isLastMaterial = currentIndex + 1 >= materials.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() =>
          hasPrevious
            ? router.push(getMaterialRoute(moduleId, materials, currentIndex - 1))
            : router.push(`/modules/${moduleId}`)
        }
        className="text-xs font-semibold text-slate-500 hover:underline"
      >
        ← Materi Sebelumnya
      </button>

      {moduleDescription && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
            {moduleDescription}
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {material?.judul || (isPdf ? "Materi PDF" : isLink ? "Tautan Materi" : "Materi Bacaan")}
        </h1>

        {!material ? (
          <p className="text-sm text-slate-500">Belum ada materi yang dapat ditampilkan untuk modul ini.</p>
        ) : isText ? (
          <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line space-y-4">
            {material.konten || "Konten bacaan tidak ditemukan."}
          </div>
        ) : isPdf ? (
          <div className="space-y-3">
            {!material.konten && (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5">
                File PDF belum tersedia untuk materi ini.
              </p>
            )}
            {material.konten && previewOpen && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                {previewLoading ? (
                  <div className="flex h-[480px] items-center justify-center text-sm text-slate-500">Memuat pratinjau PDF...</div>
                ) : previewError ? (
                  <div className="flex h-[480px] flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-red-600">{previewError}</p>
                    <a
                      href={material.konten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition"
                    >
                      Buka PDF di tab baru
                    </a>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[480px]"
                    title={material.judul || "Pratinjau PDF"}
                  />
                ) : null}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!material.konten || downloading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? "Mengunduh..." : "Download PDF"}
              </button>
              {material.konten && (
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  disabled={previewLoading && previewOpen}
                  aria-expanded={previewOpen}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {previewOpen ? "Tutup Preview" : previewLoading ? "Memuat..." : "Preview PDF"}
                </button>
              )}
            </div>
            {downloadError && <p className="text-xs text-red-600">{downloadError}</p>}
          </div>
        ) : isLink ? (
          <div className="space-y-3">
            {material.konten ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tautan Eksternal</p>
                <p className="mt-1 text-sm text-slate-700 break-all">{material.konten}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5">
                URL link belum tersedia untuk materi ini.
              </p>
            )}
            {material.konten && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={material.konten}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition"
                >
                  Buka Link
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada materi yang dapat ditampilkan untuk modul ini.</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => router.push(getMaterialRoute(moduleId, materials, currentIndex + 1))}
          className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition"
        >
          {isLastMaterial ? "Lanjut ke Evaluasi & Feedback →" : "Materi Berikutnya →"}
        </button>
      </div>
    </div>
  );
}
