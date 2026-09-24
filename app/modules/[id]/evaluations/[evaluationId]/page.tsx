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
import { useApp } from "@/app/context/AppContext";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useApp();

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
            throw new Error(t("Gagal memuat status tahapan modul.", "Failed to load module stage status."));
          }
          if (isPostTestLocked(progress)) {
            setStageBlocked(true);
            return;
          }
        }

        setSummary(currentSummary);
        setEvaluation(detail);
      } catch (err) {
        setLoadError(getErrorMessage(err, t("Gagal mengambil data asesmen.", "Failed to fetch assessment data.")));
      } finally {
        setLoading(false);
      }
    }

    if (moduleId && evaluationId) {
      fetchEvaluation();
    }
  }, [moduleId, evaluationId, refreshStageProgress, t]);

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
        t(`Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal. Yakin ingin mengirim jawaban sekarang?`, `You have only answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit now?`)
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
        throw new Error(t("Gagal memuat status tahapan terbaru dari server.", "Failed to load the latest stage status from the server."));
      }
      setResult(submitResult);
    } catch (err) {
      setSubmitError(getErrorMessage(err, t("Gagal mengirim jawaban asesmen.", "Failed to submit assessment answers.")));
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
        <p className="text-[var(--color-navy)] font-medium text-sm dark:text-slate-200">{t("Memuat soal asesmen...", "Loading assessment questions...")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm inline-block dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          {loadError}
        </div>
      </div>
    );
  }

  const courseDetailUrl = courseId ? `/modules/courses/${courseId}` : `/modules?moduleId=${moduleId}`;

  if (stageBlocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 space-y-3 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl dark:bg-amber-950/40 dark:text-amber-400">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{t("Post-Test Terkunci", "Post-Test Locked")}</h2>
          <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-300">
            {t("Selesaikan seluruh materi pembelajaran modul ini terlebih dahulu sebelum mengerjakan Post-Test.", "Complete all learning materials of this module first before taking the Post-Test.")}
          </p>
          <button
            onClick={() => router.push(courseDetailUrl)}
            className="mt-2 inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-full transition dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {t("Kembali ke Detail Course", "Back to Course Detail")}
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
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-navy)] mb-4 transition-colors dark:text-blue-400 dark:hover:text-slate-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("Kembali ke Detail Course", "Back to Course Detail")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm dark:bg-slate-900">
          <div>
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${
                preTest
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  : postTest
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-[var(--color-pale)] text-[var(--color-accent)] dark:text-blue-400"
              }`}
            >
              {getStageLabel(tipe)}
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-navy)] dark:text-slate-100">
              {evaluation?.judul || summary?.judul || getStageLabel(tipe)}
            </h1>
            {postTest && passingScore > 0 && (
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                {t("Nilai minimal kelulusan:", "Minimum passing score:")} <span className="font-semibold">{passingScore}%</span>
                {summary?.maxAttempts ? ` · ${t("Maks.", "Max.")} ${summary.maxAttempts}x ${t("percobaan", "attempts")}` : ""}
              </p>
            )}
          </div>

          {!result && (
            <div className="bg-[var(--color-pale)]/50 p-4 rounded-xl border border-[var(--color-border-soft)] min-w-[220px]">
              <div className="flex justify-between text-xs font-semibold text-[var(--color-navy)] mb-1.5 dark:text-slate-200">
                <span>{t("Progres Pengerjaan", "Completion Progress")}</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[var(--color-border-soft)] dark:bg-slate-800">
                <div
                  className="bg-[var(--color-biru-muda)] h-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-[var(--color-accent)] mt-1.5 text-right font-medium dark:text-blue-400">
                {answeredCount} {t("dari", "of")} {totalQuestions} {t("soal terjawab", "questions answered")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hasil Evaluasi (setelah submit) */}
      {result ? (
        <div className="p-8 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm text-center space-y-5 dark:bg-slate-900">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              result.isLolos
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
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
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">
              {t("Hasil", "Result")} {getStageLabel(tipe)}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("Capaian Skor:", "Score Achieved:")} {result.skor}%</h2>

            {preTest && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1 dark:text-slate-300">
                {t("Pre-Test tidak memiliki nilai gugur — materi pembelajaran modul ini sekarang sudah terbuka untuk Anda pelajari.", "The Pre-Test has no failing grade — the learning material for this module is now open for you to study.")}
              </p>
            )}

            {preTest && moduleStage.preTestCompleted && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {t("Pre-Test tercatat selesai di server", "Pre-Test recorded as completed on the server")}
              </span>
            )}

            {postTest && result.isLolos && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1 dark:text-slate-300">
                {t("Selamat! Anda telah memenuhi nilai minimal kelulusan", "Congratulations! You have met the minimum passing score")} ({result.passingScore ?? passingScore}%).{" "}
                {t("Modul ini kini berstatus", "This module is now")} <span className="font-semibold">{t("selesai", "completed")}</span>.
              </p>
            )}

            {postTest && moduleStage.postTestCompleted && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {t("Post-Test tercatat selesai di server", "Post-Test recorded as completed on the server")}
              </span>
            )}

            {postTest && !result.isLolos && !result.mustRepeat && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed pt-1 dark:text-slate-300">
                {t("Skor Anda belum mencapai nilai minimal kelulusan", "Your score has not reached the minimum passing score")} ({result.passingScore ?? passingScore}%).{" "}
                {t("Silakan pelajari kembali materi lalu coba lagi.", "Please review the material and try again.")}
              </p>
            )}

            {postTest && !result.isLolos && result.mustRepeat && (
              <p className="text-xs sm:text-sm text-rose-600 max-w-md mx-auto leading-relaxed pt-1 font-medium dark:text-rose-400">
                {t("Anda sudah gagal 3 kali percobaan Post-Test. Status modul ini direset ke \"belum dimulai\" — Anda perlu mengulang modul ini dari awal (termasuk Pre-Test dan materi pembelajaran).", "You have failed the Post-Test 3 times. This module's status has been reset to \"not started\" — you need to repeat this module from the beginning (including the Pre-Test and learning material).")}
              </p>
            )}
          </div>

          {result.isLolos ? (
            <button
              onClick={() => router.push(courseDetailUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
            >
              <span>{t("Kembali ke Detail Course", "Back to Course Detail")}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          ) : result.mustRepeat ? (
            <button
              onClick={() => router.push(courseDetailUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200"
            >
              {t("Kembali ke Detail Course", "Back to Course Detail")}
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-md transition duration-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {t("Coba Lagi Post-Test", "Retry Post-Test")}
            </button>
          )}
        </div>
      ) : questionsList.length > 0 ? (
        <div className="space-y-6">
          {submitError && (
            <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              {submitError}
            </div>
          )}

          {questionsList.map((q, index) => (
            <div
              key={q.id}
              className="p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm dark:bg-slate-900"
            >
              <div className="flex items-start gap-3 mb-5">
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-pale)] text-[var(--color-navy)] font-bold text-sm border border-[var(--color-border-soft)] dark:text-slate-200">
                  {index + 1}
                </span>
                <p className="text-base font-semibold text-[var(--color-navy)] pt-0.5 leading-relaxed dark:text-slate-100">
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
                          ? "bg-[var(--color-pale)] border-[var(--color-accent)] text-[var(--color-navy)] shadow-sm ring-1 ring-[var(--color-accent)] dark:text-slate-100"
                          : "bg-white border-[var(--color-border-soft)] hover:border-[var(--color-accent)] hover:bg-[var(--color-pale)]/30 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-[var(--color-pale)] text-[var(--color-navy)] group-hover:bg-[var(--color-border-soft)] dark:text-slate-200"
                        }`}
                      >
                        {optionLetter}
                      </div>
                      <span className="text-sm font-medium leading-normal flex-1">{opt.teksOpsi}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                            : "border-[var(--color-border-soft)] bg-white dark:bg-slate-800"
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-[var(--color-border-soft)] shadow-sm mt-8 dark:bg-slate-900">
            <p className="text-xs text-[var(--color-accent)] text-center sm:text-left font-medium dark:text-blue-400">
              {t("Pastikan seluruh soal telah terjawab sebelum mengirim asesmen.", "Make sure all questions are answered before submitting the assessment.")}
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-[var(--color-navy)] hover:bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t("Mengirim...", "Sending...")}
                </>
              ) : (
                t("Kirim Jawaban", "Submit Answers")
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border-soft)] text-[var(--color-navy)] dark:bg-slate-900 dark:text-slate-200">
          {t("Belum ada soal yang tersedia pada asesmen ini.", "No questions are available in this assessment yet.")}
        </div>
      )}
    </div>
  );
}
