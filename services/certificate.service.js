// services/certificate.service.js
//
// Pengelolaan template sertifikat per Course (khusus Admin).
// Aturan BE:
//   - POST /api/certificates/:courseId/template  (multipart/form-data, field `file`)
//   - GET  /api/certificates/:courseId/template
// Template adalah PDF dengan area nama penerima dibiarkan kosong; overlay nama
// dilakukan oleh BE saat certificate digenerate. FE tidak membuat/mengedit PDF.
//
// Sisi Guru:
//   - GET  /api/certificates            (baca daftar sertifikat milik user)
//   - POST /api/certificates/:courseId/claim  (claim idempotent)
//   - GET  /api/certificates/:id        (detail satu sertifikat)
// FE tidak pernah meng-generate PDF; generation dilakukan oleh BE. `fileUrl`
// yang dikembalikan BE dipakai untuk view/download.

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

/* ------------------------------------------------------------------ */
/* Sisi Guru — pengambilan sertifikat milik user                      */
/* ------------------------------------------------------------------ */

/**
 * Membaca objek certificate user menjadi bentuk yang konsisten untuk UI.
 * Bentuk respons BE belum terdokumentasi, jadi kita terima beberapa varian
 * terkait: id, courseId, status (`issued`/`generated`), dan fileUrl.
 */
function normalizeUserCertificate(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id || raw.certificateId || raw.certificate_id || null;
  const courseId = raw.courseId || raw.course_id || raw.id_course || null;
  const status = raw.status || raw.certificateStatus || raw.state || null;
  const fileUrl =
    raw.fileUrl || raw.fileURL || raw.url || raw.certificateUrl || raw.pdfUrl || null;

  return {
    id: id ? String(id) : null,
    courseId: courseId ? String(courseId) : null,
    status: status ? String(status).toLowerCase() : null,
    fileUrl: fileUrl ? String(fileUrl) : null,
  };
}

/** Menormalkan respons daftar sertifikat user menjadi array objek. */
function normalizeUserCertificateList(result) {
  const data = result?.data ?? result;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.certificates)
      ? data.certificates
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return list
    .map(normalizeUserCertificate)
    .filter((item) => item && (item.id || item.courseId));
}

/**
 * Baca seluruh sertifikat milik user yang sedang login.
 * Mengembalikan array { id, courseId, status, fileUrl }.
 */
export async function getUserCertificates() {
  const token = getAuthToken();
  const response = await fetchApi(`${API_URL}/api/certificates`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal mengambil sertifikat (status ${response.status}).`
    );
  }

  return normalizeUserCertificateList(result);
}

/**
 * Ambil detail satu sertifikat berdasarkan id.
 * Mengembalikan { id, courseId, status, fileUrl }.
 */
export async function getCertificateById(certificateId) {
  if (!certificateId) {
    throw new Error("Certificate ID wajib diisi.");
  }

  const token = getAuthToken();
  const response = await fetchApi(`${API_URL}/api/certificates/${certificateId}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal mengambil detail sertifikat (status ${response.status}).`
    );
  }

  return normalizeUserCertificate(result?.data ?? result);
}

/**
 * Claim sertifikat untuk sebuah course (idempotent: aman dipanggil berulang,
 * BE mengembalikan claim/sertifikat yang sudah ada bila sudah pernah di-claim).
 * Mengembalikan { id, courseId, status, fileUrl } terbaru dari BE.
 */
export async function claimCertificate(courseId) {
  if (!courseId) {
    throw new Error("Course ID wajib diisi.");
  }

  const token = getAuthToken();
  const response = await fetchApi(`${API_URL}/api/certificates/${courseId}/claim`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal claim sertifikat (status ${response.status}).`
    );
  }

  return normalizeUserCertificate(result?.data ?? result);
}
