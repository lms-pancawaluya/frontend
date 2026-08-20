"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getModules } from "@/services/module.service";
import { getProgress } from "@/services/progress.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  gelar?: string;
  foto?: string;
  fotoProfil?: string;
  avatar?: string;
  photo?: string;
}

// Circular Progress Component dengan aksen warna Hijau Disdik Jabar
function CircularProgress({
  percent,
  size = 48,
  stroke = 4,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 transform">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        className="text-slate-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-[#109B51] transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [totalModules, setTotalModules] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const loadUserData = () => {
    if (typeof window === "undefined") return;
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        setUser(parsedUser);
        setImgError(false);
      } catch {
        setUser(null);
      }
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingProgress(true);
      const [modulesData, progressData] = await Promise.all([
        getModules(),
        getProgress(),
      ]);

      const modulesArr = Array.isArray(modulesData) ? modulesData : [];
      const progressArr = Array.isArray(progressData) ? progressData : [];

      setTotalModules(modulesArr.length);

      // Pengecekan status yang fleksibel
      const selesai = progressArr.filter((p: unknown) => {
        const pp = p as { status?: string; isCompleted?: boolean; selesai?: boolean };
        const statusStr = String(pp.status || "").toLowerCase();
        return (
          statusStr === "selesai" ||
          statusStr === "completed" ||
          statusStr === "finish" ||
          pp.isCompleted === true ||
          pp.selesai === true
        );
      });

      setCompletedCount(selesai.length);
    } catch (err) {
      console.error("Gagal memuat progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMounted(true);
      loadUserData();
    });

    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        loadUserData();
        void (async () => {
          await fetchDashboardData();
        })();
      }
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (mounted && !user && !localStorage.getItem("user")) {
      router.push("/login");
      return;
    }

    if (user?.role === "admin") {
      router.push("/admin");
      return;
    }

    if (user) {
      void (async () => {
        await fetchDashboardData();
      })();
    }
  }, [router, user, mounted, fetchDashboardData]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <svg className="w-5 h-5 animate-spin text-[#109B51]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Memuat Dashboard...
        </div>
      </div>
    );
  }

  const fotoUrl = user.foto || user.fotoProfil || user.avatar || user.photo;
  const namaBerGelar = user.gelar ? `${user.nama}, ${user.gelar}` : user.nama;

  const jamSekarang = new Date().getHours();
  const sapaan =
    jamSekarang < 11
      ? "Selamat pagi"
      : jamSekarang < 15
      ? "Selamat siang"
      : jamSekarang < 19
      ? "Selamat sore"
      : "Selamat malam";

  const progressPercent =
    totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between leading-normal relative overflow-hidden">
      
      {/* ================= BACKGROUND DEKORATIF HASIL ORNAMEN DISDIK JABAR ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient Glows berdasarkan 4 Warna Logo Disdik Jabar */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -left-16 w-80 h-80 bg-[#F3BF10]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />

        {/* Pattern Dots Akses Warna Logo */}
        <div className="absolute top-12 left-8 hidden lg:grid grid-cols-4 gap-2.5 opacity-25">
          <div className="w-2.5 h-2.5 bg-[#0047A5] rounded-full" />
          <div className="w-2.5 h-2.5 bg-[#419AD6] rounded-full" />
          <div className="w-2.5 h-2.5 bg-[#109B51] rounded-full" />
          <div className="w-2.5 h-2.5 bg-[#F3BF10] rounded-full" />
        </div>

        {/* Siku Frame Accent Khas Logo */}
        <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-[#F3BF10] opacity-50 rounded-tl-md" />
        <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-[#0047A5] opacity-50 rounded-br-md" />
      </div>

      {/* ================= KONTEN DASHBOARD UTAMA ================= */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">

        {/* Hero Welcome Banner - Kombinasi Gradient Biru Utama, Biru Muda & Hijau Disdik Jabar */}
        <div
          className={`bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {/* Akses Lipatan / Geometric Ornament khas logo */}
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-32 bottom-0 w-36 h-36 bg-[#F3BF10]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-[#F3BF10] animate-pulse" />
                Portal Pembelajaran Guru SMA Jabar
              </div>

              <div className="flex items-center gap-2.5">
                <h1 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                  {sapaan}, {namaBerGelar}
                </h1>
                {jamSekarang < 19 ? (
                  <span className="text-xl"></span>
                ) : (
                  <span className="text-xl">🌙</span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
                Pantau perkembangan modul, selesaikan refleksi pembelajaran, dan tingkatkan kompetensi Anda secara terstruktur bersama platform Pancawaluya.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/modules"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F3BF10] hover:bg-amber-400 text-[#0047A5] text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg hover:shadow-amber-400/20 transition-all duration-200"
              >
                <span>Mulai Belajar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Modul Selesai */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modul Selesai</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {loadingProgress ? "..." : completedCount}{" "}
                <span className="text-xs font-semibold text-slate-400">/ {totalModules} Modul</span>
              </p>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <CircularProgress percent={progressPercent} />
              <span className="absolute text-[11px] font-bold text-slate-800">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Card Total Modul Tersedia */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Modul Tersedia</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {loadingProgress ? "..." : totalModules}{" "}
                <span className="text-xs font-semibold text-slate-400">Modul</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#419AD6]/10 text-[#0047A5] flex items-center justify-center border border-[#419AD6]/20 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          {/* Card Status Pembelajaran */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-300 transition-all duration-300">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Pembelajaran</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">
                  {progressPercent === 100 ? "Lengkap" : "Aktif Belajar"}
                </p>
                {progressPercent === 100 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#109B51]/10 text-[#109B51] border border-[#109B51]/20">
                    Selesai
                  </span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#109B51]/10 text-[#109B51] flex items-center justify-center border border-[#109B51]/20 shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Progres Pembelajaran Keseluruhan */}
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-[#0047A5]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Progres Pembelajaran Keseluruhan
                  </h2>
                </div>
                <span className="text-xs font-semibold text-[#109B51] bg-[#109B51]/10 border border-[#109B51]/20 px-3 py-1 rounded-full">
                  {progressPercent}% Selesai
                </span>
              </div>

              {loadingProgress ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <svg className="w-4 h-4 animate-spin text-[#109B51]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memuat data progres...
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Capaian Seluruh Modul</span>
                    <span className="font-semibold text-slate-800">{completedCount} dari {totalModules} Modul</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <div
                      className="bg-gradient-to-r from-[#0047A5] to-[#109B51] h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modul Pembelajaran Utama */}
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Modul Pembelajaran Utama
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Akses cepat materi dan evaluasi kompetensi</p>
                </div>
                <Link
                  href="/modules"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0047A5] hover:text-[#109B51] transition-colors"
                >
                  <span>Lihat Semua</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4 hover:border-[#109B51]/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#109B51] bg-[#109B51]/10 px-2.5 py-0.5 rounded-md border border-[#109B51]/20">
                      Pancawaluya
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      Penerapan 5 Nilai Pancawaluya dalam Pembelajaran
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Cageur, Bageur, Bener, Pinter, Singer untuk Guru SMA
                    </p>
                  </div>

                  <Link
                    href="/modules"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-[#109B51] text-slate-700 hover:text-white border border-slate-200/80 hover:border-[#109B51] text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 shrink-0 self-start sm:self-auto"
                  >
                    <span>Buka Modul</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Progres Pembelajaran</span>
                  <span className="font-bold text-slate-800">{progressPercent}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Kolom Kanan */}
          <div className="space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                {fotoUrl && !imgError ? (
                  <Image
                    src={fotoUrl}
                    alt={user.nama}
                    width={48}
                    height={48}
                    onError={() => setImgError(true)}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200/80 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#0047A5] text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                    {user.nama ? user.nama.charAt(0).toUpperCase() : "G"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{namaBerGelar}</h3>
                  <p className="text-xs text-slate-500 capitalize">{user.role} LMS</p>
                </div>
              </div>

              <div className="text-xs space-y-3.5">
                <div>
                  <p className="text-slate-400 font-medium">Alamat Email</p>
                  <p className="text-slate-700 font-semibold mt-0.5 truncate">{user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status Akun</p>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] text-[#109B51] bg-[#109B51]/10 border border-[#109B51]/20 font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#109B51]"></span>
                    {user.role} AKTIF
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/profile"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold rounded-xl transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Lihat Profil Lengkap</span>
                </Link>
              </div>
            </div>

            {/* Pusat Bantuan & Layanan Card - Kombinasi Biru Gelap Disdik Jabar & Hijau Akses */}
            <div className="p-6 bg-[#002B66] text-white rounded-3xl shadow-xl relative overflow-hidden space-y-4 border border-[#0047A5]">
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#419AD6]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-amber-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white">Pusat Bantuan & Layanan</h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Bila mengalami kendala teknis saat mengakses materi atau soal evaluasi, ajukan
                  tiket bantuan ke fasilitator pelatihan.
                </p>
              </div>

              <Link
                href="/helpdesk"
                className="inline-flex items-center gap-2 text-xs bg-[#109B51] hover:bg-[#0e8847] text-white px-4 py-2.5 rounded-xl font-semibold transition-colors duration-200"
              >
                <span>Buka Pusat Bantuan</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}