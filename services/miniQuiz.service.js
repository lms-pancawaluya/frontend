const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getMiniQuizzesByContent(contentId) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/content/${contentId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil daftar mini quiz");
  }

  return result.data;
}

export async function createMiniQuiz(contentId, quizData) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/content/${contentId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(quizData),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal membuat mini quiz");
  }

  return result.data;
}

export async function updateMiniQuiz(quizId, quizData) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/${quizId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(quizData),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal memperbarui mini quiz");
  }

  return result.data;
}

export async function deleteMiniQuiz(quizId) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/${quizId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menghapus mini quiz");
  }

  return result;
}

export async function addQuestion(quizId, questionData) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/${quizId}/questions`, {
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

export async function updateQuestion(questionId, questionData) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/questions/${questionId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(questionData),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal memperbarui soal");
  }

  return result.data;
}

export async function deleteQuestion(questionId) {
  const response = await fetch(`${API_URL}/api/mini-quizzes/questions/${questionId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menghapus soal");
  }

  return result;
}
