"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUserById, updateUser, resetUserPassword } from "@/services/user.service";
import { formatNipDisplay } from "@/lib/formatNip";
import { useApp } from "@/app/context/AppContext";

const statusOptions = ["aktif", "nonaktif", "pensiun", "wafat"];

interface UserDetail {
  id: string;
  nama: string;
  email: string;
  role: string;
  nip?: string;
  sekolah?: string;
  kotaKab?: string;
  kecamatan?: string;
  status?: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useApp();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    sekolah: "",
    kotaKab: "",
    kecamatan: "",
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
          kotaKab: data.kotaKab || "",
          kecamatan: data.kecamatan || "",
          status: data.status || "aktif",
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t("Gagal memuat data pengguna.", "Failed to load user data."));
        }
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [id, router, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateUser(id, {
        email: formData.email,
        sekolah: formData.sekolah,
        kotaKab: formData.kotaKab,
        kecamatan: formData.kecamatan,
        status: formData.status,
      });
      setMessage({ type: "success", text: t("Data guru berhasil diperbarui.", "Teacher data updated successfully.") });
    } catch (err) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: t("Gagal memperbarui data guru.", "Failed to update teacher data.") });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordBaru.length < 8) {
      setPasswordMessage({ type: "error", text: t("Password baru minimal 8 karakter.", "New password must be at least 8 characters.") });
      return;
    }

    setResetting(true);

    try {
      await resetUserPassword(id, passwordBaru);
      setPasswordMessage({ type: "success", text: t("Password guru berhasil direset.", "Teacher password reset successfully.") });
      setPasswordBaru("");
    } catch (err) {
      if (err instanceof Error) {
        setPasswordMessage({ type: "error", text: err.message });
      } else {
        setPasswordMessage({ type: "error", text: t("Gagal mereset password.", "Failed to reset password.") });
      }
    } finally {
      setResetting(false);
    }
  }

  if (loadingData) {
    return <p className="text-center mt-16 text-gray-500 dark:text-slate-400">{t("Memuat data pengguna...", "Loading user data...")}</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-[var(--color-navy)] transition dark:text-slate-400 dark:hover:text-slate-200">
          ← {t("Kembali", "Back")}
        </Link>
      </div>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-navy)] mb-1 dark:text-slate-100">
          {t("Edit Akun Guru", "Edit Teacher Account")}
        </h1>
        <p className="text-gray-500 dark:text-slate-400">{t("Ubah email, sekolah, dan status akun guru", "Change email, school, and teacher account status")}</p>
      </div>

      {/* Form Edit Data */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)] dark:bg-slate-900">
        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Nama", "Name")}</label>
              <input
                type="text"
                value={user?.nama || ""}
                disabled
                readOnly
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("NIP (Nomor Induk Pegawai)", "NIP (Employee Identification Number)")}</label>
              <input
                type="text"
                value={formatNipDisplay(user?.nip)}
                disabled
                readOnly
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-100 text-slate-500 cursor-not-allowed outline-none select-none font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1 dark:text-slate-500">{t("NIP bersifat permanen dan tidak dapat diubah.", "NIP is permanent and cannot be changed.")}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Email", "Email")}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Sekolah", "School")}</label>
            <input
              type="text"
              value={formData.sekolah}
              onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
              placeholder={t("Contoh: SMA Negeri 1 Bandung", "Example: SMA Negeri 1 Bandung")}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Kota/Kabupaten", "City/Regency")}</label>
              <input
                type="text"
                value={formData.kotaKab}
                onChange={(e) => setFormData({ ...formData, kotaKab: e.target.value })}
                placeholder={t("Contoh: Kota Bandung", "Example: Bandung City")}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Kecamatan", "District")}</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder={t("Contoh: Coblong", "Example: Coblong")}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Status", "Status")}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500 outline-none bg-white cursor-pointer capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
              {saving ? t("Menyimpan...", "Saving...") : t("Simpan Perubahan", "Save Changes")}
            </button>
          </div>
        </form>
      </div>

      {/* Reset Password */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-border-soft)] dark:bg-slate-900">
        <h2 className="text-lg font-bold text-[var(--color-navy)] mb-1 dark:text-slate-100">{t("Reset Password", "Reset Password")}</h2>
        <p className="text-sm text-gray-500 mb-4 dark:text-slate-400">{t("Atur password baru untuk akun guru ini (minimal 8 karakter).", "Set a new password for this teacher account (minimum 8 characters).")}</p>

        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
            passwordMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}>
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{t("Password Baru", "New Password")}</label>
            <input
              type="password"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              minLength={8}
              required
              placeholder={t("Minimal 8 karakter", "Minimum 8 characters")}
              className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={resetting}
              className="bg-amber-500 text-white text-sm px-5 py-2.5 rounded-full hover:bg-amber-600 transition disabled:opacity-60"
            >
              {resetting ? t("Mereset...", "Resetting...") : t("Reset Password", "Reset Password")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}