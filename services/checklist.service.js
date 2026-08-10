const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getChecklistItems() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/items`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil item checklist");
  }

  return result.data;
}

export async function createChecklistItem({ aspek, deskripsi, urutan }) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aspek, deskripsi, urutan }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal membuat item checklist");
  }

  return result.data;
}

export async function updateChecklistItem(id, { aspek, deskripsi, urutan, isActive }) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aspek, deskripsi, urutan, isActive }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal memperbarui item checklist");
  }

  return result.data;
}

export async function deleteChecklistItem(id) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/items/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menghapus item checklist");
  }

  return result.data;
}

export async function getChecklistReport(days = 7) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/report?days=${days}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil laporan konsistensi");
  }

  return result.data;
}
