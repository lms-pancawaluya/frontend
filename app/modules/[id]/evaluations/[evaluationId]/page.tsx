"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEvaluationDetail } from "@/services/evaluation.service";

interface EvaluationOption {
  id?: string;
  value?: string;
  key?: string;
  teksOpsi?: string;
  text?: string;
  label?: string;
  optionText?: string;
  jawaban?: string;
}

type EvaluationOptionItem = string | EvaluationOption;

interface EvaluationQuestion {
  id?: string;
  question?: string;
  pertanyaan?: string;
  teks?: string;
  content?: string;
  prompt?: string;
  options?: EvaluationOptionItem[];
  pilihan?: EvaluationOptionItem[];
  optionsList?: EvaluationOptionItem[];
  opsi?: EvaluationOptionItem[];
}

interface EvaluationDetail {
  title?: string;
  judul?: string;
  questions?: EvaluationQuestion[];
  soal?: EvaluationQuestion[];
  items?: EvaluationQuestion[];
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const moduleId = params.id as string;
  const evaluationId = params.evaluationId as string;

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchEvaluation() {
      try {
        setLoading(true);
        const data = await getEvaluationDetail(moduleId, evaluationId);
        setEvaluation((data?.data || data) as EvaluationDetail);
      } catch (err) {
        console.error("Gagal mengambil data evaluasi:", err);
      } finally {
        setLoading(false);
      }
    }

    if (moduleId && evaluationId) {
      fetchEvaluation();
    }
  }, [moduleId, evaluationId]);

  // Toggle/unselect jawaban jika opsi yang sama diklik kembali
  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev };
      if (updated[questionId] === optionId) {
        delete updated[questionId];
      } else {
        updated[questionId] = optionId;
      }
      return updated;
    });
  };

  const questionsList =
    evaluation?.questions || evaluation?.soal || evaluation?.items || [];

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questionsList.length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = confirm(
        `Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal. Yakin ingin mengirim jawaban sekarang?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setIsSubmitting(true);
      console.log("Jawaban terkirim:", answers);

      alert("Jawaban evaluasi berhasil dikirim!");
      // Navigasi bersih tanpa spasi ekstra di URL
      router.push(`/modules/${moduleId}`);
    } catch (err) {
      console.error("Gagal mengirim jawaban:", err);
      alert("Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--color-biru-muda)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--color-navy)] font-medium text-sm">Memuat soal evaluasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigasi & Judul */}
      <div className="mb-8">
        <Link
          href={`/modules/${moduleId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-navy)] mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Modul
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm">
          <div>
            <span className="inline-block px-3 py-1 bg-[var(--color-pale)] text-[var(--color-accent)] text-xs font-semibold rounded-full mb-2">
              Evaluasi Modul
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">
              {evaluation?.title || evaluation?.judul || "Evaluasi Pembelajaran"}
            </h1>
          </div>

          {/* Indikator Progres Pengerjaan */}
          <div className="bg-[var(--color-pale)]/50 p-4 rounded-xl border border-[var(--color-border-soft)] min-w-[220px]">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-navy)] mb-1.5">
              <span>Progres Pengerjaan</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[var(--color-border-soft)]">
              <div
                className="bg-[var(--color-biru-muda)] h-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-[var(--color-accent)] mt-1.5 text-right font-medium">
              {answeredCount} dari {totalQuestions} soal terjawab
            </p>
          </div>
        </div>
      </div>

      {/* Daftar Soal */}
      {questionsList.length > 0 ? (
        <div className="space-y-6">
          {questionsList.map((q, index) => {
            const questionId = q.id || `q-${index}`;
            const questionText =
              q.question || q.pertanyaan || q.teks || q.content || q.prompt || "";
            const optionsList =
              q.options || q.pilihan || q.optionsList || q.opsi || [];

            return (
              <div
                key={questionId}
                className="p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm"
              >
                {/* Header Pertanyaan */}
                <div className="flex items-start gap-3 mb-5">
                  <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-pale)] text-[var(--color-navy)] font-bold text-sm border border-[var(--color-border-soft)]">
                    {index + 1}
                  </span>
                  <p className="text-base font-semibold text-[var(--color-navy)] pt-0.5 leading-relaxed">
                    {questionText}
                  </p>
                </div>

                {/* Pilihan Jawaban */}
                <div className="space-y-3 pl-0 md:pl-10">
                  {optionsList.map((opt, optIdx) => {
                    const isStringOption = typeof opt === "string";
                    const optionId = isStringOption
                      ? opt
                      : opt.id || opt.value || opt.key || `opt-${optIdx}`;

                    const optionLabel = isStringOption
                      ? opt
                      : opt.teksOpsi ||
                        opt.text ||
                        opt.label ||
                        opt.optionText ||
                        opt.jawaban ||
                        "";

                    const optionLetter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[questionId] === optionId;

                    return (
                      <div
                        key={optionId}
                        onClick={() => handleOptionSelect(questionId, optionId)}
                        className={`group flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                          isSelected
                            ? "bg-[var(--color-pale)] border-[var(--color-accent)] text-[var(--color-navy)] shadow-sm ring-1 ring-[var(--color-accent)]"
                            : "bg-white border-[var(--color-border-soft)] hover:border-[var(--color-accent)] hover:bg-[var(--color-pale)]/30 text-slate-700"
                        }`}
                      >
                        {/* Badge Abjad (A, B, C, D) */}
                        <div
                          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                            isSelected
                              ? "bg-[var(--color-accent)] text-white"
                              : "bg-[var(--color-pale)] text-[var(--color-navy)] group-hover:bg-[var(--color-border-soft)]"
                          }`}
                        >
                          {optionLetter}
                        </div>

                        {/* Teks Opsi */}
                        <span className="text-sm font-medium leading-normal flex-1">
                          {optionLabel}
                        </span>

                        {/* Status Checkmark */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                              : "border-[var(--color-border-soft)] bg-white"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Action Bar / Tombol Kirim */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm mt-8">
            <p className="text-xs text-[var(--color-accent)] text-center sm:text-left font-medium">
              Pastikan seluruh soal telah terjawab sebelum mengirim evaluasi.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-[var(--color-navy)] hover:bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mengirim...
                </>
              ) : (
                "Kirim Jawaban"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border-soft)] text-[var(--color-navy)]">
          Belum ada soal yang tersedia pada evaluasi ini.
        </div>
      )}
    </div>
  );
}
