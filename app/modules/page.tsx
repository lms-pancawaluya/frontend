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
  urutan?: number;
  judul?: string;
  deskripsi?: string;
  aspekPancawaluya?: string;
  kategori?: string;
  status?: string;
  isLocked?: boolean;
  flowStatus?: {
    totalMaterials?: number;
    preTest?: { available?: boolean };
    postTest?: { available?: boolean };
  };
}

interface CourseWithModules extends Course {
  modules: ModuleCard[];
}

interface CourseApiItem extends Course {
  modules?: ModuleApiItem[];
  moduls?: ModuleApiItem[];
}

type UnknownRecord = Record<string, unknown>;

const BADGE_COLORS: Record<string, string> = {
  cageur: "bg-emerald-100 text-emerald-800 border-emerald-200",
  bageur: "bg-blue-100 text-blue-800 border-blue-200",
  bener: "bg-amber-100 text-amber-800 border-amber-200",
  singer: "bg-purple-100 text-purple-800 border-purple-200",
  pinter: "bg-rose-100 text-rose-800 border-rose-200",
  umum: "bg-slate-100 text-slate-800 border-slate-200",
};

function capitalize(value: string): string {
  if (!value) return "Umum";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Mapping respons API (module.service) ke bentuk kartu UI sesuai instruksi BE */
function mapApiModules(apiData: ModuleApiItem[]): ModuleCard[] {
  if (!Array.isArray(apiData)) return [];
  return apiData.map((item, idx) => {
    const rawCategory = item.aspekPancawaluya || item.kategori || "umum";
    const categoryKey = String(rawCategory).toLowerCase();

    return {
      id: item.id,
      code: `Modul ${item.urutan ?? idx + 1}`,
      title: item.judul || "Modul Pembelajaran",
      description: item.deskripsi || "",
      category: capitalize(categoryKey) as ModuleCard["category"],
      progress: item.status === "selesai" ? 100 : 0,
      isLocked: item.isLocked ?? false,
      totalContents: item.flowStatus?.totalMaterials || 0,
      totalQuizzes:
        (item.flowStatus?.preTest?.available ? 1 : 0) +
        (item.flowStatus?.postTest?.available ? 1 : 0),
      durationMinutes: 30,
      badgeColor: BADGE_COLORS[categoryKey] || BADGE_COLORS.umum,
    };
  });
}

/** Helper untuk ekstrak array murni meski dibungkus { data: [...] } atau { courses: [...] } */
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res;
  if (!isRecord(res)) return [];
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.courses)) return res.courses;
  if (res && Array.isArray(res.modules)) return res.modules;
  if (res && Array.isArray(res.moduls)) return res.moduls;
  return [];
}

export default function ModulesPage() {
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"semua" | "proses" | "selesai">("semua");
  const [isLoading, setIsLoading] = useState(true);

  // Sync data course + modul dari backend API murni
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const rawCourseList = await getCourses();
        const courseList = extractArray<CourseApiItem>(rawCourseList);

        if (courseList.length > 0) {
          const withModules = await Promise.all(
            courseList.map(async (course) => {
              // Cek apakah modul sudah nempel di objek course atau perlu fetch via getModules
              const attachedModules = course.modules ?? course.moduls;
              let rawModules: ModuleApiItem[] = [];

              if (Array.isArray(attachedModules) && attachedModules.length > 0) {
                rawModules = attachedModules;
              } else {
                const modulesRes = await getModules(course.id);
                rawModules = extractArray<ModuleApiItem>(modulesRes);
              }

              const modules = mapApiModules(rawModules);
              return { ...course, modules } as CourseWithModules;
            })
          );
          setCourses(withModules);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Gagal memuat data dari API Backend:", err);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  function courseMatchesTab(course: CourseWithModules): boolean {
    const progress = course.progressPercentage ?? 0;
    if (activeTab === "proses") return progress > 0 && progress < 100;
    if (activeTab === "selesai") return progress === 100;
    return true;
  }

  function courseMatchesSearch(course: CourseWithModules): boolean {
    if (!normalizedQuery) return true;
    if (
      (course.judul || "").toLowerCase().includes(normalizedQuery) ||
      (course.deskripsi || "").toLowerCase().includes(normalizedQuery)
    ) {
      return true;
    }
    // Pertahankan pencarian terhadap materi modul di dalam course tanpa
    // menampilkan daftar modulnya.
    return course.modules.some(
      (m) =>
        m.title.toLowerCase().includes(normalizedQuery) ||
        m.description.toLowerCase().includes(normalizedQuery)
    );
  }

  const visibleCourses = courses.filter(
    (course) => courseMatchesTab(course) && courseMatchesSearch(course)
  );

  const allModules = courses.flatMap((c) => c.modules);
  const totalModules = allModules.length;
  const totalCompleted = allModules.filter((m) => m.progress === 100).length;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-8 relative overflow-hidden">
      {/* BACKGROUND DEKORATIF DISDIK JABAR */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* BANNER HEADER LMS */}
        <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
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
              <p className="text-white/70 font-medium">Total Modul</p>
              <p className="text-xl font-extrabold mt-0.5">{totalModules} Modul</p>
              <p className="text-white/60 font-medium mt-0.5">
                {totalCompleted} / {totalModules} Selesai
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

        {/* DAFTAR COURSE */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse p-6 border border-slate-200" />
            ))}
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
            <p className="text-slate-500 text-sm font-medium">
              {courses.length === 0
                ? "Belum ada course yang tersedia dari backend."
                : "Tidak ada course yang sesuai dengan pencarian Anda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleCourses.map((course) => (
              <Link
                key={course.id}
                href={`/modules/courses/${course.id}`}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-all hover:border-emerald-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                {/* Header Card Course */}
                <div className="p-6">
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

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    Lihat Detail Course
                    <svg
                      className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
