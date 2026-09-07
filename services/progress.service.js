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