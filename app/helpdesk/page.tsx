"use client";

import { useEffect, useState, useRef } from "react";
import {
  getMyTickets,
  createTicket,
  getTicketDetail,
  replyToTicket,
} from "@/services/helpdesk.service";

// Bentuk tiket dari backend belum dikonfirmasi sepenuhnya, jadi seluruh
// field bersifat opsional dan dirender secara defensif (pola fallback nama
// field sudah dipakai di repo, mis. app/modules/[id]/evaluations/...).
interface Ticket {
  id?: string;
  ticketNumber?: string | number;
  nomor?: string | number;
  number?: string | number;
  kode?: string;
  subject?: string;
  subjek?: string;
  judul?: string;
  category?: string;
  kategori?: string;
  status?: string;
  description?: string;
  deskripsi?: string;
  createdAt?: string;
  created_at?: string;
  createdDate?: string;
  tanggal?: string;
}

// Bentuk balasan sesuai kontrak backend; sebagian field dirender defensif.
interface Reply {
  id?: string;
  message?: string;
  pesan?: string;
  createdAt?: string;
  created_at?: string;
  sender?: {
    id?: string;
    nama?: string;
    role?: string;
  };
}

interface TicketDetail extends Ticket {
  user?: {
    nama?: string;
    email?: string;
  };
  replies?: Reply[];
}

// --- Helper render defensif ---

function getTicketNumber(t: Ticket): string {
  const raw = t.ticketNumber ?? t.nomor ?? t.number ?? t.kode ?? t.id;
  if (raw === undefined || raw === null || raw === "") return "-";
  const str = String(raw);
  // Kalau berupa UUID panjang, tampilkan potongan pendek agar rapi.
  return str.length > 12 ? `#${str.slice(0, 8)}` : `#${str}`;
}

function getSubject(t: Ticket): string {
  return t.subject || t.subjek || t.judul || "(Tanpa subjek)";
}

function getCategory(t: Ticket): string {
  return t.category || t.kategori || "-";
}

function getDescription(t: Ticket): string {
  return t.description || t.deskripsi || "";
}

