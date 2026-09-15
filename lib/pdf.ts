/**
 * Shared helpers for PDF learning materials (upload validation + download).
 * Backend: POST /api/upload/pdf (multipart field `file`, PDF only, max 10MB)
 * returns a direct Cloudinary URL at `response.data.data.url`.
 */

/** Maximum allowed PDF size (10MB) — mirrors the backend upload limit. */
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/** A file is treated as PDF when its MIME type or extension says so. */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** Returns an error message when the file is not a valid PDF, otherwise "". */
export function validatePdfFile(file: File): string {
  if (!isPdfFile(file)) return "File harus berformat PDF.";
  if (file.size > MAX_PDF_SIZE_BYTES) return "Ukuran file maksimal 10MB.";
  return "";
}

/** Derives a safe download filename from the content title (falls back to the URL). */
export function buildPdfFileName(title?: string, url?: string): string {
  const base = (title || "")
    .trim()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  if (base) return `${base}.pdf`;

  const fromUrl = (url || "").split("?")[0].split("/").pop() || "";
  if (/\.pdf$/i.test(fromUrl)) return fromUrl;

  return "materi.pdf";
}

/** Fetches the direct PDF URL as a blob and triggers a browser download. */
export async function downloadPdfFile(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal mengunduh file PDF.");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
