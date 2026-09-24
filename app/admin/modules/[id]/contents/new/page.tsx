"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createContent, uploadPdf } from "@/services/content.service";
import { validatePdfFile } from "@/lib/pdf";
import { validateExternalUrl } from "@/lib/link";
import { useApp } from "@/app/context/AppContext";

export default function NewContentPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useApp();
  const moduleId = params.id as string;

  const [formData, setFormData] = useState({
    judul: "",
    tipe: "teks",
    konten: "",
    urutan: 1,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfError, setPdfError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
      ...(name === "tipe" && (value === "pdf" || value === "link") ? { konten: "" } : {}),
    }));

    if (name === "tipe") {
      setPdfError("");
      setPdfFileName("");
      setError("");
    }
  }

  async function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validatePdfFile(file);
    if (validationError) {
      setPdfError(validationError);
      setPdfFileName("");
      return;
    }

    setPdfError("");
    setError("");
    setUploadingPdf(true);
    try {
      const url = await uploadPdf(file);
      setFormData((prev) => ({ ...prev, konten: url }));
      setPdfFileName(file.name);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : t("Gagal mengunggah file PDF.", "Failed to upload the PDF file."));
      setPdfFileName("");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.tipe === "pdf" && !formData.konten) {
      setError(t("Silakan unggah file PDF terlebih dahulu.", "Please upload the PDF file first."));
      return;
    }

    if (formData.tipe === "link") {
      const urlError = validateExternalUrl(formData.konten);
      if (urlError) {
        setError(urlError);
        return;
      }
    }

    setLoading(true);

    try {
      await createContent(moduleId, formData);
      router.push(`/admin/modules/${moduleId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("Gagal menambahkan konten.", "Failed to add content."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="max-w-xl mx-auto p-6">
    <button
      onClick={() => router.push(`/admin/modules/${moduleId}`)}
      className="text-sm text-[var(--color-accent)] hover:underline mb-6 dark:text-blue-400"
    >
      ← {t("Kembali ke edit modul", "Back to edit module")}
    </button>

    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-6 dark:text-slate-100">
      {t("Tambah Konten Baru", "Add New Content")}
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="judul" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Judul Konten", "Content Title")}</label>
        <input
          id="judul"
          type="text"
          name="judul"
          value={formData.judul}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          placeholder={t("Pengantar Konsep Bageur", "Introduction to the Bageur Concept")}
          required
        />
      </div>

      <div>
        <label htmlFor="tipe" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Tipe Konten", "Content Type")}</label>
        <select
          id="tipe"
          name="tipe"
          value={formData.tipe}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="teks">{t("Teks", "Text")}</option>
          <option value="video">{t("Video (YouTube)", "Video (YouTube)")}</option>
          <option value="pdf">{t("PDF", "PDF")}</option>
          <option value="link">{t("Link", "Link")}</option>
        </select>
      </div>

      {formData.tipe === "link" ? (
        <div>
          <label htmlFor="konten" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">
            {t("URL Link", "Link URL")}
          </label>
          <input
            id="konten"
            type="url"
            name="konten"
            value={formData.konten}
            onChange={handleChange}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
            placeholder="https://contoh.com/materi"
            aria-describedby="konten-link-help"
            required
          />
          <p id="konten-link-help" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {t("Masukkan URL eksternal lengkap (http:// atau https://).", "Enter the full external URL (http:// or https://).")}
          </p>
        </div>
      ) : formData.tipe === "pdf" ? (
        <div>
          <label htmlFor="file-pdf" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("File PDF", "PDF File")}</label>
          <input
            id="file-pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfSelect}
            disabled={uploadingPdf}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-navy)] file:px-4 file:py-1.5 file:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            aria-describedby="file-pdf-help"
          />
          <p id="file-pdf-help" className="mt-1 text-xs text-gray-500 dark:text-slate-400">{t("Format PDF, maksimal 10MB.", "PDF format, maximum 10MB.")}</p>
          {uploadingPdf && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{t("Mengunggah file PDF...", "Uploading PDF file...")}</p>}
          {pdfError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{pdfError}</p>}
          {!uploadingPdf && !pdfError && formData.konten && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              {pdfFileName ? `${pdfFileName} — ` : ""}{t("File PDF berhasil diunggah.", "PDF file uploaded successfully.")}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="konten" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">
            {formData.tipe === "video" ? t("Link Video YouTube", "YouTube Video Link") : t("Isi Konten", "Content Body")}
          </label>
          <textarea
            id="konten"
            name="konten"
            value={formData.konten}
            onChange={handleChange}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
            rows={formData.tipe === "video" ? 2 : 6}
            placeholder={
              formData.tipe === "video"
                ? "https://youtu.be/..."
                : t("Tulis isi materi pembelajaran di sini...", "Write the learning material content here...")
            }
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="urutan" className="block text-sm font-medium text-[var(--color-navy)] mb-1 dark:text-slate-200">{t("Urutan", "Order")}</label>
        <input
          id="urutan"
          type="number"
          name="urutan"
          value={formData.urutan}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 dark:bg-slate-800 dark:text-slate-200"
          min={1}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploadingPdf}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? t("Menyimpan...", "Saving...") : t("Simpan Konten", "Save Content")}
      </button>
    </form>
  </div>
);
}
