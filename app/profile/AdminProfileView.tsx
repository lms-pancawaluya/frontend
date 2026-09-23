"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { API_URL, fetchApi } from "@/lib/api";

interface AdminProfileProps {
  profile: {
    id: string;
    nama: string;
    email: string;
    role: string;
    fotoProfil?: string;
  };
  onRefresh: () => void;
}

type AdminTab = "akun" | "keamanan";

export default function AdminProfileView({ profile, onRefresh }: AdminProfileProps) {
  const getToken = () => localStorage.getItem("token") || "";

  const [activeTab, setActiveTab] = useState<AdminTab>("akun");

  const [formData, setFormData] = useState({
    nama: profile.nama || "",
  });

  const [passwordData, setPasswordData] = useState({
    passwordLama: "",
    passwordBaru: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Update Data Admin
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);

    try {
      const res = await fetchApi(`${API_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          nama: formData.nama,
        }),
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: json.pesan || "Profil admin berhasil diupdate" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal mengupdate profil" });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setMessage(null);

    try {
      const res = await fetchApi(`${API_URL}/api/users/profile/me/password`, {
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

  // Upload Foto Profil Admin
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
      const res = await fetchApi(`${API_URL}/api/upload/foto-profil`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formDataUpload,
      });

      const json = await res.json();
      if (json.sukses) {
        setMessage({ type: "success", text: "Foto profil admin berhasil diunggah" });
        onRefresh();
      } else {
        setMessage({ type: "error", text: json.pesan || "Gagal unggah foto" });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengunggah foto" });
    } finally {
      setUploadingFoto(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* BANNER UTAMA — struktur selaras dengan Profile Guru */}
      <div className="relative bg-gradient-to-r from-[#002B66] via-[#0047A5] to-[#109B51] rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#419AD6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-[#F3BF10]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Badge Atas */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-amber-300 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#F3BF10] animate-pulse" />
              LMS Panca Waluya Jabar
            </span>
          </div>

          {/* Profil Header & Foto */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-lg bg-white/10 backdrop-blur-md flex items-center justify-center">
                  {profile.fotoProfil ? (
                    <Image src={profile.fotoProfil} alt="Foto Profil" fill className="object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-[#419AD6]">
                      {profile.nama?.charAt(0) || "A"}
                    </span>
                  )}
                  {uploadingFoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-medium">
                      Mengunggah...
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-white hover:bg-slate-50 text-[#0047A5] p-2 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoUpload} disabled={uploadingFoto} />
                </label>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.nama || "Administrator"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-100/90 flex items-center gap-1.5 font-medium">
                  <svg className="w-4 h-4 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile.email || "Email belum diatur"}
                </p>
                <p className="text-[11px] text-slate-200/70">Kelola informasi akun administrator sistem</p>
              </div>
            </div>
          </div>

          {/* 2 WIDGET KARTU DI DALAM BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4">
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Peran Akun</p>
              <p className="text-lg font-bold text-white mt-1 capitalize">{profile.role || "Administrator"}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-0">
              <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Email Terdaftar</p>
              <p className="text-sm sm:text-base font-bold text-white mt-1 truncate" title={profile.email || ""}>
                {profile.email || "Belum diatur"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT MESSAGES */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium border flex items-center gap-3 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-600 shrink-0 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-600 shrink-0 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB NAVIGATION PILL STYLE */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl inline-flex gap-1 text-xs font-semibold dark:bg-slate-800/80">
        <button
          onClick={() => setActiveTab("akun")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "akun"
              ? "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Data Akun
        </button>

        <button
          onClick={() => setActiveTab("keamanan")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "keamanan"
              ? "bg-white text-slate-900 shadow-xs font-bold dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          Keamanan Akun
        </button>
      </div>

      {/* TAB 1: DATA AKUN */}
      {activeTab === "akun" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Informasi Akun Administrator</h2>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Kelola data akun administrator sistem LMS.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">Nama Administrator</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  placeholder="Masukkan Nama Administrator"
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 cursor-not-allowed outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: KEAMANAN AKUN */}
      {activeTab === "keamanan" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-6 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Keamanan & Kata Sandi</h2>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Jaga kerahasiaan kata sandi akun LMS Anda secara berkala.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">Password Saat Ini</label>
              <input
                type="password"
                value={passwordData.passwordLama}
                onChange={(e) => setPasswordData({ ...passwordData, passwordLama: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">Password Baru</label>
              <input
                type="password"
                value={passwordData.passwordBaru}
                onChange={(e) => setPasswordData({ ...passwordData, passwordBaru: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] outline-none transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {savingPassword ? "Memperbarui..." : "Update Password Akun"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
