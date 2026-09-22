import { API_URL, fetchApi } from "@/lib/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getNotifications() {
  const response = await fetchApi(`${API_URL}/api/notifications`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil notifikasi");
  }
  return result.data ?? [];
}

/**
 * Ambil jumlah notifikasi belum dibaca.
 * Response shape BE dapat bervariasi; dibaca defensif (tanpa mengubah contract):
 *   - data berupa number langsung, atau
 *   - data.count / data.unreadCount / data.total / data.unread.
 * Mengembalikan number bila terbaca; `null` bila shape tidak dikenali agar
 * pemanggil TIDAK mengasumsikan unread = 0.
 */
export async function getUnreadNotificationCount() {
  const response = await fetchApi(`${API_URL}/api/notifications/unread-count`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil jumlah notifikasi");
  }

  const data = result.data;

  // data berupa number langsung.
  if (typeof data === "number" && Number.isFinite(data)) return data;

  // data berupa objek dengan salah satu field count yang dikenali.
  if (data && typeof data === "object") {
    const candidates = [data.count, data.unreadCount, data.total, data.unread];
    for (const candidate of candidates) {
      if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
      // Toleran bila BE mengirim string numerik.
      if (typeof candidate === "string" && candidate.trim() !== "" && Number.isFinite(Number(candidate))) {
        return Number(candidate);
      }
    }
  }

  // Shape tidak dikenali → jangan asumsikan 0.
  return null;
}

export async function markNotificationAsRead(id) {
  const response = await fetchApi(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menandai notifikasi");
  }
  return result.data;
}

export async function markAllNotificationsAsRead() {
  const response = await fetchApi(`${API_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal menandai semua notifikasi");
  }
  return result.data;
}