// services/comment.service.js
//
// Discussion/Comment service.
//
// Jalur utama: Course-level Discussion.
//   GET    /api/comments/course/:courseId     → nested (root memiliki replies[])
//   GET    /api/comments/users/search?q=:kwd  → daftar user untuk mention
//   POST   /api/comments                      → { courseId, komentar, parentId?, mentionedUserIds? }
//   DELETE /api/comments/:id
//
// Legacy (module-level) sementara: `getModuleComments` dan dukungan input
// `moduleId` pada `postComment` dipertahankan agar page yang belum dimigrasikan
// tetap berjalan. TIDAK ada fallback otomatis dari Course API ke Module API.

import { API_URL, fetchApi } from "@/lib/api";

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || "";
  }
  return "";
};

function getHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * @typedef {Object} CourseCommentInput
 * @property {string} courseId
 * @property {string} komentar
 * @property {string | null} [parentId]
 * @property {string[]} [mentionedUserIds]
 */

/**
 * @typedef {Object} LegacyModuleCommentInput
 * @property {string} moduleId
 * @property {string} [komentar]
 * @property {string} [isi]
 * @property {string | null} [parentId]
 */

// ----------------------------------------------------
// COURSE-LEVEL DISCUSSION (jalur utama)
// ----------------------------------------------------

// GET /api/comments/course/:courseId
// Response BE sudah nested: root comment memiliki `replies[]`.
// Service tidak membangun tree dari flat response.
export async function getCourseComments(courseId) {
  if (!courseId) return [];

  const response = await fetchApi(`${API_URL}/api/comments/course/${courseId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil komentar course");
  }
  return result.data ?? [];
}

// GET /api/comments/users/search?q=:keyword
// Return user sesuai contract: id, nama, fotoProfil, role, gelar.
// Tidak melakukan filtering lokal — BE adalah sumber hasil pencarian.
//
// Opsi B: query kosong (`q=`) juga dikirim ke BE, agar BE dapat mengembalikan
// daftar user default saat user baru mengetik `@`. Bila BE menolak (non-2xx),
// error dilempar seperti biasa dan ditangani pemanggil — FE tidak menebak.
export async function searchCommentUsers(keyword) {
  const query = String(keyword ?? "").trim();

  const response = await fetchApi(
    `${API_URL}/api/comments/users/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mencari user untuk mention");
  }
  return result.data ?? [];
}

// ----------------------------------------------------
// DELETE (Course & legacy)
// ----------------------------------------------------

// DELETE /api/comments/:id
// Permission ditegakkan BE (owner atau admin); FE tidak membuat workaround.
export async function deleteComment(id) {
  const response = await fetchApi(`${API_URL}/api/comments/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menghapus komentar");
  }
  return result.data;
}

// ----------------------------------------------------
// CREATE COMMENT / REPLY
// ----------------------------------------------------

/**
 * Buat komentar/balasan.
 *
 * Jalur utama (Course-level):
 *   postComment({ courseId, komentar, parentId?, mentionedUserIds? })
 *
 * Legacy (Module-level) — dipertahankan sementara agar page lama tetap jalan:
 *   postComment({ moduleId, komentar|isi, parentId? })
 *
 * Input `courseId` diprioritaskan; `moduleId` hanya dipakai bila `courseId`
 * tidak diberikan.
 *
 * @param {CourseCommentInput | LegacyModuleCommentInput} input
 */
export async function postComment(input) {
  const body = buildPostCommentBody(input);
  const response = await fetchApi(`${API_URL}/api/comments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengirim komentar");
  }
  return result.data;
}

/**
 * Susun body POST. Course-level TIDAK mengirim `moduleId`.
 * @param {CourseCommentInput | LegacyModuleCommentInput} input
 */
function buildPostCommentBody(input = {}) {
  const {
    courseId,
    moduleId,
    komentar,
    isi,
    parentId,
    mentionedUserIds,
  } = input;

  const text = komentar ?? isi ?? "";

  // Jalur utama: Course-level.
  if (courseId) {
    return {
      courseId,
      komentar: text,
      ...(parentId ? { parentId } : {}),
      ...(Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0
        ? { mentionedUserIds }
        : {}),
    };
  }

  // Legacy: Module-level (sementara, untuk page yang belum dimigrasikan).
  return {
    moduleId,
    komentar: text,
    ...(parentId ? { parentId } : {}),
  };
}

// ----------------------------------------------------
// LEGACY MODULE-LEVEL (sementara — jangan dipakai di jalur Course baru)
// ----------------------------------------------------

// GET /api/comments/module/:moduleId
/**
 * @deprecated Discussion module-level lama. Gunakan `getCourseComments(courseId)`.
 * Untuk seluruh consumer yang belum dimigrasikan.
 * @param {string} moduleId
 */
export async function getModuleComments(moduleId) {
  if (!moduleId) return [];

  const response = await fetchApi(`${API_URL}/api/comments/module/${moduleId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil komentar modul");
  }
  return result.data ?? [];
}
