import { API_URL, fetchApi } from "@/lib/api";

// Helper untuk mengambil Token Authorization
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || "";
  }
  return "";
};

export async function getChecklistReport(days = 7) {
  const token = getAuthToken();

  const response = await fetchApi(`${API_URL}/api/checklist/report?days=${days}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil laporan konsistensi");
  return result.data;
}

// --- Upload Foto Bukti & Checklist Harian Guru ---

export async function uploadFotoBukti(file) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("foto", file);

  const response = await fetchApi(`${API_URL}/api/upload/foto-bukti`, {
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
  const token = getAuthToken();

  const response = await fetchApi(`${API_URL}/api/checklist/today`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil checklist hari ini");
  return result.data;
}

export async function submitTodayChecklist(items) {
  const token = getAuthToken();

  const response = await fetchApi(`${API_URL}/api/checklist/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal menyimpan checklist");
  return result.data;
}

export async function getChecklistHistory(days = 7) {
  const token = getAuthToken();

  const response = await fetchApi(`${API_URL}/api/checklist/history?days=${days}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!result.sukses) throw new Error(result.pesan || "Gagal mengambil riwayat checklist");
  return result.data;
}