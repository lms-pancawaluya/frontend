"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCourseById } from "@/services/course.service";
import { getModuleContents, getModules } from "@/services/module.service";
import { getModuleEvaluations } from "@/services/evaluation.service";
import type { Course, CourseModule } from "@/types/course";

interface CourseWithModules extends Course {
  modules?: CourseModule[];
  moduls?: CourseModule[];
}

interface ModuleMaterial {
  id?: string;
  judul?: string;
  tipe?: string;
  urutan?: number;
}

interface ModuleEvaluation {
  id: string;
  judul?: string;
  tipe?: string;
  _count?: { questions?: number };
  questions?: { id: string }[];
}

interface ModuleOverview {
  materials: ModuleMaterial[];
  preTest: ModuleEvaluation[];
  postTest: ModuleEvaluation[];
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function getModuleTitle(module: CourseModule) {
  return module.judul || module.id;
}

/** Human-readable label for a learning material type. */
function getMaterialTypeLabel(tipe?: string) {
  switch ((tipe || "").toLowerCase()) {
    case "video":
      return "Video";
    case "teks":
    case "text":
      return "Text";
    case "pdf":
      return "PDF";
    case "link":
      return "Link";
    default:
      return tipe ? tipe.charAt(0).toUpperCase() + tipe.slice(1) : "Materi";
  }
}

function getMaterialTypeBadgeClass(tipe?: string) {
  switch ((tipe || "").toLowerCase()) {
    case "video":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "teks":
    case "text":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "pdf":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "link":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
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

      const materials = Array.isArray(contentsRes) ? (contentsRes as ModuleMaterial[]) : [];
      const evaluations = Array.isArray(evaluationsRes) ? (evaluationsRes as ModuleEvaluation[]) : [];

      setModuleOverview((prev) => ({
        ...prev,
        [moduleId]: {
          materials,
          preTest: evaluations.filter((evaluation) => evaluation.tipe === "pre_test"),
          postTest: evaluations.filter((evaluation) => evaluation.tipe === "post_test"),
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

  function renderEvaluationGroup(
    title: string,
    evaluations: ModuleEvaluation[],
    emptyText: string,
    accentClass: string
  ) {
    return (
      <div className="space-y-2">
        <h4 className={`text-xs font-bold uppercase tracking-wide ${accentClass}`}>{title}</h4>
        {evaluations.length === 0 ? (
          <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 px-3 py-2">
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-2">
            {evaluations.map((evaluation) => {
              const questionCount =
                evaluation._count?.questions ?? evaluation.questions?.length ?? null;
              return (
                <li
                  key={evaluation.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700 truncate">
                    {evaluation.judul || title}
                  </span>
                  {questionCount !== null && (
                    <span className="shrink-0 text-[11px] text-slate-400">{questionCount} soal</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

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

                    {/* Panel (isi overview saat dibuka) */}
                    {isOpen && (
                      <div id={panelId} role="region" aria-labelledby={buttonId} className="border-t border-slate-100 p-4 space-y-5 bg-slate-50/50">
                        {isLoadingOverview ? (
                          <p className="text-xs text-slate-500">Memuat isi modul...</p>
                        ) : overviewError ? (
                          <p className="text-xs text-red-600">{overviewError}</p>
                        ) : (
                          <>
                            {/* 1. Deskripsi Module */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Deskripsi Module</h4>
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {module.deskripsi || "Belum ada deskripsi untuk module ini."}
                              </p>
                            </div>

                            {/* 2. Pre-Test */}
                            {renderEvaluationGroup(
                              "Pre-Test",
                              overview?.preTest || [],
                              "Belum ada Pre-Test untuk module ini.",
                              "text-sky-700"
                            )}

                            {/* 3. Learning Materials */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Learning Materials</h4>
                              {!overview || overview.materials.length === 0 ? (
                                <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-200 px-3 py-2">
                                  Belum ada learning material untuk module ini.
                                </p>
                              ) : (
                                <ul className="space-y-2">
                                  {overview.materials.map((material, materialIndex) => (
                                    <li
                                      key={material.id || materialIndex}
                                      className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-100 px-3 py-2"
                                    >
                                      <span className="text-sm text-slate-700 truncate">
                                        {material.judul || "Materi tanpa judul"}
                                      </span>
                                      <span
                                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getMaterialTypeBadgeClass(material.tipe)}`}
                                      >
                                        {getMaterialTypeLabel(material.tipe)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* 4. Post-Test */}
                            {renderEvaluationGroup(
                              "Post-Test",
                              overview?.postTest || [],
                              "Belum ada Post-Test untuk module ini.",
                              "text-purple-700"
                            )}
                          </>
                        )}

                        {/* Action mulai/lanjut belajar */}
                        <div className="pt-1">
                          <Link
                            href={`/modules/${module.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition"
                          >
                            Mulai / Lanjut Belajar
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
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
