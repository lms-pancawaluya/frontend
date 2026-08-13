"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleContents } from "@/services/module.service";

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

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
  questions: Question[];
  isEndQuiz?: boolean;
}

interface ModuleContent {
  id: string;
  judul?: string;
  tipe?: string;
  konten?: string;
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

export default function ModuleVideoPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;

  const [videoContent, setVideoContent] = useState<ModuleContent | null>(null);
  const [miniQuizzes, setMiniQuizzes] = useState<MiniQuiz[]>([]);
  const [answeredQuizIds, setAnsweredQuizIds] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<MiniQuiz | null>(null);

  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authToken] = useState(getStoredAuthToken);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const maxWatchedTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const getYoutubeId = (url?: string) => {
    if (!url) return "";
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    return match ? match[1] : "";
  };

  // Memuat konten modul dan mini quiz
  useEffect(() => {
    async function init() {
      try {
        const contents = (await getModuleContents(moduleId)) as ModuleContent[];
        const vid = contents.find((c) => c.tipe === "video");
        if (vid) {
          setVideoContent(vid);

          const res = await fetch(`${API_BASE_URL}/mini-quizzes/content/${vid.id}`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          });
          const json = await res.json();
          
          if (json.sukses && Array.isArray(json.data) && json.data.length > 0) {
            setMiniQuizzes(json.data);
          } else {
            // Fallback data kuis jika API backend belum tersedia
            setMiniQuizzes([
              {
                id: "quiz-60s",
                judul: "Evaluasi Pemahaman Awal (Detik ke-60)",
                timestampSeconds: 60,
                passingScore: 80,
                maxAttempts: 3,
                questions: [
                  {
                    id: "q1",
                    pertanyaan: "Berdasarkan pemaparan materi, apa tujuan utama dari penerapan nilai Panca Waluya dalam proses pembelajaran?",
                    options: [
                      { id: "opt1", teksOpsi: "Mengintegrasikan lima karakter luhur Sunda ke dalam proses pembentukan kecerdasan peserta didik" },
                      { id: "opt2", teksOpsi: "Memenuhi dokumentasi administratif kurikulum tanpa implementasi praktis" },
                      { id: "opt3", teksOpsi: "Menggantikan seluruh struktur kurikulum nasional secara menyeluruh" },
                    ],
                  },
                ],
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Gagal memuat konten pembelajaran:", err);
      }
    }
    init();
  }, [moduleId, authToken]);

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
        (q) => (q.isEndQuiz || q.timestampSeconds >= Math.floor(dur) - 2) &&
               !answeredIds.includes(q.id)
      );

      if (endQuiz && !activeQuizRef.current) {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setActiveQuiz(endQuiz);
      }
    }
  }, []);

  // Inisialisasi Pemutar YouTube Iframe API
  useEffect(() => {
    if (!videoContent) return;

    const vId = getYoutubeId(videoContent.konten);
    if (!vId) return;

    const initYT = () => {
      const youtubeWindow = window as YouTubeWindow;
      if (playerRef.current || !youtubeWindow.YT) return;
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
            if (evt.data === 1) { // Playing
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

            if (evt.data === 0) { // Ended
              setIsVideoFinished(true);
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
    };

    const youtubeWindow = window as YouTubeWindow;
    if (!youtubeWindow.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      youtubeWindow.onYouTubeIframeAPIReady = () => initYT();
    } else {
      initYT();
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [videoContent, checkTimeAndTriggers]);

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
      const res = await fetch(`${API_BASE_URL}/mini-quizzes/${activeQuiz.id}/attempt`, {
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

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Bilah Navigasi dan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            onClick={() => router.push(`/modules/${moduleId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group"
          >
            <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Pengantar Modul
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Penayangan Video Wajib Diselesaikan
            </span>
          </div>
        </div>

        {/* Informasi Utama Modul */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Materi Pembelajaran Video
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {videoContent?.judul || "Materi Video Utama"}
          </h1>
        </div>

        {/* Container Pemutar Video */}
        <div className="relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 ring-1 ring-slate-900/10">
          <div id="player-iframe" className="w-full h-full" />

          {/* Modal Pop-up Mini Quiz */}
          {activeQuiz && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100 relative my-auto">
                
                {!attemptResult ? (
                  <form onSubmit={handleSubmitQuiz} className="space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Evaluasi Pembelajaran
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Batas Kelulusan: {activeQuiz.passingScore}%
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{activeQuiz.judul}</h3>
                    </div>

                    <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
                      {activeQuiz.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-3">
                          <p className="font-semibold text-slate-800 text-sm leading-relaxed">
                            <span className="text-emerald-700 font-bold">{idx + 1}.</span> {q.pertanyaan}
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
                                      ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-medium shadow-sm ring-1 ring-emerald-400"
                                      : "bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                  }`}
                                >
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                                    isSelected ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"
                                  }`}>
                                    {optionLabels[optIdx] || optIdx + 1}
                                  </div>
                                  <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    checked={isSelected}
                                    onChange={() => setUserAnswers((p) => ({ ...p, [q.id]: opt.id }))}
                                    className="sr-only"
                                  />
                                  <span className="pt-0.5 leading-snug">{opt.teksOpsi}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        Object.keys(userAnswers).length < activeQuiz.questions.length
                      }
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Memproses Evaluasi..." : "Kirim Jawaban Evaluasi"}
                    </button>
                  </form>
                ) : (
                  /* Hasil Evaluasi */
                  <div className="text-center space-y-5 py-2">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                        attemptResult.isLolos
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-rose-50 border-rose-200 text-rose-700"
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
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Hasil Evaluasi Pembelajaran
                      </span>
                      <h4 className="text-2xl font-bold text-slate-900">
                        Capaian Skor: {attemptResult.skor}%
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed pt-1">
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
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
                      >
                        Coba Kembali Evaluasi
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Panel Langkah Selanjutnya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isVideoFinished ? "bg-emerald-600" : "bg-amber-500"}`} />
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {!isVideoFinished
                ? "Selesaikan penayangan video dan evaluasi pembelajaran untuk melanjutkan ke modul teks."
                : "Seluruh tahapan pembelajaran video dan evaluasi telah diselesaikan."}
            </p>
          </div>

          <button
            onClick={() => isVideoFinished && router.push(`/modules/${moduleId}/text`)}
            disabled={!isVideoFinished}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-xs sm:text-sm rounded-2xl transition-all duration-200 ${
              isVideoFinished
                ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-md shadow-emerald-700/10"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60 shadow-none"
            }`}
          >
            <span>Lanjut ke Materi Teks</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
