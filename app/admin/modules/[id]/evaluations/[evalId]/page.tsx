"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvaluationDetail, addQuestion, updateQuestion, deleteQuestion } from "@/services/evaluation.service";

interface Option {
  id: string;
  teksOpsi?: string;
  teks?: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  pertanyaan: string;
  tipe: string;
  options: Option[];
}

interface EvaluationDetail {
  id: string;
  judul: string;
  questions: Question[];
  passingScore?: number;
  maxAttempts?: number;
}

interface OptionInput {
  teksOpsi: string;
  isCorrect: boolean;
}

export default function EvaluationDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const evalId = params.evalId as string;

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [pertanyaan, setPertanyaan] = useState("");
  const [tipe, setTipe] = useState("pilihan_ganda");
  const [options, setOptions] = useState<OptionInput[]>([
    { teksOpsi: "", isCorrect: true },
    { teksOpsi: "", isCorrect: false },
  ]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  async function handleDelete(questionId: string) {
    const confirmed = window.confirm("Yakin ingin menghapus soal ini?");
    if (!confirmed) return;

    setDeletingQuestionId(questionId);

    try {
      await deleteQuestion(moduleId, questionId);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menghapus soal.");
    } finally {
      setDeletingQuestionId(null);
    }
  }

  function getInitialOptions() {
    return [
      { teksOpsi: "", isCorrect: true },
      { teksOpsi: "", isCorrect: false },
    ];
  }

  function mapQuestionOptions(questionOptions: Option[]) {
    const mapped = questionOptions.map((opt) => ({
      teksOpsi: (opt.teksOpsi || opt.teks || "").trim(),
      isCorrect: opt.isCorrect === true,
    }));

    return mapped.length >= 2 ? mapped : getInitialOptions();
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function fetchEvaluationDetail() {
      try {
        const data = await getEvaluationDetail(moduleId, evalId);
        setEvaluation(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat detail evaluasi.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEvaluationDetail();
  }, [moduleId, evalId, router, refreshKey]);

  function handleOptionTextChange(index: number, value: string) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, teksOpsi: value } : opt))
    );
  }

  function handleCorrectChange(index: number) {
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === index }))
    );
  }

  function handleAddOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { teksOpsi: "", isCorrect: false }]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setShowQuestionForm(false);
    setPertanyaan("");
    setTipe("pilihan_ganda");
    setOptions(getInitialOptions());
    setEditingQuestionId(null);
  }

  function startEdit(question: Question) {
    if (question.tipe !== "pilihan_ganda") {
      setFormError("Edit soal saat ini hanya tersedia untuk pilihan ganda.");
      return;
    }

    setShowQuestionForm(true);
    setEditingQuestionId(question.id);
    setPertanyaan(question.pertanyaan);
    setTipe("pilihan_ganda");
    setOptions(mapQuestionOptions(question.options || []));
    setFormError("");
  }

  function validateMultipleChoice() {
    if (options.length < 2) {
      return "Minimal 2 opsi jawaban.";
    }

    const emptyOption = options.some((opt) => opt.teksOpsi.trim() === "");
    if (emptyOption) {
      return "Semua opsi jawaban harus diisi.";
    }

    const correctCount = options.filter((opt) => opt.isCorrect).length;
    if (correctCount !== 1) {
      return "Pilih tepat 1 opsi sebagai jawaban benar.";
    }

    return "";
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!evaluation) return;

    if (editingQuestionId || tipe === "pilihan_ganda") {
      const validationError = validateMultipleChoice();
      if (validationError) {
        setFormError(validationError);
        return;
      }
    }

    setSubmitting(true);

    try {
      if (editingQuestionId) {
        await updateQuestion(moduleId, editingQuestionId, {
          pertanyaan: pertanyaan.trim(),
          options: options.map((opt) => ({
            teks: opt.teksOpsi.trim(),
            isCorrect: opt.isCorrect,
          })),
        });
      } else {
        const questionData =
          tipe === "pilihan_ganda"
            ? { pertanyaan, options }
            : { pertanyaan, tipe };

        await addQuestion(moduleId, evalId, questionData);
      }

      resetForm();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(editingQuestionId ? "Gagal memperbarui soal." : "Gagal menambahkan soal.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <svg className="w-5 h-5 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat evaluasi...
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error || "Evaluasi tidak ditemukan."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push(`/admin/modules/${moduleId}/evaluations`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Evaluasi
          </button>
        </div>

        {/* Header Evaluasi */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {evaluation.judul}
          </h1>
          {(evaluation.passingScore !== undefined || evaluation.maxAttempts !== undefined) && (
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              {evaluation.passingScore !== undefined && (
                <span>Passing Score: <span className="font-medium text-slate-700">{evaluation.passingScore}%</span></span>
              )}
              {evaluation.maxAttempts !== undefined && (
                <span>Max Attempts: <span className="font-medium text-slate-700">{evaluation.maxAttempts}</span></span>
              )}
            </div>
          )}
        </div>

        {/* Feedback */}
        {formError && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {formError}
          </div>
        )}

        {/* Soal Evaluasi */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012-2" />
              </svg>
              Soal Evaluasi
            </h2>
            {!editingQuestionId && (
              <button
                type="button"
                onClick={() => {
                  setShowQuestionForm(true);
                  setFormError("");
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-slate-800 transition shadow-sm"
              >
                + Tambah Soal
              </button>
            )}
          </div>

          {evaluation.questions.length === 0 ? (
            !editingQuestionId && !showQuestionForm && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <p className="text-sm text-slate-500">Belum ada soal. Tambahkan soal pertama.</p>
              </div>
            )
          ) : (
            <div className="space-y-5">
              {evaluation.questions.map((q, index) => (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
                >
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {index + 1}. {q.pertanyaan}
                      </h3>
                      <span className="text-xs text-slate-500 capitalize">
                        {q.tipe.replace("_", " ")}
                        {q.tipe === "pilihan_ganda" && ` • ${q.options.length} opsi`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(q)}
                        disabled={q.tipe !== "pilihan_ganda" || submitting}
                        className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {q.tipe === "pilihan_ganda" ? "Edit" : "Edit belum tersedia"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        disabled={deletingQuestionId === q.id}
                        className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deletingQuestionId === q.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Tambah/Edit Soal */}
        {(showQuestionForm || editingQuestionId) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {editingQuestionId ? "Edit Soal" : "Tambah Soal Baru"}
              </h3>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false);
                    resetForm();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Batal
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Pertanyaan
                </label>
                <textarea
                  value={pertanyaan}
                  onChange={(e) => setPertanyaan(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
                  rows={2}
                  placeholder="Masukkan pertanyaan..."
                  required
                />
              </div>

              {!editingQuestionId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    Tipe Soal
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="esai">Esai</option>
                  </select>
                </div>
              )}

              {(editingQuestionId || tipe === "pilihan_ganda") && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Opsi Jawaban (pilih 1 sebagai jawaban benar)
                  </label>
                  <div className="flex flex-col gap-2">
                    {options.map((opt, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectChange(index)}
                          className="accent-[var(--color-navy)]"
                        />
                        <input
                          type="text"
                          value={opt.teksOpsi}
                          onChange={(e) => handleOptionTextChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder={`Opsi ${index + 1}`}
                          required
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                    >
                      + Tambah Opsi
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : editingQuestionId ? "Simpan Perubahan" : "Tambah Soal"}
                </button>
                {!editingQuestionId && (
                  <button
                    type="button"
                    onClick={() => setShowQuestionForm(false)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Area Aksi Admin */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.488c.457-.66 1.245-.904 2.054-.65A17.267 17.267 0 0115 5.5c0 1.005-.2 2.001-.606 2.933A7.5 7.5 0 017 12.5a7.5 0 01-2 5.36l-2.744 2.744a1 1 0 01-1.415-.001l-.003-.003a1 1 0 01-.001-1.414l1.742-1.742A5.5 5.5 0 017.5 10.5c0-1.057.094-2.103.286-3.114z" />
            </svg>
            Aksi Pengelolaan
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push(`/admin/modules/${moduleId}`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Edit Modul
            </button>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Tambah Soal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
