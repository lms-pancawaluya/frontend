// services/certificate.service.js
//
// Pengelolaan template sertifikat per Course (khusus Admin).
// Aturan BE:
//   - POST /api/certificates/:courseId/template  (multipart/form-data, field `file`)
//   - GET  /api/certificates/:courseId/template
// Template adalah PDF dengan area nama penerima dibiarkan kosong; overlay nama
// dilakukan oleh BE saat certificate digenerate. FE tidak membuat/mengedit PDF.

import { API_URL, fetchApi } from "@/lib/api";

function getAuthToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}

/**
 * Normalisasi respons template menjadi bentuk yang konsisten untuk UI.
 * Bentuk respons BE belum didokumentasikan, jadi kita terima beberapa varian
 * yang umum: { sukses, data: {...} } atau langsung objek template.
 */
function normalizeTemplate(result) {
  const data = result?.data ?? result ?? null;
  if (!data || typeof data !== "object") {
    return { hasTemplate: false, url: null, fileName: null, uploadedAt: null };
  }

  const url =
    data.url || data.templateUrl || data.fileUrl || data.file || data.path || null;
  const fileName =
    data.fileName || data.namaFile || data.originalName || data.name || null;
  const uploadedAt = data.uploadedAt || data.createdAt || data.updatedAt || null;

  const hasTemplate =
    typeof data.hasTemplate === "boolean" ? data.hasTemplate : Boolean(url);

  return {
    hasTemplate,
    url: url ? String(url) : null,
    fileName: fileName ? String(fileName) : null,
    uploadedAt: uploadedAt ? String(uploadedAt) : null,
  };
}

/**
 * Ambil status/detail template sertifikat milik sebuah course.
 * Mengembalikan objek { hasTemplate, url, fileName, uploadedAt }.
 * Melempar Error dengan pesan dari BE bila request gagal (selain 404 → belum ada).
 */
export async function getCertificateTemplate(courseId) {
  if (!courseId) {
    throw new Error("Course ID wajib diisi.");
  }

  const token = getAuthToken();
  const response = await fetchApi(`${API_URL}/api/certificates/${courseId}/template`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // 404 dianggap "belum ada template", bukan error yang menghentikan UI.
  if (response.status === 404) {
    return { hasTemplate: false, url: null, fileName: null, uploadedAt: null };
  }

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal mengambil template (status ${response.status}).`
    );
  }

  return normalizeTemplate(result);
}

/**
 * Upload / re-upload template sertifikat PDF untuk sebuah course.
 * POST multipart/form-data dengan field `file`.
 * Mengembalikan hasil normalisasi template terbaru dari BE.
 */
export async function uploadCertificateTemplate(courseId, file) {
  if (!courseId) {
    throw new Error("Course ID wajib diisi.");
  }
  if (!file) {
    throw new Error("File template wajib dipilih.");
  }

  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchApi(`${API_URL}/api/certificates/${courseId}/template`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal mengunggah template (status ${response.status}).`
    );
  }

  return normalizeTemplate(result);
}
