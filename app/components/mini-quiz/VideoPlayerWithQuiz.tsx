"use client";

import React, { useState, useRef, useEffect } from "react";
import { QuizScoreScreen, QuizAttemptResult } from "./QuizScoreScreen";

const API_BASE_URL = "https://backend-production-72a3.up.railway.app/api";

// Helper untuk mengubah link YouTube biasa/shortlink ke format Embed YouTube
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?enablejsapi=1`
    : null;
}

interface Option {
  id: string;
  teks: string;
}

interface Question {
  id: string;
  pertanyaan: string;
  pilihan: Option[] | string[];
}

interface MiniQuizData {
  id: string;
  contentId: string;
  timestampSeconds: number;
  judul?: string;
  soal: Question[];
}

interface VideoPlayerWithQuizProps {
  videoUrl: string;
  contentId: string;
  authToken: string;
  onNextContent?: () => void;
}

export const VideoPlayerWithQuiz: React.FC<VideoPlayerWithQuizProps> = ({
  videoUrl,
  contentId,
  authToken,
  onNextContent,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [quizData, setQuizData] = useState<MiniQuizData | null>(null);
  const [hasPassedBefore, setHasPassedBefore] = useState<boolean>(false);
  const [quizTriggered, setQuizTriggered] = useState<boolean>(false);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);

  // 1. Fetch data Mini Quiz & Cek Attempt Sebelumnya
  useEffect(() => {
    if (!contentId) return;

    const fetchQuizAndAttempts = async () => {
      try {
        const headers: HeadersInit = {};
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const res = await fetch(`${API_BASE_URL}/mini-quizzes/content/${contentId}`, {
          headers,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.sukses && json.data) {
            const quiz: MiniQuizData = json.data;
            setQuizData(quiz);

            if (authToken && quiz.id) {
              const attemptRes = await fetch(
                `${API_BASE_URL}/mini-quizzes/${quiz.id}/my-attempts`,
                { headers }
              );
              if (attemptRes.ok) {
                const attemptJson = await attemptRes.json();
                if (attemptJson.sukses && attemptJson.data?.isLolos) {
                  setHasPassedBefore(true);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data mini quiz:", error);
      }
    };

    fetchQuizAndAttempts();
  }, [contentId, authToken]);

  // Handler untuk video HTML5 biasa (.mp4)
  const handleTimeUpdate = () => {
    if (!videoRef.current || !quizData || quizTriggered || hasPassedBefore) return;

    const currentTime = videoRef.current.currentTime;
    if (currentTime >= quizData.timestampSeconds) {
      videoRef.current.pause();
      setQuizTriggered(true);
      setShowQuizModal(true);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    setIsSubmitting(true);
    try {
      const payload = {
        jawaban: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/mini-quizzes/${quizData.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.sukses && json.data) {
        const data = json.data;
        const result: QuizAttemptResult = {
          skor: data.skor,
          isLolos: data.isLolos,
          passingScore: data.passingScore || 80,
          sisaPercobaan: data.sisaPercobaan,
          mustRepeat: data.mustRepeat,
          pesan: json.pesan,
        };

        setQuizResult(result);

        if (data.isLolos) {
          setHasPassedBefore(true);
        }
      } else {
        alert(json.pesan || "Gagal mengirim jawaban.");
      }
    } catch (error) {
      console.error("Error submit quiz:", error);
      alert("Terjadi kesalahan koneksi saat mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowQuizModal(false);
    if (onNextContent) {
      onNextContent();
    } else if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleRetry = () => {
    setQuizResult(null);
    setAnswers({});
  };

  const handleRepeatVideo = () => {
    setQuizResult(null);
    setAnswers({});
    setQuizTriggered(false);
    setShowQuizModal(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  return (
    <div className="relative w-full space-y-4">
      {/* Pemutar Video */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-md">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            title="YouTube Video Player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain"
          >
            Browser Anda tidak mendukung tag video.
          </video>
        )}
      </div>

      {/* Pop-up Modal Kuis & Halaman Skor */}
      {showQuizModal && quizData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                Mini Quiz
              </span>
              <h3 className="text-lg font-bold text-slate-800 mt-2">
                {quizData.judul || "Uji Pemahaman Materi"}
              </h3>
            </div>

            {!quizResult ? (
              <div className="space-y-6">
                {quizData.soal.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {idx + 1}. {q.pertanyaan}
                    </p>
                    <div className="space-y-2">
                      {q.pilihan.map((opt: any, optIdx: number) => {
                        const optionId = typeof opt === "string" ? String(optIdx) : opt.id;
                        const optionText = typeof opt === "string" ? opt : opt.teks;

                        return (
                          <label
                            key={optionId || optIdx}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                              answers[q.id] === optionId
                                ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium"
                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={answers[q.id] === optionId}
                              onChange={() => handleSelectOption(q.id, optionId)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{optionText}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || Object.keys(answers).length < quizData.soal.length}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
                >
                  {isSubmitting ? "Mengirim Jawaban..." : "Submit Jawaban"}
                </button>
              </div>
            ) : (
              <QuizScoreScreen
                result={quizResult}
                onNext={handleNext}
                onRetry={handleRetry}
                onRepeatVideo={handleRepeatVideo}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};