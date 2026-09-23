"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleById, getModuleContents, updateModule } from "@/services/module.service";
import { deleteContent, updateContent, uploadPdf } from "@/services/content.service";
import { addQuestion as addEvaluationQuestion, createEvaluation, deleteEvaluation, deleteQuestion as deleteEvaluationQuestion, getEvaluationDetail, getModuleEvaluations, updateQuestion as updateEvaluationQuestion } from "@/services/evaluation.service";
import { addQuestion, createMiniQuiz, deleteMiniQuiz, deleteQuestion, getMiniQuizzesByContent, updateQuestion } from "@/services/miniQuiz.service";
import { getCourseById } from "@/services/course.service";
import { canManageCourse } from "@/lib/rbac";
import { buildPdfFileName, downloadPdfFile, loadPdfPreviewObjectUrl, validatePdfFile } from "@/lib/pdf";
import { validateExternalUrl } from "@/lib/link";

interface ModuleDetail {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
  courseId?: string | null;
}

interface ContentItem {
  id: string;
  judul: string;
  tipe: string;
  konten: string;
  urutan: number;
}

interface EvaluationOption {
  id?: string;
  teksOpsi?: string;
  teks?: string;
  isCorrect?: boolean;
}

interface EvaluationQuestion {
  id: string;
  pertanyaan: string;
  tipe: string;
  options: EvaluationOption[];
}

interface EvaluationItem {
  id: string;
  judul: string;
  tipe?: "pre_test" | "post_test" | string;
  passingScore?: number;
  maxAttempts?: number;
  questions?: EvaluationQuestion[];
  _count?: { questions: number };
}

interface InteractiveQuestion { id: string; pertanyaan: string; options: { id?: string; teksOpsi: string; isCorrect: boolean }[]; }
interface InteractiveQuiz { id: string; judul: string; timestampSeconds: number; questions?: InteractiveQuestion[]; }

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer"];

function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, "0")}:${(safeSeconds % 60).toString().padStart(2, "0")}`;
}

function parseTimestamp(value: string): number | null {
  const match = value.match(/^(\d+):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getYoutubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  const videoId = match ? match[1] : "";
  return `https://www.youtube.com/embed/${videoId}`;
}

