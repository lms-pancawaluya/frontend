import { API_URL, fetchApi } from "@/lib/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Helper terpusat untuk semua request ke API mini quiz.
 * Kenapa dibuat: sebelumnya setiap fungsi langsung memanggil response.json()
 * tanpa mengecek dulu apakah responsnya benar-benar JSON. Kalau URL salah
 * (misalnya salah kirim ID, endpoint 404, atau server down), backend/hosting
 * akan mengembalikan halaman HTML ("<!DOCTYPE ...") bukan JSON, sehingga
 * response.json() melempar error yang membingungkan:
 *   "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 * Dengan helper ini, kalau responsnya bukan JSON, kita lempar error yang
 * jelas menyebutkan status code dan URL yang dipanggil, sehingga gampang
 * ditelusuri ID mana yang salah.
 */
async function apiRequest(url, options, fallbackErrorMessage) {
  const response = await fetchApi(url, options);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const rawText = await response.text();
    throw new Error(
      `Server tidak mengembalikan JSON (status ${response.status}) untuk URL: ${url}. ` +
        `Kemungkinan ID yang dikirim salah atau endpoint tidak ditemukan. ` +
        `Cuplikan respons: ${rawText.slice(0, 120)}`
    );
  }

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || fallbackErrorMessage);
  }

  return result;
}

/**
 * Ambil daftar mini quiz berdasarkan CONTENT ID.
 * WAJIB pakai content_id (contoh: 9fc8152d-...), BUKAN mini_quiz_id.
 * URL: /api/mini-quizzes/content/{content_id}
 */
export async function getMiniQuizzesByContent(contentId) {
  const url = `${API_URL}/api/mini-quizzes/content/${contentId}`;
  const result = await apiRequest(
    url,
    { method: "GET", headers: getHeaders() },
    "Gagal mengambil daftar mini quiz"
  );
  return result.data;
}

/**
 * Cek status kunci/lock materi berdasarkan CONTENT ID.
 * WAJIB pakai content_id (contoh: 9fc8152d-...), BUKAN mini_quiz_id.
 * URL: /api/mini-quizzes/content/{content_id}/check-lock
 */
export async function checkContentLock(contentId) {
  const url = `${API_URL}/api/mini-quizzes/content/${contentId}/check-lock`;
  const result = await apiRequest(
    url,
    { method: "GET", headers: getHeaders() },
    "Gagal memeriksa status kunci konten"
  );
  return result.data;
}

/**
 * Ambil riwayat attempt milik user untuk satu mini quiz berdasarkan MINI QUIZ ID.
 * WAJIB pakai mini_quiz_id (contoh: c4721881-...), BUKAN content_id.
 * URL: /api/mini-quizzes/{mini_quiz_id}/my-attempts
 */
export async function getMyAttempts(miniQuizId) {
  const url = `${API_URL}/api/mini-quizzes/${miniQuizId}/my-attempts`;
  const result = await apiRequest(
    url,
    { method: "GET", headers: getHeaders() },
    "Gagal mengambil riwayat attempt"
  );
  return result.data;
}

/**
 * Kirim jawaban evaluasi/attempt untuk satu mini quiz berdasarkan MINI QUIZ ID.
 * WAJIB pakai mini_quiz_id (contoh: c4721881-...), BUKAN content_id.
 * URL: /api/mini-quizzes/{mini_quiz_id}/attempt
 *
 * @param {string} miniQuizId - ID mini quiz (bukan content id)
 * @param {object} answers - payload jawaban, contoh: { answers: [{ question_id, selected_option }] }
 */
export async function submitMiniQuizAttempt(miniQuizId, answers) {
  const url = `${API_URL}/api/mini-quizzes/${miniQuizId}/attempt`;
  const result = await apiRequest(
    url,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(answers),
    },
    "Gagal mengirim jawaban evaluasi"
  );
  return result.data;
}

/* ------------------------------------------------------------------ */
/* Fungsi CRUD untuk sisi Guru/Admin (dipertahankan dari kode asli)   */
/* ------------------------------------------------------------------ */

export async function createMiniQuiz(contentId, quizData) {
  const url = `${API_URL}/api/mini-quizzes/content/${contentId}`;
  const result = await apiRequest(
    url,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(quizData),
    },
    "Gagal membuat mini quiz"
  );
  return result.data;
}

export async function updateMiniQuiz(quizId, quizData) {
  const url = `${API_URL}/api/mini-quizzes/${quizId}`;
  const result = await apiRequest(
    url,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(quizData),
    },
    "Gagal memperbarui mini quiz"
  );
  return result.data;
}

export async function deleteMiniQuiz(quizId) {
  const url = `${API_URL}/api/mini-quizzes/${quizId}`;
  const result = await apiRequest(
    url,
    { method: "DELETE", headers: getHeaders() },
    "Gagal menghapus mini quiz"
  );
  return result;
}

export async function addQuestion(quizId, questionData) {
  const url = `${API_URL}/api/mini-quizzes/${quizId}/questions`;
  const result = await apiRequest(
    url,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    },
    "Gagal menambahkan soal"
  );
  return result.data;
}

export async function updateQuestion(questionId, questionData) {
  const url = `${API_URL}/api/mini-quizzes/questions/${questionId}`;
  const result = await apiRequest(
    url,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    },
    "Gagal memperbarui soal"
  );
  return result.data;
}

export async function deleteQuestion(questionId) {
  const url = `${API_URL}/api/mini-quizzes/questions/${questionId}`;
  const result = await apiRequest(
    url,
    { method: "DELETE", headers: getHeaders() },
    "Gagal menghapus soal"
  );
  return result;
}