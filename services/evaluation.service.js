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
// ASSESSMENT DOMAIN (Pre-Test / Post-Test)
// ----------------------------------------------------
// Backend sekarang memisahkan endpoint per tahap:
//   pre_test  → /api/modules/:moduleId/pre-tests
//   post_test → /api/modules/:moduleId/post-tests
//
// Helper ini menerjemahkan tipe BE ("pre_test" / "post_test") menjadi prefix
// endpoint yang sesuai. Menerima penulisan variatif ("pre-test", "Pre Test",
// dst.) untuk ketahanan, namun nilai yang dikirim/diminta ke BE tetap sesuai
// contract (`pre_test` / `post_test`).

const PRE_TEST = "pre_test";
const POST_TEST = "post_test";

/** Normalisasi tipe menjadi "pre_test" / "post_test" (atau "" bila tidak dikenali). */
function normalizeTipe(tipe) {
  const value = String(tipe || "").toLowerCase().replace(/[ _-]/g, "");
  if (value === "pretest") return PRE_TEST;
  if (value === "posttest") return POST_TEST;
  return "";
}

/** Prefix endpoint resource sesuai tipe. Default ke pre-tests bila tidak dikenali. */
function getAssessmentPrefix(tipe) {
  return normalizeTipe(tipe) === POST_TEST ? "post-tests" : "pre-tests";
}

function getAssessmentBase(moduleId, tipe) {
  return `${API_URL}/api/modules/${moduleId}/${getAssessmentPrefix(tipe)}`;
}

/**
 * Resolusi tipe assessment dari sebuah ID bila caller tidak menyediakannya.
 * Hanya menelusuri endpoint baru (pre-tests & post-tests), tanpa fallback ke
 * endpoint evaluasi lama. Mengembalikan "pre_test" / "post_test" / "".
 */
async function resolveTipe(moduleId, evaluationId, providedTipe) {
  const normalized = normalizeTipe(providedTipe);
  if (normalized) return normalized;

  const list = await getModuleEvaluations(moduleId);
  const match = Array.isArray(list)
    ? list.find((item) => item && item.id === evaluationId)
    : null;
  return normalizeTipe(match?.tipe);
}

