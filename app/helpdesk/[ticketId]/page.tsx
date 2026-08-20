"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTicketDetail, replyToTicket } from "@/services/helpdesk.service";

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

interface TicketDetail {
  id?: string;
  ticketNumber?: string | number;
  nomor?: string | number;
  subject?: string;
  subjek?: string;
  judul?: string;
  category?: string;
  kategori?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  user?: {
    nama?: string;
    email?: string;
  };
  replies?: Reply[];
}

// --- Helper render defensif (sejajar dengan konvensi halaman daftar tiket) ---

function getTicketNumber(t: TicketDetail): string {
  const raw = t.ticketNumber ?? t.nomor ?? t.id;
  if (raw === undefined || raw === null || raw === "") return "-";
  return String(raw);
}

function getSubject(t: TicketDetail): string {
  return t.subject || t.subjek || t.judul || "(Tanpa subjek)";
}

function getCategory(t: TicketDetail): string {
  return t.category || t.kategori || "";
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

// Badge status mengikuti konvensi warna repo (sama dengan halaman daftar).
function getStatusBadge(status?: string): { label: string; className: string } {
  const s = String(status || "").toLowerCase();
  if (["open", "terbuka", "baru", "new"].some((k) => s.includes(k))) {
    return { label: status || "Terbuka", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }
  if (["progress", "proses", "diproses", "pending", "menunggu"].some((k) => s.includes(k))) {
    return { label: status || "Diproses", className: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (["resolved", "selesai", "closed", "tutup", "done"].some((k) => s.includes(k))) {
    return { label: status || "Selesai", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  return { label: status || "Tidak diketahui", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

function getSenderRoleLabel(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "guru") return "Guru";
  if (r === "admin") return "Admin";
  if (r === "pengajar") return "Pengajar";
  return role || "Peserta";
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");

  async function fetchDetail() {
    try {
      setLoading(true);
      setError("");
      const data = await getTicketDetail(ticketId);
      setTicket((data || null) as TicketDetail | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail tiket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ticketId) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getTicketDetail(ticketId);
        if (!active) return;
        setTicket((data || null) as TicketDetail | null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat detail tiket.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [ticketId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setReplyError("Pesan balasan tidak boleh kosong.");
      return;
    }

    try {
      setSending(true);
      setReplyError("");
      await replyToTicket(ticketId, message.trim());
      setMessage("");
      // Perbarui percakapan tanpa reload halaman (ambil ulang detail agar
      // status & balasan mengikuti keputusan backend).
      await fetchDetail();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setSending(false);
    }
  }

  const badge = ticket ? getStatusBadge(ticket.status) : null;
  const replies = ticket?.replies || [];
  const category = ticket ? getCategory(ticket) : "";

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 pt-8 relative overflow-hidden">
      {/* Background dekoratif Disdik Jabar (selaras halaman helpdesk) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0047A5]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#109B51]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back nav */}
        <Link
          href="/helpdesk"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0047A5] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Daftar Tiket
        </Link>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm bg-white rounded-3xl border border-slate-200/80 p-8 justify-center">
            <svg className="w-5 h-5 animate-spin text-[#109B51]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Memuat detail tiket...
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 text-center">
            <p className="alert-error inline-block">{error}</p>
            <div>
              <button
                onClick={fetchDetail}
                className="text-xs font-semibold text-[#0047A5] hover:text-[#109B51] transition-colors"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : !ticket ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-8">
            <p className="text-slate-600 text-sm font-semibold">Tiket tidak ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Header tiket */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {getTicketNumber(ticket)}
                    </span>
                    {category && (
                      <span className="text-[11px] font-semibold text-[#0047A5] bg-[#419AD6]/10 border border-[#419AD6]/20 px-2 py-0.5 rounded-md">
                        {category}
                      </span>
                    )}
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {getSubject(ticket)}
                  </h1>
                  {ticket.user?.nama && (
                    <p className="text-xs text-slate-400">
                      Dibuat oleh {ticket.user.nama}
                      {ticket.createdAt || ticket.created_at
                        ? ` • ${formatDateTime(ticket.createdAt || ticket.created_at)}`
                        : ""}
                    </p>
                  )}
                </div>

                {badge && (
                  <span
                    className={`shrink-0 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            </div>

            {/* Percakapan */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 px-1">Percakapan</h2>

              {replies.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-slate-200/80 p-6">
                  <p className="text-slate-500 text-sm font-medium">Belum ada balasan pada tiket ini.</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Tulis pesan di bawah untuk memulai percakapan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {replies.map((r, idx) => {
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
                </div>
              )}
            </div>

            {/* Form balasan */}
            <form
              onSubmit={handleReply}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3"
            >
              <label htmlFor="reply" className="text-xs font-semibold text-slate-600">
                Tulis Balasan
              </label>
              {replyError && <p className="alert-error">{replyError}</p>}
              <textarea
                id="reply"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Ketik pesan balasan Anda..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all resize-y"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 text-sm bg-[#109B51] hover:bg-[#0e8847] text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors duration-200 disabled:opacity-60"
                >
                  {sending ? "Mengirim..." : "Kirim Balasan"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
