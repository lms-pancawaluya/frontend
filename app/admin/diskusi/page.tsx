"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getCourses } from "@/services/course.service";
import { getCourseComments, postComment, deleteComment } from "@/services/comment.service";
import type {
  Comment as DiscussionComment,
  CommentUser,
} from "@/types/comment";
import MentionTextarea, { type MentionSelection } from "@/app/components/common/MentionTextarea";
import { renderCommentText } from "@/lib/mention";

interface CourseItem {
  id: string;
  judul: string;
  mode?: string;
}

function roleLabel(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "pengajar") return "Pengajar";
  if (r === "guru") return "Guru";
  return role || "Pengguna";
}

function roleBadgeClass(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "admin") return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
  if (r === "pengajar") return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  if (r === "guru") return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function formatDateTime(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function userName(user?: CommentUser): string {
  if (!user) return "Pengguna";
  return user.gelar ? `${user.nama ?? "Pengguna"}, ${user.gelar}` : user.nama ?? "Pengguna";
}

function userPhoto(user?: CommentUser): string {
  return user?.fotoProfil || user?.foto || user?.avatar || "";
}

function commentText(comment: DiscussionComment): string {
  return comment.komentar || comment.isi || comment.pesan || "";
}

function commentAuthor(comment: DiscussionComment): CommentUser | undefined {
  return comment.user || comment.author || comment.pengirim;
}

export default function AdminDiskusiPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDiskusiContent />
    </Suspense>
  );
}

function AdminDiskusiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get("courseId") || searchParams.get("course");
  // commentId dari notifikasi diskusi untuk scroll/highlight komentar terkait.
  const focusedCommentId = searchParams.get("commentId") || "";
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdFromUrl || "");
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [newCommentMentions, setNewCommentMentions] = useState<MentionSelection[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyMentions, setReplyMentions] = useState<MentionSelection[]>([]);
  const [postingReply, setPostingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Muat daftar Course (sumber data existing untuk Admin).
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "admin") {
      router.push(currentUser.role === "pengajar" ? "/pengajar" : "/dashboard");
      return;
    }

    async function fetchCourses() {
      try {
        const data = await getCourses();
        const list = (data as CourseItem[]) ?? [];
        setCourses(list);
        if (list.length > 0 && !courseIdFromUrl) setSelectedCourseId(list[0].id);
      } catch (err) {
        setCommentsError(err instanceof Error ? err.message : "Gagal memuat daftar course.");
      } finally {
        setCoursesLoading(false);
      }
    }
    fetchCourses();
  }, [courseIdFromUrl, router]);

  // Muat diskusi Course-level. Response BE sudah nested via `replies[]`.
  const loadDiscussion = useCallback(async (courseId: string) => {
    setCommentsLoading(true);
    setCommentsError("");
    try {
      const data = await getCourseComments(courseId);
      setComments(Array.isArray(data) ? (data as DiscussionComment[]) : []);
    } catch (err) {
      setCommentsError(err instanceof Error ? err.message : "Gagal memuat diskusi course.");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    let active = true;
    async function fetchDiscussion() {
      setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await getCourseComments(selectedCourseId);
        if (!active) return;
        setComments(Array.isArray(data) ? (data as DiscussionComment[]) : []);
      } catch (err) {
        if (!active) return;
        setCommentsError(err instanceof Error ? err.message : "Gagal memuat diskusi course.");
      } finally {
        if (active) setCommentsLoading(false);
      }
    }
    fetchDiscussion();
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  // Buka/scroll ke komentar terkait saat datang dari notifikasi (?commentId=).
  // Retry singkat karena komentar bisa muncul setelah bagian awal dimuat.
  const [highlightCommentId, setHighlightCommentId] = useState("");
  useEffect(() => {
    if (!focusedCommentId || commentsLoading || commentsError) return;

    let rafId = 0;
    let attempts = 0;
    let highlightTimer: ReturnType<typeof setTimeout> | undefined;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`comment-${focusedCommentId}`);
      if (!el) {
        if (attempts++ < 30) {
          rafId = requestAnimationFrame(tryScroll);
        }
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // setState dijadwalkan (bukan sinkron di body effect) untuk highlight sementara.
      highlightTimer = setTimeout(() => setHighlightCommentId(focusedCommentId), 0);
      clearTimer = setTimeout(() => setHighlightCommentId(""), 2500);
    };

    rafId = requestAnimationFrame(tryScroll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (highlightTimer) clearTimeout(highlightTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [focusedCommentId, commentsLoading, commentsError, comments]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !selectedCourseId) return;
    try {
      setPosting(true);
      setPostError("");
      await postComment({
        courseId: selectedCourseId,
        komentar: newComment.trim(),
        mentionedUserIds: newCommentMentions.map((m) => m.id),
      });
      setNewComment("");
      setNewCommentMentions([]);
      await loadDiscussion(selectedCourseId);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Gagal mengirim komentar.");
    } finally {
      setPosting(false);
    }
  }

  async function handleReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyText.trim() || !selectedCourseId) return;
    try {
      setPostingReply(true);
      setReplyError("");
      await postComment({
        courseId: selectedCourseId,
        parentId,
        komentar: replyText.trim(),
        mentionedUserIds: replyMentions.map((m) => m.id),
      });
      setReplyText("");
      setReplyMentions([]);
      setReplyToId(null);
      await loadDiscussion(selectedCourseId);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setPostingReply(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return;

    try {
      setDeletingId(id);
      await deleteComment(id);
      if (selectedCourseId) await loadDiscussion(selectedCourseId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus komentar.");
    } finally {
      setDeletingId(null);
    }
  }

  function startReply(commentId: string) {
    setReplyToId(commentId);
    setReplyText("");
    setReplyMentions([]);
    setReplyError("");
  }

  function cancelReply() {
    setReplyToId(null);
    setReplyText("");
    setReplyMentions([]);
    setReplyError("");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)] dark:text-slate-100">
          Moderasi Diskusi Course
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Pantau, ikuti diskusi, dan kelola komentar pada seluruh course.</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm sm:p-6 dark:bg-slate-900">
        <label htmlFor="course-select" className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
          Pilih Course
        </label>
        {coursesLoading ? (
          <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800" />
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Belum ada course tersedia.</p>
        ) : (
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              cancelReply();
            }}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-navy)]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.judul}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Utas Diskusi Course */}
      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm sm:p-6 space-y-5 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--color-navy)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
            </svg>
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)] dark:text-slate-100">Utas Diskusi</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full dark:bg-slate-800 dark:text-slate-400">
            {comments.length} diskusi
          </span>
        </div>

        {/* Composer komentar baru — di ATAS thread */}
        {selectedCourseId && (
          <form onSubmit={handlePost} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/60">
            <label htmlFor="new-comment" className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
              Tulis Komentar
            </label>
            {postError && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">{postError}</p>}
            <MentionTextarea
              id="new-comment"
              value={newComment}
              onChange={setNewComment}
              onMentionsChange={setNewCommentMentions}
              rows={3}
              placeholder="Bagikan tanggapan, arahan, atau jawaban untuk course ini... Ketik @ untuk menyebut pengguna"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-navy)]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="rounded-xl bg-[var(--color-navy)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {posting ? "Mengirim..." : "Kirim Komentar"}
              </button>
            </div>
          </form>
        )}

        {/* Daftar diskusi (nested) — langsung setelah composer */}
        {commentsLoading ? (
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 text-center text-sm text-gray-500 dark:bg-slate-900 dark:text-slate-400">
            Memuat diskusi...
          </div>
        ) : commentsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{commentsError}</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            Belum ada diskusi pada course ini.
          </div>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => {
              const cUser = commentAuthor(c);
              const foto = userPhoto(cUser);
              const nama = userName(cUser);
              const isDeleting = deletingId === c.id;
              const replies = Array.isArray(c.replies) ? c.replies : [];

              return (
                <li key={c.id} id={`comment-${c.id}`} className={`scroll-mt-24 rounded-2xl border bg-white p-4 shadow-sm transition dark:bg-slate-900 ${isDeleting ? "opacity-50" : ""} ${highlightCommentId === c.id ? "border-emerald-400 ring-2 ring-emerald-300" : "border-[var(--color-border-soft)]"}`}>
                  {/* Root comment */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {foto ? (
                        <Image
                          src={foto}
                          alt={nama}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-sm font-bold uppercase text-white">
                          {(cUser?.nama ?? "U").charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--color-navy)] dark:text-slate-100">{nama}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(cUser?.role)}`}>
                            {roleLabel(cUser?.role)}
                          </span>
                          {c.createdAt && <span className="text-[11px] text-gray-400 dark:text-slate-500">{formatDateTime(c.createdAt)}</span>}
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{renderCommentText(commentText(c), "font-semibold text-[var(--color-navy)] dark:text-slate-100")}</p>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => (replyToId === c.id ? cancelReply() : startReply(c.id))}
                            className="text-xs font-semibold text-[var(--color-navy)] hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-400"
                          >
                            {replyToId === c.id ? "Batal" : "Balas"}
                          </button>
                        </div>

                        {/* Reply form */}
                        {replyToId === c.id && (
                          <form
                            onSubmit={(e) => handleReply(e, c.id)}
                            className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800"
                          >
                            {replyError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">{replyError}</p>}
                            <MentionTextarea
                              value={replyText}
                              onChange={setReplyText}
                              onMentionsChange={setReplyMentions}
                              rows={2}
                              placeholder="Tulis balasan... Ketik @ untuk menyebut pengguna"
                              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-navy)]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={postingReply || !replyText.trim()}
                                className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                              >
                                {postingReply ? "Mengirim..." : "Kirim Balasan"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isDeleting}
                      className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-rose-950/30"
                      title="Hapus komentar"
                      aria-label="Hapus komentar"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Nested replies (struktur langsung dari BE) */}
                  {replies.length > 0 && (
                    <ul className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
                      {replies.map((reply) => {
                        const rUser = commentAuthor(reply);
                        const rfoto = userPhoto(rUser);
                        const rnama = userName(rUser);
                        const isReplyDeleting = deletingId === reply.id;

                        return (
                          <li key={reply.id} id={`comment-${reply.id}`} className={`scroll-mt-24 rounded-xl p-3 transition ${isReplyDeleting ? "opacity-50" : ""} ${highlightCommentId === reply.id ? "bg-emerald-50 ring-2 ring-emerald-300 dark:bg-emerald-950/30" : "bg-slate-50 dark:bg-slate-800/60"}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                {rfoto ? (
                                  <Image
                                    src={rfoto}
                                    alt={rnama}
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                  />
                                ) : (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-500 text-xs font-bold uppercase text-white">
                                    {(rUser?.nama ?? "U").charAt(0)}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{rnama}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(rUser?.role)}`}>
                                      {roleLabel(rUser?.role)}
                                    </span>
                                    {reply.createdAt && <span className="text-[11px] text-gray-400 dark:text-slate-500">{formatDateTime(reply.createdAt)}</span>}
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">{renderCommentText(commentText(reply), "font-semibold text-[var(--color-navy)] dark:text-slate-100")}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(reply.id)}
                                disabled={isReplyDeleting}
                                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-rose-950/30"
                                title="Hapus balasan"
                                aria-label="Hapus balasan"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
