"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMiniQuizzesByContent,
  createMiniQuiz,
  updateMiniQuiz,
  deleteMiniQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/services/miniQuiz.service";

interface OptionData {
  id?: string;
  teksOpsi: string;
  isCorrect: boolean;
}

interface QuestionData {
  id?: string;
  pertanyaan: string;
  options: OptionData[];
}

interface MiniQuizData {
  id: string;
  judul: string;
  timestampSeconds: number;
  passingScore: number;
  maxAttempts: number;
  questions: { id: string; pertanyaan: string; options: { id: string; teksOpsi: string; isCorrect: boolean }[] }[];
}

const formatTimestamp = (seconds: number) => {
  if (!seconds || seconds <= 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function AdminQuizManagementPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const contentId = params.contentId as string;

  const [quizzes, setQuizzes] = useState<MiniQuizData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    judul: "",
    timestampSeconds: 0,
    passingScore: 80,
    maxAttempts: 3,
  });

  const [editingQuiz, setEditingQuiz] = useState<MiniQuizData | null>(null);
  const [editingQuizForm, setEditingQuizForm] = useState({
    judul: "",
    timestampSeconds: 0,
    passingScore: 80,
    maxAttempts: 3,
  });
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState<QuestionData>({
    pertanyaan: "",
    options: [
      { teksOpsi: "", isCorrect: true },
      { teksOpsi: "", isCorrect: false },
    ],
  });

  async function fetchQuizzes() {
    setLoading(true);
    setError("");
    try {
      const data = await getMiniQuizzesByContent(contentId);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat mini quiz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchQuizzes triggers setState but is necessary for data fetch on mount
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  function resetQuestionForm() {
    setEditingQuestion(null);
    setQuestionForm({
      pertanyaan: "",
      options: [
        { teksOpsi: "", isCorrect: true },
        { teksOpsi: "", isCorrect: false },
      ],
    });
  }

  function handleQuestionOptionChange(idx: number, field: "teksOpsi" | "isCorrect", value: string | boolean) {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === idx ? { ...opt, [field]: value } : opt
      ),
    }));
  }

  function addOption() {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { teksOpsi: "", isCorrect: false }],
    }));
  }

  function removeOption(idx: number) {
    setQuestionForm((prev) => {
      const options = prev.options.filter((_, i) => i !== idx);
      const hasCorrect = options.some((o) => o.isCorrect);
      if (options.length > 0 && !hasCorrect) {
        options[0].isCorrect = true;
      }
      return { ...prev, options };
    });
  }

  function setCorrectOption(idx: number) {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({ ...opt, isCorrect: i === idx })),
    }));
  }

  function validateQuestion(): string | null {
    if (!questionForm.pertanyaan.trim()) {
      return "Pertanyaan wajib diisi.";
    }
    if (questionForm.options.length < 2) {
      return "Minimal 2 opsi diperlukan.";
    }
    const hasEmptyOption = questionForm.options.some((o) => !o.teksOpsi.trim());
    if (hasEmptyOption) {
      return "Semua opsi harus diisi.";
    }
    const hasCorrect = questionForm.options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      return "Setidaknya 1 opsi harus ditandai benar.";
    }
    return null;
  }

  async function handleSubmitQuestion(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateQuestion();
    if (validationError) {
      setError(validationError);
      return;
    }

    const targetQuiz = expandedQuizId
      ? quizzes.find((q) => q.id === expandedQuizId)
      : null;
    if (!targetQuiz) return;

    setSavingQuestion(true);
    setError("");
    setSuccessMessage("");

    try {
      if (editingQuestion?.id) {
        await updateQuestion(editingQuestion.id, {
          pertanyaan: questionForm.pertanyaan,
          options: questionForm.options,
        });
        setSuccessMessage("Soal berhasil diperbarui.");
      } else {
        await addQuestion(targetQuiz.id, {
          pertanyaan: questionForm.pertanyaan,
          options: questionForm.options,
        });
        setSuccessMessage("Soal berhasil ditambahkan.");
      }
      setShowQuestionForm(false);
      resetQuestionForm();
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan soal.");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId: string, pertanyaan: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus soal "${pertanyaan}"?`);
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");
    try {
      await deleteQuestion(questionId);
      setSuccessMessage("Soal berhasil dihapus.");
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus soal.");
    }
  }

  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccessMessage("");
    try {
      await createMiniQuiz(contentId, newQuiz);
      setSuccessMessage("Mini quiz berhasil dibuat.");
      setShowCreateForm(false);
      setNewQuiz({ judul: "", timestampSeconds: 0, passingScore: 80, maxAttempts: 3 });
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat mini quiz.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuiz) return;

    setSavingQuiz(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateMiniQuiz(editingQuiz.id, editingQuizForm);
      setSuccessMessage("Mini quiz berhasil diperbarui.");
      setEditingQuiz(null);
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui mini quiz.");
    } finally {
      setSavingQuiz(false);
    }
  }

  async function handleDeleteQuiz(id: string, judul: string) {
    const confirmed = window.confirm(`Yakin ingin menghapus mini quiz "${judul}"?`);
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");
    try {
      await deleteMiniQuiz(id);
      setSuccessMessage("Mini quiz berhasil dihapus.");
      await fetchQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus mini quiz.");
    }
  }

  function openEditQuiz(quiz: MiniQuizData) {
    setEditingQuiz(quiz);
    setEditingQuizForm({
      judul: quiz.judul,
      timestampSeconds: quiz.timestampSeconds,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
    });
  }

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
          Memuat Mini Quiz...
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
            onClick={() => router.push(`/admin/modules/${moduleId}`)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Detail Modul
          </button>
        </div>

        {/* Judul Halaman */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Kelola Quiz - Konten Video</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola Mini Quiz yang tersedia pada konten video ini (contentId: {contentId}).
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200">
            {successMessage}
          </div>
        )}

        {/* Tombol Tambah Mini Quiz */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Daftar Mini Quiz</h2>
          {!showCreateForm && (
            <button
              onClick={() => {
                setShowCreateForm(true);
                setError("");
                setSuccessMessage("");
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-slate-800 transition shadow-sm"
            >
              + Tambah Quiz
            </button>
          )}
        </div>

        {/* Form Buat Mini Quiz */}
        {showCreateForm && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Buat Mini Quiz Baru</h3>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Judul</label>
                <input
                  type="text"
                  value={newQuiz.judul}
                  onChange={(e) => setNewQuiz({ ...newQuiz, judul: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Judul mini quiz"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Timestamp (detik)</label>
                  <input
                    type="number"
                    min={0}
                    value={newQuiz.timestampSeconds}
                    onChange={(e) => setNewQuiz({ ...newQuiz, timestampSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Passing Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newQuiz.passingScore}
                    onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuiz.maxAttempts}
                    onChange={(e) => setNewQuiz({ ...newQuiz, maxAttempts: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-emerald-800 transition shadow-sm disabled:opacity-60"
                >
                  {creating ? "Menyimpan..." : "Simpan Quiz"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Form Edit Mini Quiz */}
        {editingQuiz && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900">Edit Mini Quiz: {editingQuiz.judul}</h3>
            <form onSubmit={handleUpdateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Judul</label>
                <input
                  type="text"
                  value={editingQuizForm.judul}
                  onChange={(e) => setEditingQuizForm({ ...editingQuizForm, judul: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Timestamp (detik)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingQuizForm.timestampSeconds}
                    onChange={(e) => setEditingQuizForm({ ...editingQuizForm, timestampSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Passing Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingQuizForm.passingScore}
                    onChange={(e) => setEditingQuizForm({ ...editingQuizForm, passingScore: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuizForm.maxAttempts}
                    onChange={(e) => setEditingQuizForm({ ...editingQuizForm, maxAttempts: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-60"
                >
                  {savingQuiz ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Mini Quiz */}
        {quizzes.length === 0 ? (
          !showCreateForm && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <p className="text-sm text-slate-500">Belum ada mini quiz untuk konten video ini.</p>
            </div>
          )
        ) : (
          <div className="space-y-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{quiz.judul}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Timestamp: <span className="font-medium text-slate-700">{formatTimestamp(quiz.timestampSeconds)}</span></span>
                      <span>Passing: <span className="font-medium text-slate-700">{quiz.passingScore}%</span></span>
                      <span>Max Attempts: <span className="font-medium text-slate-700">{quiz.maxAttempts}</span></span>
                      <span>Soal: <span className="font-medium text-slate-700">{quiz.questions.length}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditQuiz(quiz)}
                      className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id, quiz.judul)}
                      className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)}
                      className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition"
                    >
                      {expandedQuizId === quiz.id ? "Tutup" : "Soal"}
                    </button>
                  </div>
                </div>

                {expandedQuizId === quiz.id && (
                  <div className="p-5 sm:p-6 space-y-4">
                    {!showQuestionForm && !editingQuestion && (
                      <button
                        onClick={() => {
                          setShowQuestionForm(true);
                          setError("");
                          setSuccessMessage("");
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-full hover:bg-emerald-800 transition shadow-sm"
                      >
                        + Tambah Soal
                      </button>
                    )}

                    {showQuestionForm && (
                      <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">
                          {editingQuestion ? "Edit Soal" : "Tambah Soal Baru"}
                        </h4>
                        <form onSubmit={handleSubmitQuestion} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Pertanyaan</label>
                            <textarea
                              value={questionForm.pertanyaan}
                              onChange={(e) => setQuestionForm({ ...questionForm, pertanyaan: e.target.value })}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
                              rows={2}
                              placeholder="Masukkan pertanyaan..."
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Opsi Jawaban</label>
                            {questionForm.options.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt.teksOpsi}
                                  onChange={(e) => handleQuestionOptionChange(idx, "teksOpsi", e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  placeholder={`Opsi ${idx + 1}`}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setCorrectOption(idx)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                                    opt.isCorrect
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {opt.isCorrect ? "Benar" : "Kosongkan"}
                                </button>
                                {questionForm.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(idx)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {questionForm.options.length < 6 && (
                              <button
                                type="button"
                                onClick={addOption}
                                className="text-xs text-slate-600 hover:text-slate-800"
                              >
                                + Tambah Opsi
                              </button>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={savingQuestion}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition shadow-sm disabled:opacity-60"
                            >
                              {savingQuestion ? "Menyimpan..." : editingQuestion ? "Perbarui Soal" : "Simpan Soal"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuestionForm(false);
                                resetQuestionForm();
                              }}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {quiz.questions.length > 0 && (
                      <div className="space-y-3">
                        {quiz.questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="border border-slate-200 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {idx + 1}. {q.pertanyaan}
                              </p>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingQuestion({
                                      id: q.id,
                                      pertanyaan: q.pertanyaan,
                                      options: q.options.map((o) => ({
                                        id: o.id,
                                        teksOpsi: o.teksOpsi,
                                        isCorrect: o.isCorrect,
                                      })),
                                    });
                                    setQuestionForm({
                                      pertanyaan: q.pertanyaan,
                                      options: q.options.map((o) => ({
                                        id: o.id,
                                        teksOpsi: o.teksOpsi,
                                        isCorrect: o.isCorrect,
                                      })),
                                    });
                                    setShowQuestionForm(true);
                                  }}
                                  className="text-xs text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id, q.pertanyaan)}
                                  className="text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {q.options.map((opt, oidx) => (
                                <div
                                  key={opt.id}
                                  className="flex items-center gap-2 text-xs text-slate-600"
                                >
                                  <span className="font-medium w-5">{String.fromCharCode(65 + oidx)}.</span>
                                  <span>{opt.teksOpsi}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {quiz.questions.length === 0 && !showQuestionForm && (
                      <p className="text-xs text-slate-400">Belum ada soal untuk quiz ini.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
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
            <Link
              href={`/admin/modules/${moduleId}/edit`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Edit Modul
            </Link>
            <Link
              href={`/admin/modules/${moduleId}/evaluations`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Edit Evaluasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
