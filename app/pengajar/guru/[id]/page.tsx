"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUserById, updateUser } from "@/services/user.service";
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

export default function PengajarGuruDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useApp();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [formData, setFormData] = useState({ email: "", sekolah: "", kotaKab: "", kecamatan: "", status: "aktif" });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser?.role !== "pengajar") {
      router.push(currentUser?.role === "admin" ? "/admin" : "/dashboard");
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
        setError(err instanceof Error ? err.message : t("Gagal memuat data guru.", "Failed to load teacher data."));
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
      // Backend authorizes: pengajar may only edit guru in the same school (else 403).
      await updateUser(id, {
        email: formData.email,
        sekolah: formData.sekolah,
        kotaKab: formData.kotaKab,
        kecamatan: formData.kecamatan,
        status: formData.status,
      });
      setMessage({ type: "success", text: t("Data guru berhasil diperbarui.", "Teacher data updated successfully.") });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : t("Gagal memperbarui data guru.", "Failed to update teacher data.") });
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return <p className="text-center mt-16 text-gray-500 dark:text-slate-400">{t("Memuat data guru...", "Loading teacher data...")}</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link href="/pengajar/guru" className="text-sm text-gray-500 transition hover:text-[var(--color-navy)] dark:text-slate-400 dark:hover:text-slate-200">
        ← {t("Kembali ke Kelola Guru", "Back to Manage Teachers")}
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)] dark:text-slate-100">{t("Detail Guru", "Teacher Detail")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t("Perbarui email, sekolah, lokasi, dan status akun guru binaan.", "Update the email, school, location, and account status of the supervised teacher.")}</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm dark:bg-slate-900">
        {message && (
          <div
            className={`mb-4 rounded-xl border p-3 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Nama", "Name")}</label>
              <input
                type="text"
                value={user?.nama || ""}
                disabled
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("NIP", "NIP")}</label>
              <input
                type="text"
                value={formatNipDisplay(user?.nip)}
                disabled
                readOnly
                className="w-full cursor-not-allowed select-none rounded-xl border border-slate-200 bg-slate-100 p-2.5 font-mono text-sm text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{t("NIP bersifat permanen dan tidak dapat diubah.", "NIP is permanent and cannot be changed.")}</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Email", "Email")}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Sekolah", "School")}</label>
            <input
              type="text"
              value={formData.sekolah}
              onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
              placeholder={t("Contoh: SMA Negeri 1 Bandung", "Example: SMA Negeri 1 Bandung")}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Kota/Kabupaten", "City/Regency")}</label>
              <input
                type="text"
                value={formData.kotaKab}
                onChange={(e) => setFormData({ ...formData, kotaKab: e.target.value })}
                placeholder={t("Contoh: Kota Bandung", "Example: Bandung City")}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Kecamatan", "District")}</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder={t("Contoh: Coblong", "Example: Coblong")}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{t("Status", "Status")}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-sm capitalize outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--color-navy)] px-5 py-2.5 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? t("Menyimpan...", "Saving...") : t("Simpan Perubahan", "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
