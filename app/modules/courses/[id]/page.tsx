"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCourseById } from "@/services/course.service";
import { getModuleContents, getModules } from "@/services/module.service";
import { getModuleEvaluations } from "@/services/evaluation.service";
import { isPreTest, isPostTest, type EvaluationSummary } from "@/types/evaluation";
import type { Course, CourseModule } from "@/types/course";

interface CourseWithModules extends Course {
  modules?: CourseModule[];
  moduls?: CourseModule[];
}

interface ModuleOverview {
  hasMaterials: boolean;
  preTestId: string | null;
  postTestId: string | null;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function getModuleTitle(module: CourseModule) {
  return module.judul || module.id;
}

export default function GuruCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion state + data overview per module (diambil saat module dibuka).
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({});
  const [moduleOverview, setModuleOverview] = useState<Record<string, ModuleOverview>>({});
  const [moduleOverviewLoading, setModuleOverviewLoading] = useState<Record<string, boolean>>({});
  const [moduleOverviewError, setModuleOverviewError] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError("");
      try {
        const courseData = (await getCourseById(id)) as CourseWithModules;
        setCourse(courseData);

        const attached = courseData?.modules ?? courseData?.moduls;
        if (Array.isArray(attached) && attached.length > 0) {
          setModules(attached);
        } else {
          const modulesData = await getModules(id);
          setModules(Array.isArray(modulesData) ? (modulesData as CourseModule[]) : []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail course.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCourse();
  }, [id]);

  const loadModuleOverview = useCallback(async (moduleId: string) => {
    setModuleOverviewLoading((prev) => ({ ...prev, [moduleId]: true }));
    setModuleOverviewError((prev) => ({ ...prev, [moduleId]: "" }));
    try {
      const [contentsRes, evaluationsRes] = await Promise.all([
        getModuleContents(moduleId),
        getModuleEvaluations(moduleId),
      ]);

      const materials = Array.isArray(contentsRes) ? contentsRes : [];
      const evaluations = Array.isArray(evaluationsRes) ? (evaluationsRes as EvaluationSummary[]) : [];

      const preTest = evaluations.find((evaluation) => isPreTest(evaluation.tipe));
      const postTest = evaluations.find((evaluation) => isPostTest(evaluation.tipe));

      setModuleOverview((prev) => ({
        ...prev,
        [moduleId]: {
          hasMaterials: materials.length > 0,
          preTestId: preTest?.id ?? null,
          postTestId: postTest?.id ?? null,
        },
      }));
    } catch (err) {
      setModuleOverviewError((prev) => ({
        ...prev,
        [moduleId]: err instanceof Error ? err.message : "Gagal memuat isi modul.",
      }));
    } finally {
      setModuleOverviewLoading((prev) => ({ ...prev, [moduleId]: false }));
    }
  }, []);

  function toggleModule(moduleId: string) {
    const willOpen = !openModuleIds[moduleId];
    setOpenModuleIds((prev) => ({ ...prev, [moduleId]: willOpen }));

    if (willOpen && !moduleOverview[moduleId] && !moduleOverviewLoading[moduleId]) {
      loadModuleOverview(moduleId);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/80 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Memuat detail course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto mt-16 max-w-md p-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || "Course tidak ditemukan."}
        </div>
        <button
          type="button"
          onClick={() => router.push("/modules")}
          className="mt-4 text-sm text-emerald-700 hover:underline"
        >
          ← Kembali ke daftar course
        </button>
      </div>
    );
  }

