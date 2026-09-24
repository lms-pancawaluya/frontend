"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { getNotificationPreference, updateNotificationPreference } from "@/services/user.service";
import { Sun, Moon, Monitor, Globe } from "lucide-react";

type TabType = "preferences" | "notifications";

const VALID_TABS: TabType[] = ["preferences", "notifications"];

// Sidebar mengarah ke /settings?tab=preferences|notifications (lihat Sidebar.tsx).
// "General Information" & "Security/Change Password" sudah tersedia di Profile,
// jadi tidak lagi ada di Settings. Query kosong/tak dikenal → fallback "preferences".
function parseTabParam(tabParam: string | null): TabType {
  return VALID_TABS.includes(tabParam as TabType) ? (tabParam as TabType) : "preferences";
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageWithTab />
    </Suspense>
  );
}

// Membaca ?tab= dan menjadikannya bagian dari `key`, supaya setiap kali menu
// Sidebar (Preferences / Notifications) diklik, komponen di bawah remount dengan
// tab aktif yang benar — tanpa useEffect+setState.
function SettingsPageWithTab() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  return <SettingsPageContent key={tabParam ?? "preferences"} initialTab={parseTabParam(tabParam)} />;
}

function SettingsPageContent({ initialTab }: { initialTab: TabType }) {
  const { theme, setTheme, language, setLanguage, t } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [loadingPreference, setLoadingPreference] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreference() {
      setLoadingPreference(true);
      setPreferenceError(null);

      try {
        const data = await getNotificationPreference();
        if (!active) return;
        setNotificationsEnabled(Boolean(data?.notificationsEnabled));
      } catch (err) {
        if (!active) return;
        setNotificationsEnabled(null);
        setPreferenceError(
          err instanceof Error
            ? err.message
            : language === "en"
              ? "Failed to load notification preference."
              : "Gagal mengambil preferensi notifikasi."
        );
      } finally {
        if (active) setLoadingPreference(false);
      }
    }

    loadPreference();

    return () => {
      active = false;
    };
  }, [language]);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled === null || savingPreference || loadingPreference) return;

    const previous = notificationsEnabled;
    const next = !previous;

    setSavingPreference(true);
    setPreferenceError(null);
    setNotificationsEnabled(next);

    try {
      const data = await updateNotificationPreference(next);
      setNotificationsEnabled(Boolean(data?.notificationsEnabled));
    } catch (err) {
      setNotificationsEnabled(previous);
      setPreferenceError(
        err instanceof Error
          ? err.message
          : t("Gagal memperbarui preferensi notifikasi.", "Failed to update notification preference.")
      );
    } finally {
      setSavingPreference(false);
    }
  };

  const preferenceBusy = loadingPreference || savingPreference;
  const preferenceUnavailable = notificationsEnabled === null && !loadingPreference;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("Settings", "Settings")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("Kelola preferensi tampilan dan notifikasi akun Anda.", "Manage your display and notification preferences.")}
          </p>
        </div>
      </div>

      {/* Sub-Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
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
          {/* TAB 1: PREFERENCES (THEME & LANGUAGE) */}
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
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t("Bahasa Indonesia", "Indonesian")}</span>
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
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{t("English (US)", "English (US)")}</span>
                    </div>
                    {language === "en" && <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t("Notifications", "Notifications")}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("Kelola preferensi notifikasi Anda.", "Manage your notification preferences.")}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {t("Notifikasi", "Notifications")}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t(
                      "Aktifkan atau nonaktifkan pengiriman notifikasi baru untuk akun Anda.",
                      "Enable or disable delivery of new notifications for your account."
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsEnabled === true}
                  disabled={preferenceBusy || preferenceUnavailable}
                  aria-busy={preferenceBusy}
                  aria-label={t("Notifikasi", "Notifications")}
                  onClick={handleToggleNotifications}
                  className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047A5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    notificationsEnabled ? "bg-[#0047A5]" : "bg-slate-300 dark:bg-slate-700"
                  } ${preferenceBusy || preferenceUnavailable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="text-[9px] font-bold text-white absolute left-1.5">
                    {notificationsEnabled === true ? t("Aktif", "On") : ""}
                  </span>
                  <span className="text-[9px] font-bold text-white absolute right-1.5">
                    {notificationsEnabled === false ? t("Nonaktif", "Off") : ""}
                  </span>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                      notificationsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {loadingPreference && (
                <p className="text-[11px] text-slate-400">
                  {t("Memuat preferensi notifikasi...", "Loading notification preference...")}
                </p>
              )}

              {preferenceError && (
                <div className="p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  <svg className="w-4 h-4 text-rose-600 shrink-0 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{preferenceError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}