/** Ambil semua assessment pada satu tipe (list endpoint). */
async function getAssessmentsByTipe(moduleId, tipe) {
  const response = await fetchApi(getAssessmentBase(moduleId, tipe), {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil daftar asesmen");
  }

  return result.data ?? [];
}

// ----------------------------------------------------
// FITUR EVALUASI HALAMAN GURU
// ----------------------------------------------------

/**
 * Get daftar evaluasi berdasarkan ID Modul.
 *
 * Menggabungkan Pre-Test & Post-Test dari endpoint terpisah menjadi satu list
 * (kontrak lama) agar consumer yang memfilter berdasarkan `tipe` tetap bekerja.
 */
export async function getModuleEvaluations(moduleId) {
  const [preTests, postTests] = await Promise.all([
    getAssessmentsByTipe(moduleId, PRE_TEST),
    getAssessmentsByTipe(moduleId, POST_TEST),
  ]);

  return [...preTests, ...postTests];
}

/**
 * Get detail evaluasi & daftar soal
 * URL: GET /api/modules/:moduleId/pre-tests/:id  |  /post-tests/:id
 *
 * `tipe` opsional. Bila tidak diberikan, service menelusuri daftar untuk
 * menentukan prefix endpoint yang benar.
 */
export async function getEvaluationDetail(moduleId, evaluationId, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(`${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil detail evaluasi");
  }

  return result.data;
}

/**
 * Submit jawaban evaluasi modul (Guru)
 * URL: POST /api/modules/:moduleId/pre-tests/:id/submit  |  /post-tests/:id/submit
 */
export async function submitEvaluation(moduleId, evaluationId, jawaban, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}/submit`,
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
 * URL: GET /api/modules/:moduleId/pre-tests/:id/my-answers  |  /post-tests/:id/my-answers
 */
export async function getMyAnswers(moduleId, evaluationId, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}/my-answers`,
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
 * Get seluruh jawaban pada satu evaluasi (Admin)
 * URL: GET /api/modules/:moduleId/pre-tests/:id/answers  |  /post-tests/:id/answers
 */
export async function getEvaluationAnswers(moduleId, evaluationId, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}/answers`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil jawaban evaluasi");
  }

  return result.data ?? [];
}

/**
 * Kirim Saran & Masukan per Course oleh Guru.
 * URL: POST /api/feedbacks/course/:courseId
 * Body: { masukan, saran } — `saran` required sesuai contract BE.
 */
export async function sendCourseFeedback(courseId, payload) {
  const response = await fetchApi(`${API_URL}/api/feedbacks/course/${courseId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  // Response BE dapat berupa non-JSON (mis. error HTML 404/500). Parsing
  // defensif agar tidak melempar raw `JSON.parse` error ke UI.
  let result = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || !result?.sukses) {
    throw new Error(
      result?.pesan || result?.message || "Gagal mengirim saran dan masukan"
    );
  }

  return result.data;
}

/**
 * Get seluruh Saran & Masukan guru (untuk monitoring admin)
 * URL: GET /api/feedbacks
 * Endpoint GET/list tetap sesuai contract BE yang tersedia (tidak diubah).
 * Response dapat memuat field `masukan` dan relasi `course`; konsumen
 * dirender defensif agar toleran terhadap response transisional.
 */
export async function getAllFeedbacks() {
  const response = await fetchApi(`${API_URL}/api/feedbacks`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.pesan || result.message || "Gagal mengambil data saran & masukan");
  }

  return result.data ?? [];
}

// ----------------------------------------------------
// FITUR MANAGEMENT EVALUASI (ADMIN / AUTHORING)
// ----------------------------------------------------

/**
 * Buat evaluasi baru di dalam modul.
 * Mengarah ke endpoint Pre-Test HANYA untuk tipe `pre_test`, dan endpoint
 * Post-Test HANYA untuk tipe `post_test` (tidak ada cross-call).
 */
export async function createEvaluation(moduleId, { judul, tipe, passingScore, maxAttempts }) {
  const normalizedTipe = normalizeTipe(tipe);
  const body =
    normalizedTipe === PRE_TEST
      ? { judul }
      : { judul, passingScore, maxAttempts };

  const response = await fetchApi(getAssessmentBase(moduleId, normalizedTipe), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal membuat evaluasi");
  }

  return result.data;
}

/**
 * Hapus Pre-Test/Post-Test sesuai tipe.
 * URL: DELETE /api/modules/:moduleId/pre-tests/:id  |  /post-tests/:id
 */
export async function deleteEvaluation(moduleId, evaluationId, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(`${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}`, {
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

/**
 * Tambah soal ke Pre-Test/Post-Test.
 * URL: POST /api/modules/:moduleId/pre-tests/:id/questions  |  /post-tests/:id/questions
 */
export async function addQuestion(moduleId, evaluationId, questionData, tipe) {
  const resolvedTipe = await resolveTipe(moduleId, evaluationId, tipe);
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, resolvedTipe)}/${evaluationId}/questions`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(questionData),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menambahkan soal");
  }

  return result.data;
}

/**
 * Update soal.
 * URL: PUT /api/modules/:moduleId/pre-tests/questions/:id  |  /post-tests/questions/:id
 */
export async function updateQuestion(moduleId, questionId, questionData, tipe) {
  const headers = getHeaders();
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, await resolveQuestionTipe(moduleId, questionId, tipe))}/questions/${questionId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(questionData),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal memperbarui soal");
  }

  return result.data;
}

/**
 * Hapus soal.
 * URL: DELETE /api/modules/:moduleId/pre-tests/questions/:id  |  /post-tests/questions/:id
 */
export async function deleteQuestion(moduleId, questionId, tipe) {
  const response = await fetchApi(
    `${getAssessmentBase(moduleId, await resolveQuestionTipe(moduleId, questionId, tipe))}/questions/${questionId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menghapus soal");
  }

  return result.data;
}

/**
 * Tentukan tipe untuk operasi berbasis questionId. Karena endpoint soal
 * ber-prefix per tahap, tipe perlu diketahui. Bila caller tidak menyediakannya,
 * tipe ditelusuri dari daftar + detail Pre-Test/Post-Test modul.
 */
async function resolveQuestionTipe(moduleId, questionId, providedTipe) {
  const normalized = normalizeTipe(providedTipe);
  if (normalized) return normalized;

  const assessments = await getModuleEvaluations(moduleId);
  if (!Array.isArray(assessments)) return "";

  for (const assessment of assessments) {
    if (!assessment?.id) continue;
    const detail = await getEvaluationDetail(moduleId, assessment.id, assessment.tipe);
    const questions = Array.isArray(detail?.questions) ? detail.questions : [];
    if (questions.some((question) => question?.id === questionId)) {
      return normalizeTipe(assessment.tipe);
    }
  }

  return "";
}
