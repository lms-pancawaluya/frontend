"use client";

import { useState } from "react";
import Link from "next/link";

interface Module {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "Cageur" | "Bageur" | "Bener" | "Singer" | "Pinter";
  progress: number; // 0 - 100
  isLocked: boolean;
  totalContents: number;
  totalQuizzes: number;
  durationMinutes: number;
  badgeColor: string;
}

// Mock Data Modul Pancawaluya (Bisa disesuaikan dengan API Anda)
const MODULE_DATA: Module[] = [
  {
    id: "3c29f67b-0629-4291-9857-935aedff0d90",
    code: "Modul 1",
    title: "Cageur - Sehat Fisik & Mental",
    description: "Membahas pembentukan kesamaptaan fisik dan kesehatan mental peserta didik agar energi tersalurkan ke aktivitas positif.",
    category: "Cageur",
    progress: 45,
    isLocked: false,
    totalContents: 2,
    totalQuizzes: 1,
    durationMinutes: 30,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "2",
    code: "Modul 2",
    title: "Bageur - Akhlak Mulia & Empati",
    description: "Pengembangan karakter berbudi pekerti luhur, saling menghargai, dan menumbuhkan kepedulian sosial di lingkungan sekolah.",
    category: "Bageur",
    progress: 0,
    isLocked: false,
    totalContents: 3,
    totalQuizzes: 1,
    durationMinutes: 45,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "3",
    code: "Modul 3",
    title: "Bener - Integritas & Kejujuran",
    description: "Menanamkan nilai-nilai kebenaran, kejujuran akademik, serta kepatuhan terhadap norma hukum dan tata tertib.",
    category: "Bener",
    progress: 0,
    isLocked: true,
    totalContents: 2,
    totalQuizzes: 1,
    durationMinutes: 40,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "4",
    code: "Modul 4",
    title: "Singer - Tanggap & Proaktif",
    description: "Melatih kepekaan terhadap perubahan zaman, krisis sosial, dan kemampuan mengambil inisiatif dalam penyelesaian masalah.",
    category: "Singer",
    progress: 0,
    isLocked: true,
    totalContents: 4,
    totalQuizzes: 2,
    durationMinutes: 50,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: "5",
    code: "Modul 5",
    title: "Pinter - Kecerdasan & Inovasi",
    description: "Penguasaan ilmu pengetahuan, pemikiran kritis, serta kreativitas berbasis teknologi untuk masa depan.",
    category: "Pinter",
    progress: 0,
    isLocked: true,
    totalContents: 3,
    totalQuizzes: 1,
    durationMinutes: 60,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
  },
];

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"semua" | "proses" | "selesai">("semua");

  // Filter modul berdasarkan pencarian & tab
  const filteredModules = MODULE_DATA.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "proses") return matchesSearch && m.progress > 0 && m.progress < 100;
    if (activeTab === "selesai") return matchesSearch && m.progress === 100;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-8 relative overflow-hidden">
      
      {/* ================= BACKGROUND DEKORATIF DISDIK JABAR ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
        
        {/* Pattern Dots */}
        <div className="absolute top-12 left-8 hidden lg:grid grid-cols-4 gap-2.5 opacity-20">
          <div className="w-2 h-2 bg-[#0047A5] rounded-full" />
          <div className="w-2 h-2 bg-[#419AD6] rounded-full" />
          <div className="w-2 h-2 bg-[#109B51] rounded-full" />
          <div className="w-2 h-2 bg-[#F3BF10] rounded-full" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* BANNER HEADER LMS */}
        <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none hidden md:block">
            <svg className="w-96 h-full" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-amber-300 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              LMS Panca Waluya Jabar
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Modul Pembelajaran Guru
            </h1>
            <p className="text-slate-100 text-xs sm:text-sm leading-relaxed opacity-90">
              Tingkatkan kompetensi pendidik melalui 5 pilar karakter Sunda (Cageur, Bageur, Bener, Singer, Pinter) secara terstruktur dan terukur.
            </p>
          </div>

          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Total Modul</p>
              <p className="text-xl font-extrabold mt-0.5">5 Modul</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Progres Pembelajaran</p>
              <p className="text-xl font-extrabold mt-0.5">1 / 5 Diselesaikan</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Sertifikat Kelulusan</p>
              <p className="text-xl font-extrabold mt-0.5 text-white text-amber-300">Belum Tersedia</p>
            </div>
          </div>
        </div>

        {/* KONTROL PENCARIAN & FILTER */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Tab Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("semua")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "semua"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semua Modul
            </button>
            <button
              onClick={() => setActiveTab("proses")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "proses"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Sedang Dipelajari
            </button>
            <button
              onClick={() => setActiveTab("selesai")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "selesai"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Selesai
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Cari materi modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* GRID DAFTAR MODUL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                item.isLocked
                  ? "border-slate-200 bg-slate-50/50 opacity-80"
                  : "border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:-translate-y-1"
              }`}
            >
              {/* Header Card Modul */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${item.badgeColor}`}>
                    {item.category}
                  </span>

                  {item.isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Terkunci
                    </span>
                  ) : item.progress === 100 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Selesai
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      {item.code}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Metadata Modul */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{item.totalContents} Materi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{item.totalQuizzes} Evaluasi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{item.durationMinutes} Mnt</span>
                  </div>
                </div>
              </div>

              {/* Footer Card & Progress Bar */}
              <div className="p-6 pt-0 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium">
                    <span className="text-slate-500">Progres Kelulusan</span>
                    <span className="text-slate-800 font-bold">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Tombol Aksi */}
                {item.isLocked ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-100 text-slate-400 font-semibold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Selesaikan Modul Sebelumnya</span>
                  </button>
                ) : (
                  <Link
                    href={`/modules/${item.id}`}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition duration-200 shadow-md shadow-emerald-700/10 flex items-center justify-center gap-2 group"
                  >
                    <span>{item.progress > 0 ? "Lanjutkan Belajar" : "Mulai Modul"}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* State Kosong jika Filter Tidak Menemukan Hasil */}
        {filteredModules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
            <p className="text-slate-500 text-sm font-medium">Tidak ada modul yang sesuai dengan pencarian Anda.</p>
          </div>
        )}

      </div>
    </div>
  );
}