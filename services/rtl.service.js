// services/rtl.service.js
// RTL (Rencana Tindak Lanjut) review workflow — shared by Admin & Pengajar.
// Backend enforces role/school scope; the FE does not re-implement authorization.

import { API_URL, fetchApi } from "@/lib/api";

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || "";
  }
  return "";
};

function getHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// GET /api/rtl/submissions?status=&moduleId=
export async function getRtlSubmissions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.moduleId) params.append("moduleId", filters.moduleId);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  const response = await fetchApi(`${API_URL}/api/rtl/submissions${queryString}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil daftar RTL");
  }
  return result.data ?? [];
}

// GET /api/rtl/:rtlId
export async function getRtlDetail(rtlId) {
  const response = await fetchApi(`${API_URL}/api/rtl/${rtlId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal mengambil detail RTL");
  }
  return result.data;
}

// PATCH /api/rtl/:rtlId/review  body: { status: "disetujui" | "ditolak", catatanTrainer }
export async function reviewRtl(rtlId, { status, catatanTrainer }) {
  const response = await fetchApi(`${API_URL}/api/rtl/${rtlId}/review`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status, catatanTrainer }),
  });

  const result = await response.json();
  if (!response.ok || !result.sukses) {
    throw new Error(result.pesan || result.message || "Gagal memperbarui status RTL");
  }
  return result.data;
}
