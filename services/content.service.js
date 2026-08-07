const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createContent(moduleId, contentData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/modules/${moduleId}/contents`, {
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

  const response = await fetch(`${API_URL}/api/contents/${contentId}`, {
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

  const response = await fetch(`${API_URL}/api/contents/${contentId}`, {
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