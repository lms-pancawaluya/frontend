"use client";

import Link from "next/link";

export default function DashboardPage() {
  const userData = {
    name: "Rahmat Kosasih Anjai, S.T.",
    role: "Guru LMS",
    email: "vargielarentzio@gmail.com",
    status: "GURU AKTIF",
  };

  const stats = {
    completedModules: 1,
    totalModules: 1,
    learningStatus: "Lengkap",
    overallProgress: 100,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Hero / Banner Sambutan */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-[var(--color-border-soft)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-pale)] text-[var(--color-accent)] text-xs font-semibold">
            <svg
              className="w-4 h-4 text-[var(--color-accent)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
            Portal Pembelajaran Guru
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] flex items-center gap-3">
            Selamat pagi, {userData.name}!
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pantau perkembangan modul, selesaikan refleksi pembelajaran, dan tingkatkan kompetensi Anda bersama Pancawaluya.
          </p>
        </div>

        <Link
          href="/modules"
          className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-navy)] hover:bg-[var(--color-accent)] text-white font-medium text-sm rounded-xl transition-colors shadow-sm gap-2 whitespace-nowrap"
        >
          <span>Mulai Belajar</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>

      {/* 2. Cards Statistik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modul Selesai */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">
              Modul Selesai
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--color-navy)]">
                {stats.completedModules}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                / {stats.totalModules} Modul
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[var(--color-pale)] border border-[var(--color-border-soft)] flex items-center justify-center text-[var(--color-accent)]">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Total Modul Tersedia */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">
              Total Modul Tersedia
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--color-navy)]">
                {stats.totalModules}
              </span>
              <span className="text-sm text-slate-500 font-medium">Modul</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[var(--color-pale)] border border-[var(--color-border-soft)] flex items-center justify-center text-[var(--color-accent)]">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Status Pembelajaran */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-1">
              Status Pembelajaran
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--color-navy)]">
                {stats.learningStatus}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Grid Tengah: Overall Progress & Profil Ringkas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri / Tengah (Progress & Daftar Modul) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-pale)] flex items-center justify-center text-[var(--color-accent)]">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h2 className="font-bold text-[var(--color-navy)] text-base">
                  Progress Belajar
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats.overallProgress}% Selesai
              </span>
            </div>

            <div className="w-full bg-[var(--color-pale)] h-2.5 rounded-full overflow-hidden border border-[var(--color-border-soft)] mb-2">
              <div
                className="bg-[var(--color-biru-muda)] h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.overallProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Penyelesaian Seluruh Modul</span>
              <span>
                {stats.completedModules} dari {stats.totalModules} modul
              </span>
            </div>
          </div>

          {/* Daftar Modul Pembelajaran */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[var(--color-navy)] text-base">
                  Modul Pembelajaran Guru
                </h2>
                <p className="text-xs text-slate-500">
                  Akses materi dan evaluasi Pancawaluya
                </p>
              </div>
              <Link
                href="/modules"
                className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-navy)] flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua Modul</span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Modul Item Card */}
            <div className="p-5 border border-[var(--color-border-soft)] rounded-xl bg-[var(--color-pale)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-[var(--color-pale)] text-[var(--color-accent)] uppercase border border-[var(--color-border-soft)]">
                  PANCAWALUYA
                </span>
                <h3 className="font-bold text-[var(--color-navy)] text-sm">
                  Penerapan 5 Nilai Pancawaluya dalam Pembelajaran
                </h3>
                <p className="text-xs text-slate-500">
                  Cageur, Bageur, Bener, Pinter, Singer untuk Guru SMA
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Progres Keseluruhan
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    100%
                  </span>
                </div>
              </div>

              <Link
                href="/modules"
                className="self-start sm:self-center px-4 py-2 bg-white border border-[var(--color-border-soft)] text-[var(--color-navy)] hover:bg-[var(--color-pale)] font-medium text-xs rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Buka Daftar Modul
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (Profil Ringkas & Bantuan) */}
        <div className="space-y-6">
          {/* Card Profil User */}
          <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-navy)] text-white font-bold flex items-center justify-center text-lg shadow-sm">
                R
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-navy)] text-sm">
                  {userData.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {userData.role}
                </p>
              </div>
            </div>

            <hr className="border-[var(--color-border-soft)]" />

            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium">Alamat Email</span>
                <p className="text-[var(--color-navy)] font-semibold truncate">
                  {userData.email}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Status Akun</span>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {userData.status}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/profile"
              className="w-full mt-2 py-2.5 px-4 bg-white border border-[var(--color-border-soft)] hover:bg-[var(--color-pale)] text-[var(--color-navy)] font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4 text-[var(--color-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Lihat Profil Lengkap</span>
            </Link>
          </div>

          {/* Card Bantuan Pelatihan */}
          <div className="bg-[var(--color-navy)] text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base mb-1">
                Butuh Bantuan Pelatihan?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika Anda mengalami kendala saat mengakses materi atau mengerjakan evaluasi, silakan hubungi fasilitator.
              </p>
            </div>
            <button className="w-full py-2.5 px-4 bg-white hover:bg-[var(--color-pale)] text-[var(--color-navy)] font-semibold text-xs rounded-xl transition-colors shadow-sm">
              Pusat Pembelajaran
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