function getCreatedDate(t: Ticket): string {
  const raw = t.createdAt || t.created_at || t.createdDate || t.tanggal;
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(raw?: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Badge status mengikuti konvensi warna repo (aktif/selesai=hijau,
// proses=amber, tutup=abu). Nilai status tiket belum dikonfirmasi backend,
// jadi pemetaan bersifat toleran dengan default netral.
function getStatusBadge(status?: string): { label: string; className: string } {
  const s = String(status || "").toLowerCase();

  if (["open", "terbuka", "baru", "new"].some((k) => s.includes(k))) {
    return { label: status || "Terbuka", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }
  if (
    ["progress", "proses", "diproses", "pending", "menunggu"].some((k) => s.includes(k))
  ) {
    return { label: status || "Diproses", className: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (["resolved", "selesai", "closed", "tutup", "done"].some((k) => s.includes(k))) {
    return { label: status || "Selesai", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  return {
    label: status || "Tidak diketahui",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };
}

function getSenderRoleLabel(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "guru") return "Guru";
  if (r === "admin") return "Admin";
  if (r === "pengajar") return "Pengajar";
  return role || "Peserta";
}

/**
 * Cek apakah tiket berstatus resolved/closed (guru tidak boleh membalas).
 */
function isTicketClosed(status?: string): boolean {
  const s = String(status || "").toLowerCase();
  return ["resolved", "selesai", "closed", "tutup", "done"].some((k) => s.includes(k));
}

/**
 * Batas 2 pesan berturut-turut dari guru sebelum admin/pengajar membalas.
 * ponytail: frontend-only enforcement — upgrade ketika BE mengonfirmasi server-side.
 */
const GURU_CONSECUTIVE_LIMIT = 2;

function isGuruReplyBlocked(replies: Reply[]): boolean {
  if (replies.length === 0) return false;
  let consecutive = 0;
  // Hitung dari pesan terakhir ke belakang.
  for (let i = replies.length - 1; i >= 0; i--) {
    const role = String(replies[i].sender?.role || "").toLowerCase();
    if (role === "guru") {
      consecutive++;
      if (consecutive >= GURU_CONSECUTIVE_LIMIT) return true;
    } else {
      break; // pesan non-guru ditemukan, hentikan hitungan
    }
  }
  return false;
}

// Konten Quick Tutorial (statis, tanpa API). Penjelasan singkat untuk guru.
const TUTORIAL_ITEMS: { title: string; body: string }[] = [
  {
    title: "Cara membuat tiket",
    body: "Klik tombol \"Buat Tiket\" di bagian atas halaman. Isi Subjek (ringkasan singkat kendala), Kategori, dan Deskripsi selengkap mungkin, lalu klik \"Kirim Tiket\". Tiket yang berhasil dibuat langsung muncul di daftar tiket Anda.",
  },
  {
    title: "Cara melihat dan membalas tiket",
    body: "Klik salah satu tiket pada daftar untuk membuka detail tiket. Di dalam pop-up, Anda dapat melihat informasi tiket, membaca percakapan, dan mengirim balasan. Anda dapat mengirim maksimal 2 pesan berturut-turut — setelah itu, tunggu balasan dari admin/pengajar sebelum mengirim pesan berikutnya.",
  },
  {
    title: "Arti status tiket",
    body: "Open (biru): tiket baru diterima dan belum diproses. In Progress (kuning): tiket sedang ditangani oleh tim/fasilitator. Resolved (hijau): kendala sudah ditangani. Closed (hijau): tiket ditutup. Status di luar itu ditampilkan netral (abu-abu). Guru tidak dapat mengubah status tiket.",
  },
  {
    title: "Kapan sebaiknya membuat tiket",
    body: "Buatlah tiket bila Anda mengalami kendala teknis yang tidak dapat diselesaikan sendiri — misalnya video atau materi tidak terbuka, error saat mengerjakan evaluasi, atau masalah pada akun. Untuk masukan atau saran umum terhadap modul, gunakan fitur Saran & Kritik, bukan tiket bantuan.",
  },
];

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // State modal buat tiket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State modal detail tiket
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Quick Tutorial: indeks item yang sedang terbuka (bisa lebih dari satu).
  const [openTutorials, setOpenTutorials] = useState<number[]>([]);

  function toggleTutorial(index: number) {
    setOpenTutorials((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  // ---------- Fetch daftar tiket ----------

  useEffect(() => {
    let active = true;

    async function fetchTickets() {
      try {
        setLoading(true);
        setError("");
        const data = await getMyTickets();
        if (!active) return;
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat daftar tiket.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTickets();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // ---------- Modal Buat Tiket ----------

  function handleOpenCreateModal() {
    setSubject("");
    setCategory("");
    setDescription("");
    setFormError("");
    setShowCreateModal(true);
  }

  function handleCloseCreateModal() {
    if (submitting) return;
    setShowCreateModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !category.trim() || !description.trim()) {
      setFormError("Subjek, kategori, dan deskripsi wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      await createTicket({
        subject: subject.trim(),
        category: category.trim(),
        description: description.trim(),
      });
      setShowCreateModal(false);
      setSuccessMsg("Tiket berhasil dibuat.");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat tiket.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Modal Detail Tiket ----------

  async function fetchTicketDetail(ticketId: string) {
    try {
      setDetailLoading(true);
      setDetailError("");
      const data = await getTicketDetail(ticketId);
      setDetailTicket((data || null) as TicketDetail | null);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Gagal memuat detail tiket.");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleOpenDetailModal(ticketId: string) {
    setDetailTicketId(ticketId);
    setDetailTicket(null);
    setDetailError("");
    setReplyMessage("");
    setReplyError("");
    fetchTicketDetail(ticketId);
  }

  function handleCloseDetailModal() {
    if (replySending) return;
    setDetailTicketId(null);
    setDetailTicket(null);
  }

  // Scroll ke bawah percakapan saat replies berubah.
  useEffect(() => {
    if (detailTicket?.replies && conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detailTicket?.replies]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) {
      setReplyError("Pesan balasan tidak boleh kosong.");
      return;
    }
    if (!detailTicketId) return;

    try {
      setReplySending(true);
      setReplyError("");
      await replyToTicket(detailTicketId, replyMessage.trim());
      setReplyMessage("");
      // Perbarui percakapan tanpa reload halaman.
      await fetchTicketDetail(detailTicketId);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setReplySending(false);
    }
  }

  // Derived state detail modal
  const detailReplies = detailTicket?.replies || [];
  const detailCategory = detailTicket ? getCategory(detailTicket) : "";
  const detailBadge = detailTicket ? getStatusBadge(detailTicket.status) : null;
  const detailDescription = detailTicket ? getDescription(detailTicket) : "";
  const ticketIsClosed = detailTicket ? isTicketClosed(detailTicket.status) : false;
  const guruBlocked = isGuruReplyBlocked(detailReplies);

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-8 relative overflow-hidden">
      {/* ================= BACKGROUND DEKORATIF DISDIK JABAR ================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#419AD6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* BANNER HEADER */}
        <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-amber-300 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Pusat Bantuan Guru
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Bantuan / Tiket</h1>
              <p className="text-slate-100 text-xs sm:text-sm leading-relaxed opacity-90">
                Ajukan kendala teknis atau pertanyaan seputar pembelajaran. Pantau status tiket yang
                telah Anda buat di bawah ini.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F3BF10] hover:bg-amber-400 text-[#0047A5] text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg hover:shadow-amber-400/20 transition-all duration-200 self-start shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Tiket</span>
            </button>
          </div>
        </div>

        {/* Pesan sukses */}
        {successMsg && (
          <div className="flex items-center justify-between gap-3 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200 animate-fade-in">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </span>
            <button
              onClick={() => setSuccessMsg("")}
              className="text-emerald-500 hover:text-emerald-700"
              aria-label="Tutup notifikasi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* DAFTAR TIKET */}
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm bg-white rounded-3xl border border-slate-200/80 p-8 justify-center">
            <svg className="w-5 h-5 animate-spin text-[#109B51]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Memuat daftar tiket...
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 text-center">
            <p className="alert-error inline-block">{error}</p>
            <div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-xs font-semibold text-[#0047A5] hover:text-[#109B51] transition-colors"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm font-semibold">Belum ada tiket.</p>
            <p className="text-slate-400 text-xs">
              Klik <span className="font-semibold text-slate-500">Buat Tiket</span> untuk mengajukan
              bantuan pertama Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t, idx) => {
              const badge = getStatusBadge(t.status);
              const rowInner = (
                <>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getTicketNumber(t)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#0047A5] bg-[#419AD6]/10 border border-[#419AD6]/20 px-2 py-0.5 rounded-md">
                        {getCategory(t)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                      {getSubject(t)}
                    </h3>
                    <p className="text-xs text-slate-400">Dibuat {getCreatedDate(t)}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {t.id && (
                      <svg
                        className="w-4 h-4 text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </>
              );

              const rowClass =
                "bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200";

              return t.id ? (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleOpenDetailModal(t.id!)}
                  className={`${rowClass} hover:border-[#419AD6]/60 hover:shadow-md w-full text-left cursor-pointer`}
                >
                  {rowInner}
                </button>
              ) : (
                <div key={idx} className={`${rowClass} hover:border-slate-300`}>
                  {rowInner}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= QUICK TUTORIAL (statis) ================= */}
        <section aria-labelledby="tutorial-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 id="tutorial-heading" className="text-sm font-bold text-slate-700">
              Panduan Singkat
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {TUTORIAL_ITEMS.map((item, idx) => {
              const isOpen = openTutorials.includes(idx);
              const panelId = `tutorial-panel-${idx}`;
              const btnId = `tutorial-btn-${idx}`;
              return (
                <div key={idx}>
                  <h3>
                    <button
                      id={btnId}
                      type="button"
                      onClick={() => toggleTutorial(idx)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                      <svg
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="px-5 pb-4 -mt-1 text-xs text-slate-500 leading-relaxed"
                    >
                      {item.body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="text-center">
          <a
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-[#0047A5] transition-colors"
          >
            ← Kembali ke Dashboard
          </a>
        </div>
      </div>

      {/* ================= MODAL BUAT TIKET ================= */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseCreateModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Buat Tiket Baru</h2>
              <button
                onClick={handleCloseCreateModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <p className="alert-error">{formError}</p>}

              <div className="space-y-1.5">
                <label htmlFor="create-subject" className="text-xs font-semibold text-slate-600">
                  Subjek <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ringkasan singkat kendala Anda"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-category" className="text-xs font-semibold text-slate-600">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  id="create-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="mis. Materi & Video, Akun, Evaluasi"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-description" className="text-xs font-semibold text-slate-600">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="create-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Jelaskan kendala Anda selengkap mungkin..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all resize-y"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={submitting}
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 text-sm bg-[#109B51] hover:bg-[#0e8847] text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors duration-200 disabled:opacity-60"
                >
                  {submitting ? "Mengirim..." : "Kirim Tiket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL TIKET ================= */}
      {detailTicketId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseDetailModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Detail Tiket</h2>
              <button
                onClick={handleCloseDetailModal}
                disabled={replySending}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-12">
                  <svg className="w-5 h-5 animate-spin text-[#109B51]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memuat detail tiket...
                </div>
              ) : detailError ? (
                <div className="text-center space-y-3 py-8">
                  <p className="alert-error inline-block">{detailError}</p>
                  <div>
                    <button
                      onClick={() => fetchTicketDetail(detailTicketId)}
                      className="text-xs font-semibold text-[#0047A5] hover:text-[#109B51] transition-colors"
                    >
                      Coba lagi
                    </button>
                  </div>
                </div>
              ) : !detailTicket ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 text-sm font-semibold">Tiket tidak ditemukan.</p>
                </div>
              ) : (
                <>
                  {/* Informasi Tiket (read-only) */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {getTicketNumber(detailTicket)}
                        </span>
                        {detailCategory && detailCategory !== "-" && (
                          <span className="text-[11px] font-semibold text-[#0047A5] bg-[#419AD6]/10 border border-[#419AD6]/20 px-2 py-0.5 rounded-md">
                            {detailCategory}
                          </span>
                        )}
                      </div>
                      {detailBadge && (
                        <span
                          className={`shrink-0 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${detailBadge.className}`}
                        >
                          {detailBadge.label}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {getSubject(detailTicket)}
                    </h3>

                    {detailDescription && (
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                        {detailDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {detailTicket.user?.nama && (
                        <span>Dibuat oleh {detailTicket.user.nama}</span>
                      )}
                      {(detailTicket.createdAt || detailTicket.created_at) && (
                        <span>• {formatDateTime(detailTicket.createdAt || detailTicket.created_at)}</span>
                      )}
                    </div>
                  </div>

                  {/* Percakapan */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">Percakapan</h3>

                    {detailReplies.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/60 rounded-2xl border border-slate-100">
                        <p className="text-slate-500 text-sm font-medium">Belum ada balasan pada tiket ini.</p>
                        <p className="text-slate-400 text-xs mt-1">
                          Tulis pesan di bawah untuk memulai percakapan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {detailReplies.map((r, idx) => {
                          const isGuru = String(r.sender?.role || "").toLowerCase() === "guru";
                          return (
                            <div
                              key={r.id || idx}
                              className={`flex ${isGuru ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
                                  isGuru
                                    ? "bg-[#419AD6]/10 border-[#419AD6]/30"
                                    : "bg-white border-slate-200/80"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800">
                                    {r.sender?.nama || "Pengguna"}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                      isGuru
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {getSenderRoleLabel(r.sender?.role)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                  {r.message || r.pesan || ""}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                  {formatDateTime(r.createdAt || r.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={conversationEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Form Balasan */}
                  {ticketIsClosed ? (
                    <div className="text-center py-3 text-sm text-slate-400 font-medium bg-slate-50/60 rounded-2xl border border-slate-100">
                      Tiket sudah ditutup. Tidak dapat mengirim balasan.
                    </div>
                  ) : guruBlocked ? (
                    <div className="text-center py-3 text-sm text-amber-700 font-medium bg-amber-50 rounded-2xl border border-amber-200">
                      Anda sudah mengirim 2 pesan. Silakan tunggu balasan admin.
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="space-y-3">
                      <label htmlFor="detail-reply" className="text-xs font-semibold text-slate-600">
                        Tulis Balasan
                      </label>
                      {replyError && <p className="alert-error">{replyError}</p>}
                      <textarea
                        id="detail-reply"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        placeholder="Ketik pesan balasan Anda..."
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all resize-y"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replySending}
                          className="inline-flex items-center gap-2 text-sm bg-[#109B51] hover:bg-[#0e8847] text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors duration-200 disabled:opacity-60"
                        >
                          {replySending ? "Mengirim..." : "Kirim Balasan"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
