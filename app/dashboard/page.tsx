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
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [totalModules, setTotalModules] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser?.role === "admin") {
      router.push("/admin");
      return;
    }

    async function fetchDashboardData() {
      setUser(currentUser);

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

    fetchDashboardData();
  }, [router]);

  if (!user) {
    return <p className="text-center mt-16 text-gray-500">Memuat dashboard...</p>;
  }

  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-pale)] text-slate-800 flex flex-col justify-between leading-normal">
      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Welcome Hero Banner */}
        <div className="bg-white border border-[var(--color-border-soft)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-xs font-semibold text-[var(--color-navy)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-navy)]"></span>
              Portal Pembelajaran Guru
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--color-navy)] tracking-normal">
              Selamat datang kembali, {user.nama}! 👋
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

        {/* Quick Stat Cards */}
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

        {/* Main Content Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri - Modul & Progress Utama */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Progress Utama */}
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

            {/* List Modul Pembelajaran Quick Access */}
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-navy)]">
                    Modul Pembelajaran Guru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Akses materi dan evaluasi Pancawaluya</p>
                </div>
                <Link href="/modules" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
                  Lihat Semua Modul →
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border-soft)] bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      Pancawaluya
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      Penerapan 5 Nilai Pancawaluya dalam Pembelajaran
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      Cageur, Bageur, Bener, Pinter, Singer untuk Guru SMA
                    </p>
                  </div>

                  <Link
                    href="/modules"
                    className="px-4 py-2 bg-slate-100 hover:bg-[var(--color-navy)] text-slate-700 hover:text-white text-xs font-semibold rounded-lg text-center transition whitespace-nowrap self-start sm:self-auto"
                  >
                    Buka Daftar Modul
                  </Link>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Progres Keseluruhan</span>
                  <span className="font-bold text-slate-800">{progressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan - Informasi Akun & Bantuan */}
          <div className="space-y-6">
            {/* Profil Card */}
            <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-[var(--color-navy)] text-white font-bold flex items-center justify-center text-base shadow-sm">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{user.nama}</h3>
                  <p className="text-xs text-slate-500 capitalize">{user.role} LMS</p>
                </div>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <p className="text-slate-400 font-medium">Alamat Email</p>
                  <p className="text-slate-700 font-semibold mt-0.5">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Akun</p>
                  <span className="inline-block mt-1 text-[10px] text-teal-700 bg-teal-50 border border-teal-100 font-bold px-2.5 py-0.5 rounded uppercase">
                    {user.role} AKTIF
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/profile"
                  className="block w-full text-center py-2 border border-[var(--color-border-soft)] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Lihat Profil Lengkap
                </Link>
              </div>
            </div>

            {/* Bantuan Card */}
            <div className="p-5 bg-[var(--color-navy)] text-white rounded-2xl shadow-sm space-y-3">
              <h3 className="text-sm font-bold">Butuh Bantuan Pelatihan?</h3>
              <p className="text-xs text-teal-100 leading-relaxed">
                Jika Anda mengalami kendala saat mengakses materi atau mengerjakan evaluasi, silakan hubungi fasilitator.
              </p>
              <Link
                href="/modules"
                className="inline-block text-xs bg-white text-[var(--color-navy)] hover:bg-teal-50 px-4 py-2 rounded-lg font-semibold transition"
              >
                Pusat Pembelajaran
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[var(--color-border-soft)] bg-white text-center text-xs text-slate-400 mt-12">
        © 2026 LMS Pancawaluya. Dibuat untuk mendukung pembelajaran Guru SMA.
      </footer>
    </div>
  );
}