"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getModules } from "@/services/module.service";
import { getCourses } from "@/services/course.service";
import type { Course } from "@/types/course";

interface ModuleCard {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "Cageur" | "Bageur" | "Bener" | "Singer" | "Pinter" | "Umum";
  progress: number; // 0 - 100
  isLocked: boolean;
  totalContents: number;
  totalQuizzes: number;
  durationMinutes: number;
  badgeColor: string;
}

interface ModuleApiItem {
  id: string;
  code?: string;
  judul?: string;
  title?: string;
  deskripsi?: string;
  description?: string;
  kategori?: ModuleCard["category"];
  category?: ModuleCard["category"];
  aspekPancawaluya?: string;
  progress?: number;
  isLocked?: boolean;
  totalContents?: number;
  totalQuizzes?: number;
  durationMinutes?: number;
  badgeColor?: string;
  _count?: {
    contents?: number;
  };
}

interface CourseWithModules extends Course {
  modules: ModuleCard[];
}

const BADGE_COLORS: Record<string, string> = {
  cageur: "bg-emerald-100 text-emerald-800 border-emerald-200",
  bageur: "bg-blue-100 text-blue-800 border-blue-200",
  bener: "bg-amber-100 text-amber-800 border-amber-200",
  singer: "bg-rose-100 text-rose-800 border-rose-200",
  pinter: "bg-purple-100 text-purple-800 border-purple-200",
  umum: "bg-slate-100 text-slate-700 border-slate-200",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Mapping fleksibel dari bentuk respons API (module.service) ke bentuk kartu UI. */
function mapApiModules(apiData: ModuleApiItem[]): ModuleCard[] {
  return apiData.map((item, idx) => {
    const rawCategory =
      item.kategori || item.category || item.aspekPancawaluya || "Cageur";
    const categoryKey = String(rawCategory).toLowerCase();

    return {
      id: item.id,
      code: item.code || `Modul ${idx + 1}`,
      title: item.judul || item.title || "Modul Pembelajaran",
      description: item.deskripsi || item.description || "Deskripsi modul pembelajaran.",
      category: capitalize(categoryKey) as ModuleCard["category"],
      progress: item.progress ?? 0,
      isLocked: item.isLocked ?? false,
      totalContents: item.totalContents || item._count?.contents || 0,
      totalQuizzes: item.totalQuizzes || 0,
      durationMinutes: item.durationMinutes || 30,
      badgeColor: item.badgeColor || BADGE_COLORS[categoryKey] || BADGE_COLORS.umum,
    };
  });
}

// Fallback lokal (dipakai kalau API course/module tidak tersedia)
const FALLBACK_COURSES: CourseWithModules[] = [
  {
    id: "fallback-course-1",
    judul: "Pancawaluya Dasar",
    deskripsi: "Program pembinaan karakter dasar Pancawaluya untuk guru dan pendidik.",
    mode: "online",
    hasCertificate: false,
    progressPercentage: 9,
    totalModules: 5,
    modules: [
      {
        id: "33a743f8-8856-47d9-a784-2e513b6663c4",
        code: "Modul 1",
        title: "Cageur - Sehat Fisik & Mental",
        description:
          "Membahas pembentukan kesamaptaan fisik dan kesehatan mental peserta didik agar energi tersalurkan ke aktivitas positif.",
        category: "Cageur",
        progress: 45,
        isLocked: false,
        totalContents: 2,
        totalQuizzes: 1,
        durationMinutes: 30,
        badgeColor: BADGE_COLORS.cageur,
      },
      {
        id: "2",
        code: "Modul 2",
        title: "Bageur - Akhlak Mulia & Empati",
        description:
          "Pengembangan karakter berbudi pekerti luhur, saling menghargai, dan menumbuhkan kepedulian sosial di lingkungan sekolah.",
        category: "Bageur",
        progress: 0,
        isLocked: false,
        totalContents: 3,
        totalQuizzes: 1,
        durationMinutes: 45,
        badgeColor: BADGE_COLORS.bageur,
      },
      {
        id: "3",
        code: "Modul 3",
        title: "Bener - Integritas & Kejujuran",
        description:
          "Menanamkan nilai-nilai kebenaran, kejujuran akademik, serta kepatuhan terhadap norma hukum dan tata tertib.",
        category: "Bener",
        progress: 0,
        isLocked: true,
        totalContents: 2,
        totalQuizzes: 1,
        durationMinutes: 40,
        badgeColor: BADGE_COLORS.bener,
      },
      {
        id: "4",
        code: "Modul 4",
        title: "Singer - Tanggap & Proaktif",
        description:
          "Melatih kepekaan terhadap perubahan zaman, krisis sosial, dan kemampuan mengambil inisiatif dalam penyelesaian masalah.",
        category: "Singer",
        progress: 0,
        isLocked: true,
        totalContents: 4,
        totalQuizzes: 2,
        durationMinutes: 50,
        badgeColor: BADGE_COLORS.singer,
      },
      {
        id: "5",
        code: "Modul 5",
        title: "Pinter - Kecerdasan & Inovasi",
        description:
          "Penguasaan ilmu pengetahuan, pemikiran kritis, serta kreativitas berbasis teknologi untuk masa depan.",
        category: "Pinter",
        progress: 0,
        isLocked: true,
        totalContents: 3,
        totalQuizzes: 1,
        durationMinutes: 60,
        badgeColor: BADGE_COLORS.pinter,
      },
    ],
  },
];

export default function ModulesPage() {
  const [courses, setCourses] = useState<CourseWithModules[]>(FALLBACK_COURSES);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"semua" | "proses" | "selesai">("semua");
  const [isLoading, setIsLoading] = useState(true);

  // Sync data course + modul dari backend API jika tersedia
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const courseList = await getCourses();

        if (Array.isArray(courseList) && courseList.length > 0) {
          const withModules = await Promise.all(
            courseList.map(async (course) => {
              const rawModules = await getModules(course.id);
              const modules = Array.isArray(rawModules) ? mapApiModules(rawModules) : [];
              return { ...course, modules } as CourseWithModules;
            })
          );
          setCourses(withModules);
        }
      } catch (err) {
        console.warn("Gagal memuat course dari API, menggunakan data fallback lokal.", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  function moduleMatchesTab(m: ModuleCard): boolean {
    if (activeTab === "proses") return m.progress > 0 && m.progress < 100;
    if (activeTab === "selesai") return m.progress === 100;
    return true;
  }

  function moduleMatchesSearch(m: ModuleCard): boolean {
    if (!normalizedQuery) return true;
    return (
      m.title.toLowerCase().includes(normalizedQuery) ||
      m.description.toLowerCase().includes(normalizedQuery)
    );
  }

  function courseMatchesSearch(course: CourseWithModules): boolean {
    if (!normalizedQuery) return true;
    return (
      course.judul.toLowerCase().includes(normalizedQuery) ||
      (course.deskripsi || "").toLowerCase().includes(normalizedQuery)
    );
  }

  // Course tampil kalau course-nya sendiri cocok pencarian, ATAU minimal satu modul di
  // dalamnya cocok. Modul yang ditampilkan di dalam card difilter oleh tab + pencarian.
  const visibleCourses = courses
    .map((course) => {
      const visibleModules = course.modules.filter(
        (m) => moduleMatchesTab(m) && (courseMatchesSearch(course) || moduleMatchesSearch(m))
      );
      return { course, visibleModules };
    })
    .filter(({ course, visibleModules }) => courseMatchesSearch(course) || visibleModules.length > 0);

  const allModules = courses.flatMap((c) => c.modules);
  const totalModules = allModules.length;
  const totalCompleted = allModules.filter((m) => m.progress === 100).length;

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
            <svg
              className="w-96 h-full"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
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
              Tingkatkan kompetensi pendidik melalui 5 pilar karakter Sunda (Cageur, Bageur, Bener,
              Singer, Pinter) secara terstruktur dan terukur.
            </p>
          </div>

          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Total Course</p>
              <p className="text-xl font-extrabold mt-0.5">{courses.length} Course</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Progres Modul</p>
              <p className="text-xl font-extrabold mt-0.5">
                {totalCompleted} / {totalModules} Diselesaikan
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Sertifikat Kelulusan</p>
              <p className="text-xl font-extrabold mt-0.5 text-amber-300">Belum Tersedia</p>
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
              placeholder="Cari course atau materi modul..."
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* DAFTAR COURSE (setiap card berisi modul-modul di dalamnya) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleCourses.map(({ course, visibleModules }) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Header Card Course */}
              <div className="p-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-sky-100 text-sky-800 border border-sky-200">
                    {course.mode === "offline" ? "Tatap Muka" : "Online"}
                  </span>
                  {course.hasCertificate && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                      Bersertifikat
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-slate-900 text-lg leading-snug">{course.judul}</h2>
                {course.deskripsi && (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {course.deskripsi}
                  </p>
                )}

                {/* Progress Course */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-medium">
                    <span className="text-slate-500">
                      Progres Course · {course.modules.length} Modul
                    </span>
                    <span className="text-slate-800 font-bold">
                      {course.progressPercentage ?? 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercentage ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* DAFTAR MODUL DI DALAM CARD COURSE */}
              <div className="p-4 sm:p-5 space-y-2.5 flex-1">
                {visibleModules.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {course.modules.length === 0
                      ? "Belum ada modul pada course ini."
                      : "Tidak ada modul yang sesuai dengan filter/pencarian."}
                  </p>
                ) : (
                  visibleModules.map((mod) => {
                    const rowContent = (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${mod.badgeColor}`}
                            >
                              {mod.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{mod.code}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {mod.title}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                            <span>{mod.totalContents} Materi</span>
                            <span>{mod.totalQuizzes} Evaluasi</span>
                            <span>{mod.durationMinutes} Mnt</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1.5 pl-3">
                          {mod.isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                              Terkunci
                            </span>
                          ) : mod.progress === 100 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Selesai
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-700">{mod.progress}%</span>
                          )}

                          {!mod.isLocked && (
                            <svg
                              className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </>
                    );

                    if (mod.isLocked) {
                      return (
                        <div
                          key={mod.id}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 opacity-80 cursor-not-allowed"
                        >
                          {rowContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={mod.id}
                        href={`/modules/${mod.id}`}
                        className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-400 hover:shadow-sm transition-all"
                      >
                        {rowContent}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* State Kosong jika Filter Tidak Menemukan Hasil */}
        {!isLoading && visibleCourses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
            <p className="text-slate-500 text-sm font-medium">
              Tidak ada course atau modul yang sesuai dengan pencarian Anda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
