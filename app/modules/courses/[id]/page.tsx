"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCourseById } from "@/services/course.service";
import { getModuleById, getModuleContents, getModules } from "@/services/module.service";
import { getModuleEvaluations } from "@/services/evaluation.service";
import { getCourseComments, postComment } from "@/services/comment.service";
import type { Comment as DiscussionComment, CommentUser } from "@/types/comment";
import {
  claimCertificate,
  getCertificateById,
  getUserCertificates,
} from "@/services/certificate.service";
import { isPreTest, isPostTest, type EvaluationSummary } from "@/types/evaluation";
import type { Course, CourseModule } from "@/types/course";
import {
  isMaterialLocked,
  isPostTestLocked,
  readModuleStageProgress,
  type ModuleStageProgress,
} from "@/lib/moduleStages";
import { isCourseCompletedByBackend } from "@/lib/certificate";

interface CourseWithModules extends Course {
  modules?: CourseModule[];
  moduls?: CourseModule[];
}

interface ModuleOverview {
  hasMaterials: boolean;
  preTestId: string | null;
  postTestId: string | null;
}

interface UserCertificate {
  id: string | null;
  courseId: string | null;
  status: string | null;
  fileUrl: string | null;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("id-ID");
}

function getModuleTitle(module: CourseModule) {
  return module.judul || module.id;
}

function getCommentUserLabel(user?: CommentUser) {
  if (!user) return "Pengguna";
  return user.gelar ? `${user.nama ?? "Pengguna"}, ${user.gelar}` : user.nama ?? "Pengguna";
}

function getCommentUserPhoto(user?: CommentUser) {
  return user?.fotoProfil || user?.foto || user?.avatar || "";
}

function roleLabel(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "pengajar") return "Pengajar";
  if (r === "guru") return "Guru";
  return role || "Pengguna";
}

