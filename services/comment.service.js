// services/comment.service.js
// Module discussion comments. Pengajar & Admin can view and post; deletion is
// Admin-only (DELETE /api/comments/:id) and intentionally not included here so
// the Pengajar panel cannot call it.

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
 * @typedef {Object} PostCommentInput
 * @property {string} moduleId
 * @property {string} [komentar]
 * @property {string} [isi]
 * @property {string | null | undefined} [parentId]
 */

// GET /api/comments/module/:moduleId
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

// POST /api/comments  body: { moduleId, parentId?, komentar }
/**
 * @param {PostCommentInput} input
 */
export async function postComment({ moduleId, komentar, isi, parentId = null }) {
  const response = await fetchApi(`${API_URL}/api/comments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      moduleId,
      komentar: komentar ?? isi ?? "",
      ...(parentId ? { parentId } : {}),
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengirim komentar");
  }
  return result.data;
}

// DELETE /api/comments/:id
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
