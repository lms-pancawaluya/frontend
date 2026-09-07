import { API_URL, fetchApi } from "@/lib/api";

export async function searchGlobal(keyword) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetchApi(`${API_URL}/api/search?q=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      console.warn("Server merespon error saat pencarian:", response.status);
      return null;
    }

    const result = await response.json();
    return result.sukses ? result.data : null;
  } catch (error) {
    console.warn("Gagal terhubung ke server pencarian:", error);
    return null;
  }
}