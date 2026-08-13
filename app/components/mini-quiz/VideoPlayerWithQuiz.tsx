"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

interface Option {
  id: string;
  teksOpsi: string;
}

interface Question {
  id: string;
  pertanyaan: string;
  options: Option[];
}

interface MiniQuiz {
  id: string;
  judul: string;
  timestampSeconds: number;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

interface AttemptResult {
  skor: number;
  isLolos: boolean;
  passingScore: number;
  sisaPercobaan: number;
  mustRepeat: boolean;
  benar?: number;
  totalSoal?: number;
}

interface VideoPlayerWithQuizProps {
  videoUrl: string;
  contentId: string;
  authToken: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayerWithQuiz: React.FC<VideoPlayerWithQuizProps> = ({
  videoUrl,
  contentId,
  authToken,
}) => {
  const [miniQuizzes, setMiniQuizzes] = useState<MiniQuiz[]>([]);
  const [answeredQuizIds, setAnsweredQuizIds] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<MiniQuiz | null>(null);
  
  // Quiz Form & Submission
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // YouTube Player Ref
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract YouTube Video ID
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    return match ? match[1] : "";
  };

  const videoId = getYoutubeId(videoUrl);

  // 1. Fetch Mini Quizzes & Initial Attempt History
  useEffect(() => {
    if (!contentId) return;

    const fetchQuizzesAndAttempts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/mini-quizzes/content/${contentId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const json = await res.json();

        if (json.sukses && json.data && Array.isArray(json.data)) {
          const quizzes: MiniQuiz[] = json.data.sort(
            (a: MiniQuiz, b: MiniQuiz) => a.timestampSeconds - b.timestampSeconds
          );
          setMiniQuizzes(quizzes);

          // Check previous attempts for each quiz
          const passedIds: string[] = [];
          for (const q of quizzes) {
            try {
              const attRes = await fetch(`${API_BASE_URL}/mini-quizzes/${q.id}/my-attempts`, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
              });
              const attJson = await attRes.json();
              if (attJson.sukses && attJson.data?.isLolos) {
                passedIds.push(q.id);
              }
            } catch (err) {
              console.error(`Error checking attempts for quiz ${q.id}:`, err);
            }
          }
          setAnsweredQuizIds(passedIds);
        }
      } catch (err) {
        console.error("Gagal memuat mini quiz:", err);
      }
    };

    fetchQuizzesAndAttempts();
  }, [contentId, authToken]);

  // 2. Setup YouTube Player API & Time Listener
  const checkTimeAndTriggerQuiz = useCallback(
    (currentTime: number) => {
      if (activeQuiz) return;

      const currentSecond = Math.floor(currentTime);
      const quizToTrigger = miniQuizzes.find(
        (quiz) =>
          quiz.timestampSeconds === currentSecond &&
          !answeredQuizIds.includes(quiz.id)
      );

      if (quizToTrigger) {
        if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
          playerRef.current.pauseVideo();
        }
        setActiveQuiz(quizToTrigger);
        setUserAnswers({});
        setAttemptResult(null);
      }
    },
    [activeQuiz, miniQuizzes, answeredQuizIds]
  );

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(`yt-player-${contentId}`, {
        videoId: videoId,
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1) {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                  const time = playerRef.current.getCurrentTime();
                  checkTimeAndTriggerQuiz(time);
                }
              }, 500);
            } else {
              if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [videoId, contentId, checkTimeAndTriggerQuiz]);

  // 3. Handle Answer Selection
  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // 4. Submit Quiz Handler
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;

    // Build payload
    const jawabanPayload = Object.entries(userAnswers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    if (jawabanPayload.length < activeQuiz.questions.length) {
      alert("Mohon jawab semua pertanyaan terlebih dahulu!");
      return;
    }

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
      if (json.sukses && json.data) {
        setAttemptResult(json.data);

        if (json.data.isLolos) {
          setAnsweredQuizIds((prev) => [...prev, activeQuiz.id]);
        }
      } else {
        alert(json.pesan || "Gagal mengirim jawaban.");
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("Terjadi kesalahan koneksi saat mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Action Handlers for Score Screen
  const handleContinueVideo = () => {
    setActiveQuiz(null);
    setAttemptResult(null);
    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      playerRef.current.playVideo();
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers({});
    setAttemptResult(null);
  };

  const handleWatchFromBeginning = () => {
    setActiveQuiz(null);
    setAttemptResult(null);
    setUserAnswers({});
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200">
      {/* Video Container */}
      <div id={`yt-player-${contentId}`} className="w-full h-full" ref={iframeContainerRef} />

      {/* POP-UP MODAL KUIS */}
      {activeQuiz && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-200">
            
            {!attemptResult ? (
              /* FORM PERTANYAAN */
              <form onSubmit={handleSubmitQuiz} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Mini Quiz Pop-Up
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">{activeQuiz.judul}</h3>
                  <p className="text-xs text-slate-500">
                    Batas Lulus: {activeQuiz.passingScore}% | Maksimal Percobaan: {activeQuiz.maxAttempts}x
                  </p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">
                        {idx + 1}. {q.pertanyaan}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              userAnswers[q.id] === opt.id
                                ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-medium"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={opt.id}
                              checked={userAnswers[q.id] === opt.id}
                              onChange={() => handleSelectOption(q.id, opt.id)}
                              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{opt.teksOpsi}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200"
                >
                  {isSubmitting ? "Mengirim Jawaban..." : "Submit Jawaban"}
                </button>
              </form>
            ) : (
              /* HALAMAN SKOR (SCORE SCREEN) */
              <div className="text-center space-y-5 py-2">
                {/* KONDISI A: LULUS */}
                {attemptResult.isLolos && (
                  <>
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                      ✓
                    </div>
                    <div>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        Lulus
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-900">Skor: {attemptResult.skor}</h4>
                      <p className="text-xs text-slate-600 mt-2">
                        Selamat! Kamu telah berhasil melampaui passing grade ({attemptResult.passingScore}%).
                      </p>
                    </div>
                    <button
                      onClick={handleContinueVideo}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-200"
                    >
                      Lanjut ke Materi Selanjutnya
                    </button>
                  </>
                )}

                {/* KONDISI B: GAGAL MASIH ADA KESEMPATAN */}
                {!attemptResult.isLolos && !attemptResult.mustRepeat && (
                  <>
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                      !
                    </div>
                    <div>
                      <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        Belum Lulus
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-900">Skor: {attemptResult.skor}</h4>
                      <p className="text-xs text-slate-600 mt-2">
                        Skor minimal lulus adalah {attemptResult.passingScore}%. Sisa kesempatan kamu:{" "}
                        <span className="font-bold text-amber-600">{attemptResult.sisaPercobaan} kali</span>.
                      </p>
                    </div>
                    <button
                      onClick={handleRetryQuiz}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-200"
                    >
                      Coba Lagi
                    </button>
                  </>
                )}

                {/* KONDISI C: GAGAL 3X (KESEMPATAN HABIS) */}
                {!attemptResult.isLolos && attemptResult.mustRepeat && (
                  <>
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                      ✕
                    </div>
                    <div>
                      <span className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        Kesempatan Habis
                      </span>
                      <h4 className="text-2xl font-extrabold text-slate-900">Skor: {attemptResult.skor}</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Kamu telah gagal 3 kali. Kuis di-reset dan kamu wajib mempelajari ulang materi dari awal.
                      </p>
                    </div>
                    <button
                      onClick={handleWatchFromBeginning}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-200"
                    >
                      Tonton Ulang Materi
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};