  const isOffline = course.mode?.toLowerCase() === "offline";

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-6 relative overflow-hidden">
      {/* BACKGROUND DEKORATIF DISDIK JABAR */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Navigasi Kembali */}
        <button
          type="button"
          onClick={() => router.push("/modules")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
        >
          <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </span>
          Kembali ke daftar course
        </button>

        {/* Banner Course */}
        <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/20">
                {isOffline ? "Tatap Muka" : "Online"}
              </span>
              {course.hasCertificate && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-300/90 text-amber-900 border border-amber-200/60">
                  Bersertifikat
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {course.judul || "Tanpa judul"}
            </h1>

            {course.deskripsi && (
              <p className="text-slate-100 text-xs sm:text-sm leading-relaxed opacity-90 max-w-3xl">
                {course.deskripsi}
              </p>
            )}
          </div>

          {/* Ringkasan Course */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Mode</p>
              <p className="text-lg font-extrabold mt-0.5 capitalize">{course.mode || "—"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Sertifikat</p>
              <p className="text-lg font-extrabold mt-0.5">
                {course.hasCertificate ? "Tersedia" : "Tidak tersedia"}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-white/70 font-medium">Periode</p>
              <p className="text-sm font-extrabold mt-0.5">
                {formatDate(course.tanggalMulai)} — {formatDate(course.tanggalSelesai)}
              </p>
            </div>
            {isOffline && (
              <div className="col-span-2 sm:col-span-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-white/70 font-medium">Lokasi</p>
                <p className="text-lg font-extrabold mt-0.5">{course.lokasi || "—"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tentang Course */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Tentang Course</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {course.deskripsi || "Tidak ada deskripsi."}
          </p>
        </section>

        {/* Daftar Module — accordion overview */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Modul dalam Course</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {modules.length} modul
            </span>
          </div>

          {modules.length === 0 ? (
            <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 text-center">
              Belum ada modul pada course ini.
            </p>
          ) : (
            <ul className="space-y-3">
              {modules.map((module, index) => {
                const isOpen = !!openModuleIds[module.id];
                const overview = moduleOverview[module.id];
                const isLoadingOverview = !!moduleOverviewLoading[module.id];
                const overviewError = moduleOverviewError[module.id];
                const panelId = `module-panel-${module.id}`;
                const buttonId = `module-toggle-${module.id}`;

                return (
                  <li key={module.id} className="rounded-2xl border border-slate-200/80 overflow-hidden">
                    {/* Header (selalu tampil) */}
                    <button
                      type="button"
                      id={buttonId}
                      onClick={() => toggleModule(module.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left bg-white hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400">#{module.urutan ?? index + 1}</span>
                          {module.aspekPancawaluya && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                              {module.aspekPancawaluya}
                            </span>
                          )}
                          {module.isLocked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                              Terkunci
                            </span>
                          )}
                          {typeof module.progressPercentage === "number" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {module.progressPercentage}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {getModuleTitle(module)}
                        </p>
                        {module.deskripsi && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{module.deskripsi}</p>
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Panel (overview aktivitas saat dibuka) */}
                    {isOpen && (
                      <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-slate-100 p-4 space-y-5 bg-slate-50/50">
                        {/* Informasi Module */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Deskripsi Module</h4>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {module.deskripsi || "Belum ada deskripsi untuk module ini."}
                          </p>
                        </div>

                        {isLoadingOverview ? (
                          <p className="text-xs text-slate-500">Memuat aktivitas modul...</p>
                        ) : overviewError ? (
                          <p className="text-xs text-red-600">{overviewError}</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {/* 1. Pre-Test */}
                            <div className="flex flex-col rounded-2xl border border-sky-100 bg-white p-4 space-y-3">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                                  Pre-Test
                                </span>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {overview?.preTestId
                                    ? "Kerjakan Pre-Test sebelum mempelajari materi modul."
                                    : "Pre-Test belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {overview?.preTestId ? (
                                <Link
                                  href={`/modules/${module.id}/evaluations/${overview.preTestId}`}
                                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-700 text-white text-xs font-semibold rounded-full hover:bg-sky-800 transition"
                                >
                                  Mulai Pre-Test
                                </Link>
                              ) : (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Belum tersedia
                                </span>
                              )}
                            </div>

                            {/* 2. Learning Material */}
                            <div className="flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                  Learning Material
                                </span>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {overview?.hasMaterials
                                    ? "Pelajari materi pembelajaran modul ini."
                                    : "Learning material belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {overview?.hasMaterials ? (
                                <Link
                                  href={`/modules/${module.id}`}
                                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-full hover:bg-emerald-800 transition"
                                >
                                  Mulai Belajar
                                </Link>
                              ) : (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Belum tersedia
                                </span>
                              )}
                            </div>

                            {/* 3. Post-Test */}
                            <div className="flex flex-col rounded-2xl border border-purple-100 bg-white p-4 space-y-3">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
                                  Post-Test
                                </span>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {overview?.postTestId
                                    ? "Kerjakan Post-Test setelah menyelesaikan materi modul."
                                    : "Post-Test belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {overview?.postTestId ? (
                                <Link
                                  href={`/modules/${module.id}/evaluations/${overview.postTestId}`}
                                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700 text-white text-xs font-semibold rounded-full hover:bg-purple-800 transition"
                                >
                                  Mulai Post-Test
                                </Link>
                              ) : (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Belum tersedia
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
