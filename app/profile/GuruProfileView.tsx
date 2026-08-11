"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Image from "next/image";

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
    noHp?: string;
    fotoProfil?: string;
    progress?: ProgressItem[];
  };
  onRefresh: () => void;
}

// Daftar Gelar Akademik Guru
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

export default function GuruProfileView({ profile, onRefresh }: GuruProfileProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getToken = () => localStorage.getItem("token") || "";

  // Ambil gelar dari localStorage jika API belum mendukung kolom gelar
  const getSavedGelar = () => {
    if (profile.gelar) return profile.gelar;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.gelar || "";
        } catch {
          return "";
        }
      }
    }
    return "";
  };

  const [formData, setFormData] = useState({
    nama: profile.nama || "",
    gelar: getSavedGelar(),
    email: profile.email || "",
    nip: profile.nip || "",
    sekolah: profile.sekolah || "",
    noHp: profile.noHp || "",
  });

  const [passwordData, setPasswordData] = useState({
    passwordLama: "",
    passwordBaru: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // EFEEK SINKRONISASI: Meng-update state input form setiap kali data profile dari API selesai dimuat / di-refresh
  useEffect(() => {
    let currentGelar = profile.gelar;
    if (!currentGelar) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          currentGelar = JSON.parse(savedUser).gelar || "";
        } catch {
          currentGelar = "";
        }
      }
    }

    setFormData({
      nama: profile.nama || "",
      gelar: currentGelar || "",
      email: profile.email || "",
      nip: profile.nip || "",
      sekolah: profile.sekolah || "",
      noHp: profile.noHp || "",
    });
  }, [profile]);

  // Format Nama Lengkap Beserta Gelar
  const namaLengkapBerGelar = formData.gelar 
    ? `${formData.nama}, ${formData.gelar}` 
    : formData.nama;

  // Handler NIP: Hanya angka & maksimal 18 digit
  const handleNipChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 18);
    setFormData((prev) => ({ ...prev, nip: value }));
  };

  // Handler No HP: Hanya angka & maksimal 13 digit
  const handleNoHpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormData((prev) => ({ ...prev, noHp: value }));
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Validasi Form
    if (!formData.nama.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nama Lengkap" });
      return;
    }
    if (!formData.email.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Email" });
      return;
    }
    if (!formData.nip.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form NIP" });
      return;
    }
    if (!formData.sekolah.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Sekolah" });
      return;
    }
    if (!formData.noHp.trim()) {
      setMessage({ type: "error", text: "Mohon lengkapi form Nomor HP" });
      return;
    }

    // 2. Validasi Format Email
    if (!formData.email.trim().toLowerCase().endsWith("@gmail.com")) {
      setMessage({
        type: "error",
        text: "Email harus berakhiran @gmail.com (contoh: nama@gmail.com)",
      });
      return;
    }

    // 3. Validasi NIP
    if (formData.nip.length !== 18) {
      setMessage({
        type: "error",
        text: "NIP harus berjumlah 18 digit angka",
      });
      return;
    }

    // 4. Validasi No HP
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

      // Selalu simpan ke localStorage sebagai cadangan persistence
      const existingUser = localStorage.getItem("user");
      const parsedUser = existingUser ? JSON.parse(existingUser) : {};
      const updatedUser = {
        ...parsedUser,
        nama: formData.nama,
        gelar: formData.gelar,
        email: formData.email,
        nip: formData.nip,
        sekolah: formData.sekolah,
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
      setMessage({ type: "error", text: "Terjadi kesalahan" });
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
              <p className="text-xs text-gray-500">{profile.sekolah || "Sekolah Belum Diatur"}</p>
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
          {/* Form Informasi Pribadi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
            <h2 className="text-lg font-bold text-[var(--color-navy)] mb-4">Informasi Pribadi</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Input Nama Lengkap */}
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

                {/* Dropdown List Gelar Guru */}
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIP (Maks. 18 Angka)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={18}
                    value={formData.nip}
                    onChange={handleNipChange}
                    placeholder="198501012010011001"
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sekolah</label>
                  <input
                    type="text"
                    value={formData.sekolah}
                    onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                    placeholder="SMA Negeri 1 Bandung"
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
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