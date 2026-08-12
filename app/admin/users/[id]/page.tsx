"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUserById, updateUser, resetUserPassword } from "@/services/user.service";
import { formatNipDisplay } from "@/lib/formatNip";

const statusOptions = ["aktif", "nonaktif", "pensiun", "wafat"];

interface UserDetail {
  id: string;
  nama: string;
  email: string;
  role: string;
  nip?: string;
  sekolah?: string;
  status?: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    sekolah: "",
    status: "aktif",
  });

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwordBaru, setPasswordBaru] = useState("");
  const [resetting, setResetting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function loadData() {
      try {
        const data = await getUserById(id);
        setUser(data);
        setFormData({
          email: data.email || "",
          sekolah: data.sekolah || "",
          status: data.status || "aktif",
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat data pengguna.");
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateUser(id, {
        email: formData.email,
        sekolah: formData.sekolah,
        status: formData.status,
      });
      setMessage({ type: "success", text: "Data guru berhasil diperbarui." });
    } catch (err) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "Gagal memperbarui data guru." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordBaru.length < 8) {
      setPasswordMessage({ type: "error", text: "Password baru minimal 8 karakter." });
      return;
    }

    setResetting(true);

    try {
      await resetUserPassword(id, passwordBaru);
      setPasswordMessage({ type: "success", text: "Password guru berhasil direset." });
      setPasswordBaru("");
    } catch (err) {
      if (err instanceof Error) {
        setPasswordMessage({ type: "error", text: err.message });
      } else {
        setPasswordMessage({ type: "error", text: "Gagal mereset password." });
      }
    } finally {
      setResetting(false);
    }
  }

  if (loadingData) {
    return <p className="text-center mt-16 text-gray-500">Memuat data pengguna...</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-[var(--color-navy)] transition">
          ← Kembali
        </Link>
      </div>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-1">
          Edit Akun Guru
        </h1>
        <p className="text-gray-500">Ubah email, sekolah, dan status akun guru</p>
      </div>

      {/* Form Edit Data */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama</label>
              <input
                type="text"
                value={user?.nama || ""}
                disabled
                readOnly
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NIP (Nomor Induk Pegawai)</label>
              <input
                type="text"
                value={formatNipDisplay(user?.nip)}
                disabled
                readOnly
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none select-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">NIP bersifat permanen dan tidak dapat diubah.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sekolah</label>
            <input
              type="text"
              value={formData.sekolah}
              onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
              placeholder="Contoh: SMA Negeri 1 Bandung"
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer capitalize"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--color-navy)] text-white text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      {/* Reset Password */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)]">
        <h2 className="text-lg font-bold text-[var(--color-navy)] mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-4">Atur password baru untuk akun guru ini (minimal 8 karakter).</p>

        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
            passwordMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
            <input
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              minLength={8}
              required
              placeholder="Minimal 8 karakter"
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={resetting}
              className="bg-amber-500 text-white text-sm px-5 py-2.5 rounded-full hover:bg-amber-600 transition disabled:opacity-60"
            >
              {resetting ? "Mereset..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}