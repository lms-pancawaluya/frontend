"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useApp } from "@/app/context/AppContext";
import { Sun, Moon, Monitor, Globe } from "lucide-react";
import { API_URL, fetchApi } from "@/lib/api";

type TabType = "general" | "preferences" | "security" | "notifications";

interface ProfileData {
  nama: string;
  email: string;
  nip: string;
  sekolah: string;
  noHp: string;
  alamat: string;
  fotoProfil?: string;
}

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, t } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [profile, setProfile] = useState<ProfileData>({
    nama: "",
    email: "",
    nip: "",
    sekolah: "",
    noHp: "",
    alamat: "",
    fotoProfil: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    moduleUpdates: true,
  });

  // Load User Data
  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchApi(`${API_URL}/api/users/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result) {
          const data = result.data || result;
          setProfile({
            nama: data.nama || "",
            email: data.email || "",
            nip: data.nip || "",
            sekolah: data.sekolah || "",
            noHp: data.noHp || "",
            alamat: data.alamat || "",
            fotoProfil: data.fotoProfil || data.foto || "",
          });
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Simpan Perubahan Profil
  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetchApi(`${API_URL}/api/users/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        const updated = await res.json();
        const userData = updated.data || updated;
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...localUser, ...userData }));
        window.dispatchEvent(new Event("authChange"));

        setMessage({ type: "success", text: t("Pengaturan profil berhasil diperbarui!", "Profile settings updated successfully!") });
      } else {
        setMessage({ type: "error", text: t("Gagal memperbarui profil.", "Failed to update profile.") });
      }
    } catch {
      setMessage({ type: "error", text: t("Terjadi kesalahan jaringan.", "Network error occurred.") });
    } finally {
      setSaving(false);
    }
  };

  // Simpan Password
  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: t("Konfirmasi kata sandi baru tidak cocok.", "Password confirmation does not match.") });
      return;
    }

    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetchApi(`${API_URL}/api/users/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("Kata sandi berhasil diubah!", "Password changed successfully!") });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMessage({ type: "error", text: t("Kata sandi lama salah.", "Incorrect current password.") });
      }
    } catch {
      setMessage({ type: "error", text: t("Gagal mengubah kata sandi.", "Failed to change password.") });
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalSave = () => {
    if (activeTab === "security") {
      handleSavePassword();
    } else {
      handleSaveProfile();
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0047A5]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("Settings", "Settings")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("Kelola preferensi akun, profil, serta pengaturan sistem Anda.", "Manage your account preferences, profile, and system settings.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {t("Cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleGlobalSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0047A5] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {saving ? t("Saving...", "Saving...") : t("Save Changes", "Save Changes")}
          </button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Sub-Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "general"
                ? "bg-white dark:bg-slate-800 text-[#0047A5] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{t("General Information", "General Information")}</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "preferences"
                ? "bg-white dark:bg-slate-800 text-[#0047A5] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t("Preferences", "Preferences")}</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "security"
                ? "bg-white dark:bg-slate-800 text-[#0047A5] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>{t("Security", "Security")}</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
              activeTab === "notifications"
                ? "bg-white dark:bg-slate-800 text-[#0047A5] dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>{t("Notifications", "Notifications")}</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* TAB 1: GENERAL INFORMATION */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("General Information", "General Information")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Atur informasi profil dan data pribadi Anda.", "Manage your profile and personal information.")}
                </p>
              </div>

              {/* Profile Picture Upload Section */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("Profile picture upload", "Profile picture upload")}
                </p>
                <div className="flex items-center gap-4 pt-1">
                  {profile.fotoProfil ? (
                    <Image
                      src={profile.fotoProfil}
                      alt="Profile"
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#0047A5] text-white font-bold flex items-center justify-center text-lg">
                      {profile.nama ? profile.nama.charAt(0) : "U"}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 rounded-xl bg-[#0047A5] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition">
                      {t("Upload New Photo", "Upload New Photo")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfile({ ...profile, fotoProfil: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, fotoProfil: "" })}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      {t("Delete", "Delete")}
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800 my-4" />

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Nama Lengkap", "Full Name")}
                  </label>
                  <input
                    type="text"
                    value={profile.nama}
                    onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Alamat Email", "Email Address")}
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / Identitas
                  </label>
                  <input
                    type="text"
                    value={profile.nip}
                    onChange={(e) => setProfile({ ...profile, nip: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Nomor HP", "Phone Number")}
                  </label>
                  <input
                    type="text"
                    value={profile.noHp}
                    onChange={(e) => setProfile({ ...profile, noHp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Sekolah / Instansi", "School / Institution")}
                  </label>
                  <input
                    type="text"
                    value={profile.sekolah}
                    onChange={(e) => setProfile({ ...profile, sekolah: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Alamat Lengkap", "Address")}
                  </label>
                  <input
                    type="text"
                    value={profile.alamat}
                    onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5] transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREFERENCES (THEME & LANGUAGE) */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("Display & Preferences", "Display & Preferences")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Atur tema tampilan dan bahasa aplikasi.", "Set display theme and system language.")}
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("Display Theme", "Display Theme")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      theme === "light"
                        ? "border-[#0047A5] bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t("Light", "Light")}</span>
                    </div>
                    {theme === "light" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      theme === "dark"
                        ? "border-[#0047A5] bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t("Dark", "Dark")}</span>
                    </div>
                    {theme === "dark" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      theme === "system"
                        ? "border-[#0047A5] bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t("System", "System")}</span>
                    </div>
                    {theme === "system" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("Interface Language", "Interface Language")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage("id")}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      language === "id"
                        ? "border-[#0047A5] bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Bahasa Indonesia</span>
                    </div>
                    {language === "id" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition ${
                      language === "en"
                        ? "border-[#0047A5] bg-blue-50/40 dark:bg-blue-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">English (US)</span>
                    </div>
                    {language === "en" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("Security & Password", "Security & Password")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun.", "Update your password regularly to secure your account.")}
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Kata Sandi Saat Ini", "Current Password")}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Kata Sandi Baru", "New Password")}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("Konfirmasi Kata Sandi Baru", "Confirm New Password")}
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-[#0047A5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("Notifications", "Notifications")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Kelola notifikasi dan umpan balik informasi yang Anda terima.", "Manage your notification alerts and updates.")}
                </p>
              </div>

              <div className="space-y-3">
                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{t("Pemberitahuan Email", "Email Alerts")}</p>
                    <p className="text-[11px] text-slate-400">{t("Terima informasi penting aplikasi lewat email.", "Receive important system updates via email.")}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      notifications.emailAlerts ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold text-white absolute ${
                        notifications.emailAlerts ? "left-1.5" : "right-1.5"
                      }`}
                    >
                      {notifications.emailAlerts ? "On" : "Off"}
                    </span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                        notifications.emailAlerts ? "translate-x-6.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Module Updates Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{t("Pemberitahuan Modul", "Module Updates")}</p>
                    <p className="text-[11px] text-slate-400">{t("Notifikasi saat ada modul atau tugas baru.", "Get notified when new modules are assigned.")}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifications({ ...notifications, moduleUpdates: !notifications.moduleUpdates })}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      notifications.moduleUpdates ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold text-white absolute ${
                        notifications.moduleUpdates ? "left-1.5" : "right-1.5"
                      }`}
                    >
                      {notifications.moduleUpdates ? "On" : "Off"}
                    </span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                        notifications.moduleUpdates ? "translate-x-6.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}