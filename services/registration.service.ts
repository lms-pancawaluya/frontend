import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ""}/api`,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

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
  const response = await api.get<CekNipResponse>(`/guru/cek-nip/${nip}`);
  return response.data;
};

export const cariSekolah = async (keyword: string): Promise<CariSekolahResponse> => {
  const response = await api.get<CariSekolahResponse>(`/guru/cari-sekolah`, {
    params: { q: keyword },
  });
  return response.data;
};