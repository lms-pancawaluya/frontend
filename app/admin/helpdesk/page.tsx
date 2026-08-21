"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAllTickets,
  getTicketDetail,
  replyToTicket,
  updateTicketStatus,
} from "@/services/helpdesk.service";

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
  user?: {
    nama?: string;
    email?: string;
    sekolah?: string;
  };
}

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
  replies?: Reply[];
}

// --- Helper render defensif (sejajar dengan konvensi halaman daftar tiket) ---

function getTicketNumber(t: Ticket): string {
  const raw = t.ticketNumber ?? t.nomor ?? t.number ?? t.kode ?? t.id;
  if (raw === undefined || raw === null || raw === "") return "-";
  const str = String(raw);
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

// Badge status mengikuti konvensi warna admin repo
function getStatusBadge(status?: string): { label: string; className: string } {
  const s = String(status || "").toLowerCase();

  if (s === "open" || s === "terbuka" || s === "baru" || s === "new") {
    return { label: "Open", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }
  if (s === "in_progress" || s === "proses" || s === "diproses" || s === "pending") {
    return { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  if (s === "resolved" || s === "selesai") {
    return { label: "Resolved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  if (s === "closed" || s === "tutup") {
    return { label: "Closed", className: "bg-slate-100 text-slate-800 border-slate-200" };
  }
  return {
    label: status || "Tidak diketahui",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };
}

function getSenderRoleLabel(role?: string): string {
  const r = String(role || "").toLowerCase();
  if (r === "guru") return "Guru";
  if (r === "admin") return "Admin";
  if (r === "pengajar") return "Pengajar";
  return role || "Peserta";
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function AdminHelpdeskPage() {
  const router = useRouter();

  // State utama list tiket
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // State Filter (server-side)
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // State modal detail
  const [detailTicketId, setDetailTicketId] = useState<string | null>(null);
  const [detailTicket, setDetailTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Role guard
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
    }
  }, [router]);

  // Fetch list tiket berdasarkan filter
  useEffect(() => {
    let active = true;

    async function fetchTickets() {
      try {
        setLoading(true);
        setError("");
        const filters: { status?: string; category?: string } = {};
        if (filterStatus) filters.status = filterStatus;
        if (filterCategory) filters.category = filterCategory;

        const data = await getAllTickets(filters);
        if (!active) return;
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat tiket.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTickets();
    return () => {
      active = false;
    };
  }, [refreshKey, filterStatus, filterCategory]);

  // Fetch detail tiket
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

  // Scroll ke bawah saat replies berubah
  useEffect(() => {
    if (detailTicket?.replies && conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detailTicket?.replies]);

  function handleOpenDetailModal(ticketId: string) {
    setDetailTicketId(ticketId);
    setDetailTicket(null);
    setDetailError("");
    setReplyMessage("");
    setReplyError("");
    setStatusUpdateError("");
    fetchTicketDetail(ticketId);
  }

  function handleCloseDetailModal() {
    if (replySending || statusUpdating) return;
    setDetailTicketId(null);
    setDetailTicket(null);
  }

  // Kirim balasan
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

      // Setelah membalas, refresh detail tiket untuk mendapatkan
      // percakapan terbaru & status ter-update otomatis oleh BE (open -> in_progress)
      await fetchTicketDetail(detailTicketId);
      // Refresh list utama agar status ter-update di tabel
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
    } finally {
      setReplySending(false);
    }
  }

  // Update Status
  async function handleStatusChange(newStatus: string) {
    if (!detailTicketId) return;
    try {
      setStatusUpdating(true);
      setStatusUpdateError("");
      await updateTicketStatus(detailTicketId, newStatus);
      setSuccessMsg(`Status tiket berhasil diubah menjadi ${newStatus}`);

      // Refresh data
      await fetchTicketDetail(detailTicketId);
      setRefreshKey((k) => k + 1);

      // Auto dismiss message
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : "Gagal memperbarui status tiket.");
    } finally {
      setStatusUpdating(false);
    }
  }

  const detailReplies = detailTicket?.replies || [];
  const detailCategory = detailTicket ? getCategory(detailTicket) : "";
  const detailBadge = detailTicket ? getStatusBadge(detailTicket.status) : null;
  const detailDescription = detailTicket ? getDescription(detailTicket) : "";
  const isClosedOrResolved =
    detailTicket?.status === "resolved" ||
    detailTicket?.status === "selesai" ||
    detailTicket?.status === "closed" ||
    detailTicket?.status === "tutup";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
            Manajemen Layanan
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mt-2">
            Kelola Tiket Bantuan (Helpdesk)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pantau kendala teknis dari Guru, berikan jawaban/balasan, dan perbarui status tiket.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="filter-status" className="text-xs font-bold text-slate-600">
            Filter Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          >
            <option value="">Semua Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="filter-category" className="text-xs font-bold text-slate-600">
            Filter Kategori
          </label>
          <input
            id="filter-category"
            type="text"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="mis. Materi & Video, Akun, Evaluasi"
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          />
        </div>

        {(filterStatus || filterCategory) && (
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterCategory("");
            }}
            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 shrink-0 w-full sm:w-auto"
          >
            Bersihkan Filter
          </button>
        )}
      </div>

      {/* NOTIFIKASI SUKSES */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-2xl border border-emerald-200 animate-fade-in flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* TABEL DATA TIKET */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-20">
            <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Memuat daftar tiket...
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-3">
            <p className="alert-error inline-block">{error}</p>
            <div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <svg className="w-12 h-12 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4M4 13h4m1.5-4h.01M12 9h.01M15.5 9h.01" />
            </svg>
            <p className="text-slate-600 text-sm font-semibold">Tidak ada tiket ditemukan.</p>
            <p className="text-slate-400 text-xs">Coba sesuaikan status atau kategori filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">No. Tiket</th>
                  <th className="py-4 px-6">Pengirim</th>
                  <th className="py-4 px-6">Subjek & Kategori</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Tanggal Dibuat</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {tickets.map((t) => {
                  const badge = getStatusBadge(t.status);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">
                        {getTicketNumber(t)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{t.user?.nama || "-"}</div>
                        <div className="text-xs text-slate-400">{t.user?.email || ""}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 leading-snug">{getSubject(t)}</div>
                        <div className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md mt-1">
                          {getCategory(t)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {getCreatedDate(t)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenDetailModal(t.id!)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-2 rounded-xl transition-all"
                        >
                          Tinjau Tiket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL DETAIL TIKET (ADMIN) ================= */}
      {detailTicketId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseDetailModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Peninjauan Detail Tiket</h2>
                {detailTicket && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID Tiket: {getTicketNumber(detailTicket)}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseDetailModal}
                disabled={replySending || statusUpdating}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-20">
                  <svg className="w-5 h-5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memuat detail tiket...
                </div>
              ) : detailError ? (
                <div className="text-center py-10 space-y-3">
                  <p className="alert-error inline-block">{detailError}</p>
                  <div>
                    <button
                      onClick={() => fetchTicketDetail(detailTicketId)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Coba lagi
                    </button>
                  </div>
                </div>
              ) : !detailTicket ? (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-sm font-semibold">Tiket tidak ditemukan.</p>
                </div>
              ) : (
                <>
                  {/* Grid layout: Info Tiket vs Update Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Detail Informasi */}
                    <div className="md:col-span-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                          KATEGORI: {detailCategory}
                        </span>
                        {detailBadge && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${detailBadge.className}`}>
                            {detailBadge.label}
                          </span>
                        )}
                        {detailTicket.createdAt && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Dibuat: {formatDateTime(detailTicket.createdAt || detailTicket.created_at)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {getSubject(detailTicket)}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words border-t border-slate-200/40 pt-2.5">
                        {detailDescription}
                      </p>
                    </div>

                    {/* Requester Info & Status Controller */}
                    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                      {/* Requester Info */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pengirim</h4>
                        <p className="text-sm font-bold text-slate-900 mt-1">{detailTicket.user?.nama || "-"}</p>
                        <p className="text-xs text-slate-400">{detailTicket.user?.email || ""}</p>
                        {detailTicket.user?.sekolah && (
                          <p className="text-xs text-slate-500 mt-0.5 italic">Asal: {detailTicket.user.sekolah}</p>
                        )}
                      </div>

                      {/* Status Selector */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label htmlFor="update-status" className="text-xs font-bold text-slate-600 block">
                          Ubah Status Tiket
                        </label>
                        {statusUpdateError && <p className="text-xs text-red-500 leading-snug">{statusUpdateError}</p>}
                        <select
                          id="update-status"
                          disabled={statusUpdating}
                          value={detailTicket.status || "open"}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-semibold"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Percakapan */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">Percakapan / Balasan</h3>
                    {detailReplies.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/40 rounded-2xl border border-slate-100">
                        <p className="text-slate-400 text-xs">Belum ada percakapan pada tiket ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {detailReplies.map((r, idx) => {
                          const isGuru = String(r.sender?.role || "").toLowerCase() === "guru";
                          return (
                            <div key={r.id || idx} className={`flex ${isGuru ? "justify-start" : "justify-end"}`}>
                              <div
                                className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
                                  isGuru
                                    ? "bg-white border-slate-200/85"
                                    : "bg-emerald-50 border-emerald-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800">
                                    {r.sender?.nama || "Pengguna"}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
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

                  {/* Input Form Balasan */}
                  {isClosedOrResolved ? (
                    <div className="text-center py-3 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-100">
                      Tiket telah ditutup/diselesaikan. Buka kembali tiket jika ingin mengirim balasan.
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="space-y-3 border-t border-slate-100 pt-4">
                      <label htmlFor="reply-message" className="text-xs font-bold text-slate-600 block">
                        Tulis Balasan Tanggapan
                      </label>
                      {replyError && <p className="alert-error">{replyError}</p>}
                      <textarea
                        id="reply-message"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        placeholder="Ketik pesan balasan penyelesaian kendala di sini..."
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-y"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replySending}
                          className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-60 cursor-pointer"
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
