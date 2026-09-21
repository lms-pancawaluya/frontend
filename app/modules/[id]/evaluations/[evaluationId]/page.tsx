"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getModuleEvaluations,
  getEvaluationDetail,
  submitEvaluation,
} from "@/services/evaluation.service";
import { getModuleById } from "@/services/module.service";
import { isPostTestLocked, readModuleStageProgress, type ModuleStageProgress } from "@/lib/moduleStages";
import {
  isPreTest,
  isPostTest,
  getStageLabel,
  type EvaluationSummary,
  type EvaluationDetailData,
  type SubmitAnswerItem,
  type SubmitEvaluationResult,
} from "@/types/evaluation";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleId = params.id as string;
  const courseIdFromUrl = searchParams.get("courseId");
  const evaluationId = params.evaluationId as string;

  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Validasi prerequisite Post-Test berbasis progress BE (bukan sekadar lock tombol).
  const [stageBlocked, setStageBlocked] = useState(false);
  // Status stage terbaru dari BE (source of truth), di-refresh setelah submit.
  const [moduleStage, setModuleStage] = useState<ModuleStageProgress>({});
  const [courseId, setCourseId] = useState<string | null>(courseIdFromUrl);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitEvaluationResult | null>(null);

  // Ambil status stage terbaru dari BE untuk module ini (single source of truth).
  // Dipakai saat validasi prerequisite dan setelah submit evaluation.
  const refreshStageProgress = useCallback(async (): Promise<ModuleStageProgress | null> => {
    const moduleData = await getModuleById(moduleId);
    if (!moduleData) return null;
    if (moduleData.courseId || moduleData.course_id) {
      setCourseId(moduleData.courseId || moduleData.course_id);
    }
    const progress = readModuleStageProgress(moduleData);
    setModuleStage(progress);
    return progress;
  }, [moduleId]);

  useEffect(() => {
    async function fetchEvaluation() {
      setLoading(true);
      setLoadError(null);
      setStageBlocked(false);
      try {
        // Ambil data module & daftar evaluasi & detail soal secara paralel.
        const [moduleData, list, detail] = await Promise.all([
          getModuleById(moduleId).catch(() => null),
          getModuleEvaluations(moduleId) as Promise<EvaluationSummary[]>,
          getEvaluationDetail(moduleId, evaluationId) as Promise<EvaluationDetailData>,
        ]);

        const moduleCourseId = moduleData?.courseId || moduleData?.course_id || null;
        if (moduleCourseId) {
          setCourseId(moduleCourseId);
        }

        const currentSummary = Array.isArray(list)
          ? list.find((e) => e.id === evaluationId) || null
          : null;

        // Post-Test hanya boleh diakses setelah Learning Material selesai.
        // Status diambil dari progress BE pada Module (single source of truth).
        const tipe = currentSummary?.tipe ?? detail?.tipe;
        if (isPostTest(tipe)) {
          const progress = moduleData ? readModuleStageProgress(moduleData) : await refreshStageProgress();
          if (moduleData) setModuleStage(progress ?? {});
          if (!progress) {
            throw new Error("Gagal memuat status tahapan modul.");
          }
          if (isPostTestLocked(progress)) {
            setStageBlocked(true);
            return;
          }
        }

        setSummary(currentSummary);
        setEvaluation(detail);
      } catch (err) {
        setLoadError(getErrorMessage(err, "Gagal mengambil data asesmen."));
      } finally {
        setLoading(false);
      }
    }

    if (moduleId && evaluationId) {
      fetchEvaluation();
    }
  }, [moduleId, evaluationId, refreshStageProgress]);

  const questionsList = evaluation?.questions || [];
  const tipe = summary?.tipe ?? evaluation?.tipe;
  const passingScore = summary?.passingScore ?? evaluation?.passingScore ?? 0;
  const preTest = isPreTest(tipe);
  const postTest = isPostTest(tipe);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questionsList.length;
  const progressPercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = confirm(
        `Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal. Yakin ingin mengirim jawaban sekarang?`
      );
      if (!confirmSubmit) return;
    }

    const payload: SubmitAnswerItem[] = Object.entries(answers).map(
      ([questionId, jawaban]) => ({ questionId, jawaban })
    );

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const submitResult = (await submitEvaluation(
        moduleId,
        evaluationId,
        payload,
        tipe
      )) as SubmitEvaluationResult;

      // Setelah submit, ambil ulang flag stage dari GET /api/modules/:id.
      // Result evaluasi tidak dipakai untuk membuka stage.
      const updatedStage = await refreshStageProgress();
      if (!updatedStage) {
        throw new Error("Gagal memuat status tahapan terbaru dari server.");
      }
      setResult(submitResult);
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Gagal mengirim jawaban asesmen."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setSubmitError(null);
    // Status stage bisa berubah (mis. modul di-reset BE setelah gagal berulang),
    // jadi validasi ulang prerequisite dari BE sebelum mengulang.
    void refreshStageProgress().catch((err) =>
      console.warn("Gagal me-refresh status tahapan:", err)
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--color-biru-muda)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--color-navy)] font-medium text-sm">Memuat soal asesmen...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm inline-block">
          {loadError}
        </div>
      </div>
    );
  }

  const courseDetailUrl = courseId ? `/modules/courses/${courseId}` : `/modules?moduleId=${moduleId}`;

  if (stageBlocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-800">Post-Test Terkunci</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Selesaikan seluruh materi pembelajaran modul ini terlebih dahulu sebelum
            mengerjakan Post-Test.
          </p>
          <button
            onClick={() => router.push(courseDetailUrl)}
            className="mt-2 inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-full transition"
          >
            Kembali ke Detail Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Navigasi & Judul */}
      <div className="mb-8">
        <Link
          href={courseDetailUrl}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-navy)] mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Detail Course
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm">
          <div>
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${
                preTest
                  ? "bg-sky-50 text-sky-700"
                  : postTest
                  ? "bg-amber-50 text-amber-700"
                  : "bg-[var(--color-pale)] text-[var(--color-accent)]"
              }`}
            >
              {getStageLabel(tipe)}
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-navy)]">
              {evaluation?.judul || summary?.judul || getStageLabel(tipe)}
            </h1>
            {postTest && passingScore > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Nilai minimal kelulusan: <span className="font-semibold">{passingScore}%</span>
                {summary?.maxAttempts ? ` · Maks. ${summary.maxAttempts}x percobaan` : ""}
              </p>
            )}
          </div>

          {!result && (
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
          )}
        </div>
      </div>

      {/* Hasil Evaluasi (setelah submit) */}
      {result ? (
        <div className="p-8 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm text-center space-y-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              result.isLolos
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {result.isLolos ? (
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
              Hasil {getStageLabel(tipe)}
            </span>
            <h2 className="text-2xl font-bold text-slate-900">Capaian Skor: {result.skor}%</h2>

            {preTest && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                Pre-Test tidak memiliki nilai gugur — materi pembelajaran modul ini sekarang
                sudah terbuka untuk Anda pelajari.
              </p>
            )}

            {preTest && moduleStage.preTestCompleted && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Pre-Test tercatat selesai di server
              </span>
            )}

            {postTest && result.isLolos && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                Selamat! Anda telah memenuhi nilai minimal kelulusan ({result.passingScore ?? passingScore}%).
                Modul ini kini berstatus <span className="font-semibold">selesai</span>.
              </p>
            )}

            {postTest && moduleStage.postTestCompleted && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Post-Test tercatat selesai di server
              </span>
            )}

            {postTest && !result.isLolos && !result.mustRepeat && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                Skor Anda belum mencapai nilai minimal kelulusan ({result.passingScore ?? passingScore}%).
                Silakan pelajari kembali materi lalu coba lagi.
              </p>
            )}

            {postTest && !result.isLolos && result.mustRepeat && (
              <p className="text-xs sm:text-sm text-rose-600 max-w-md mx-auto leading-relaxed pt-1 font-medium">
                Anda sudah gagal 3 kali percobaan Post-Test. Status modul ini direset ke
                &quot;belum dimulai&quot; — Anda perlu mengulang modul ini dari awal (termasuk
                Pre-Test dan materi pembelajaran).
              </p>
            )}
          </div>

          {result.isLolos ? (
            <button
              onClick={() => router.push(courseDetailUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
            >
              <span>Kembali ke Detail Course</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ) : result.mustRepeat ? (
            <button
              onClick={() => router.push(courseDetailUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
            >
              Kembali ke Detail Course
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
            >
              Coba Lagi Post-Test
            </button>
          )}
        </div>
      ) : questionsList.length > 0 ? (
        <div className="space-y-6">
          {submitError && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
              {submitError}
            </div>
          )}

          {questionsList.map((q, index) => (
            <div
              key={q.id}
              className="p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm"
            >
              <div className="flex items-start gap-3 mb-5">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-pale)] text-[var(--color-navy)] font-bold text-sm border border-[var(--color-border-soft)]">
                  {index + 1}
                </span>
                <p className="text-base font-semibold text-[var(--color-navy)] pt-0.5 leading-relaxed">
                  {q.pertanyaan}
                </p>
              </div>

              <div className="space-y-3 pl-0 md:pl-10">
                {(q.options || []).map((opt, optIdx) => {
                  const optionLetter = String.fromCharCode(65 + optIdx);
                  const isSelected = answers[q.id] === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      className={`group flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                        isSelected
                          ? "bg-[var(--color-pale)] border-[var(--color-accent)] text-[var(--color-navy)] shadow-sm ring-1 ring-[var(--color-accent)]"
                          : "bg-white border-[var(--color-border-soft)] hover:border-[var(--color-accent)] hover:bg-[var(--color-pale)]/30 text-slate-700"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-[var(--color-pale)] text-[var(--color-navy)] group-hover:bg-[var(--color-border-soft)]"
                        }`}
                      >
                        {optionLetter}
                      </div>
                      <span className="text-sm font-medium leading-normal flex-1">{opt.teksOpsi}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                            : "border-[var(--color-border-soft)] bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm mt-8">
            <p className="text-xs text-[var(--color-accent)] text-center sm:text-left font-medium">
              Pastikan seluruh soal telah terjawab sebelum mengirim asesmen.
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
          Belum ada soal yang tersedia pada asesmen ini.
        </div>
      )}
    </div>
  );
}
