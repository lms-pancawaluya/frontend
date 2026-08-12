"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { formatNipDisplay } from "@/lib/formatNip";

interface ProgressItem {
  status: string;
  completedAt: string;
  module: {
    judul: string;
    aspekPancawaluya: string;
  };
}

interface GuruProfileProps {
  profile: {
    id: string;
    nama: string;
    email: string;
    role: string;
    gelar?: string;
    nip?: string;
    sekolah?: string;
    alamatSekolah?: string;
    noHp?: string;
    fotoProfil?: string;
    progress?: ProgressItem[];
  };
  onRefresh: () => void;
}

interface SekolahData {
  nama: string;
  alamat: string;
}

// Data Kabupaten/Kota & Sekolah di Jawa Barat beserta Alamatnya
const DATA_SEKOLAH_JABAR: Record<string, SekolahData[]> = {
  "Kota Bandung": [
    { nama: "SMA Negeri 1 Bandung", alamat: "Jl. Ir. H. Juanda No.93, Lb. Siliwangi, Kec. Coblong, Kota Bandung" },
    { nama: "SMA Negeri 2 Bandung", alamat: "Jl. Cihampelas No.173, Cipaganti, Kec. Coblong, Kota Bandung" },
    { nama: "SMA Negeri 3 Bandung", alamat: "Jl. Belitung No.8, Merdeka, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMA Negeri 4 Bandung", alamat: "Jl. Gardujati No.20, Kebon Jeruk, Kec. Andir, Kota Bandung" },
    { nama: "SMA Negeri 5 Bandung", alamat: "Jl. Belitung No.8, Merdeka, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMA Negeri 8 Bandung", alamat: "Jl. Solontongan No.3, Turangga, Kec. Lengkong, Kota Bandung" },
    { nama: "SMA Negeri 11 Bandung", alamat: "Jl. Kembar VII No.9, Cigereleng, Kec. Regol, Kota Bandung" },
    { nama: "SMK Negeri 1 Bandung", alamat: "Jl. Wastukencana No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung" },
    { nama: "SMK Negeri 3 Bandung", alamat: "Jl. Solontongan No.10, Turangga, Kec. Lengkong, Kota Bandung" },
  ],
  "Kab. Bandung": [
    { nama: "SMA Negeri 1 Baleendah", alamat: "Jl. R.A.A. Wiranatakoesoemah No.30, Baleendah, Kab. Bandung" },
    { nama: "SMA Negeri 1 Katapang", alamat: "Jl. Terusan Kopo KM.12.5, Katapang, Kab. Bandung" },
    { nama: "SMA Negeri 1 Margahayu", alamat: "Jl. KH. Wahid Hasyim No.387, Sulaiman, Kec. Margahayu, Kab. Bandung" },
    { nama: "SMA Negeri 1 Cileunyi", alamat: "Jl. Stasiun Cimekar, Cileunyi, Kab. Bandung" },
  ],
  "Kab. Bandung Barat": [
    { nama: "SMA Negeri 1 Lembang", alamat: "Jl. Raya Lembang No.137, Lembang, Kab. Bandung Barat" },
    { nama: "SMA Negeri 1 Padalarang", alamat: "Jl. Perintis Kemerdekaan No.2, Padalarang, Kab. Bandung Barat" },
    { nama: "SMA Negeri 1 Cisarua", alamat: "Jl. Kolonel Masturi No.64, Cisarua, Kab. Bandung Barat" },
  ],
  "Kota Cimahi": [
    { nama: "SMA Negeri 1 Cimahi", alamat: "Jl. Pasir Kumeli No.1, Pasirkaliki, Kec. Cimahi Utara, Kota Cimahi" },
    { nama: "SMA Negeri 2 Cimahi", alamat: "Jl. Sriwijaya No.32, Setiamanah, Kec. Cimahi Tengah, Kota Cimahi" },
    { nama: "SMA Negeri 3 Cimahi", alamat: "Jl. Pesantren No.108, Cibabat, Kec. Cimahi Utara, Kota Cimahi" },
  ],
  "Kota Bogor": [
    { nama: "SMA Negeri 1 Bogor", alamat: "Jl. Ir. H. Juanda No.16, Paledang, Kec. Bogor Tengah, Kota Bogor" },
    { nama: "SMA Negeri 2 Bogor", alamat: "Jl. Keranji No.1, Budi Agung, Kec. Tanah Sereal, Kota Bogor" },
    { nama: "SMA Negeri 3 Bogor", alamat: "Jl. Pakuan No.4, Baranangsiang, Kec. Bogor Timur, Kota Bogor" },
  ],
  "Kab. Bogor": [
    { nama: "SMA Negeri 1 Cibinong", alamat: "Jl. Mayor Oking Jaya Atmaja No.73, Cibinong, Kab. Bogor" },
    { nama: "SMA Negeri 1 Ciawi", alamat: "Jl. Raya Tapos No.63, Ciawi, Kab. Bogor" },
  ],
  "Kota Depok": [
    { nama: "SMA Negeri 1 Depok", alamat: "Jl. Nusantara Raya No.317, Depok Jaya, Kec. Pancoran Mas, Kota Depok" },
    { nama: "SMA Negeri 2 Depok", alamat: "Jl. Limo Raya No.1, Limo, Kota Depok" },
  ],
  "Kota Bekasi": [
    { nama: "SMA Negeri 1 Bekasi", alamat: "Jl. KH. Agus Salim No.181, Bekasi Timur, Kota Bekasi" },
    { nama: "SMA Negeri 2 Bekasi", alamat: "Jl. Tangkuban Perahu Raya No.1, Kayuringin Jaya, Kota Bekasi" },
  ],
  "Kab. Bekasi": [
    { nama: "SMA Negeri 1 Cikarang Pusat", alamat: "Jl. Komplek Pemda Kab. Bekasi, Sukamahi, Cikarang Pusat" },
    { nama: "SMA Negeri 1 Cikarang Utara", alamat: "Jl. Fatahillah No.1, Cikarang Utara, Kab. Bekasi" },
  ],
  "Kota Sukabumi": [
    { nama: "SMA Negeri 1 Sukabumi", alamat: "Jl. R.E. Martadinata No.166, Cikole, Kota Sukabumi" },
    { nama: "SMA Negeri 2 Sukabumi", alamat: "Jl. Karamat No.93, Karamat, Kec. Gunungpuruh, Kota Sukabumi" },
  ],
  "Kab. Sukabumi": [
    { nama: "SMA Negeri 1 Cibadak", alamat: "Jl. Siliwangi No.123, Cibadak, Kab. Sukabumi" },
    { nama: "SMA Negeri 1 Palabuhanratu", alamat: "Jl. Raya Cisolok KM.1, Palabuhanratu, Kab. Sukabumi" },
  ],
  "Kab. Cianjur": [
    { nama: "SMA Negeri 1 Cianjur", alamat: "Jl. Pangeran Hidayatullah No.42, Skanagara, Kab. Cianjur" },
    { nama: "SMA Negeri 2 Cianjur", alamat: "Jl. Didi Prawiranataku No.1, Cianjur, Kab. Cianjur" },
  ],
  "Kab. Karawang": [
    { nama: "SMA Negeri 1 Karawang", alamat: "Jl. Ahmad Yani No.22, Nagasari, Kec. Karawang Barat, Kab. Karawang" },
    { nama: "SMA Negeri 2 Karawang", alamat: "Jl. Laks. L RE. Martadinata No.3, Karawang Barat, Kab. Karawang" },
  ],
  "Kab. Purwakarta": [
    { nama: "SMA Negeri 1 Purwakarta", alamat: "Jl. KK Singawinata No.83, Nagri Tengah, Kab. Purwakarta" },
  ],
  "Kab. Subang": [
    { nama: "SMA Negeri 1 Subang", alamat: "Jl. Ki Hajar Dewantara No.14, Karanganyar, Kab. Subang" },
  ],
  "Kab. Sumedang": [
    { nama: "SMA Negeri 1 Sumedang", alamat: "Jl. Prabu Geusan Ulun No.39, Regol Wetan, Kab. Sumedang" },
  ],
  "Kab. Garut": [
    { nama: "SMA Negeri 1 Garut", alamat: "Jl. Merdeka No.91, Jayaraga, Kec. Tarogong Kidul, Kab. Garut" },
  ],
  "Kota Tasikmalaya": [
    { nama: "SMA Negeri 1 Tasikmalaya", alamat: "Jl. Rumah Sakit No.28, Empangsari, Kec. Tawang, Kota Tasikmalaya" },
  ],
  "Kab. Tasikmalaya": [
    { nama: "SMA Negeri 1 Singaparna", alamat: "Jl. Pahlawan KHZ. Musthafa, Singaparna, Kab. Tasikmalaya" },
  ],
  "Kab. Ciamis": [
    { nama: "SMA Negeri 1 Ciamis", alamat: "Jl. Gunung Galunggung No.37, Ciamis, Kab. Ciamis" },
  ],
  "Kota Banjar": [
    { nama: "SMA Negeri 1 Banjar", alamat: "Jl. KH. Mustofa No.1, Banjar, Kota Banjar" },
  ],
  "Kab. Pangandaran": [
    { nama: "SMA Negeri 1 Pangandaran", alamat: "Jl. Merdeka No.182, Pananjung, Kab. Pangandaran" },
  ],
  "Kota Cirebon": [
    { nama: "SMA Negeri 1 Cirebon", alamat: "Jl. Wahidin Sudirohusodo No.81, Kejaksan, Kota Cirebon" },
  ],
  "Kab. Cirebon": [
    { nama: "SMA Negeri 1 Sumber", alamat: "Jl. Sultan Agung No.2, Sumber, Kab. Cirebon" },
  ],
  "Kab. Indramayu": [
    { nama: "SMA Negeri 1 Indramayu", alamat: "Jl. Soekarno Hatta No.2, Indramayu, Kab. Indramayu" },
  ],
  "Kab. Majalengka": [
    { nama: "SMA Negeri 1 Majalengka", alamat: "Jl. KH. Abdul Halim No.50, Majalengka, Kab. Majalengka" },
  ],
  "Kab. Kuningan": [
    { nama: "SMA Negeri 1 Kuningan", alamat: "Jl. Siliwangi No.55, Kuningan, Kab. Kuningan" },
  ],
};

