const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-72a3.up.railway.app";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : "";
}

function getJsonHeaders(includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = includeAuth ? getToken() : "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readResult(response, fallbackMessage) {
  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || !result?.sukses) {
    throw new Error(result?.pesan || result?.message || fallbackMessage);
  }

  return result;
}

export async function getUsers(filters = {}) {
  const params = new URLSearchParams();

  if (typeof filters === "string") {
    if (filters) params.append("search", filters);
  } else {
    if (filters.search) params.append("search", filters.search);
    if (filters.sekolah) params.append("sekolah", filters.sekolah);
    if (filters.kotaKab || filters.kota) params.append("kotaKab", filters.kotaKab || filters.kota);
    if (filters.kecamatan || filters.daerah) params.append("kecamatan", filters.kecamatan || filters.daerah);
    if (filters.status) params.append("status", filters.status);
    if (filters.role) params.append("role", filters.role);
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/api/users${queryString}`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil data pengguna");
  return result.data;
}

export async function getUserById(id) {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil detail pengguna");
  return result.data;
}

export async function updateUser(id, userData) {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify(userData),
  });

  const result = await readResult(response, "Gagal memperbarui pengguna");
  return result.data;
}

export async function resetUserPassword(id, passwordBaru) {
  const response = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
    method: "PUT",
    headers: getJsonHeaders(),
    body: JSON.stringify({ passwordBaru }),
  });

  const result = await readResult(response, "Gagal mereset password pengguna");
  return result;
}

export async function deleteUser(id) {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal menghapus pengguna");
  return result;
}

export async function getUserProgress(userId) {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/progress`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil progres pengguna");
  return result.data;
}

export async function getUserEvaluations(userId) {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/evaluations`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil hasil evaluasi pengguna");
  return result.data;
}

// --- Monitoring untuk Pengajar/Admin (scoped di backend) ---
// Endpoint /api/admin-monitoring/* mengembalikan hanya guru dalam scope sekolah
// pengajar yang login (untuk admin: seluruh guru). Otorisasi ditegakkan backend.

export async function getMonitoringUserProgress(userId) {
  const response = await fetch(`${API_URL}/api/admin-monitoring/users/${userId}/progress`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil progres pengguna");
  return result.data;
}

export async function getMonitoringUserEvaluations(userId) {
  const response = await fetch(`${API_URL}/api/admin-monitoring/users/${userId}/evaluations`, {
    method: "GET",
    headers: getJsonHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil hasil evaluasi pengguna");
  return result.data;
}
