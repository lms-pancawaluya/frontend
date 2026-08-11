"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";

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

export default function AdminProfileView({ profile, onRefresh }: AdminProfileProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getToken = () => localStorage.getItem("token") || "";

  const [formData, setFormData] = useState({
    nama: profile.nama || "",
    email: profile.email || "",
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
      const res = await fetch(`${API_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
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
      const res = await fetch(`${API_URL}/api/upload/foto-profil`, {
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Profil Administrator</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola informasi akun administrator sistem</p>
        </div>
        <span className="bg-purple-100 text-purple-700 font-semibold px-3 py-1 rounded-full text-xs uppercase">
          Administrator
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center h-fit">
          <div className="relative w-28 h-28 mx-auto mb-4">
            {profile.fotoProfil ? (
              <Image src={profile.fotoProfil} alt="Foto Profil" fill className="rounded-full object-cover border-2 border-purple-600" />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-3xl font-bold border-2 border-slate-300">
                {profile.nama?.charAt(0) || "A"}
              </div>
            )}
            {uploadingFoto && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">
                Uploading...
              </div>
            )}
          </div>

          <label className="cursor-pointer inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full transition">
            {uploadingFoto ? "Memproses..." : "Ubah Foto Profil"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoUpload} disabled={uploadingFoto} />
          </label>
          <p className="text-[11px] text-gray-400 mt-2">Maks. 5MB (JPG, PNG, WebP)</p>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Informasi Akun Admin</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Administrator</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingProfile} className="bg-purple-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                  {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Ganti Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password Saat Ini</label>
                  <input
                    type="password"
                    value={passwordData.passwordLama}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordLama: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={passwordData.passwordBaru}
                    onChange={(e) => setPasswordData({ ...passwordData, passwordBaru: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
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