"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModules } from "@/services/module.service";
import { getProgress } from "@/services/progress.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  gelar?: string;
}

export default function GuruDashboardPage() {
  const router = useRouter();
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("user");
    if (!userData) return null;
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  });

  const [totalModules, setTotalModules] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    // Proteksi: Jika Admin mencoba masuk ke route Guru
    if (String(user.role).toLowerCase() === "admin") {
      router.push("/admin");
      return;
    }

    async function fetchDashboardData() {
      try {
        const [modulesData, progressData] = await Promise.all([
          getModules(),
          getProgress(),
        ]);

        setTotalModules(modulesData.length);
        const selesai = progressData.filter(
          (p: { status: string }) => p.status === "selesai"
        );
        setCompletedCount(selesai.length);
      } catch (err) {
        console.error("Gagal memuat progress:", err);
      } finally {
        setLoadingProgress(false);
      }
    }

    void fetchDashboardData();
  }, [router, user]);

  if (!user) {
    return <p className="text-center mt-16 text-slate-500">Memuat dashboard...</p>;
  }

  const namaBerGelar = user.gelar ? `${user.nama}, ${user.gelar}` : user.nama;
  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-pale)] text-slate-800 flex flex-col justify-between leading-normal">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Banner Selamat Datang Guru */}
        <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-xs font-semibold text-[var(--color-navy)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-navy)]"></span>
              Portal Pembelajaran Guru
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--color-navy)] tracking-normal">
              Selamat datang kembali, {namaBerGelar}! 👋
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              Pantau perkembangan modul, selesaikan refleksi pembelajaran, dan tingkatkan kompetensi Anda bersama Pancawaluya.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Link
              href="/modules"
              className="px-5 py-2.5 bg-[var(--color-navy)] hover:opacity-90 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              Mulai Belajar
            </Link>
          </div>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Modul Selesai</p>
              <p className="text-2xl font-bold text-slate-900">
                {loadingProgress ? "..." : completedCount}{" "}
                <span className="text-xs font-normal text-slate-500">/ {totalModules} Modul</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-[var(--color-navy)] flex items-center justify-center font-bold text-sm border border-teal-100">
              {progressPercent}%
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Modul Tersedia</p>
              <p className="text-2xl font-bold text-slate-900">
                {loadingProgress ? "..." : totalModules}{" "}
                <span className="text-xs font-normal text-slate-500">Modul</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-100">
              📚
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status Pembelajaran</p>
              <p className="text-xl font-bold text-slate-900">
                {progressPercent === 100 ? "Lengkap 🎉" : "Aktif Belajar"}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100">
              ✓
            </div>
          </div>
        </div>

        {/* Layout Konten Utama */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy)]">
                  Overall Progress Belajar
                </h2>
                <span className="text-xs font-semibold text-[var(--color-navy)] bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                  {progressPercent}% Selesai
                </span>
              </div>

              {loadingProgress ? (
                <p className="text-xs text-slate-400">Memuat progress...</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Penyelesaian Seluruh Modul</span>
                    <span>{completedCount} dari {totalModules} modul</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--color-navy)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-[var(--color-navy)] text-white font-bold flex items-center justify-center text-base shadow-sm">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{namaBerGelar}</h3>
                  <p className="text-xs text-slate-500 capitalize">{user.role} LMS</p>
                </div>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <p className="text-slate-400 font-medium">Alamat Email</p>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}