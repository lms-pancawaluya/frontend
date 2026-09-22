"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsersProgressAll } from "@/services/user.service";

// ---------------------------------------------------------------------------
// Monitoring Pembelajaran — struktur nested dari
// GET /api/admin-monitoring/users/progress/all (User → Course → Module → Activity).
// Semua field opsional agar defensif terhadap partial/null data.
// ---------------------------------------------------------------------------

interface ContentItem {
  id?: string;
  judul?: string;
  tipe?: string;
  urutan?: number;
  progressPercent?: number;
  isCompleted?: boolean;
}

interface InteractiveQuestionInfo {
  hasInteractiveQuestion?: boolean;
  judul?: string;
  status?: string;
  skor?: number | null;
  attemptsCount?: number | null;
}

interface LearningMaterial {
  isCompleted?: boolean;
  contents?: ContentItem[];
  interactiveQuestion?: InteractiveQuestionInfo | null;
}

interface AssessmentStage {
  exists?: boolean;
  status?: string;
  nilai?: number | null;
  skor?: number | null;
  completedAt?: string | null;
}

interface ModuleItem {
  id?: string;
  judul?: string;
  preTest?: AssessmentStage | null;
  postTest?: AssessmentStage | null;
  learningMaterial?: LearningMaterial | null;
}

interface CourseItem {
  id?: string;
  judulCourse?: string;
  judul?: string;
  statusCourse?: string;
  progressPercent?: number;
  completedAt?: string | null;
  modules?: ModuleItem[];
}

interface UserProgressItem {
  userId?: string;
  id?: string;
  namaGuru?: string;
  nama?: string;
  emailGuru?: string;
  email?: string;
  courses?: CourseItem[];
}

// ---------------------------------------------------------------------------
// Helper defensif monitoring
// ---------------------------------------------------------------------------

function getGuruName(u: UserProgressItem, fallback: string): string {
  return u.namaGuru || u.nama || fallback;
}

function getGuruEmail(u: UserProgressItem): string {
  return u.emailGuru || u.email || "";
}

function getCourseTitle(c: CourseItem): string {
  return c.judulCourse || c.judul || "Course tanpa judul";
}

function clampPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function progressColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function statusTone(status?: string): { label: string; className: string } {
  const s = String(status || "").toLowerCase();
  if (!s) return { label: "—", className: "bg-slate-100 text-slate-600 border-slate-200" };
  if (["selesai", "completed", "done", "lulus", "passed"].some((k) => s.includes(k))) {
    return { label: status || "Selesai", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  if (["proses", "progress", "berjalan", "ongoing", "in_progress"].some((k) => s.includes(k))) {
    return { label: status || "Berjalan", className: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  if (["belum", "not_started", "pending", "tertunda"].some((k) => s.includes(k))) {
    return { label: status || "Belum Mulai", className: "bg-slate-100 text-slate-600 border-slate-200" };
  }
  if (["gagal", "failed", "tidak lulus"].some((k) => s.includes(k))) {
    return { label: status || "Gagal", className: "bg-rose-100 text-rose-700 border-rose-200" };
  }
  return { label: status || "—", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function contentTypeLabel(tipe?: string): string {
  const t = String(tipe || "").toLowerCase();
  if (t === "teks" || t === "text") return "Teks";
  if (t === "video") return "Video";
  return tipe || "Materi";
}

// ---------------------------------------------------------------------------
// Sub-komponen Monitoring
// ---------------------------------------------------------------------------

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className={`h-full rounded-full ${progressColor(pct)} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold text-slate-700">{pct}%</span>
    </div>
  );
}

function AssessmentStageCard({ title, stage }: { title: string; stage?: AssessmentStage | null }) {
  const exists = stage?.exists === true;
  const tone = statusTone(stage?.status);
  const nilai = stage?.nilai ?? stage?.skor ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900">{title}</span>
        {exists ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.className}`}>
            {tone.label}
          </span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Tidak tersedia
          </span>
        )}
      </div>
      {exists && nilai !== null && (
        <p className="text-xs text-slate-600">
          Nilai: <span className="font-bold text-slate-800">{nilai}</span>
        </p>
      )}
    </div>
  );
}

function LearningMaterialBlock({ material }: { material?: LearningMaterial | null }) {
  const contents = material?.contents ?? [];
  const iq = material?.interactiveQuestion;
  const hasIQ = iq?.hasInteractiveQuestion === true;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900">Learning Material</span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            material?.isCompleted
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {material?.isCompleted ? "Selesai" : "Belum"}
        </span>
      </div>

      {contents.length > 0 ? (
        <ul className="space-y-2">
          {contents.map((content, idx) => {
            const cpct = clampPercent(content.progressPercent ?? (content.isCompleted ? 100 : 0));
            return (
              <li key={content.id || idx} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{content.judul || "Materi tanpa judul"}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-200">
                        {contentTypeLabel(content.tipe)}
                      </span>
                      {content.urutan !== undefined && content.urutan !== null && (
                        <span className="text-[10px] text-slate-400">Urutan #{content.urutan}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      content.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {content.isCompleted ? "Selesai" : "Belum"}
                  </span>
                </div>
                <ProgressBar pct={cpct} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[11px] italic text-slate-400">Belum ada materi.</p>
      )}

      {hasIQ && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Interactive Question</span>
            {iq?.status && (
              <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {iq.status}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-800">{iq?.judul || "Pertanyaan Interaktif"}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-600">
            {iq?.skor !== undefined && iq?.skor !== null && (
              <span>
                Skor: <span className="font-bold text-slate-800">{iq.skor}</span>
              </span>
            )}
            {iq?.attemptsCount !== undefined && iq?.attemptsCount !== null && (
              <span>
                Percobaan: <span className="font-bold text-slate-800">{iq.attemptsCount}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleRow({ module, index }: { module: ModuleItem; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `admin-module-panel-${module.id ?? index}`;

  return (
    <li className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 bg-white px-3.5 py-2.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">
            {index + 1}
          </span>
          <span className="truncate text-xs font-semibold text-slate-800">{module.judul || "Modul tanpa judul"}</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div id={panelId} role="region" className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3.5">
          <AssessmentStageCard title="Pre-Test" stage={module.preTest} />
          <LearningMaterialBlock material={module.learningMaterial} />
          <AssessmentStageCard title="Post-Test" stage={module.postTest} />
        </div>
      )}
    </li>
  );
}

function CourseCard({ course }: { course: CourseItem }) {
  const [open, setOpen] = useState(false);
  const modules = course.modules ?? [];
  const pct = clampPercent(course.progressPercent);
  const tone = statusTone(course.statusCourse);
  const completed = fmtDate(course.completedAt);
  const panelId = `admin-course-panel-${course.id ?? getCourseTitle(course)}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-2 sm:max-w-[55%]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-800">{getCourseTitle(course)}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.className}`}>
              {tone.label}
            </span>
          </div>
          {completed && <p className="text-[11px] text-slate-400">Selesai: {completed}</p>}
        </div>

        <div className="flex w-full items-center gap-3 sm:w-64">
          <ProgressBar pct={pct} />
          <span className="shrink-0 text-[11px] font-semibold text-slate-500">{modules.length} modul</span>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div id={panelId} role="region" className="border-t border-slate-100 p-4">
          {modules.length > 0 ? (
            <ul className="space-y-2.5">
              {modules.map((m, idx) => (
                <ModuleRow key={m.id ?? idx} module={m} index={idx} />
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-slate-400">Belum ada modul pada course ini.</p>
          )}
        </div>
      )}
    </div>
  );
}

function GuruCard({ guru, fallbackName }: { guru: UserProgressItem; fallbackName: string }) {
  const [open, setOpen] = useState(false);
  const courses = guru.courses ?? [];
  const nama = getGuruName(guru, fallbackName);
  const email = getGuruEmail(guru);
  const panelId = `admin-guru-panel-${guru.userId ?? guru.id ?? nama}`;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50/70 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {nama.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{nama}</p>
            {email && <p className="truncate text-[11px] text-slate-400">{email}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:inline">
            {courses.length} course
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div id={panelId} role="region" className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
          {courses.length > 0 ? (
            courses.map((c) => <CourseCard key={c.id ?? getCourseTitle(c)} course={c} />)
          ) : (
            <p className="text-xs italic text-slate-400">Guru ini belum mengikuti course apa pun.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Halaman
// ---------------------------------------------------------------------------

export default function AdminMonitoringPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    let active = true;

    async function fetchProgress() {
      try {
        setLoading(true);
        setError("");
        const data = await getUsersProgressAll();
        if (!active) return;
        setUsers(Array.isArray(data) ? (data as UserProgressItem[]) : []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data monitoring.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchProgress();

    return () => {
      active = false;
    };
  }, [router]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;
    return users.filter((u) => getGuruName(u, "").toLowerCase().includes(normalizedQuery));
  }, [users, normalizedQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <svg className="w-5 h-5 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat data monitoring...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Dashboard Admin
          </button>
        </div>

        {/* Judul Halaman */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Pembelajaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau progres pembelajaran (course) tiap guru: Pre-Test, materi, dan Post-Test.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* ================= MONITORING PEMBELAJARAN ================= */}
        {!error && (
          <>
            <div className="space-y-1 rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Guru</span>
              <div className="text-2xl font-bold text-slate-900">{users.length} Guru</div>
            </div>

            {/* Pencarian Guru */}
            <div className="relative w-full sm:max-w-sm">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru..."
                aria-label="Cari nama guru"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((guru, idx) => (
                  <GuruCard key={guru.userId ?? guru.id ?? idx} guru={guru} fallbackName={`Guru ${idx + 1}`} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  {users.length === 0 ? "Belum ada guru terdaftar." : "Guru tidak ditemukan."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
