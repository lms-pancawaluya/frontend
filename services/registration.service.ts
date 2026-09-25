import { API_URL, fetchApi } from "@/lib/api";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : "";
}

function getJsonHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export interface CekNipResponse {
  success: boolean;
  message: string;
  data: {
    namaGuru: string;
    npsnSekolah: string;
    namaSekolah: string;
    kotaKab: string;
    kecamatan: string;
  };
}

export interface SekolahItem {
  id: string;
  npsn: string;
  nama: string;
  kotaKab: string;
  kecamatan: string;
}

export interface CariSekolahResponse {
  success: boolean;
  message: string;
  data: SekolahItem[];
}

export const cekNipGuru = async (nip: string): Promise<CekNipResponse> => {
  const response = await fetchApi(`${API_URL}/api/guru/cek-nip/${nip}`, {
    headers: getJsonHeaders(),
  });
  return response.json();
};

export const cariSekolah = async (keyword: string): Promise<CariSekolahResponse> => {
  const response = await fetchApi(`${API_URL}/api/guru/cari-sekolah?q=${encodeURIComponent(keyword)}`, {
    headers: getJsonHeaders(),
  });
  return response.json();
};

export async function lookupMasterGuru(nip: string) {
  const normalizedNip = nip.replace(/[^0-9]/g, "");
  const response = await fetchApi(`${API_URL}/api/guru/cek-nip/${encodeURIComponent(normalizedNip)}`, {
    method: "GET",
    headers: getJsonHeaders(),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.sukses === false || data.success === false) {
    throw new Error(data.pesan || data.message || "Data NIP tidak ditemukan.");
  }
  return data.data || data;
}

export async function registerGuru(payload: { nip: string; email: string; password: string }) {
  const response = await fetchApi(`${API_URL}/api/auth/register-guru`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.sukses === false || data.success === false) {
    throw new Error(data.pesan || data.message || "Gagal mendaftarkan guru.");
  }
  return data;
}

export async function registerPublicGuru(payload: {
  nama: string;
  email: string;
  password: string;
  nip?: string;
  schoolId?: string;
  sekolah?: string;
  kotaKab?: string;
  kecamatan?: string;
  gelar?: string;
}) {
  const response = await fetchApi(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.sukses === false || data.success === false) {
    throw new Error(data.pesan || data.message || "Gagal mendaftarkan guru.");
  }
  return data;
}