function roleBadgeClass(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "bg-purple-100 text-purple-700";
  if (r === "pengajar") return "bg-amber-100 text-amber-700";
  if (r === "guru") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

function formatCommentDateTime(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GuruCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-stage completion flags dari BE, keyed by moduleId. Menjadi single
  // source of truth untuk gating Pre-Test → Material → Post-Test.
  const [stageProgress, setStageProgress] = useState<Record<string, ModuleStageProgress>>({});

  // Accordion state + data overview per module (diambil saat module dibuka).
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({});
  const [moduleOverview, setModuleOverview] = useState<Record<string, ModuleOverview>>({});
  const [moduleOverviewLoading, setModuleOverviewLoading] = useState<Record<string, boolean>>({});
  const [moduleOverviewError, setModuleOverviewError] = useState<Record<string, string>>({});

  // Sertifikat user untuk course ini (dari BE). `null` = belum ada record.
  // Status & fileUrl sepenuhnya berasal dari BE; FE tidak meng-generate PDF.
  const [certificate, setCertificate] = useState<UserCertificate | null>(null);
  const [certificateBusy, setCertificateBusy] = useState(false);
  const [certificateMessage, setCertificateMessage] = useState("");

  // Course-level Discussion (Guru). Response BE sudah nested via `replies[]`,
  // sehingga tidak ada pembangunan tree dari data flat di FE.
  const [discussion, setDiscussion] = useState<DiscussionComment[]>([]);
  const [discussionLoading, setDiscussionLoading] = useState(true);
  const [discussionError, setDiscussionError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentPostError, setCommentPostError] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [replyPostError, setReplyPostError] = useState("");

  const loadStageProgress = useCallback(async (modulesList: CourseModule[]) => {
    // GET /api/modules/:id adalah contract stage completion BE. Jangan gunakan
    // /api/progress karena endpoint tersebut sedang gagal 500 dan bukan sumber
    // yang diperlukan untuk gating Course Detail.
    const moduleDetails = await Promise.all(
      modulesList.map((module) => getModuleById(module.id).catch(() => null))
    );

    const progressMap: Record<string, ModuleStageProgress> = {};
    modulesList.forEach((module, index) => {
      const detail = moduleDetails[index];
      progressMap[module.id] = readModuleStageProgress(detail || module);
    });
    setStageProgress(progressMap);
  }, []);

  // Baca sertifikat milik user untuk course ini langsung dari BE.
  // Tidak membuat sertifikat; hanya membaca record yang sudah ada.
  const loadCertificate = useCallback(async (courseId: string) => {
    try {
      const list = (await getUserCertificates()) as UserCertificate[];
      const current = list.find((item) => item.courseId === courseId) ?? null;

      // Bila record sudah ada dan belum punya fileUrl (mis. status `issued`),
      // ambil detailnya untuk memastikan fileUrl terbaru dari BE.
      if (current && !current.fileUrl && current.id) {
        try {
          const detail = (await getCertificateById(current.id)) as UserCertificate;
          setCertificate(detail ?? current);
          return;
        } catch {
          // Abaikan; tampilkan record dari daftar sebagai fallback.
        }
      }

      setCertificate(current);
    } catch {
      // Diamkan: status sertifikat tidak menghalangi halaman Course Detail.
      setCertificate(null);
    }
  }, []);

  // Muat Course-level Discussion dari BE. Response sudah nested (replies[]).
  const loadDiscussion = useCallback(async (courseId: string) => {
    setDiscussionLoading(true);
    setDiscussionError("");
    try {
      const data = await getCourseComments(courseId);
      setDiscussion(Array.isArray(data) ? (data as DiscussionComment[]) : []);
    } catch (err) {
      setDiscussionError(err instanceof Error ? err.message : "Gagal memuat diskusi course.");
    } finally {
      setDiscussionLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError("");
      try {
        const courseData = (await getCourseById(id)) as CourseWithModules;
        setCourse(courseData);

        const attached = courseData?.modules ?? courseData?.moduls;
        let modulesList: CourseModule[];
        if (Array.isArray(attached) && attached.length > 0) {
          modulesList = attached;
        } else {
          const modulesData = await getModules(id);
          modulesList = Array.isArray(modulesData) ? (modulesData as CourseModule[]) : [];
        }
        setModules(modulesList);
        await loadStageProgress(modulesList);
        await loadCertificate(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail course.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCourse();
  }, [id, loadStageProgress, loadCertificate]);

  // Discussion dimuat terpisah dari data course agar kegagalan endpoint diskusi
  // (mis. belum tersedia di BE) tidak memblokir Course Detail.
  useEffect(() => {
    if (id) loadDiscussion(id);
  }, [id, loadDiscussion]);

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

  // Buka file sertifikat (view/download) memakai fileUrl dari BE.
  function openCertificateFile(fileUrl: string) {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  // Aksi tombol Certificate:
  //  - Sudah punya fileUrl → langsung buka.
  //  - Sudah ada record tapi belum ada file → refresh dari BE (tanpa claim ulang).
  //  - Belum ada record & eligible → claim (idempotent), lalu refresh & buka bila siap.
  async function handleCertificateClick() {
    if (certificateBusy) return;
    setCertificateMessage("");

    if (certificate?.fileUrl) {
      openCertificateFile(certificate.fileUrl);
      return;
    }

    setCertificateBusy(true);
    try {
      if (!certificate) {
        await claimCertificate(id);
      }
      // Selalu refresh dari BE agar UI memakai status & fileUrl terbaru.
      const list = (await getUserCertificates()) as UserCertificate[];
      let current = list.find((item) => item.courseId === id) ?? null;
      if (current && !current.fileUrl && current.id) {
        try {
          current = (await getCertificateById(current.id)) as UserCertificate;
        } catch {
          // pertahankan record dari daftar
        }
      }
      setCertificate(current);

      if (current?.fileUrl) {
        openCertificateFile(current.fileUrl);
      } else if (current) {
        setCertificateMessage("Sertifikat sedang diproses oleh server. Silakan coba lagi nanti.");
      } else {
        setCertificateMessage("Sertifikat belum tersedia. Pastikan seluruh modul telah selesai.");
      }
    } catch (err) {
      setCertificateMessage(
        err instanceof Error ? err.message : "Gagal memproses sertifikat."
      );
    } finally {
      setCertificateBusy(false);
    }
  }

  // Kirim komentar utama (Course-level). Tidak mengirim moduleId.
  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    setPostingComment(true);
    setCommentPostError("");
    try {
      await postComment({ courseId: id, komentar: text });
      setNewComment("");
      await loadDiscussion(id);
    } catch (err) {
      setCommentPostError(err instanceof Error ? err.message : "Gagal mengirim komentar.");
    } finally {
      setPostingComment(false);
    }
  }

  // Kirim balasan pada root comment (Course-level + parentId).
  async function handlePostReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;

    setPostingReply(true);
    setReplyPostError("");
    try {
      await postComment({ courseId: id, parentId, komentar: text });
      setReplyText("");
      setReplyToId(null);
      await loadDiscussion(id);
    } catch (err) {
      setReplyPostError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setPostingReply(false);
    }
  }

  function startReply(commentId: string) {
    setReplyToId(commentId);
    setReplyText("");
    setReplyPostError("");
  }

  function cancelReply() {
    setReplyToId(null);
    setReplyText("");
    setReplyPostError("");
  }

  // Segarkan status stage dari BE ketika Guru kembali ke tab ini (mis. setelah
  // menyelesaikan Pre-Test/Material di halaman lain). Satu request saat focus,
  // bukan polling berkala.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      if (modules.length > 0) {
        loadStageProgress(modules);
      }
      loadCertificate(id);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [id, modules, loadStageProgress, loadCertificate]);

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

  // Eligibility sepenuhnya mengikuti BE: course harus menawarkan sertifikat
  // (hasCertificate) dan seluruh modul dilaporkan selesai oleh BE.
  const modulesCompleted = isCourseCompletedByBackend(modules, stageProgress);
  const certificateEligible = Boolean(course.hasCertificate) && modulesCompleted;
  const hasCertificateRecord = Boolean(certificate && (certificate.id || certificate.fileUrl));
  // Tombol aktif bila sudah ada record sertifikat, atau course eligible untuk di-claim.
  const certificateEnabled = hasCertificateRecord || certificateEligible;

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
          {course.hasCertificate && (
            <div className="relative z-20 sm:absolute sm:top-6 sm:right-6 flex flex-col items-stretch sm:items-end">
              <button
                type="button"
                onClick={handleCertificateClick}
                disabled={!certificateEnabled || certificateBusy}
                title={
                  certificateEnabled
                    ? hasCertificateRecord
                      ? "Lihat / unduh sertifikat"
                      : "Ambil sertifikat"
                    : "Sertifikat tersedia setelah seluruh modul selesai"
                }
                aria-label="Sertifikat"
                className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-sm transition ${
                  certificateEnabled && !certificateBusy
                    ? "bg-white text-[#0047A5] hover:bg-white/90"
                    : "bg-white/40 text-white/70 cursor-not-allowed"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.043-.133-2.052-.382-3.016z" />
                </svg>
                {certificateBusy
                  ? "Memproses..."
                  : hasCertificateRecord
                    ? "Sertifikat"
                    : "Ambil Sertifikat"}
              </button>
              {certificateMessage && (
                <p className="mt-2 max-w-[16rem] text-right text-[11px] font-medium text-white/90">
                  {certificateMessage}
                </p>
              )}
            </div>
          )}

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

                const progress = stageProgress[module.id] || {};
                const preTestCompleted = progress.preTestCompleted === true;
                const materialCompleted = progress.materialCompleted === true;
                const postTestCompleted = progress.postTestCompleted === true;
                const isModuleCompleted = preTestCompleted && materialCompleted && postTestCompleted;
                const materialLocked = isMaterialLocked(progress);
                const postTestLocked = isPostTestLocked(progress);

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
                          {isModuleCompleted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Selesai
                            </span>
                          ) : typeof module.progressPercentage === "number" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {module.progressPercentage}%
                            </span>
                          ) : null}
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
                            <div
                              className={`flex flex-col rounded-2xl border bg-white p-4 space-y-3 ${
                                preTestCompleted ? "border-sky-200" : "border-sky-100"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                                    Pre-Test
                                  </span>
                                  {preTestCompleted && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Selesai
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {overview?.preTestId
                                    ? preTestCompleted
                                      ? "Pre-Test telah Anda selesaikan."
                                      : "Kerjakan Pre-Test sebelum mempelajari materi modul."
                                    : "Pre-Test belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {overview?.preTestId ? (
                                <Link
                                  href={`/modules/${module.id}/evaluations/${overview.preTestId}?courseId=${id}`}
                                  className={`mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-full transition ${
                                    preTestCompleted
                                      ? "bg-sky-600 hover:bg-sky-700"
                                      : "bg-sky-700 hover:bg-sky-800"
                                  }`}
                                >
                                  {preTestCompleted ? "Lanjutkan Pre-Test" : "Mulai Pre-Test"}
                                </Link>
                              ) : (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Belum tersedia
                                </span>
                              )}
                            </div>

                            {/* 2. Learning Material */}
                            <div
                              className={`flex flex-col rounded-2xl border bg-white p-4 space-y-3 ${
                                materialLocked ? "border-slate-200 bg-slate-50/60" : "border-emerald-100"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                                    Learning Material
                                  </span>
                                  {materialLocked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                      Terkunci
                                    </span>
                                  ) : materialCompleted ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Selesai
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {materialLocked
                                    ? "Selesaikan Pre-Test terlebih dahulu untuk membuka materi."
                                    : overview?.hasMaterials
                                      ? materialCompleted
                                        ? "Materi pembelajaran telah Anda selesaikan."
                                        : "Pelajari materi pembelajaran modul ini."
                                      : "Learning material belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {materialLocked ? (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Terkunci
                                </span>
                              ) : overview?.hasMaterials ? (
                                <Link
                                  href={`/modules/${module.id}?courseId=${id}`}
                                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-full hover:bg-emerald-800 transition"
                                >
                                  {materialCompleted ? "Lanjutkan Belajar" : "Mulai Belajar"}
                                </Link>
                              ) : (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Belum tersedia
                                </span>
                              )}
                            </div>

                            {/* 3. Post-Test */}
                            <div
                              className={`flex flex-col rounded-2xl border bg-white p-4 space-y-3 ${
                                postTestLocked ? "border-slate-200 bg-slate-50/60" : "border-purple-100"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-purple-700">
                                    Post-Test
                                  </span>
                                  {postTestLocked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                      Terkunci
                                    </span>
                                  ) : postTestCompleted ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Selesai
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {postTestLocked
                                    ? "Selesaikan seluruh materi pembelajaran untuk membuka Post-Test."
                                    : overview?.postTestId
                                      ? postTestCompleted
                                        ? "Post-Test telah Anda selesaikan."
                                        : "Kerjakan Post-Test setelah menyelesaikan materi modul."
                                      : "Post-Test belum tersedia untuk module ini."}
                                </p>
                              </div>
                              {postTestLocked ? (
                                <span className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-full cursor-not-allowed">
                                  Terkunci
                                </span>
                              ) : overview?.postTestId ? (
                                <Link
                                  href={`/modules/${module.id}/evaluations/${overview.postTestId}?courseId=${id}`}
                                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700 text-white text-xs font-semibold rounded-full hover:bg-purple-800 transition"
                                >
                                  {postTestCompleted ? "Lanjutkan Post-Test" : "Mulai Post-Test"}
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

        {/* Diskusi Course */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
              </svg>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Diskusi Course</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {discussion.length} diskusi
            </span>
          </div>

          {/* Form komentar utama */}
          <form onSubmit={handlePostComment} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <label htmlFor="new-course-comment" className="block text-xs font-bold text-slate-600">
              Tulis Komentar
            </label>
            {commentPostError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{commentPostError}</p>
            )}
            <textarea
              id="new-course-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Bagikan pertanyaan atau tanggapan untuk course ini..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={postingComment || !newComment.trim()}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {postingComment ? "Mengirim..." : "Kirim Komentar"}
              </button>
            </div>
          </form>

          {/* Daftar diskusi (nested) */}
          {discussionLoading ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
              Memuat diskusi...
            </div>
          ) : discussionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {discussionError}
            </div>
          ) : discussion.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Belum ada diskusi pada course ini.
            </div>
          ) : (
            <ul className="space-y-3">
              {discussion.map((comment) => {
                const user = comment.user || comment.author || comment.pengirim;
                const photo = getCommentUserPhoto(user);
                const name = getCommentUserLabel(user);
                const text = comment.komentar || comment.isi || comment.pesan || "";
                const replies = Array.isArray(comment.replies) ? comment.replies : [];

                return (
                  <li key={comment.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={name}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold uppercase text-white">
                          {name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(user?.role)}`}>
                            {roleLabel(user?.role)}
                          </span>
                          {comment.createdAt && (
                            <span className="text-[11px] text-slate-400">{formatCommentDateTime(comment.createdAt)}</span>
                          )}
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700">{text}</p>

                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => (replyToId === comment.id ? cancelReply() : startReply(comment.id))}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            {replyToId === comment.id ? "Batal" : "Balas"}
                          </button>
                        </div>

                        {/* Form balasan */}
                        {replyToId === comment.id && (
                          <form
                            onSubmit={(e) => handlePostReply(e, comment.id)}
                            className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                          >
                            {replyPostError && (
                              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{replyPostError}</p>
                            )}
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={2}
                              placeholder="Tulis balasan..."
                              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={postingReply || !replyText.trim()}
                                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                              >
                                {postingReply ? "Mengirim..." : "Kirim Balasan"}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Balasan nested (struktur langsung dari BE) */}
                        {replies.length > 0 && (
                          <ul className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                            {replies.map((reply) => {
                              const replyUser = reply.user || reply.author || reply.pengirim;
                              const replyPhoto = getCommentUserPhoto(replyUser);
                              const replyName = getCommentUserLabel(replyUser);
                              const replyContent = reply.komentar || reply.isi || reply.pesan || "";

                              return (
                                <li key={reply.id} className="rounded-xl bg-slate-50 p-3">
                                  <div className="flex items-start gap-2.5">
                                    {replyPhoto ? (
                                      <Image
                                        src={replyPhoto}
                                        alt={replyName}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover"
                                      />
                                    ) : (
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500 text-xs font-bold uppercase text-white">
                                        {replyName.charAt(0)}
                                      </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800">{replyName}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(replyUser?.role)}`}>
                                          {roleLabel(replyUser?.role)}
                                        </span>
                                        {reply.createdAt && (
                                          <span className="text-[11px] text-slate-400">{formatCommentDateTime(reply.createdAt)}</span>
                                        )}
                                      </div>
                                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{replyContent}</p>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
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
