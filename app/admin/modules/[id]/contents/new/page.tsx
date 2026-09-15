"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createContent, uploadPdf } from "@/services/content.service";
import { validatePdfFile } from "@/lib/pdf";

export default function NewContentPage() {
  const params = useParams();
  const router = useRouter();
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
      ...(name === "tipe" && value === "pdf" ? { konten: "" } : {}),
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
      setPdfError(err instanceof Error ? err.message : "Gagal mengunggah file PDF.");
      setPdfFileName("");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.tipe === "pdf" && !formData.konten) {
      setError("Silakan unggah file PDF terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      await createContent(moduleId, formData);
      router.push(`/admin/modules/${moduleId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menambahkan konten.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="max-w-xl mx-auto p-6">
    <button
      onClick={() => router.push(`/admin/modules/${moduleId}`)}
      className="text-sm text-[var(--color-accent)] hover:underline mb-6"
    >
      ← Kembali ke edit modul
    </button>

    <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-6">
      Tambah Konten Baru
    </h1>

    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="judul" className="block text-sm font-medium text-[var(--color-navy)] mb-1">Judul Konten</label>
        <input
          id="judul"
          type="text"
          name="judul"
          value={formData.judul}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          placeholder="Pengantar Konsep Bageur"
          required
        />
      </div>

      <div>
        <label htmlFor="tipe" className="block text-sm font-medium text-[var(--color-navy)] mb-1">Tipe Konten</label>
        <select
          id="tipe"
          name="tipe"
          value={formData.tipe}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
        >
          <option value="teks">Teks</option>
          <option value="video">Video (YouTube)</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {formData.tipe === "pdf" ? (
        <div>
          <label htmlFor="file-pdf" className="block text-sm font-medium text-[var(--color-navy)] mb-1">File PDF</label>
          <input
            id="file-pdf"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handlePdfSelect}
            disabled={uploadingPdf}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-navy)] file:px-4 file:py-1.5 file:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            aria-describedby="file-pdf-help"
          />
          <p id="file-pdf-help" className="mt-1 text-xs text-gray-500">Format PDF, maksimal 10MB.</p>
          {uploadingPdf && <p className="mt-1 text-xs text-gray-500">Mengunggah file PDF...</p>}
          {pdfError && <p className="mt-1 text-xs text-red-600">{pdfError}</p>}
          {!uploadingPdf && !pdfError && formData.konten && (
            <p className="mt-1 text-xs text-emerald-700">
              {pdfFileName ? `${pdfFileName} — ` : ""}File PDF berhasil diunggah.
            </p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="konten" className="block text-sm font-medium text-[var(--color-navy)] mb-1">
            {formData.tipe === "video" ? "Link Video YouTube" : "Isi Konten"}
          </label>
          <textarea
            id="konten"
            name="konten"
            value={formData.konten}
            onChange={handleChange}
            className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            rows={formData.tipe === "video" ? 2 : 6}
            placeholder={
              formData.tipe === "video"
                ? "https://youtu.be/..."
                : "Tulis isi materi pembelajaran di sini..."
            }
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="urutan" className="block text-sm font-medium text-[var(--color-navy)] mb-1">Urutan</label>
        <input
          id="urutan"
          type="number"
          name="urutan"
          value={formData.urutan}
          onChange={handleChange}
          className="w-full border border-[var(--color-border-soft)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          min={1}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploadingPdf}
        className="bg-[var(--color-navy)] text-white py-2.5 rounded-full font-medium hover:opacity-90 transition disabled:bg-gray-400 mt-2"
      >
        {loading ? "Menyimpan..." : "Simpan Konten"}
      </button>
    </form>
  </div>
);
}
