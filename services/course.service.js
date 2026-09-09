import { API_URL, fetchApi } from "@/lib/api";

function getAuthToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}

function getHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

export async function getCourses(mode) {
  const query = mode ? `?${new URLSearchParams({ mode }).toString()}` : "";
  const response = await fetchApi(`${API_URL}/api/courses${query}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil daftar course");
  return result.data;
}

export async function getCourseById(id) {
  const response = await fetchApi(`${API_URL}/api/courses/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await readResult(response, "Gagal mengambil detail course");
  return result.data;
}

export async function createCourse(data) {
  const response = await fetchApi(`${API_URL}/api/courses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result = await readResult(response, "Gagal menambahkan course");
  return result.data;
}

export async function updateCourse(id, data) {
  const response = await fetchApi(`${API_URL}/api/courses/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result = await readResult(response, "Gagal memperbarui course");
  return result.data;
}

export async function deleteCourse(id) {
  const response = await fetchApi(`${API_URL}/api/courses/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  return readResult(response, "Gagal menghapus course");
}
