import { API_URL, fetchApi } from "@/lib/api";

export async function getProgress() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetchApi(`${API_URL}/api/progress`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.warn("Server merespon error saat getProgress:", response.status);
      return [];
    }

    const result = await response.json().catch(() => ({}));

    if (!result.sukses) {
      console.warn(result.pesan || "Gagal mengambil data progress");
      return result.data || [];
    }

    return result.data || [];
  } catch (error) {
    console.warn("Gagal terhubung ke server (getProgress):", error);
    return [];
  }
}

/**
 * Get progress detail satu module (termasuk material progress/detail).
 * URL: GET /api/progress/:moduleId
 * Mengembalikan `data` dari BE, atau `null` bila tidak tersedia.
 */
export async function getModuleProgress(moduleId) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  try {
    const response = await fetchApi(`${API_URL}/api/progress/${moduleId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.warn("Server merespon error saat getModuleProgress:", response.status);
      return null;
    }

    const result = await response.json().catch(() => ({}));

    if (!result.sukses) {
      console.warn(result.pesan || "Gagal mengambil progress module");
      return result.data || null;
    }

    return result.data || null;
  } catch (error) {
    console.warn("Gagal terhubung ke server (getModuleProgress):", error);
    return null;
  }
}

/**
 * Laporkan progress pemutaran/sebagian sebuah content (mis. video).
 * URL: POST /api/progress/contents/:contentId/progress
 * Body: { progressPercent }
 */
export async function reportContentProgress(contentId, progressPercent) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const response = await fetchApi(
    `${API_URL}/api/progress/contents/${contentId}/progress`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ progressPercent }),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengirim progress materi");
  }

  return result.data;
}

/**
 * Tandai sebuah content selesai (PDF/Text/Link, atau video yang telah 100%).
 * URL: POST /api/progress/contents/:contentId/complete
 * Tanpa body. BE yang menegakkan syarat Mini Quiz / Interactive Question.
 */
export async function completeContent(contentId) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const response = await fetchApi(
    `${API_URL}/api/progress/contents/${contentId}/complete`,
    {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menyelesaikan materi");
  }

  return result.data;
}

export async function startModule(moduleId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetchApi(`${API_URL}/api/progress/${moduleId}/start`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    if (!result.sukses) {
      throw new Error(result.pesan || "Gagal memulai modul");
    }

    return result.data;
  } catch (error) {
    console.warn("Gagal terhubung ke server (startModule):", error);
    throw error;
  }
}

export async function completeModule(moduleId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetchApi(`${API_URL}/api/progress/${moduleId}/complete`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    if (!result.sukses) {
      throw new Error(result.pesan || "Gagal menyelesaikan modul");
    }

    return result.data;
  } catch (error) {
    console.warn("Gagal terhubung ke server (completeModule):", error);
    throw error;
  }
}