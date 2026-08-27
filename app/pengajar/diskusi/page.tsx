"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getModules } from "@/services/module.service";
import { getModuleComments, postComment } from "@/services/comment.service";

interface ModuleItem {
  id: string;
  judul: string;
  urutan?: number;
}

interface CommentUser {
  nama?: string;
  role?: string;
  gelar?: string;
  foto?: string;
  fotoProfil?: string;
  avatar?: string;
}

interface CommentItem {
  id: string;
  isi?: string;
  komentar?: string;
  createdAt?: string;
  user?: CommentUser;
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
  if (r === "admin") return "bg-purple-100 text-purple-700";
  if (r === "pengajar") return "bg-amber-100 text-amber-700";
  if (r === "guru") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function formatDateTime(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PengajarDiskusiPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [modulesLoading, setModulesLoading] = useState(true);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "pengajar") {
      router.push(currentUser.role === "admin" ? "/admin" : "/dashboard");
      return;
    }

    async function fetchModules() {
      try {
        const data = await getModules();
        const list = (data as ModuleItem[]) ?? [];
        setModules(list);
        if (list.length > 0) setSelectedModuleId(list[0].id);
      } finally {
        setModulesLoading(false);
      }
    }
    fetchModules();
  }, [router]);

  useEffect(() => {
    if (!selectedModuleId) return;
    let active = true;
    async function fetchComments() {
      setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await getModuleComments(selectedModuleId);
        if (!active) return;
        setComments(data as CommentItem[]);
      } catch (err) {
        if (!active) return;
        setCommentsError(err instanceof Error ? err.message : "Gagal memuat komentar.");
      } finally {
        if (active) setCommentsLoading(false);
      }
    }
    fetchComments();
    return () => {
      active = false;
    };
  }, [selectedModuleId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !selectedModuleId) return;
    try {
      setPosting(true);
      setPostError("");
      await postComment({ moduleId: selectedModuleId, isi: newComment.trim() });
      setNewComment("");
      const data = await getModuleComments(selectedModuleId);
      setComments(data as CommentItem[]);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Gagal mengirim komentar.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)]">
          Diskusi/Komentar Modul
        </h1>
        <p className="mt-1 text-sm text-gray-500">Ikuti diskusi pada modul dan berikan tanggapan untuk guru.</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm sm:p-6">
        <label htmlFor="module-select" className="mb-1.5 block text-xs font-bold text-slate-600">
          Pilih Modul
        </label>
        {modulesLoading ? (
          <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
        ) : modules.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada modul tersedia.</p>
        ) : (
          <select
            id="module-select"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-navy)]/15"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.judul}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Post a comment */}
      {selectedModuleId && (
        <form onSubmit={handlePost} className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm sm:p-6">
          <label htmlFor="new-comment" className="mb-1.5 block text-xs font-bold text-slate-600">
            Tulis Komentar
          </label>
          {postError && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{postError}</p>}
          <textarea
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Bagikan tanggapan atau arahan untuk modul ini..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--color-navy)]/15"
          />
          <div className="mt-3 flex justify-end">
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

      {/* Comments list */}
      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)]">Komentar</h2>
        {commentsLoading ? (
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Memuat komentar...
          </div>
        ) : commentsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{commentsError}</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Belum ada komentar pada modul ini.
          </div>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => {
              const foto = c.user?.foto || c.user?.fotoProfil || c.user?.avatar;
              const nama = c.user?.gelar ? `${c.user?.nama ?? "Pengguna"}, ${c.user.gelar}` : c.user?.nama ?? "Pengguna";
              return (
                <li key={c.id} className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    {foto ? (
                      <Image
                        src={foto}
                        alt={nama}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-navy)] text-sm font-bold uppercase text-white">
                        {(c.user?.nama ?? "U").charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--color-navy)]">{nama}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(c.user?.role)}`}>
                          {roleLabel(c.user?.role)}
                        </span>
                        {c.createdAt && <span className="text-[11px] text-gray-400">{formatDateTime(c.createdAt)}</span>}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.isi || c.komentar || ""}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
