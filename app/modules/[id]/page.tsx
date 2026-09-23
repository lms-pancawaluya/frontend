"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getModuleById, getModuleContents } from "@/services/module.service";
import { completeContent, getModuleProgress, reportContentProgress } from "@/services/progress.service";
import { getMaterialRoute, isVideoMaterial, sortMaterialsByUrutan, type ModuleMaterial } from "@/lib/materials";
import {
  clampPercent,
  readMaterialStatus,
  type MaterialProgressEntry,
} from "@/lib/contentProgress";
import ModuleStageGuard from "@/app/components/common/ModuleStageGuard";
import MaterialStatusBadge from "@/app/components/common/MaterialStatusBadge";

import { API_URL, fetchApi } from "@/lib/api";

const API_BASE_URL = `${API_URL}/api`;

interface Question {
  id: string;
  pertanyaan: string;
  options: { id: string; teksOpsi: string }[];
}

interface MiniQuiz {
  id: string;
  judul: string;
  timestampSeconds: number;
  passingScore: number;
  maxAttempts: number;
  questions?: Question[];
  isEndQuiz?: boolean;
}

interface ModuleContent {
  id: string;
  judul?: string;
  tipe?: string;
  konten?: string;
  urutan?: number;
}

interface AttemptResult {
  skor: number;
  isLolos: boolean;
  passingScore?: number;
  mustRepeat?: boolean;
}

interface YouTubePlayer {
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  destroy?: () => void;
}

interface YouTubeStateChangeEvent {
  data: number;
}

interface YouTubePlayerOptions {
  videoId: string;
  playerVars: {
    controls: number;
    disablekb: number;
    enablejsapi: number;
    rel: number;
    modestbranding: number;
  };
  events: {
    onStateChange: (event: YouTubeStateChangeEvent) => void;
  };
}

type YouTubeWindow = Window & {
  YT?: {
    Player: new (elementId: string, options: YouTubePlayerOptions) => YouTubePlayer;
  };
  onYouTubeIframeAPIReady?: () => void;
};

const getStoredAuthToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token") || localStorage.getItem("authToken") || ""
    : "";

/**
 * Robust YouTube ID Extractor
 * Mengisolasi persis 11 karakter ID YouTube & membuang query parameter seperti ?si=..., &t=..., dll.
 */
const getYoutubeId = (url?: string): string => {
  if (!url) return "";
  const cleanUrl = url.trim();

  // Jika input sudah merupakan 11-character ID murni
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Matching format URL YouTube umum (watch, embed, shorturl/youtu.be)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = cleanUrl.match(regExp);

  return match && match[2].length === 11 ? match[2] : "";
};

export default function ModuleVideoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-6 text-xs text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">Memuat materi...</div>}>
      <ModuleStageGuardWrapper />
    </Suspense>
  );
}

function ModuleStageGuardWrapper() {
  const params = useParams();
  const moduleId = params.id as string;

  return (
    <ModuleStageGuard moduleId={moduleId} stage="material">
      <ModuleVideoPageContent />
    </ModuleStageGuard>
  );
}

function ModuleVideoPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = params.id as string;

  const [videoContent, setVideoContent] = useState<ModuleContent | null>(null);
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moduleDescription, setModuleDescription] = useState<string>("");
  const [miniQuizzes, setMiniQuizzes] = useState<MiniQuiz[]>([]);
  const [answeredQuizIds, setAnsweredQuizIds] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<MiniQuiz | null>(null);

  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authToken] = useState(getStoredAuthToken);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Progress/status per material dari BE (single source of truth).
  const [materialStatus, setMaterialStatus] = useState<Record<string, MaterialProgressEntry>>({});
  // progressPercent terakhir yang sudah berhasil dilaporkan ke BE (throttle).
  const lastReportedPercentRef = useRef<number>(0);
  const completionSentRef = useRef<boolean>(false);

  // Loading & Error States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Status resolusi material awal. Video UI HANYA boleh dirender saat status
  // ini bernilai "video", sehingga tidak ada paint Video sebelum material
  // aktif benar-benar diketahui.
  const [resolutionStatus, setResolutionStatus] = useState<"resolving" | "video" | "non-video" | "error">("resolving");

  const playerRef = useRef<YouTubePlayer | null>(null);
  const maxWatchedTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const invalidVideoMessage =
    videoContent && !getYoutubeId(videoContent.konten)
      ? "URL Video tidak valid atau ID YouTube tidak ditemukan."
      : null;
  const displayErrorMessage = errorMessage || invalidVideoMessage;

  // REFS untuk mencegah stale closure pada event loop YouTube API
  const activeQuizRef = useRef<MiniQuiz | null>(null);
  const answeredQuizIdsRef = useRef<string[]>([]);
  const miniQuizzesRef = useRef<MiniQuiz[]>([]);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  useEffect(() => {
    answeredQuizIdsRef.current = answeredQuizIds;
  }, [answeredQuizIds]);

  useEffect(() => {
    miniQuizzesRef.current = miniQuizzes;
  }, [miniQuizzes]);

  // Memuat status per-material dari BE (GET /api/progress/:moduleId).
  const refreshMaterialStatus = useCallback(async () => {
    const data = await getModuleProgress(moduleId);
    if (data) {
      setMaterialStatus(readMaterialStatus(data));
    }
  }, [moduleId]);

  // Memuat konten dan metadata modul
  useEffect(() => {
    async function init() {
      setErrorMessage(null);
      setResolutionStatus("resolving");
      try {
        const [contentsRes, moduleRes] = await Promise.all([
          getModuleContents(moduleId),
          getModuleById(moduleId).catch(() => null),
        ]);

        if (moduleRes?.deskripsi) {
          setModuleDescription(moduleRes.deskripsi);
        }

        const foundCourseId = moduleRes?.courseId || moduleRes?.course_id || null;
        if (foundCourseId) {
          setCourseId(foundCourseId);
        }

        const contents = sortMaterialsByUrutan(contentsRes as ModuleMaterial[]);
        setMaterials(contents);

        // Muat status per-material dari progress BE (single source of truth).
        void refreshMaterialStatus();

        if (contents.length > 0) {
          const requestedIndex = Number(searchParams.get("i"));
          const hasRequestedIndex = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < contents.length;
          // Tanpa index eksplisit, mulai dari material pertama (paling kecil
          // `urutan`-nya) — bukan dari tipe tertentu (mis. video).
          const targetIndex = hasRequestedIndex ? requestedIndex : 0;
          setCurrentIndex(targetIndex);

          const target = contents[targetIndex];
          if (target && isVideoMaterial(target.tipe)) {
            setVideoContent(target as ModuleContent);
            setResolutionStatus("video");

            try {
              const quizRes = await fetchApi(`${API_BASE_URL}/mini-quizzes/content/${target.id}`, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
              });
              const quizJson = await quizRes.json();

              // ✅ Simpan data quiz apa adanya, termasuk questions-nya.
              // Endpoint content/:contentId ini SUDAH mengembalikan soal
              // secara lengkap, jadi tidak perlu (dan tidak boleh) dibuang
              // di sini.
              if (quizJson.sukses && Array.isArray(quizJson.data)) {
                setMiniQuizzes(quizJson.data);
              }
            } catch (err) {
              console.error("Gagal memuat mini quiz:", err);
              setMiniQuizzes([]);
            }
          } else if (target) {
            // Material pertama (atau pada index ini) bukan video → serahkan ke
            // halaman material generik pada posisi yang sama. Tandai sebagai
            // non-video agar UI Video tidak pernah dirender.
            setResolutionStatus("non-video");
            router.replace(getMaterialRoute(moduleId, contents, targetIndex));
          } else {
            setResolutionStatus("error");
            router.replace(foundCourseId ? `/modules/courses/${foundCourseId}` : "/modules");
          }
        } else {
          setResolutionStatus("error");
          router.replace(foundCourseId ? `/modules/courses/${foundCourseId}` : "/modules");
        }
      } catch (err) {
        console.error("Gagal memuat konten pembelajaran:", err);
        setResolutionStatus("error");
        setErrorMessage("Gagal terhubung ke server backend.");
      }
    }
    init();
  }, [moduleId, authToken, router, searchParams, refreshMaterialStatus]);

  // ❌ useEffect fetch detail kuis ke endpoint GET /mini-quizzes/:id sudah
  // DIHAPUS. Endpoint itu tidak tersedia di backend dan menyebabkan error
  // "Unexpected token '<', "<!DOCTYPE "... is not valid JSON". Data
  // questions sekarang sudah lengkap sejak fetch pertama di atas, jadi
  // effect ini tidak diperlukan lagi.

  // Ref contentId video aktif, agar pelaporan progress memakai id yang benar.
  const videoContentIdRef = useRef<string | null>(null);
  useEffect(() => {
    videoContentIdRef.current = videoContent?.id ?? null;
    // Reset pelaporan & waktu tonton saat berpindah ke video/material lain
    // (route sama, query beda).
    lastReportedPercentRef.current = 0;
    completionSentRef.current = false;
    maxWatchedTimeRef.current = 0;
  }, [videoContent]);

  // Laporkan progress video ke BE. Completion diproses terpisah setelah video
  // mencapai 100% dan seluruh Mini Quiz dinyatakan lolos.
  const reportVideoProgress = useCallback((percent: number) => {
    const contentId = videoContentIdRef.current;
    if (!contentId) return;

    const clamped = clampPercent(percent);
    const lastReported = lastReportedPercentRef.current;

    // Jangan turunkan/mengulang laporan yang tidak perlu.
    if (clamped <= lastReported && clamped < 100) return;

    if (clamped >= 100) {
      lastReportedPercentRef.current = 100;
      reportContentProgress(contentId, 100).catch((err) =>
        console.warn("Gagal mengirim progress video:", err)
      );
      return;
    }

    if (clamped - lastReported < 5) return;
    lastReportedPercentRef.current = clamped;

    reportContentProgress(contentId, clamped).catch((err) =>
      console.warn("Gagal mengirim progress video:", err)
    );
  }, []);

  // Evaluasi waktu pemutaran video
  const checkTimeAndTriggers = useCallback((cTime: number, dur: number) => {
    // Membatasi fungsi percepatan video (fast-forward)
    if (cTime > maxWatchedTimeRef.current + 2) {
      if (playerRef.current && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(maxWatchedTimeRef.current, true);
      }
      return;
    }

    if (cTime > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = cTime;
    }

    // Laporkan progress berdasarkan waktu tonton aktual (maxWatchedTime).
    if (dur > 0) {
      reportVideoProgress((maxWatchedTimeRef.current / dur) * 100);
    }

    const currentSec = Math.floor(cTime);
    const quizzes = miniQuizzesRef.current;
    const answeredIds = answeredQuizIdsRef.current;

    // Evaluasi pemicu kuis pada interval pertengahan video
    if (!activeQuizRef.current) {
      const midQuiz = quizzes.find(
        (q) =>
          currentSec >= q.timestampSeconds &&
          !answeredIds.includes(q.id) &&
          !q.isEndQuiz
      );

      if (midQuiz) {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setActiveQuiz(midQuiz);
        return;
      }
    }

    // Evaluasi penyelesaian pemutaran video
    if (dur > 0 && cTime >= dur - 1) {
      setIsVideoFinished(true);
      const endQuiz = quizzes.find(
        (q) =>
          (q.isEndQuiz || q.timestampSeconds >= Math.floor(dur) - 2) &&
          !answeredIds.includes(q.id)
      );

      if (endQuiz && !activeQuizRef.current) {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setActiveQuiz(endQuiz);
      }
    }
  }, [reportVideoProgress]);

  const completeVideoMaterial = useCallback(async () => {
    const contentId = videoContentIdRef.current;
    if (!contentId || completionSentRef.current) return false;

    completionSentRef.current = true;
    try {
      await completeContent(contentId);
      await refreshMaterialStatus();
      return true;
    } catch (err) {
      completionSentRef.current = false;
      console.warn("Gagal menyelesaikan materi video:", err);
      return false;
    }
  }, [refreshMaterialStatus]);

  const goToNextMaterial = useCallback(() => {
    router.push(getMaterialRoute(moduleId, materials, currentIndex + 1));
  }, [currentIndex, materials, moduleId, router]);

  // Inisialisasi Pemutar YouTube Iframe API
  useEffect(() => {
    if (!videoContent) return;

    const vId = getYoutubeId(videoContent.konten);
    if (!vId) {
      return;
    }

    let isMounted = true;

    const initYT = () => {
      const youtubeWindow = window as YouTubeWindow;
      // Memastikan elemen DOM target (#player-iframe) sudah dirender di DOM
      const targetElement = document.getElementById("player-iframe");

      if (!targetElement || !youtubeWindow.YT || !youtubeWindow.YT.Player) {
        return;
      }

      // Hapus player lama jika ada
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      try {
        playerRef.current = new youtubeWindow.YT.Player("player-iframe", {
          videoId: vId,
          playerVars: {
            controls: 1,
            disablekb: 1,
            enablejsapi: 1,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onStateChange: (evt) => {
              if (!isMounted) return;

              if (evt.data === 1) {
                // Playing
                if (!timerIntervalRef.current) {
                  timerIntervalRef.current = setInterval(() => {
                    const player = playerRef.current;
                    if (player && typeof player.getCurrentTime === "function") {
                      const cTime = player.getCurrentTime() || 0;
                      const dur = player.getDuration ? player.getDuration() || 0 : 0;
                      checkTimeAndTriggers(cTime, dur);
                    }
                  }, 400);
                }
              } else {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
              }

              if (evt.data === 0) {
                // Ended — video benar-benar selesai → laporkan 100% & complete.
                maxWatchedTimeRef.current = Number.MAX_SAFE_INTEGER;
                setIsVideoFinished(true);
                reportVideoProgress(100);
                const quizzes = miniQuizzesRef.current;
                const answeredIds = answeredQuizIdsRef.current;
                const endQuiz = quizzes.find((q) => !answeredIds.includes(q.id));
                if (endQuiz && !activeQuizRef.current) {
                  setActiveQuiz(endQuiz);
                }
              }
            },
          },
        });
      } catch (err) {
        console.error("Gagal menginisialisasi YouTube Player:", err);
      }
    };

    const youtubeWindow = window as YouTubeWindow;

    // Jika YT sudah dimuat sebelumnya
    if (youtubeWindow.YT && youtubeWindow.YT.Player) {
      // Gunakan setTimeout kecil untuk menjamin DOM sudah dirender penuh oleh Next.js
      const timer = setTimeout(() => {
        if (isMounted) initYT();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Inject script YouTube Iframe API jika belum terpasang
      if (!document.getElementById("yt-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      const originalOnReady = youtubeWindow.onYouTubeIframeAPIReady;
      youtubeWindow.onYouTubeIframeAPIReady = () => {
        if (originalOnReady) originalOnReady();
        if (isMounted) initYT();
      };
    }

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [videoContent, checkTimeAndTriggers, reportVideoProgress]);

  // Pengiriman jawaban kuis
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;

    const jawabanPayload = Object.entries(userAnswers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`${API_BASE_URL}/mini-quizzes/${activeQuiz.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ jawaban: jawabanPayload }),
      });
      const json = await res.json();

      if (json.sukses) {
        setAttemptResult(json.data);
        if (json.data.isLolos) {
          setAnsweredQuizIds((prev) => [...prev, activeQuiz.id]);
        }
      } else {
        setAttemptResult({ skor: 100, isLolos: true });
        setAnsweredQuizIds((prev) => [...prev, activeQuiz.id]);
      }
    } catch {
      setAttemptResult({ skor: 100, isLolos: true });
      setAnsweredQuizIds((prev) => [...prev, activeQuiz.id]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Video UI HANYA dirender setelah resolusi material awal memastikan material
  // aktif adalah video. Selama resolving / saat diarahkan ke material non-video
  // / saat error, tampilkan state netral saja (tidak ada badge/judul/player
  // Video maupun fallback "Materi Video Utama").
  if (resolutionStatus !== "video" || !videoContent) {
    const isError = resolutionStatus === "error";
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-6 dark:bg-slate-900/70">
        {isError ? (
          <div className="max-w-md text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {displayErrorMessage || "Materi tidak dapat ditampilkan."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Silakan periksa kembali data modul atau pastikan koneksi internet terhubung.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Memuat materi pembelajaran...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-6 relative overflow-hidden dark:bg-slate-900/70">
      {/* ================= BACKGROUND DEKORATIF DISDIK JABAR ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute top-2/3 -left-16 w-80 h-80 bg-[#F3BF10]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />

        <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-[#F3BF10] rounded-tl-sm opacity-70" />
        <div className="absolute top-6 left-12 w-2.5 h-2.5 bg-[#109B51] rounded-full" />

        <div className="absolute top-16 right-10 hidden md:block opacity-20 transform rotate-12">
          <div className="w-16 h-16 bg-[#109B51] rounded-tl-2xl rounded-br-2xl mb-2" />
          <div className="w-20 h-12 bg-[#F3BF10] rounded-tr-2xl rounded-bl-2xl -mt-6 ml-4" />
        </div>

        <div className="absolute top-1/3 left-6 hidden lg:grid grid-cols-4 gap-2.5 opacity-25">
          <div className="w-2 h-2 bg-[#0047A5] rounded-full" />
          <div className="w-2 h-2 bg-[#419AD6] rounded-full" />
          <div className="w-2 h-2 bg-[#109B51] rounded-full" />
          <div className="w-2 h-2 bg-[#F3BF10] rounded-full" />
          <div className="w-2 h-2 bg-[#419AD6] rounded-full" />
          <div className="w-2 h-2 bg-[#0047A5] rounded-full" />
          <div className="w-2 h-2 bg-[#F3BF10] rounded-full" />
          <div className="w-2 h-2 bg-[#109B51] rounded-full" />
        </div>

        <div className="absolute -bottom-10 right-8 w-64 h-64 border-4 border-[#419AD6]/20 rounded-full" />
        <div className="absolute bottom-6 right-24 w-36 h-36 border-4 border-[#109B51]/20 rounded-full" />

        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-[#0047A5] rounded-br-sm opacity-70" />
      </div>

      {/* ================= KONTEN UTAMA ================= */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Bilah Navigasi dan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm dark:bg-slate-900/90 dark:border-slate-800">
          <button
            onClick={() => router.push(courseId ? `/modules/courses/${courseId}` : "/modules")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group dark:text-slate-300 dark:hover:text-emerald-400"
          >
            <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors dark:bg-slate-800 dark:group-hover:bg-emerald-950/40 dark:text-slate-400 dark:group-hover:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Detail Course
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50/90 border border-amber-200/80 px-3 py-1.5 rounded-xl dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Penayangan Video Wajib Diselesaikan
            </span>
          </div>
        </div>

        {moduleDescription && (
          <div className="prose prose-slate prose-sm max-w-none">
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line dark:text-slate-300">
              {moduleDescription}
            </p>
          </div>
        )}

        {/* Informasi Utama Modul */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/90 px-2.5 py-1 rounded-md border border-emerald-200/60 backdrop-blur-sm dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Materi Pembelajaran Video
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {videoContent?.judul || "Materi Video Utama"}
            </h1>
            <MaterialStatusBadge
              entry={videoContent ? materialStatus[videoContent.id] : undefined}
            />
          </div>
        </div>

        {/* Container Pemutar Video */}
        <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 ring-1 ring-slate-900/10">
          {/* Tampilan Error Fallback */}
          {displayErrorMessage && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="font-semibold text-white text-base">{displayErrorMessage}</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Silakan periksa kembali data modul atau pastikan koneksi internet terhubung.
              </p>
            </div>
          )}

          {/* Target Element Iframe Player YouTube */}
          <div id="player-iframe" className="w-full h-full" />

          {/* Modal Pop-up Mini Quiz */}
          {activeQuiz && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100 relative my-auto dark:bg-slate-900 dark:border-slate-800">
                {!attemptResult ? (
                  <form onSubmit={handleSubmitQuiz} className="space-y-5">
                    <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Kuis Interaktif
                        </span>
                        <span className="text-xs text-slate-400 font-medium dark:text-slate-500">
                          Batas Kelulusan: {activeQuiz.passingScore}%
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug dark:text-slate-100">
                        {activeQuiz.judul}
                      </h3>
                    </div>

                    <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
                      {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                        activeQuiz.questions.map((q, idx) => (
                          <div key={q.id} className="space-y-3">
                            <p className="font-semibold text-slate-800 text-sm leading-relaxed dark:text-slate-200">
                              <span className="text-emerald-700 font-bold dark:text-emerald-400">{idx + 1}.</span>{" "}
                              {q.pertanyaan}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const optionLabels = ["A", "B", "C", "D"];
                                const isSelected = userAnswers[q.id] === opt.id;
                                return (
                                  <label
                                    key={opt.id}
                                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs sm:text-sm cursor-pointer transition-all duration-200 ${
                                      isSelected
                                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-medium shadow-sm ring-1 ring-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-200"
                                        : "bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-600"
                                    }`}
                                  >
                                    <div
                                      className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                                        isSelected
                                          ? "bg-emerald-700 text-white"
                                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      {optionLabels[optIdx] || optIdx + 1}
                                    </div>
                                    <input
                                      type="radio"
                                      name={`q-${q.id}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        setUserAnswers((p) => ({ ...p, [q.id]: opt.id }))
                                      }
                                      className="sr-only"
                                    />
                                    <span className="pt-0.5 leading-snug">{opt.teksOpsi}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4 dark:text-slate-500">
                          Kuis ini belum memiliki soal.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !activeQuiz.questions ||
                        activeQuiz.questions.length === 0 ||
                        Object.keys(userAnswers).length < activeQuiz.questions.length
                      }
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      {isSubmitting ? "Memproses Jawaban..." : "Kirim Jawaban Kuis"}
                    </button>
                  </form>
                ) : (
                  /* Hasil Evaluasi */
                  <div className="text-center space-y-5 py-2">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                        attemptResult.isLolos
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                          : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                      }`}
                    >
                      {attemptResult.isLolos ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">
                        Hasil Kuis Interaktif
                      </span>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Capaian Skor: {attemptResult.skor}%
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed pt-1 dark:text-slate-300">
                        {attemptResult.isLolos
                          ? "Anda telah memenuhi batas kriteria ketuntasan minimal. Silakan melanjutkan pemutaran video."
                          : "Skor belum mencapai batas kriteria ketuntasan minimal (80%). Silakan lakukan pemahaman ulang."}
                      </p>
                    </div>

                    {attemptResult.isLolos ? (
                      <button
                        onClick={() => {
                          setActiveQuiz(null);
                          setAttemptResult(null);
                          setUserAnswers({});
                          playerRef.current?.playVideo();
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
                      >
                        <span>Lanjutkan Pemutaran Video</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    ) : attemptResult.mustRepeat ? (
                      <button
                        onClick={() => {
                          setActiveQuiz(null);
                          setAttemptResult(null);
                          setUserAnswers({});
                          maxWatchedTimeRef.current = 0;
                          setIsVideoFinished(false);
                          playerRef.current?.seekTo(0, true);
                          playerRef.current?.playVideo();
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Ulangi Pemutaran dari Awal</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAttemptResult(null);
                          setUserAnswers({});
                        }}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                      >
                        Coba Kembali Kuis
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel Langkah Selanjutnya */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-slate-900/90 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isVideoFinished ? "bg-emerald-600" : "bg-amber-500"
              }`}
            />
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed dark:text-slate-300">
              {!isVideoFinished
                ? "Selesaikan penayangan video dan kuis interaktif untuk melanjutkan ke materi berikutnya."
                : "Seluruh tahapan pembelajaran video dan kuis interaktif telah diselesaikan."}
            </p>
          </div>

          <button
            onClick={async () => {
              if (!isVideoFinished) return;
              if (await completeVideoMaterial()) goToNextMaterial();
            }}
            disabled={!isVideoFinished}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all duration-200 ${
              isVideoFinished
                ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-md shadow-emerald-700/10"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60 shadow-none dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
            }`}
          >
            <span>{currentIndex + 1 < materials.length ? "Materi Berikutnya" : "Kembali ke Detail Course"}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}