const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getModuleEvaluations(moduleId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil daftar evaluasi");
  }

  return result.data;
}

export async function getEvaluationDetail(evaluationId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/evaluations/${evaluationId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil detail evaluasi");
  }

  return result.data;
}

export async function submitEvaluation(evaluationId, jawaban) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/evaluations/${evaluationId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jawaban }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengirim jawaban evaluasi");
  }

  return result.data;
}

export async function createEvaluation(moduleId, judul) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/evaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ judul }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal membuat evaluasi");
  }

  return result.data;
}

export async function addQuestion(evaluationId, questionData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/evaluations/${evaluationId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(questionData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menambahkan soal");
  }

  return result.data;
}