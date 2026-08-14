const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Manajemen Master Item Checklist (Admin) ---
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

// --- Upload Foto Bukti & Checklist Harian Guru ---
export async function uploadFotoBukti(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("foto", file);

  const response = await fetch(`${API_URL}/api/upload/foto-bukti`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengunggah foto bukti. Pastikan foto memiliki lokasi & waktu aktif.");
  }

  return result.data;
}

export async function getTodayChecklist() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/today`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil checklist hari ini");
  }

  return result.data;
}

export async function submitTodayChecklist(items) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal menyimpan checklist");
  }

  return result.data;
}

export async function getChecklistHistory(days = 7) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/checklist/history?days=${days}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!result.sukses) {
    throw new Error(result.pesan || "Gagal mengambil riwayat checklist");
  }

  return result.data;
}