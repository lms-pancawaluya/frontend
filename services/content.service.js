import { API_URL, fetchApi } from "@/lib/api";

/**
 * Upload a PDF material to the backend.
 * POST /api/upload/pdf — multipart/form-data field `file` (PDF only, max 10MB).
 * Returns the direct Cloudinary URL from `response.data.data.url`.
 */
export async function uploadPdf(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchApi(`${API_URL}/api/upload/pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.sukses || !result.data?.url) {
    throw new Error(result.pesan || "Gagal mengunggah file PDF.");
  }

  return result.data.url;
}

export async function createContent(moduleId, contentData) {
  const token = localStorage.getItem("token");

  const response = await fetchApi(`${API_URL}/api/modules/${moduleId}/contents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(contentData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menambahkan konten");
  }

  return result.data;
}

export async function updateContent(contentId, contentData) {
  const token = localStorage.getItem("token");

  const response = await fetchApi(`${API_URL}/api/contents/${contentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(contentData),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui konten");
  }

  return result.data;
}

export async function deleteContent(contentId) {
  const token = localStorage.getItem("token");

  const response = await fetchApi(`${API_URL}/api/contents/${contentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menghapus konten");
  }

  return result;
}