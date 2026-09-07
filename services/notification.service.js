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

export async function getUnreadNotificationCount() {
  const response = await fetchApi(`${API_URL}/api/notifications/unread-count`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil jumlah notifikasi");
  }
  return result.data?.count ?? 0;
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