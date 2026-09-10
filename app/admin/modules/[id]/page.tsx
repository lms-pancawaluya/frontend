"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getModuleById, getModuleContents, updateModule } from "@/services/module.service";
import { deleteComment, getModuleComments, postComment } from "@/services/comment.service";
import { deleteContent, updateContent } from "@/services/content.service";
import { createEvaluation, getModuleEvaluations } from "@/services/evaluation.service";
import { addQuestion, createMiniQuiz, deleteQuestion, getMiniQuizzesByContent, updateQuestion } from "@/services/miniQuiz.service";

interface ModuleDetail {
  id: string;
  judul: string;
  deskripsi: string;
  aspekPancawaluya: string;
  urutan: number;
}

interface ContentItem {
  id: string;
  judul: string;
  tipe: string;
  konten: string;
  urutan: number;
}

interface EvaluationItem {
  id: string;
  judul: string;
  tipe?: "pre_test" | "post_test" | string;
  passingScore?: number;
  maxAttempts?: number;
  _count?: { questions: number };
}

interface InteractiveQuestion { id: string; pertanyaan: string; options: { id?: string; teksOpsi: string; isCorrect: boolean }[]; }
interface InteractiveQuiz { id: string; judul: string; timestampSeconds: number; questions: InteractiveQuestion[]; }

interface CommentUser {
  id?: string;
  nama?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
}

interface ModuleComment {
  id?: string;
  konten?: string;
  isi?: string;
  pesan?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: CommentUser;
  author?: CommentUser;
  pengirim?: CommentUser;
  replies?: ModuleComment[];
  parentCommentId?: string;
  parentId?: string;
}

const aspekOptions = ["cageur", "bageur", "bener", "pinter", "singer"];

function getYoutubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  const videoId = match ? match[1] : "";
  return `https://www.youtube.com/embed/${videoId}`;
}

function getUserLabel(user?: CommentUser) {
  return user?.nama || user?.name || user?.username || user?.email || user?.role || "Pengguna";
}

function getCommentText(comment: ModuleComment) {
  return comment.konten || comment.isi || comment.pesan || "";
}

function formatCommentDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeCommentTree(comments: ModuleComment[]): (ModuleComment & { children?: ModuleComment[] })[] {
  const hasNestedReplies = comments.some((comment) => Array.isArray(comment.replies) && comment.replies.length > 0);

  if (hasNestedReplies) {
    return comments.map((comment) => ({
      ...comment,
      children: normalizeCommentTree(comment.replies || []),
    }));
  }

  const tree = new Map<string, ModuleComment & { children: ModuleComment[] }>();
  const roots: (ModuleComment & { children: ModuleComment[] })[] = [];

  comments.forEach((comment, index) => {
    const key = comment.id || `comment-${index}`;
    tree.set(key, { ...comment, children: [] });
  });

  comments.forEach((comment, index) => {
    const key = comment.id || `comment-${index}`;
    const node = tree.get(key);
    if (!node) return;

    const parentKey = comment.parentCommentId || comment.parentId;
    if (parentKey && tree.has(parentKey)) {
      tree.get(parentKey)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function AdminModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [comments, setComments] = useState<ModuleComment[]>([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentError, setCommentError] = useState("");
  const [replyTo, setReplyTo] = useState<ModuleComment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busyCommentId, setBusyCommentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluationTitle, setEvaluationTitle] = useState("");
  const [evaluationType, setEvaluationType] = useState<"pre_test" | "post_test">("pre_test");
  const [passingScore, setPassingScore] = useState(80);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [evaluationBusy, setEvaluationBusy] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [videoQuizzes, setVideoQuizzes] = useState<Record<string, InteractiveQuiz[]>>({});
  const [interactiveLoading, setInteractiveLoading] = useState<string | null>(null);
  const [interactiveError, setInteractiveError] = useState<Record<string, string>>({});
  const [interactiveForm, setInteractiveForm] = useState<{ quizId: string; questionId?: string; pertanyaan: string; options: { teksOpsi: string; isCorrect: boolean }[] } | null>(null);
  const [checkpointForm, setCheckpointForm] = useState<{ contentId: string; judul: string; timestampSeconds: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [moduleData, contentsData] = await Promise.all([
          getModuleById(id),
          getModuleContents(id),
        ]);
        setModule(moduleData);
        setFormData({
          judul: moduleData.judul,
          deskripsi: moduleData.deskripsi || "",
          aspekPancawaluya: moduleData.aspekPancawaluya,
          urutan: moduleData.urutan,
        });
         setContents(contentsData);
         setEvaluations((await getModuleEvaluations(id)) as EvaluationItem[]);

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

    async function fetchComments() {
      setCommentLoading(true);
      setCommentError("");
      try {
        const data = await getModuleComments(id);
        setComments(data as ModuleComment[]);
      } catch (err) {
        setCommentError(err instanceof Error ? err.message : "Gagal memuat komentar modul.");
      } finally {
        setCommentLoading(false);
      }
    }

    fetchData();
    fetchComments();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
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
    setEditingContentId(content.id);
    setContentMessage("");
    setContentData({ judul: content.judul, tipe: content.tipe, konten: content.konten, urutan: content.urutan });
  }

  async function handleContentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingContentId) return;
    setContentBusy(true);
    setContentMessage("");
    try {
      const updated = await updateContent(editingContentId, contentData);
      setContents((prev) => prev.map((content) => content.id === editingContentId ? { ...content, ...contentData, ...updated } : content));
      setEditingContentId(null);
      setContentMessage("Learning Material berhasil diperbarui.");
    } catch (err) {
      setContentMessage(err instanceof Error ? err.message : "Gagal memperbarui Learning Material.");
    } finally {
      setContentBusy(false);
    }
  }

  async function handleContentDelete(content: ContentItem) {
    if (!window.confirm(`Yakin ingin menghapus konten "${content.judul}"?`)) return;
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
      const created = await createEvaluation(id, { judul: evaluationTitle, tipe: evaluationType, passingScore, maxAttempts });
      setEvaluations((prev) => [...prev, created as EvaluationItem]);
      setEvaluationTitle("");
      setShowEvaluationForm(false);
    } catch (err) {
      setEvaluationMessage(err instanceof Error ? err.message : "Gagal membuat evaluasi.");
    } finally {
      setEvaluationBusy(false);
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
    try {
      const checkpoint = await createMiniQuiz(checkpointForm.contentId, { judul: checkpointForm.judul, timestampSeconds: checkpointForm.timestampSeconds, passingScore: 80, maxAttempts: 3 });
      setVideoQuizzes((prev) => ({ ...prev, [checkpointForm.contentId]: [...(prev[checkpointForm.contentId] || []), checkpoint] }));
      setCheckpointForm(null);
    } catch (err) {
      setInteractiveError((prev) => ({ ...prev, [checkpointForm.contentId]: err instanceof Error ? err.message : "Gagal membuat checkpoint video." }));
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
    try { await deleteQuestion(questionId); setVideoQuizzes((prev) => ({ ...prev, [contentId]: (prev[contentId] || []).map((quiz) => ({ ...quiz, questions: quiz.questions.filter((question) => question.id !== questionId) })) })); }
    catch (err) { setInteractiveError((prev) => ({ ...prev, [contentId]: err instanceof Error ? err.message : "Gagal menghapus Pertanyaan Interaktif." })); }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    if (!replyTo?.id || !replyText.trim()) return;

    setBusyCommentId(replyTo.id);
    try {
      await postComment({ moduleId: id, komentar: replyText.trim(), parentId: replyTo.id });
      setReplyText("");
      setReplyTo(null);
      const refreshed = await getModuleComments(id);
      setComments(refreshed as ModuleComment[]);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleDeleteComment(commentId?: string) {
    if (!commentId) return;
    const confirmed = window.confirm("Hapus komentar ini?");
    if (!confirmed) return;

    setBusyCommentId(commentId);
    try {
      await deleteComment(commentId);

      const removeById = (items: ModuleComment[]): ModuleComment[] =>
        items
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies ? removeById(comment.replies) : [],
          }));

      setComments((prev) => removeById(prev));
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Gagal menghapus komentar.");
    } finally {
      setBusyCommentId(null);
    }
  }

  const commentTree = normalizeCommentTree(comments);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Tombol Navigasi Kembali */}
        <div>
          <button
            onClick={() => router.push("/admin/modules")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors group bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm"
          >
            <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 transition-colors">
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
         <form onSubmit={handleModuleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
           <h2 className="text-base font-bold text-slate-900 tracking-tight">Informasi Modul</h2>
           {moduleMessage && <div className={`text-sm px-4 py-3 rounded-xl border ${moduleMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>{moduleMessage.text}</div>}
           <div className="space-y-4">
             <div><label htmlFor="judul" className="block text-xs font-semibold text-slate-600 mb-1">Judul Modul</label><input id="judul" name="judul" value={formData.judul} onChange={handleModuleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required /></div>
             <div><label htmlFor="deskripsi" className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label><textarea id="deskripsi" name="deskripsi" value={formData.deskripsi} onChange={handleModuleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-y" rows={4} required /></div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label htmlFor="aspekPancawaluya" className="block text-xs font-semibold text-slate-600 mb-1">Aspek Pancawaluya</label><select id="aspekPancawaluya" name="aspekPancawaluya" value={formData.aspekPancawaluya} onChange={handleModuleChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize">{aspekOptions.map((aspek) => <option key={aspek} value={aspek}>{aspek}</option>)}</select></div><div><label htmlFor="urutan" className="block text-xs font-semibold text-slate-600 mb-1">Urutan Modul</label><input id="urutan" type="number" name="urutan" value={formData.urutan} onChange={handleModuleChange} min={1} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required /></div></div>
           </div>
           <div className="flex justify-end"><button type="submit" disabled={savingModule} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl disabled:opacity-60">{savingModule ? "Menyimpan..." : "Simpan Perubahan"}</button></div>
         </form>

        {/* Konten Pembelajaran - Kartu */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <p className="text-sm text-slate-500">Belum ada konten untuk modul ini.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {contents
                .sort((a, b) => a.urutan - b.urutan)
                .map((content) => (
                  <div
                    key={content.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <strong className="text-xs font-bold text-slate-400">#{content.urutan}</strong>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {content.judul}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 capitalize bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {content.tipe}
                      </span>
                    </div>

                     <div className="p-5 sm:p-6">
                       {editingContentId === content.id ? (
                         <form onSubmit={handleContentSubmit} className="space-y-4">
                           <input value={contentData.judul} onChange={(e) => setContentData({ ...contentData, judul: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required />
                           <select value={contentData.tipe} onChange={(e) => setContentData({ ...contentData, tipe: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm capitalize"><option value="teks">Text</option><option value="video">Video</option></select>
                           <textarea value={contentData.konten} onChange={(e) => setContentData({ ...contentData, konten: e.target.value })} rows={contentData.tipe === "video" ? 2 : 6} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required />
                           <input type="number" min={1} value={contentData.urutan} onChange={(e) => setContentData({ ...contentData, urutan: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required />
                           <div className="flex gap-2"><button type="submit" disabled={contentBusy} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-60">Simpan</button><button type="button" onClick={() => setEditingContentId(null)} className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl">Batal</button></div>
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
                      ) : (
                        <div className="prose prose-slate prose-sm max-w-none">
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                            {content.konten}
                          </p>
                        </div>
                       )}
                        {editingContentId !== content.id && <div className="flex flex-wrap gap-2 mt-4"><button type="button" onClick={() => startContentEdit(content)} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg">Edit</button><button type="button" onClick={() => handleContentDelete(content)} disabled={contentBusy} className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg disabled:opacity-60">Hapus</button>{content.tipe === "video" && <button type="button" onClick={() => toggleInteractiveQuestions(content.id)} className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-lg">{expandedVideoId === content.id ? "Tutup Pertanyaan Interaktif" : "Kelola Pertanyaan Interaktif"}</button>}</div>}
                        {content.tipe === "video" && expandedVideoId === content.id && <div className="mt-4 border-t border-slate-100 pt-4 space-y-3"><div className="flex items-center justify-between"><h4 className="text-sm font-bold text-slate-900">Pertanyaan Interaktif</h4><button type="button" onClick={() => setCheckpointForm({ contentId: content.id, judul: "", timestampSeconds: 0 })} className="text-xs text-emerald-700">+ Tambah Checkpoint</button></div>{checkpointForm?.contentId === content.id && <form onSubmit={saveCheckpoint} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2"><input value={checkpointForm.judul} onChange={(e) => setCheckpointForm({ ...checkpointForm, judul: e.target.value })} placeholder="Nama checkpoint" className="border border-slate-200 rounded-xl p-2 text-xs" required /><input type="number" min={0} value={checkpointForm.timestampSeconds} onChange={(e) => setCheckpointForm({ ...checkpointForm, timestampSeconds: Number(e.target.value) })} aria-label="Waktu checkpoint dalam detik" className="border border-slate-200 rounded-xl p-2 text-xs" required /><button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs">Simpan</button></form>}{interactiveLoading === content.id ? <p className="text-xs text-slate-500">Memuat...</p> : interactiveError[content.id] ? <p className="text-xs text-red-600">{interactiveError[content.id]}</p> : (videoQuizzes[content.id] || []).length === 0 ? <p className="text-xs text-slate-500">Belum ada Pertanyaan Interaktif.</p> : (videoQuizzes[content.id] || []).map((quiz) => <div key={quiz.id} className="space-y-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Checkpoint — {Math.floor(quiz.timestampSeconds / 60).toString().padStart(2, "0")}:{(quiz.timestampSeconds % 60).toString().padStart(2, "0")} <span className="font-normal text-slate-500">({quiz.judul})</span></p><button type="button" onClick={() => setInteractiveForm({ quizId: quiz.id, pertanyaan: "", options: [{ teksOpsi: "", isCorrect: true }, { teksOpsi: "", isCorrect: false }] })} className="text-xs text-emerald-700">+ Tambah Pertanyaan</button></div>{quiz.questions.map((question) => <div key={question.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-800">{question.pertanyaan}</p><div className="flex gap-2 mt-2"><button type="button" onClick={() => setInteractiveForm({ quizId: quiz.id, questionId: question.id, pertanyaan: question.pertanyaan, options: question.options.map(({ teksOpsi, isCorrect }) => ({ teksOpsi, isCorrect })) })} className="text-xs text-slate-600">Edit</button><button type="button" onClick={() => removeInteractiveQuestion(content.id, question.id)} className="text-xs text-red-600">Hapus</button></div></div>)}</div>)}{interactiveForm && <form onSubmit={saveInteractiveQuestion} className="space-y-2"><textarea value={interactiveForm.pertanyaan} onChange={(e) => setInteractiveForm({ ...interactiveForm, pertanyaan: e.target.value })} className="w-full border border-slate-200 rounded-xl p-2 text-xs" placeholder="Pertanyaan" required />{interactiveForm.options.map((option, index) => <div key={index} className="flex gap-2"><input value={option.teksOpsi} onChange={(e) => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.map((item, itemIndex) => itemIndex === index ? { ...item, teksOpsi: e.target.value } : item) })} className="flex-1 border border-slate-200 rounded-xl p-2 text-xs" placeholder={`Opsi ${index + 1}`} required /><button type="button" onClick={() => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === index })) })} className={`text-xs px-2 rounded-lg ${option.isCorrect ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 text-slate-500"}`}>{option.isCorrect ? "Benar" : "Tandai benar"}</button>{interactiveForm.options.length > 2 && <button type="button" onClick={() => setInteractiveForm({ ...interactiveForm, options: interactiveForm.options.filter((_, itemIndex) => itemIndex !== index) })} className="text-xs text-red-600">Hapus</button>}</div>)}<button type="button" onClick={() => setInteractiveForm({ ...interactiveForm, options: [...interactiveForm.options, { teksOpsi: "", isCorrect: false }] })} className="text-xs text-emerald-700">+ Tambah opsi</button><div className="flex gap-2"><button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs">Simpan</button><button type="button" onClick={() => setInteractiveForm(null)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs">Batal</button></div></form>}</div>}
                       {contentMessage && editingContentId === null && <p className="text-xs text-red-600 mt-2">{contentMessage}</p>}
                     </div>
                   </div>

                ))}
            </div>
          )}
        </div>

         <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
           <div className="flex items-center justify-between gap-3">
             <h2 className="text-base font-bold text-slate-900">Evaluasi</h2>
             <button type="button" onClick={() => setShowEvaluationForm((value) => !value)} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full">+ Buat Evaluasi</button>
           </div>
           {evaluationMessage && <p className="text-sm text-red-600">{evaluationMessage}</p>}
           {showEvaluationForm && <form onSubmit={handleEvaluationSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-3"><input value={evaluationTitle} onChange={(e) => setEvaluationTitle(e.target.value)} placeholder="Judul Evaluasi" className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" required /><select value={evaluationType} onChange={(e) => setEvaluationType(e.target.value as "pre_test" | "post_test")} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm"><option value="pre_test">Pre-Test</option><option value="post_test">Post-Test</option></select><input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" aria-label="Passing Score" /><input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm" aria-label="Max Attempts" /><button type="submit" disabled={evaluationBusy} className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-60">{evaluationBusy ? "Membuat..." : "Simpan"}</button></form>}
           {evaluations.length === 0 ? <p className="text-sm text-slate-500">Belum ada evaluasi untuk modul ini.</p> : <div className="space-y-3">{evaluations.map((evaluation) => <div key={evaluation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-200 rounded-2xl p-4"><div><p className="font-semibold text-sm text-slate-900">{evaluation.judul}</p><div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1"><span className="capitalize">{(evaluation.tipe || "evaluation").replace("_", "-")}</span>{evaluation._count && <span>{evaluation._count.questions} soal</span>}{evaluation.passingScore !== undefined && <span>Passing Score: {evaluation.passingScore}%</span>}{evaluation.maxAttempts !== undefined && <span>Max Attempts: {evaluation.maxAttempts}</span>}</div></div><Link href={`/admin/modules/${id}/evaluations/${evaluation.id}`} className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full text-center">Kelola</Link></div>)}</div>}
         </section>

         {/* Moderasi Diskusi */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
              </svg>
              Moderasi Diskusi
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {comments.length} komentar
            </span>
          </div>

          {commentError && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl border border-red-200">
              {commentError}
            </div>
          )}

          {replyTo && (
            <form onSubmit={handleReplySubmit} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <p className="text-xs text-slate-500">
                Membalas komentar dari <span className="font-semibold text-slate-700">{getUserLabel(replyTo.user || replyTo.author || replyTo.pengirim)}</span>
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
                rows={3}
                placeholder="Tulis balasan admin..."
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-white transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busyCommentId === replyTo.id || !replyText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition"
                >
                  {busyCommentId === replyTo.id ? "Mengirim..." : "Kirim Balasan"}
                </button>
              </div>
            </form>
          )}

          {commentLoading ? (
            <p className="text-sm text-slate-500">Memuat komentar modul...</p>
          ) : commentTree.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada komentar pada modul ini.</p>
          ) : (
            <div className="space-y-4">
              {commentTree.map((comment, index) => {
                const user = comment.user || comment.author || comment.pengirim;
                const commentKey = comment.id || `comment-${index}`;
                const dateLabel = formatCommentDate(comment.createdAt || comment.updatedAt);

                return (
                  <div key={commentKey} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{getUserLabel(user)}</p>
                        {dateLabel && <p className="text-xs text-slate-400">{dateLabel}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyTo(comment)}
                          disabled={!comment.id || busyCommentId === comment.id}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition"
                        >
                          Balas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={!comment.id || busyCommentId === comment.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition"
                        >
                          {busyCommentId === comment.id ? "Memproses..." : "Hapus/Moderasi"}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {getCommentText(comment) || "Komentar kosong."}
                    </p>

                    {comment.children && comment.children.length > 0 && (
                      <div className="pl-4 border-l-2 border-slate-100 space-y-3">
                        {comment.children.map((reply, replyIndex) => {
                          const replyUser = reply.user || reply.author || reply.pengirim;
                          const replyKey = reply.id || `${commentKey}-reply-${replyIndex}`;
                          const replyDate = formatCommentDate(reply.createdAt || reply.updatedAt);

                          return (
                            <div key={replyKey} className="bg-slate-50 rounded-xl p-3 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">{getUserLabel(replyUser)}</p>
                                  {replyDate && <p className="text-xs text-slate-400">{replyDate}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  disabled={!reply.id || busyCommentId === reply.id}
                                  className="self-start px-3 py-1.5 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg border border-red-100 transition"
                                >
                                  {busyCommentId === reply.id ? "Memproses..." : "Hapus/Moderasi"}
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                {getCommentText(reply) || "Komentar kosong."}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Area Aksi Admin */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.488c.457-.66 1.245-.904 2.054-.65A17.267 17.267 0 0115 5.5c0 1.005-.2 2.001-.606 2.933A7.5 7.5 0 0017 12.5a7.5 0 01-2 5.36l-2.744 2.744a1 1 0 01-1.415-.001l-.003-.003a1 1 0 01-.001-1.414l1.742-1.742A5.5 5.5 0 0112.5 10.5c0-1.057.094-2.103.286-3.114z" />
            </svg>
            Aksi Pengelolaan
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">

            <Link
              href={`/admin/modules/${module.id}/evaluations`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl shadow-sm transition"
            >
              Edit Evaluasi
            </Link>
            {contents.some((c) => c.tipe === "video") && (
              <Link
                 href={`/admin/modules/${module.id}/quiz/${contents.find((c) => c.tipe === "video")!.id}`}
                 className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-2xl shadow-sm transition"
               >
                 Pertanyaan Interaktif
               </Link>

            )}
          </div>
        </div>
      </div>
    </div>
  );
}