export default function AdminModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Guard ownership: Module mewarisi ownership dari parent Course.
  const [accessDenied, setAccessDenied] = useState(false);
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    aspekPancawaluya: "cageur",
    urutan: 1,
  });
  const [savingModule, setSavingModule] = useState(false);
  const [moduleMessage, setModuleMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [contentData, setContentData] = useState({ judul: "", tipe: "teks", konten: "", urutan: 1 });
  const [contentMessage, setContentMessage] = useState("");
  const [contentBusy, setContentBusy] = useState(false);
  const [pdfUploadingId, setPdfUploadingId] = useState<string | null>(null);
  const [pdfMessage, setPdfMessage] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [downloadingContentId, setDownloadingContentId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<Record<string, string>>({});
  const [previewContentId, setPreviewContentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<Record<string, string>>({});
  const previewRequestRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluationTitle, setEvaluationTitle] = useState("");
  const [evaluationType, setEvaluationType] = useState<"pre_test" | "post_test">("pre_test");
  const [passingScore, setPassingScore] = useState(80);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [evaluationBusy, setEvaluationBusy] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [evaluationQuestionForm, setEvaluationQuestionForm] = useState<{ evaluationId: string; questionId?: string; pertanyaan: string; options: { teksOpsi: string; isCorrect: boolean }[] } | null>(null);
  const [evaluationQuestionBusy, setEvaluationQuestionBusy] = useState(false);
  const [evaluationQuestionDeletingId, setEvaluationQuestionDeletingId] = useState<string | null>(null);
  const [evaluationDeletingId, setEvaluationDeletingId] = useState<string | null>(null);
  // Error delete per-stage, ditampilkan terlepas dari form create terbuka atau tidak.
  const [evaluationDeleteError, setEvaluationDeleteError] = useState<Record<"pre_test" | "post_test", string>>({ pre_test: "", post_test: "" });
  const [evaluationQuestionError, setEvaluationQuestionError] = useState<Record<string, string>>({});
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [videoQuizzes, setVideoQuizzes] = useState<Record<string, InteractiveQuiz[]>>({});
  const [interactiveLoading, setInteractiveLoading] = useState<string | null>(null);
  const [interactiveError, setInteractiveError] = useState<Record<string, string>>({});
  const [interactiveDeletingId, setInteractiveDeletingId] = useState<string | null>(null);
  const [interactiveForm, setInteractiveForm] = useState<{ quizId: string; questionId?: string; pertanyaan: string; options: { teksOpsi: string; isCorrect: boolean }[] } | null>(null);
  const [checkpointForm, setCheckpointForm] = useState<{ contentId: string; judul: string; timestamp: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Muat ulang daftar evaluasi (Pre-Test/Post-Test) beserta soalnya dari BE.
  // Dipakai saat load awal maupun setelah delete agar list mencerminkan BE.
  const loadEvaluations = useCallback(async () => {
    const evaluationList = (await getModuleEvaluations(id)) as EvaluationItem[];
    const detailed = await Promise.all(
      evaluationList.map(async (evaluation) => ({
        ...evaluation,
        ...(await getEvaluationDetail(id, evaluation.id)),
      }))
    );
    setEvaluations(detailed);
  }, [id]);

  useEffect(() => {
    async function fetchData() {
      // Ownership ditentukan dari parent Course (data canonical `createdBy`).
      let currentUser: { role?: string; id?: string } = {};
      try {
        const raw = localStorage.getItem("user");
        currentUser = raw ? JSON.parse(raw) : {};
      } catch {
        currentUser = {};
      }

      try {
        const [moduleData, contentsData] = await Promise.all([
          getModuleById(id),
          getModuleContents(id),
        ]);

        // Pengajar hanya boleh mengelola Module pada Course miliknya.
        const courseId = (moduleData as ModuleDetail)?.courseId;
        if (courseId) {
          try {
            const course = await getCourseById(courseId);
            if (!canManageCourse(currentUser.role, currentUser.id, course)) {
              setAccessDenied(true);
              return;
            }
          } catch {
            // Bila detail Course tidak dapat diakses, blocking natural oleh BE
            // saat action; jangan memblokir render Module di sini.
          }
        }

        setModule(moduleData);
        setFormData({
          judul: moduleData.judul,
          deskripsi: moduleData.deskripsi || "",
          aspekPancawaluya: moduleData.aspekPancawaluya,
          urutan: moduleData.urutan,
        });
         setContents(contentsData);
         await loadEvaluations();

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat detail modul.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, loadEvaluations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm dark:text-slate-400">
          <svg className="w-5 h-5 animate-spin text-emerald-700" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat Informasi Modul...
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center">
        <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg border border-amber-200">
          Module ini berada pada Course yang bukan milik Anda, sehingga tidak dapat dikelola. Hubungi Admin jika perlu.
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/modules")}
          className="mt-4 text-sm text-emerald-700 hover:underline"
        >
          ← Kembali ke daftar modul
        </button>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error || "Modul tidak ditemukan."}
        </div>
      </div>
    );
  }

  function handleModuleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "urutan" ? Number(value) : value,
    }));
  }

  async function handleModuleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModuleMessage(null);
    setSavingModule(true);

    try {
      const updatedModule = await updateModule(id, formData);
      const nextModule = { ...module, ...formData, ...(updatedModule || {}) };
      setModule(nextModule);
      setFormData({
        judul: nextModule.judul,
        deskripsi: nextModule.deskripsi || "",
        aspekPancawaluya: nextModule.aspekPancawaluya,
        urutan: nextModule.urutan,
      });
      setModuleMessage({ type: "success", text: "Informasi modul berhasil diperbarui." });
    } catch (err) {
      setModuleMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memperbarui modul.",
      });
    } finally {
      setSavingModule(false);
    }
  }

  function startContentEdit(content: ContentItem) {
    closePdfPreview();
    setEditingContentId(content.id);
    setContentMessage("");
    setPdfMessage("");
    setPdfFileName("");
    setContentData({ judul: content.judul, tipe: content.tipe, konten: content.konten, urutan: content.urutan });
  }

  function cancelContentEdit() {
    setEditingContentId(null);
    setPdfMessage("");
    setPdfFileName("");
  }

  async function handleContentPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validatePdfFile(file);
    if (validationError) {
      setPdfMessage(validationError);
      setPdfFileName("");
      return;
    }

    setPdfMessage("");
    setPdfUploadingId(editingContentId);
    try {
      const url = await uploadPdf(file);
      setContentData((prev) => ({ ...prev, konten: url }));
      setPdfFileName(file.name);
    } catch (err) {
      setPdfMessage(err instanceof Error ? err.message : "Gagal mengunggah file PDF.");
      setPdfFileName("");
    } finally {
      setPdfUploadingId(null);
    }
  }

  async function handleContentDownload(content: ContentItem) {
    setDownloadError((prev) => ({ ...prev, [content.id]: "" }));
    setDownloadingContentId(content.id);
    try {
      await downloadPdfFile(content.konten, buildPdfFileName(content.judul, content.konten));
    } catch (err) {
      setDownloadError((prev) => ({ ...prev, [content.id]: err instanceof Error ? err.message : "Gagal mengunduh file PDF." }));
    } finally {
      setDownloadingContentId(null);
    }
  }

  function closePdfPreview() {
    previewRequestRef.current += 1;
    setPreviewContentId(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewLoading(false);
  }

  async function handleContentPreview(content: ContentItem) {
    if (previewContentId === content.id) {
      closePdfPreview();
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewError((prev) => ({ ...prev, [content.id]: "" }));
    setPreviewContentId(content.id);
    setPreviewLoading(true);
    try {
      const objectUrl = await loadPdfPreviewObjectUrl(content.konten);
      if (previewRequestRef.current !== requestId) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      previewUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } catch (err) {
      if (previewRequestRef.current === requestId) {
        setPreviewError((prev) => ({ ...prev, [content.id]: err instanceof Error ? err.message : "Gagal memuat pratinjau PDF." }));
      }
    } finally {
      if (previewRequestRef.current === requestId) setPreviewLoading(false);
    }
  }

  async function handleContentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingContentId) return;
    if (contentData.tipe === "pdf" && !contentData.konten) {
      setPdfMessage("Silakan unggah file PDF terlebih dahulu.");
      return;
    }
    if (contentData.tipe === "link") {
      const urlError = validateExternalUrl(contentData.konten);
      if (urlError) {
        setContentMessage(urlError);
        return;
      }
    }
    setContentBusy(true);
    setContentMessage("");
    setPdfMessage("");
    try {
      const updated = await updateContent(editingContentId, contentData);
      setContents((prev) => prev.map((content) => content.id === editingContentId ? { ...content, ...contentData, ...updated } : content));
      setEditingContentId(null);
      setPdfFileName("");
      setContentMessage("Learning Material berhasil diperbarui.");
    } catch (err) {
      setContentMessage(err instanceof Error ? err.message : "Gagal memperbarui Learning Material.");
    } finally {
      setContentBusy(false);
    }
  }

  async function handleContentDelete(content: ContentItem) {
    if (!window.confirm(`Yakin ingin menghapus konten "${content.judul}"?`)) return;
    if (previewContentId === content.id) closePdfPreview();
    setContentBusy(true);
    try {
      await deleteContent(content.id);
      setContents((prev) => prev.filter((item) => item.id !== content.id));
    } catch (err) {
      setContentMessage(err instanceof Error ? err.message : "Gagal menghapus Learning Material.");
    } finally {
      setContentBusy(false);
    }
  }

  async function handleEvaluationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEvaluationBusy(true);
    setEvaluationMessage("");
    try {
      const created = await createEvaluation(id, { judul: evaluationTitle, tipe: evaluationType, passingScore, maxAttempts }) as EvaluationItem;
      setEvaluations((prev) => [...prev, { ...created, questions: [] }]);
      setEvaluationTitle("");
      setShowEvaluationForm(false);
    } catch (err) {
      setEvaluationMessage(err instanceof Error ? err.message : "Gagal membuat asesmen.");
    } finally {
      setEvaluationBusy(false);
    }
  }

  async function handleEvaluationDelete(evaluationId: string, title: string, type: "pre_test" | "post_test") {
    if (!window.confirm(`Yakin ingin menghapus ${title} ini? Semua soal di dalamnya juga akan terhapus.`)) return;
    setEvaluationDeletingId(evaluationId);
    setEvaluationMessage("");
    setEvaluationDeleteError((prev) => ({ ...prev, [type]: "" }));
    try {
      await deleteEvaluation(id, evaluationId, type);
      // Refresh dari BE agar Pre-Test/Post-Test langsung hilang dari UI.
      await loadEvaluations();
    } catch (err) {
      setEvaluationDeleteError((prev) => ({
        ...prev,
        [type]: err instanceof Error ? err.message : `Gagal menghapus ${title}.`,
      }));
    } finally {
      setEvaluationDeletingId(null);
    }
  }

  function getInitialEvaluationOptions() {
    return [{ teksOpsi: "", isCorrect: true }, { teksOpsi: "", isCorrect: false }];
  }

  function mapEvaluationOptions(options: EvaluationOption[]) {
    const mapped = options.map((option) => ({ teksOpsi: (option.teksOpsi || option.teks || "").trim(), isCorrect: option.isCorrect === true }));
    return mapped.length >= 2 ? mapped : getInitialEvaluationOptions();
  }

  function startEvaluationQuestionForm(evaluationId: string) {
    setEvaluationQuestionForm({ evaluationId, pertanyaan: "", options: getInitialEvaluationOptions() });
    setEvaluationQuestionError((prev) => ({ ...prev, [evaluationId]: "" }));
  }

  function startEvaluationQuestionEdit(evaluationId: string, question: EvaluationQuestion) {
    setEvaluationQuestionForm({ evaluationId, questionId: question.id, pertanyaan: question.pertanyaan, options: mapEvaluationOptions(question.options || []) });
    setEvaluationQuestionError((prev) => ({ ...prev, [evaluationId]: "" }));
  }

  function refreshEvaluationQuestions(evaluationId: string, questions: EvaluationQuestion[]) {
    setEvaluations((prev) => prev.map((evaluation) => evaluation.id === evaluationId ? { ...evaluation, questions, _count: { questions: questions.length } } : evaluation));
  }

  // Tipe Pre-Test/Post-Test milik sebuah evaluasi (dibutuhkan agar question CRUD
  // memanggil endpoint per-tahap yang benar).
  function getEvaluationTipe(evaluationId: string): string {
    return evaluations.find((evaluation) => evaluation.id === evaluationId)?.tipe || "";
  }

  function validateEvaluationQuestionForm() {
    if (!evaluationQuestionForm?.pertanyaan.trim()) return "Pertanyaan wajib diisi.";
    if (evaluationQuestionForm.options.length < 2) return "Minimal 2 opsi jawaban.";
    if (evaluationQuestionForm.options.some((option) => !option.teksOpsi.trim())) return "Semua opsi jawaban harus diisi.";
    if (evaluationQuestionForm.options.filter((option) => option.isCorrect).length !== 1) return "Pilih tepat 1 jawaban benar.";
    return "";
  }

  async function saveEvaluationQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!evaluationQuestionForm) return;
    const validationError = validateEvaluationQuestionForm();
    if (validationError) {
      setEvaluationQuestionError((prev) => ({ ...prev, [evaluationQuestionForm.evaluationId]: validationError }));
      return;
    }
    setEvaluationQuestionBusy(true);
    try {
      const payload = {
        pertanyaan: evaluationQuestionForm.pertanyaan.trim(),
        options: evaluationQuestionForm.options.map((option) => ({ teks: option.teksOpsi.trim(), isCorrect: option.isCorrect })),
      };
      if (evaluationQuestionForm.questionId) await updateEvaluationQuestion(id, evaluationQuestionForm.questionId, payload, getEvaluationTipe(evaluationQuestionForm.evaluationId));
      else await addEvaluationQuestion(id, evaluationQuestionForm.evaluationId, { pertanyaan: payload.pertanyaan, options: evaluationQuestionForm.options }, getEvaluationTipe(evaluationQuestionForm.evaluationId));
      const refreshed = await getEvaluationDetail(id, evaluationQuestionForm.evaluationId) as EvaluationItem;
      refreshEvaluationQuestions(evaluationQuestionForm.evaluationId, refreshed.questions || []);
      setEvaluationQuestionForm(null);
    } catch (err) {
      setEvaluationQuestionError((prev) => ({ ...prev, [evaluationQuestionForm.evaluationId]: err instanceof Error ? err.message : "Gagal menyimpan soal." }));
    } finally {
      setEvaluationQuestionBusy(false);
    }
  }

  async function removeEvaluationQuestion(evaluationId: string, questionId: string) {
    if (!window.confirm("Hapus soal ini?")) return;
    setEvaluationQuestionDeletingId(questionId);
    try {
      await deleteEvaluationQuestion(id, questionId, getEvaluationTipe(evaluationId));
      const refreshed = await getEvaluationDetail(id, evaluationId) as EvaluationItem;
      refreshEvaluationQuestions(evaluationId, refreshed.questions || []);
    } catch (err) {
      setEvaluationQuestionError((prev) => ({ ...prev, [evaluationId]: err instanceof Error ? err.message : "Gagal menghapus soal." }));
    } finally {
      setEvaluationQuestionDeletingId(null);
    }
  }

  async function toggleInteractiveQuestions(contentId: string) {
    if (expandedVideoId === contentId) { setExpandedVideoId(null); return; }
    setExpandedVideoId(contentId);
    if (videoQuizzes[contentId]) return;
    setInteractiveLoading(contentId);
    try { const quizzes = await getMiniQuizzesByContent(contentId); setVideoQuizzes((prev) => ({ ...prev, [contentId]: quizzes })); }
    catch (err) { setInteractiveError((prev) => ({ ...prev, [contentId]: err instanceof Error ? err.message : "Gagal memuat Pertanyaan Interaktif." })); }
    finally { setInteractiveLoading(null); }
  }

  async function saveCheckpoint(e: React.FormEvent) {
    e.preventDefault();
    if (!checkpointForm) return;
    const timestampSeconds = parseTimestamp(checkpointForm.timestamp);
    if (timestampSeconds === null) {
      setInteractiveError((prev) => ({ ...prev, [checkpointForm.contentId]: "Gunakan format waktu MM:SS yang valid." }));
      return;
    }
    try {
      if (!checkpointForm.judul.trim()) {
        setInteractiveError((prev) => ({ ...prev, [checkpointForm.contentId]: "Nama checkpoint wajib diisi." }));
        return;
      }
      const checkpoint = await createMiniQuiz(checkpointForm.contentId, { judul: checkpointForm.judul.trim(), timestampSeconds, passingScore: 80, maxAttempts: 3 });
      setVideoQuizzes((prev) => ({ ...prev, [checkpointForm.contentId]: [...(prev[checkpointForm.contentId] || []), checkpoint] }));
      setCheckpointForm(null);
    } catch (err) {
      setInteractiveError((prev) => ({ ...prev, [checkpointForm.contentId]: err instanceof Error ? err.message : "Gagal membuat checkpoint video." }));
    }
  }

  async function removeCheckpoint(contentId: string, quizId: string) {
    if (!window.confirm("Hapus checkpoint ini beserta semua pertanyaan di dalamnya?")) return;
    setInteractiveDeletingId(quizId);
    try {
      await deleteMiniQuiz(quizId);
      setVideoQuizzes((prev) => ({ ...prev, [contentId]: (prev[contentId] || []).filter((quiz) => quiz.id !== quizId) }));
    } catch (err) {
      setInteractiveError((prev) => ({ ...prev, [contentId]: err instanceof Error ? err.message : "Gagal menghapus checkpoint." }));
    } finally {
      setInteractiveDeletingId(null);
    }
  }

  async function saveInteractiveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!interactiveForm) return;
    if (interactiveForm.options.length < 2 || interactiveForm.options.some((option) => !option.teksOpsi.trim()) || interactiveForm.options.filter((option) => option.isCorrect).length !== 1) {
      setInteractiveError((prev) => ({ ...prev, [expandedVideoId!]: "Pertanyaan harus memiliki minimal 2 opsi terisi dan tepat 1 jawaban benar." }));
      return;
    }
    const payload = { pertanyaan: interactiveForm.pertanyaan, options: interactiveForm.options };
    const quizzes = videoQuizzes[expandedVideoId || ""] || [];
    const quiz = quizzes.find((item) => item.id === interactiveForm.quizId);
    if (!quiz) return;
    try {
      if (interactiveForm.questionId) await updateQuestion(interactiveForm.questionId, payload);
      else await addQuestion(quiz.id, payload);
      const refreshed = await getMiniQuizzesByContent(expandedVideoId!);
      setVideoQuizzes((prev) => ({ ...prev, [expandedVideoId!]: refreshed }));
      setInteractiveForm(null);
    } catch (err) { setInteractiveError((prev) => ({ ...prev, [expandedVideoId!]: err instanceof Error ? err.message : "Gagal menyimpan Pertanyaan Interaktif." })); }
  }

  async function removeInteractiveQuestion(contentId: string, questionId: string) {
    if (!window.confirm("Hapus Pertanyaan Interaktif ini?")) return;
    try { await deleteQuestion(questionId); setVideoQuizzes((prev) => ({ ...prev, [contentId]: (prev[contentId] || []).map((quiz) => ({ ...quiz, questions: (quiz.questions || []).filter((question) => question.id !== questionId) })) })); }
    catch (err) { setInteractiveError((prev) => ({ ...prev, [contentId]: err instanceof Error ? err.message : "Gagal menghapus Pertanyaan Interaktif." })); }
  }

  const preTestEvaluations = evaluations.filter((evaluation) => evaluation.tipe === "pre_test");
  const postTestEvaluations = evaluations.filter((evaluation) => evaluation.tipe === "post_test");

  function openEvaluationForm(type: "pre_test" | "post_test") {
    setEvaluationType(type);
    setEvaluationTitle("");
    setShowEvaluationForm(true);
    setEvaluationMessage("");
  }

  function renderEvaluationSection(title: string, type: "pre_test" | "post_test", items: EvaluationItem[]) {
    const isActiveForm = showEvaluationForm && evaluationType === type;

    return (
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {items.length === 0 && <button type="button" onClick={() => openEvaluationForm(type)} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full dark:bg-slate-700">+ Buat {title}</button>}
        </div>
        {evaluationMessage && isActiveForm && <p className="text-sm text-red-600">{evaluationMessage}</p>}
        {evaluationDeleteError[type] && <p className="text-sm text-red-600">{evaluationDeleteError[type]}</p>}
        {isActiveForm && (
          <form onSubmit={handleEvaluationSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-3">
            <input
              value={evaluationTitle}
              onChange={(e) => setEvaluationTitle(e.target.value)}
              placeholder={`Judul ${title}`}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              required
            />
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Passing Score"
            />
            <input
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Max Attempts"
            />
            <button
              type="submit"
              disabled={evaluationBusy}
              className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-60"
            >
              {evaluationBusy ? "Membuat..." : "Simpan"}
            </button>
          </form>
        )}
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada {title} untuk modul ini.</p>
        ) : (
          <div className="space-y-3">
            {items.map((evaluation) => {
              const questions = evaluation.questions || [];
              const activeForm = evaluationQuestionForm?.evaluationId === evaluation.id;

              return (
                <div key={evaluation.id} className="border border-slate-200 rounded-2xl p-4 space-y-5 dark:border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{evaluation.judul}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1 dark:text-slate-400">
                        <span>{title}</span>
                        <span>{questions.length} soal</span>
                        {evaluation.passingScore !== undefined && <span>Passing Score: {evaluation.passingScore}%</span>}
                        {evaluation.maxAttempts !== undefined && <span>Max Attempts: {evaluation.maxAttempts}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => startEvaluationQuestionForm(evaluation.id)} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full text-center">+ Tambah Soal</button>
                      <button type="button" onClick={() => handleEvaluationDelete(evaluation.id, title, type)} disabled={evaluationDeletingId === evaluation.id} className="px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-full text-center hover:bg-red-50 disabled:opacity-60">{evaluationDeletingId === evaluation.id ? "Menghapus..." : "Hapus"}</button>
                    </div>
                  </div>
                  {evaluationQuestionError[evaluation.id] && <p className="text-sm text-red-600">{evaluationQuestionError[evaluation.id]}</p>}
                  {questions.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada soal untuk {title} ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div key={question.id} className="rounded-xl bg-slate-50 p-4 space-y-3 dark:bg-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{index + 1}. {question.pertanyaan}</p>
                              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{(question.options || []).length} opsi</p>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => startEvaluationQuestionEdit(evaluation.id, question)} className="text-xs font-semibold text-slate-600 dark:text-slate-300">Edit</button>
                              <button type="button" onClick={() => removeEvaluationQuestion(evaluation.id, question.id)} disabled={evaluationQuestionDeletingId === question.id} className="text-xs font-semibold text-red-600 disabled:opacity-60">{evaluationQuestionDeletingId === question.id ? "Menghapus..." : "Hapus"}</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optionIndex) => (
                              <p key={option.id || optionIndex} className={`text-xs rounded-lg px-3 py-2 ${option.isCorrect ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                                {option.teksOpsi || option.teks || "Opsi kosong"}{option.isCorrect ? " • Jawaban benar" : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeForm && (
                    <form onSubmit={saveEvaluationQuestion} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800">
                      <textarea value={evaluationQuestionForm.pertanyaan} onChange={(e) => setEvaluationQuestionForm({ ...evaluationQuestionForm, pertanyaan: e.target.value })} className="w-full border border-slate-200 rounded-xl p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" placeholder="Pertanyaan" rows={2} required />
                      <div className="space-y-2">
                        {evaluationQuestionForm.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <input type="radio" name={`correct-${evaluation.id}`} checked={option.isCorrect} onChange={() => setEvaluationQuestionForm({ ...evaluationQuestionForm, options: evaluationQuestionForm.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === optionIndex })) })} />
                            <input value={option.teksOpsi} onChange={(e) => setEvaluationQuestionForm({ ...evaluationQuestionForm, options: evaluationQuestionForm.options.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, teksOpsi: e.target.value } : item) })} className="flex-1 border border-slate-200 rounded-xl p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" placeholder={`Opsi ${optionIndex + 1}`} required />
                            {evaluationQuestionForm.options.length > 2 && <button type="button" onClick={() => setEvaluationQuestionForm({ ...evaluationQuestionForm, options: evaluationQuestionForm.options.filter((_, itemIndex) => itemIndex !== optionIndex) })} className="text-xs text-red-600">Hapus</button>}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setEvaluationQuestionForm({ ...evaluationQuestionForm, options: [...evaluationQuestionForm.options, { teksOpsi: "", isCorrect: false }] })} className="text-xs text-emerald-700">+ Tambah Opsi</button>
                      <div className="flex gap-2">
                        <button type="submit" disabled={evaluationQuestionBusy} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs disabled:opacity-60">{evaluationQuestionBusy ? "Menyimpan..." : evaluationQuestionForm.questionId ? "Simpan Perubahan" : "Tambah Soal"}</button>
                        <button type="button" onClick={() => setEvaluationQuestionForm(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Batal</button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6 dark:bg-slate-900/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push("/admin/modules")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-emerald-400"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors dark:bg-slate-700 dark:group-hover:bg-emerald-950/40 dark:text-slate-400 dark:group-hover:text-emerald-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            Kembali ke Kelola Modul
          </button>
        </div>

        {/* Hero Banner Header Modul */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{module.aspekPancawaluya}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {module.judul}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              {module.deskripsi ||
                "Modul ini membahas tentang pembentukan kesemaptaan fisik yang lebih baik sehingga energi tersalurkan untuk mengoptimalkan ketahanan fisik, disertai penguatan mental spiritual yang mendorong tanggung jawab terhadap sesama, alam, dan Tuhan Yang Maha Kuasa."}
            </p>
          </div>
        </div>

         {/* Informasi Modul */}
         <form onSubmit={handleModuleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
           <h2 className="text-base font-bold text-slate-900 tracking-tight dark:text-slate-100">Informasi Modul</h2>
           {moduleMessage && <div className={`text-sm px-4 py-3 rounded-xl border ${moduleMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>{moduleMessage.text}</div>}
           <div className="space-y-4">
              <div>
                <label htmlFor="judul" className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">
                  Judul Modul
                </label>
                <input
                  id="judul"
                  name="judul"
                  value={formData.judul}
                  onChange={handleModuleChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="deskripsi" className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">
                  Deskripsi
                </label>
                <textarea
                  id="deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleModuleChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-y dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aspekPancawaluya" className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">
                    Aspek Pancawaluya
                  </label>
                  <select
                    id="aspekPancawaluya"
                    name="aspekPancawaluya"
                    value={formData.aspekPancawaluya}
                    onChange={handleModuleChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {aspekOptions.map((aspek) => (
                      <option key={aspek} value={aspek}>
                        {aspek}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="urutan" className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">
                    Urutan Modul
                  </label>
                  <input
                    id="urutan"
                    type="number"
                    name="urutan"
                    value={formData.urutan}
                    onChange={handleModuleChange}
                    min={1}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>
           </div>
           <div className="flex justify-end"><button type="submit" disabled={savingModule} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl disabled:opacity-60">{savingModule ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
         </form>

        {renderEvaluationSection("Pre-Test", "pre_test", preTestEvaluations)}

        {/* Konten Pembelajaran - Kartu */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 dark:text-slate-100">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Konten Pembelajaran
            </h2>
            <Link
              href={`/admin/modules/${module.id}/contents/new`}
              className="text-xs sm:text-sm bg-slate-900 text-white px-4 py-2 rounded-full font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              + Tambah Konten
            </Link>
          </div>

          {contents.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada konten untuk modul ini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {contents
                .sort((a, b) => a.urutan - b.urutan)
                .map((content) => (
                  <div
                    key={content.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <strong className="text-xs font-bold text-slate-400">#{content.urutan}</strong>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base dark:text-slate-100">
                          {content.judul}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                        {content.tipe}
                      </span>
                    </div>

                     <div className="p-5 sm:p-6">
                       {editingContentId === content.id ? (
                         <form onSubmit={handleContentSubmit} className="space-y-4">
                           <input
                             value={contentData.judul}
                             onChange={(e) => setContentData({ ...contentData, judul: e.target.value })}
                             className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                             required
                           />
                           <select
                             value={contentData.tipe}
                             onChange={(e) => {
                               const tipe = e.target.value;
                               setPdfMessage("");
                               setPdfFileName("");
                               setContentMessage("");
                               setContentData((prev) => ({ ...prev, tipe, ...(tipe === "pdf" || tipe === "link" ? { konten: "" } : {}) }));
                             }}
                             className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                           >
                             <option value="teks">Text</option>
                             <option value="video">Video</option>
                             <option value="pdf">PDF</option>
                             <option value="link">Link</option>
                           </select>
                           {contentData.tipe === "pdf" ? (
                             <div>
                               <label htmlFor={`pdf-file-${content.id}`} className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">File PDF</label>
                               <input
                                 id={`pdf-file-${content.id}`}
                                 type="file"
                                 accept="application/pdf,.pdf"
                                 onChange={handleContentPdfUpload}
                                 disabled={pdfUploadingId === content.id}
                                 className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-1.5 file:text-white disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:file:bg-slate-700"
                                 aria-describedby={`pdf-file-help-${content.id}`}
                               />
                               <p id={`pdf-file-help-${content.id}`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">Format PDF, maksimal 10MB.</p>
                               {pdfUploadingId === content.id && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mengunggah file PDF...</p>}
                               {pdfMessage && <p className="mt-1 text-xs text-red-600">{pdfMessage}</p>}
                               {pdfUploadingId !== content.id && !pdfMessage && contentData.konten && (
                                 <p className="mt-1 text-xs text-emerald-700">
                                   {pdfFileName ? `${pdfFileName} — ` : ""}File PDF berhasil diunggah.
                                 </p>
                               )}
                             </div>
                           ) : contentData.tipe === "link" ? (
                             <div>
                               <label htmlFor={`link-url-${content.id}`} className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">URL Link</label>
                               <input
                                 id={`link-url-${content.id}`}
                                 type="url"
                                 value={contentData.konten}
                                 onChange={(e) => setContentData({ ...contentData, konten: e.target.value })}
                                 className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                 placeholder="https://contoh.com/materi"
                                 aria-describedby={`link-url-help-${content.id}`}
                                 required
                               />
                               <p id={`link-url-help-${content.id}`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">Masukkan URL eksternal lengkap (http:// atau https://).</p>
                             </div>
                           ) : (
                             <textarea
                               value={contentData.konten}
                               onChange={(e) => setContentData({ ...contentData, konten: e.target.value })}
                               rows={contentData.tipe === "video" ? 2 : 6}
                               className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                               required
                             />
                           )}
                           <input
                             type="number"
                             min={1}
                             value={contentData.urutan}
                             onChange={(e) => setContentData({ ...contentData, urutan: Number(e.target.value) })}
                             className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                             required
                           />
                           <div className="flex gap-2">
                             <button type="submit" disabled={contentBusy || pdfUploadingId === content.id} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-60">
                               Simpan
                             </button>
                             <button type="button" onClick={cancelContentEdit} className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                               Batal
                             </button>
                           </div>
                         </form>
                       ) : content.tipe === "video" ? (
                        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 ring-1 ring-slate-900/10">
                          <iframe
                            src={getYoutubeEmbedUrl(content.konten)}
                            className="w-full h-full"
                            allowFullScreen
                            title={content.judul}
                          />
                        </div>
                      ) : content.tipe === "pdf" ? (
                        <div className="space-y-3">
                          {!content.konten && (
                            <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                              File PDF belum tersedia untuk materi ini.
                            </p>
                          )}
                          {content.konten && previewContentId === content.id && (
                            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              {previewLoading ? (
                                <div className="flex h-[480px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">Memuat pratinjau PDF...</div>
                              ) : previewError[content.id] ? (
                                <div className="flex h-[480px] flex-col items-center justify-center gap-3 p-6 text-center">
                                  <p className="text-sm text-red-600">{previewError[content.id]}</p>
                                  <a
                                    href={content.konten}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    Buka PDF di tab baru
                                  </a>
                                </div>
                              ) : previewUrl ? (
                                <iframe
                                  src={previewUrl}
                                  className="w-full h-[480px]"
                                  title={content.judul}
                                />
                              ) : null}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleContentDownload(content)}
                              disabled={!content.konten || downloadingContentId === content.id}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {downloadingContentId === content.id ? "Mengunduh..." : "Download PDF"}
                            </button>
                            {content.konten && (
                              <button
                                type="button"
                                onClick={() => handleContentPreview(content)}
                                disabled={previewLoading && previewContentId === content.id}
                                aria-expanded={previewContentId === content.id}
                                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                {previewContentId === content.id ? "Tutup Preview" : previewLoading && previewContentId === content.id ? "Memuat..." : "Preview PDF"}
                              </button>
                            )}
                          </div>
                          {downloadError[content.id] && <p className="text-xs text-red-600">{downloadError[content.id]}</p>}
                        </div>
                      ) : content.tipe === "link" ? (
                        <div className="space-y-3">
                          {content.konten ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tautan Eksternal</p>
                              <p className="mt-1 text-sm text-slate-700 break-all dark:text-slate-300">{content.konten}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                              URL link belum tersedia untuk materi ini.
                            </p>
                          )}
                          {content.konten && (
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={content.konten}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition"
                              >
                                Buka Link
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line dark:text-slate-300">
                            {content.konten}
                          </p>
                        </div>
                       )}
                        {editingContentId !== content.id && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => startContentEdit(content)}
                              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleContentDelete(content)}
                              disabled={contentBusy}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg disabled:opacity-60"
                            >
                              Hapus
                            </button>
                            {content.tipe === "video" && (
                              <button
                                type="button"
                                onClick={() => toggleInteractiveQuestions(content.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg"
                              >
                                {expandedVideoId === content.id ? "Tutup Pertanyaan Interaktif" : "Kelola Pertanyaan Interaktif"}
                              </button>
                            )}
                          </div>
                        )}
                        {content.tipe === "video" && expandedVideoId === content.id && (
                          <div className="mt-6 border-t border-slate-100 pt-6 space-y-5 dark:border-slate-800">
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Pertanyaan Interaktif</h4>
                                  <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                                    Tambahkan checkpoint pada waktu tertentu di video untuk menampilkan pertanyaan kepada peserta.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCheckpointForm({ contentId: content.id, judul: "", timestamp: "" })}
                                  className="shrink-0 text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-xl px-4 py-2 hover:bg-emerald-50"
                                >
                                  + Tambah Checkpoint
                                </button>
                              </div>
                              {checkpointForm?.contentId === content.id && (
                                <form onSubmit={saveCheckpoint} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 dark:border-slate-700 dark:bg-slate-800">
                                  <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tambah Checkpoint</h5>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">Nama Checkpoint</label>
                                    <input
                                      value={checkpointForm.judul}
                                      onChange={(e) => setCheckpointForm({ ...checkpointForm, judul: e.target.value })}
                                      placeholder="Nama checkpoint"
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">Waktu Video</label>
                                    <input
                                      value={checkpointForm.timestamp}
                                      onChange={(e) => setCheckpointForm({ ...checkpointForm, timestamp: e.target.value })}
                                      placeholder="MM:SS"
                                      inputMode="numeric"
                                      pattern="\d+:\d{2}"
                                      aria-label="Waktu checkpoint MM:SS"
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                      required
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setCheckpointForm(null)} className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                      Batal
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
                                      Simpan Checkpoint
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                            {interactiveLoading === content.id ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400">Memuat...</p>
                            ) : interactiveError[content.id] ? (
                              <p className="text-xs text-red-600">{interactiveError[content.id]}</p>
                            ) : (videoQuizzes[content.id] || []).length === 0 ? (
                              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-5 dark:text-slate-400 dark:border-slate-700">
                                Belum ada checkpoint pada video ini.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {(videoQuizzes[content.id] || []).map((quiz) => (
                                  <div key={quiz.id} className="rounded-2xl border border-slate-200 p-5 space-y-5 dark:border-slate-700">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Checkpoint</p>
                                        <h5 className="text-base font-bold text-slate-900 mt-1 dark:text-slate-100">{quiz.judul || "Checkpoint tanpa nama"}</h5>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                                          {formatTimestamp(quiz.timestampSeconds)}
                                        </span>
                                        <button type="button" onClick={() => removeCheckpoint(content.id, quiz.id)} disabled={interactiveDeletingId === quiz.id} className="text-xs font-semibold text-red-600 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-60">Hapus</button>
                                      </div>
                                    </div>
                                    {(quiz.questions || []).length === 0 ? (
                                      <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada pertanyaan pada checkpoint ini.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pertanyaan Interaktif</p>
                                        {(quiz.questions || []).map((question) => (
                                          <div key={question.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{question.pertanyaan}</p>
                                            <div className="flex gap-3 mt-3">
                                              <button
                                                type="button"
                                                onClick={() => setInteractiveForm({ quizId: quiz.id, questionId: question.id, pertanyaan: question.pertanyaan, options: question.options.map(({ teksOpsi, isCorrect }) => ({ teksOpsi, isCorrect })) })}
                                                className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                                              >
                                                Edit
                                              </button>
                                              <button type="button" onClick={() => removeInteractiveQuestion(content.id, question.id)} className="text-xs font-semibold text-red-600">
                                                Hapus
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setInteractiveForm({ quizId: quiz.id, pertanyaan: "", options: [{ teksOpsi: "", isCorrect: true }, { teksOpsi: "", isCorrect: false }] })}
                                      className="text-sm font-semibold text-emerald-700 text-right"
                                    >
                                      + Tambah Pertanyaan
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {interactiveForm && (
                              <form onSubmit={saveInteractiveQuestion} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 dark:border-slate-700 dark:bg-slate-800">
                                <textarea
                                  value={interactiveForm.pertanyaan}
                                  onChange={(e) => setInteractiveForm({ ...interactiveForm, pertanyaan: e.target.value })}
                                  className="w-full border border-slate-200 rounded-xl p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  placeholder="Pertanyaan"
                                  required
                                />
                                {interactiveForm.options.map((option, index) => (
                                  <div key={index} className="flex gap-2">
                                    <input
                                      value={option.teksOpsi}
                                      onChange={(e) => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.map((item, itemIndex) => itemIndex === index ? { ...item, teksOpsi: e.target.value } : item) })}
                                      className="flex-1 border border-slate-200 rounded-xl p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                      placeholder={`Opsi ${index + 1}`}
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })) })}
                                      className={`text-xs px-2 rounded-lg ${option.isCorrect ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}
                                    >
                                      {option.isCorrect ? "Benar" : "Tandai benar"}
                                    </button>
                                    {interactiveForm.options.length > 2 && (
                                      <button type="button" onClick={() => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.filter((_, itemIndex) => itemIndex !== index) })} className="text-xs text-red-600">
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button type="button" onClick={() => setInteractiveForm({ ...interactiveForm, options: [...interactiveForm.options, { teksOpsi: "", isCorrect: false }] })} className="text-xs text-emerald-700">
                                  + Tambah opsi
                                </button>
                                <div className="flex gap-2">
                                  <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs">Simpan</button>
                                  <button type="button" onClick={() => setInteractiveForm(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Batal</button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                       {contentMessage && editingContentId === null && <p className="text-xs text-red-600 mt-2">{contentMessage}</p>}
                     </div>
                   </div>

                ))}
            </div>
          )}
        </div>

        {renderEvaluationSection("Post-Test", "post_test", postTestEvaluations)}

      </div>
    </div>
  );
}
