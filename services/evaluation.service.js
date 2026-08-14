const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

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
  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations`, {
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
  const response = await fetch(
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
  const response = await fetch(
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
 * Kirim saran & kritik per modul oleh Guru
 * URL: POST /api/feedbacks/module/:moduleId
 */
export async function sendModuleFeedback(moduleId, payload) {
  const response = await fetch(`${API_URL}/api/feedbacks/module/${moduleId}`, {
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

// ----------------------------------------------------
// FITUR MANAGEMENT EVALUASI (ADMIN / AUTHORING)
// ----------------------------------------------------

/**
 * Buat evaluasi baru di dalam modul
 */
export async function createEvaluation(moduleId, judul) {
  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ judul }),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal membuat evaluasi");
  }

  return result.data;
}

export async function addQuestion(moduleId, evaluationId, questionData) {
  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations/${evaluationId}/questions`, {
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

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations/questions/${questionId}`, {
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

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations/questions/${questionId}`, {
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