const DAFTAR_GELAR = [
  "",
  "S.Pd.",
  "S.Pd.I.",
  "S.S.",
  "S.Si.",
  "S.T.",
  "S.Kom.",
  "S.E.",
  "S.Sos.",
  "M.Pd.",
  "M.Pd.I.",
  "M.Si.",
  "M.T.",
  "M.Kom.",
  "M.M.",
  "Dr.",
];

const getProfileFormData = (profile: GuruProfileProps["profile"]) => {
  let currentGelar = profile.gelar;
  let currentNip = profile.nip;

  if (typeof window !== "undefined") {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!currentGelar) currentGelar = parsed.gelar || "";
        if (!currentNip) currentNip = parsed.nip || "";
      } catch {
        // Abaikan error parse JSON jika terjadi masalah
      }
    }
  }

  return {
    nama: profile.nama || "",
    gelar: currentGelar || "",
    email: profile.email || "",
    nip: currentNip || "",
    sekolah: profile.sekolah || "",
    alamatSekolah: profile.alamatSekolah || "",
    noHp: profile.noHp || "",
  };
};

export default function GuruProfileView({ profile, onRefresh }: GuruProfileProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getToken = () => localStorage.getItem("token") || "";

  const [formData, setFormData] = useState(() => getProfileFormData(profile));
  const [selectedDaerah, setSelectedDaerah] = useState<string>("");
  const [ketikManual, setKetikManual] = useState<boolean>(false);

  const [passwordData, setPasswordData] = useState({
    passwordLama: "",
    passwordBaru: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cari daerah dan alamat sekolah saat awal memuat profil
  useEffect(() => {
    const initialData = getProfileFormData(profile);
    setFormData(initialData);

    const currentSchool = profile.sekolah || "";
    if (currentSchool) {
      let foundDaerah = "";
      let foundAlamat = profile.alamatSekolah || "";

      for (const [daerah, listSekolah] of Object.entries(DATA_SEKOLAH_JABAR)) {
        const item = listSekolah.find((s) => s.nama === currentSchool);
        if (item) {
          foundDaerah = daerah;
          if (!foundAlamat) foundAlamat = item.alamat;
          break;
        }
      }

      if (foundDaerah) {
        setSelectedDaerah(foundDaerah);
        setFormData((prev) => ({ ...prev, alamatSekolah: foundAlamat }));
        setKetikManual(false);
      } else {
        setKetikManual(true);
      }
    }
  }, [profile]);

  const namaLengkapBerGelar = formData.gelar 
    ? `${formData.nama}, ${formData.gelar}` 
    : formData.nama;

  const handleNoHpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormData((prev) => ({ ...prev, noHp: value }));
  };

  const handleDaerahChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const daerah = e.target.value;
    setSelectedDaerah(daerah);
    setFormData((prev) => ({ ...prev, sekolah: "", alamatSekolah: "" }));
  };

  const handleSekolahSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const namaSekolah = e.target.value;
    const listSekolah = DATA_SEKOLAH_JABAR[selectedDaerah] || [];
    const itemTarget = listSekolah.find((s) => s.nama === namaSekolah);

    setFormData((prev) => ({
      ...prev,
      sekolah: namaSekolah,
      alamatSekolah: itemTarget ? itemTarget.alamat : "",
    }));
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nama Lengkap" });
      return;
    }
    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Email" });
      return;
    }
    if (!formData.sekolah.trim()) {
      setMessage({ type: "error", text: "Mohon pilih atau isi asal Sekolah Anda" });
      return;
    }
    if (!formData.noHp.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nomor HP" });
      return;
    }

    if (!formData.email.trim().toLowerCase().endsWith("@gmail.com")) {
      setMessage({
        type: "error",
        text: "Email harus berakhiran @gmail.com (contoh: nama@gmail.com)",
      });
      return;
    }

    if (!formData.noHp.startsWith("08")) {
      setMessage({
        type: "error",
        text: "Nomor HP harus diawali dengan 08",
      });
      return;
    }
    if (formData.noHp.length < 10) {
      setMessage({
        type: "error",
        text: "Nomor HP minimal 10 digit",
      });
      return;
    }

    setSavingProfile(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      const existingUser = localStorage.getItem("user");
      const parsedUser = existingUser ? JSON.parse(existingUser) : {};
      const updatedUser = {
        ...parsedUser,
        nama: formData.nama,
        gelar: formData.gelar,
        email: formData.email,
        nip: formData.nip,
        sekolah: formData.sekolah,
        alamatSekolah: formData.alamatSekolah,
        noHp: formData.noHp,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (json.sukses) {
        setMessage({ type: "success", text: json.pesan || "Profil berhasil diperbarui" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal memperbarui profil" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(passwordData),
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: json.pesan || "Password berhasil diubah" });
        setPasswordData({ passwordLama: "", passwordBaru: "" });
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal mengubah password" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran file maksimal 5MB" });
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("foto", file);

    setUploadingFoto(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/upload/foto-profil`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formDataUpload,
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: "Foto profil berhasil diperbarui" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal mengunggah foto" });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengunggah foto profil" });
    } finally {
      setUploadingFoto(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Pengaturan Profil Guru</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data diri dan informasi akun Anda</p>
        </div>
        <span className="bg-sky-100 text-sky-700 font-semibold px-3 py-1 rounded-full text-xs uppercase">
          Guru
        </span>
      </div>

      {/* Alert Notifikasi */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Kolom Kiri - Foto & Info Ringkas */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)] text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              {profile.fotoProfil ? (
                <Image src={profile.fotoProfil} alt="Foto Profil" fill className="rounded-full object-cover border-2 border-[var(--color-navy)]" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-3xl font-bold border-2 border-slate-300">
                  {profile.nama?.charAt(0) || "G"}
                </div>
              )}
              {uploadingFoto && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">
                  Mengunggah...
                </div>
              )}
            </div>

            <label className="cursor-pointer inline-block bg-[var(--color-pale)] hover:bg-slate-200 text-[var(--color-navy)] text-xs font-semibold px-4 py-2 rounded-full transition">
              {uploadingFoto ? "Memproses..." : "Ubah Foto Profil"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoUpload} disabled={uploadingFoto} />
            </label>
            <p className="text-[11px] text-gray-400 mt-2">Maks. 5MB (JPG, PNG, WebP)</p>

            <hr className="my-4 border-slate-100" />

            <div className="text-left space-y-1 text-sm">
              <p className="font-semibold text-slate-800">{namaLengkapBerGelar}</p>
              <p className="text-xs text-gray-500">{profile.email}</p>
              <p className="text-xs text-gray-500">{formData.sekolah || "Sekolah Belum Diatur"}</p>
            </div>
          </div>

          {/* Modul Selesai */}
          {profile.progress && profile.progress.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
              <h3 className="font-bold text-sm text-[var(--color-navy)] mb-3">Modul Selesai</h3>
              <div className="space-y-2">
                {profile.progress.map((item, idx) => (
                  <div key={idx} className="bg-[var(--color-pale)] p-2.5 rounded-xl text-xs flex justify-between items-center">
                    <span className="font-medium text-slate-700">{item.module.judul}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan - Form Utama */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
            <h2 className="text-lg font-bold text-[var(--color-navy)] mb-4">Informasi Pribadi</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                    placeholder="Masukkan Nama Lengkap"
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gelar (Pilihan)</label>
                  <select
                    value={formData.gelar}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer"
                  >
                    <option value="">-- Tanpa Gelar --</option>
                    {DAFTAR_GELAR.filter(Boolean).map((gelar, idx) => (
                      <option key={idx} value={gelar}>
                        {gelar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email (@gmail.com)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contoh@gmail.com"
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input
                    type="text"
                    value={formatNipDisplay(formData.nip)}
                    disabled
                    readOnly
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none select-none font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">NIP bersifat permanen dan tidak dapat diubah.</p>
                </div>
              </div>

              {/* SECTION PILIH KOTA, SEKOLAH, & ALAMAT JAWA BARAT */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">Asal Sekolah (Jawa Barat)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setKetikManual(!ketikManual);
                      setSelectedDaerah("");
                      setFormData((prev) => ({ ...prev, sekolah: "", alamatSekolah: "" }));
                    }}
                    className="text-[11px] text-sky-600 hover:underline font-semibold"
                  >
                    {ketikManual ? "Pilih dari List Sekolah" : "Sekolah tidak ada di list? Ketik manual"}
                  </button>
                </div>

                {!ketikManual ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Filter Kota / Kabupaten */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kabupaten / Kota</label>
                        <select
                          value={selectedDaerah}
                          onChange={handleDaerahChange}
                          className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer text-slate-700"
                        >
                          <option value="">-- Pilih Kab/Kota --</option>
                          {Object.keys(DATA_SEKOLAH_JABAR).map((kota, idx) => (
                            <option key={idx} value={kota}>
                              {kota}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* List Sekolah Sesuai Daerah */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Sekolah</label>
                        <select
                          value={formData.sekolah}
                          disabled={!selectedDaerah}
                          onChange={handleSekolahSelect}
                          className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Pilih Sekolah --</option>
                          {selectedDaerah &&
                            DATA_SEKOLAH_JABAR[selectedDaerah]?.map((s, idx) => (
                              <option key={idx} value={s.nama}>
                                {s.nama}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Field Alamat Otomatis */}
                    {formData.alamatSekolah && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Alamat Sekolah (Otomatis)</label>
                        <textarea
                          value={formData.alamatSekolah}
                          readOnly
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-600 outline-none resize-none cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Form Input Manual */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nama Sekolah</label>
                      <input
                        type="text"
                        value={formData.sekolah}
                        onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                        placeholder="Contoh: SMA Negeri 1 Bandung"
                        required
                        className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Alamat Sekolah</label>
                      <input
                        type="text"
                        value={formData.alamatSekolah}
                        onChange={(e) => setFormData({ ...formData, alamatSekolah: e.target.value })}
                        placeholder="Masukkan jalan, kecamatan, kabupaten/kota"
                        className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor HP (08xx, Maks 13 Angka)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  value={formData.noHp}
                  onChange={handleNoHpChange}
                  placeholder="081234567890"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingProfile} className="bg-[var(--color-navy)] text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                  {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>

          {/* Form Ganti Password */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
            <h2 className="text-lg font-bold text-[var(--color-navy)] mb-4">Ganti Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password Saat Ini</label>
                  <input
                    type="password"
                    value={passwordData.passwordLama}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordLama: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={passwordData.passwordBaru}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordBaru: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingPassword} className="bg-amber-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition">
                  {savingPassword ? "Memperbarui..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}