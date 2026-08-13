"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MiniQuiz, SubmitAttemptResponse, QuizHistoryResponse } from "@/types/miniQuiz";

interface VideoInteractiveQuizProps {
  contentId: string;
  videoSrc: string;
  authToken: string;
  onQuizCompleted?: () => void;
}

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

export const VideoInteractiveQuiz: React.FC<VideoInteractiveQuizProps> = ({
  contentId,
  videoSrc,
  authToken,
  onQuizCompleted,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [quizzes, setQuizzes] = useState<MiniQuiz[]>([]);
  const [passedQuizIds, setPassedQuizIds] = useState<Set<string>>(new Set());
  const [activeQuiz, setActiveQuiz] = useState<MiniQuiz | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attemptResult, setAttemptResult] = useState<SubmitAttemptResponse["data"] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch daftar quiz & riwayat pengerjaan user
  const fetchQuizzesAndHistory = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };

      const quizRes = await fetch(`${API_BASE_URL}/mini-quizzes/content/${contentId}`, { headers });
      const quizData = await quizRes.json();

      if (quizData.sukses && Array.isArray(quizData.data)) {
        const fetchedQuizzes: MiniQuiz[] = quizData.data;
        setQuizzes(fetchedQuizzes);

        const passedIds = new Set<string>();
        for (const quiz of fetchedQuizzes) {
          const historyRes = await fetch(`${API_BASE_URL}/mini-quizzes/${quiz.id}/my-attempts`, { headers });
          const historyData: QuizHistoryResponse = await historyRes.json();
          if (historyData.sukses && historyData.data.isLolos) {
            passedIds.add(quiz.id);
          }
        }
        setPassedQuizIds(passedIds);
      }
    } catch (err) {
      console.error("Gagal memuat data quiz:", err);
    }
  }, [contentId, authToken]);

  useEffect(() => {
    fetchQuizzesAndHistory();
  }, [fetchQuizzesAndHistory]);

  // Pause video otomatis saat currentTime menyentuh timestampSeconds
  const handleTimeUpdate = () => {
    if (!videoRef.current || activeQuiz) return;

    const currentTime = videoRef.current.currentTime;

    const triggeredQuiz = quizzes.find((quiz) => {
      const isTimeReached = currentTime >= quiz.timestampSeconds && currentTime < quiz.timestampSeconds + 1;
      const isNotPassed = !passedQuizIds.has(quiz.id);
      return isTimeReached && isNotPassed;
    });

    if (triggeredQuiz) {
      videoRef.current.pause();
      setActiveQuiz(triggeredQuiz);
      setSelectedAnswers({});
      setAttemptResult(null);
      setErrorMessage(null);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Submit jawaban ke backend
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz) return;

    if (Object.keys(selectedAnswers).length < activeQuiz.questions.length) {
      setErrorMessage("Pilih jawaban untuk semua pertanyaan sebelum mengirim.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      jawaban: Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
        questionId,
        optionId,
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/mini-quizzes/${activeQuiz.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result: SubmitAttemptResponse = await res.json();

      if (result.sukses) {
        setAttemptResult(result.data);

        if (result.data.isLolos) {
          setPassedQuizIds((prev) => new Set(prev).add(activeQuiz.id));
          if (onQuizCompleted) onQuizCompleted();
        }
      } else {
        setErrorMessage(result.pesan || "Terjadi kesalahan saat mengirim jawaban.");
      }
    } catch {
      setErrorMessage("Gagal terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Lanjutkan Video (Kondisi Lolos)
  const handleContinueVideo = () => {
    setActiveQuiz(null);
    setAttemptResult(null);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Action: Coba Lagi (Gagal, sisaPercobaan > 0)
  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setAttemptResult(null);
    setErrorMessage(null);
  };

  // Action: Reset & Ulang Video dari Awal (Gagal 3x / mustRepeat === true)
  const handleRestartVideo = () => {
    setActiveQuiz(null);
    setAttemptResult(null);
    setSelectedAnswers({});
    setPassedQuizIds(new Set());

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden bg-black shadow-md">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full aspect-video object-cover"
      />

      {/* Pop-up Modal Kuis */}
      {activeQuiz && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl border border-slate-200 text-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{activeQuiz.judul}</h3>
              <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full font-medium">
                Passing Grade: {activeQuiz.passingScore}%
              </span>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {errorMessage}
              </div>
            )}

            {/* TAMPILAN HASIL SUBMIT */}
            {attemptResult ? (
              <div className="space-y-4 text-center py-2">
                {/* LULUS */}
                {attemptResult.isLolos && (
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-emerald-600">Selamat! Kamu Lolos</h4>
                    <p className="text-sm text-slate-600">
                      Nilai: <span className="font-bold text-slate-900">{attemptResult.skor}</span> ({attemptResult.benar} dari {attemptResult.totalSoal} benar)
                    </p>
                    <button
                      onClick={handleContinueVideo}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Lanjutkan Video
                    </button>
                  </div>
                )}

                {/* GAGAL, BISA RETRY */}
                {!attemptResult.isLolos && !attemptResult.mustRepeat && (
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-amber-600">Belum Mencapai Passing Grade</h4>
                    <p className="text-sm text-slate-600">
                      Nilai: <span className="font-bold text-slate-900">{attemptResult.skor}</span> | Sisa Percobaan: <span className="font-bold text-amber-600">{attemptResult.sisaPercobaan}x</span>
                    </p>
                    <button
                      onClick={handleRetryQuiz}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                {/* GAGAL 3X (MUST REPEAT) */}
                {!attemptResult.isLolos && attemptResult.mustRepeat && (
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-rose-600">Kesempatan Habis</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Kamu gagal 3 kali berturut-turut. Silakan tonton ulang materi video dari awal untuk mengulang kuis.
                    </p>
                    <button
                      onClick={handleRestartVideo}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-lg transition-colors"
                    >
                      Tonton Ulang Video
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* FORM PERTANYAAN */
              <form onSubmit={handleSubmitQuiz} className="space-y-4">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {idx + 1}. {q.pertanyaan}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt) => {
                        const isChecked = selectedAnswers[q.id] === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                              isChecked
                                ? "bg-sky-50 border-sky-500 text-sky-900 font-medium"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              value={opt.id}
                              checked={isChecked}
                              onChange={() => handleSelectOption(q.id, opt.id)}
                              className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <span className="ml-2.5">{opt.teksOpsi}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Jawaban"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};