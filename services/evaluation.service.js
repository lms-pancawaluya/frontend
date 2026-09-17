import { API_URL, fetchApi } from "@/lib/api";

// Helper internal untuk menyusun header request & Authorization token
function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ----------------------------------------------------
// FITUR EVALUASI HALAMAN GURU
// ----------------------------------------------------

/**
 * Get daftar evaluasi berdasarkan ID Modul
 */
export async function getModuleEvaluations(moduleId) {
  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil daftar evaluasi");
  }

  return result.data;
}

/**
 * Get detail evaluasi & daftar soal
 * URL: GET /api/modules/:moduleId/evaluations/:evaluationId
 */
export async function getEvaluationDetail(moduleId, evaluationId) {
  const response = await fetchApi(
    `${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil detail evaluasi");
  }

  return result.data;
}

/**
 * Submit jawaban evaluasi modul
 * URL: POST /api/modules/:moduleId/evaluations/:evaluationId/submit
 */
export async function submitEvaluation(moduleId, evaluationId, jawaban) {
  const response = await fetchApi(
    `${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}/submit`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ jawaban }),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengirim jawaban evaluasi");
  }

  return result.data;
}

/**
 * Cek riwayat jawaban milik Guru pada satu evaluasi
 * URL: GET /api/modules/:moduleId/evaluations/:evaluationId/my-answers
 */
export async function getMyAnswers(moduleId, evaluationId) {
  const response = await fetchApi(
    `${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}/my-answers`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil riwayat jawaban");
  }

  return result.data;
}

/**
 * Kirim saran & kritik per modul oleh Guru
 * URL: POST /api/feedbacks/module/:moduleId
 */
export async function sendModuleFeedback(moduleId, payload) {
  const response = await fetchApi(`${API_URL}/api/feedbacks/module/${moduleId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengirim saran dan kritik");
  }

  return result.data;
}

/**
 * Get seluruh saran & kritik guru (untuk monitoring admin)
 * URL: GET /api/feedbacks
 * Backend menjamin satu feedback per guru per modul.
 */
export async function getAllFeedbacks() {
  const response = await fetchApi(`${API_URL}/api/feedbacks`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || result.message || "Gagal mengambil data saran & kritik");
  }

  return result.data ?? [];
}

// ----------------------------------------------------
// FITUR MANAGEMENT EVALUASI (ADMIN / AUTHORING)
// ----------------------------------------------------

/**
 * Buat evaluasi baru di dalam modul
 */
export async function createEvaluation(moduleId, { judul, tipe, passingScore, maxAttempts }) {
  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ judul, tipe, passingScore, maxAttempts }),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal membuat evaluasi");
  }

  return result.data;
}

export async function deleteEvaluation(moduleId, evaluationId) {
  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  // Robust terhadap respons non-JSON (mis. 404/HTML) agar pesan error jelas,
  // bukan error parsing yang membingungkan.
  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || result?.sukses === false || result === null) {
    throw new Error(
      result?.pesan || result?.message || `Gagal menghapus evaluasi (status ${response.status}).`
    );
  }

  return result;
}

export async function addQuestion(moduleId, evaluationId, questionData) {
  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}/questions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(questionData),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menambahkan soal");
  }

  return result.data;
}

export async function updateQuestion(moduleId, questionId, questionData) {
  const token = localStorage.getItem("token");

  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations/questions/${questionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(questionData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui soal");
  }

  return result.data;
}

export async function deleteQuestion(moduleId, questionId) {
  const token = localStorage.getItem("token");

  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/evaluations/questions/${questionId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menghapus soal");
  }

  return result.data;
}
