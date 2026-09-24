"use client";

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getAllTickets,
  getTicketDetail,
  replyToTicket,
  updateTicketStatus,
  getTicketCategories,
} from "@/services/helpdesk.service";
import { getAllFeedbacks } from "@/services/evaluation.service";
import { getUsers } from "@/services/user.service";
import { useApp } from "@/app/context/AppContext";

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
    role?: string;
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

// --- Saran & Masukan (course-level feedback) ---

interface FeedbackItem {
  id?: string;
  saran?: string;
  /** Field utama contract baru. */
  masukan?: string;
  /** Field legacy (transisional) bila BE belum sepenuhnya migrasi. */
  kritik?: string;
  createdAt?: string;
  created_at?: string;
  createdDate?: string;
  tanggal?: string;
  user?: {
    id?: string;
    nama?: string;
    email?: string;
    role?: string;
    sekolah?: string;
    kotaKab?: string;
  };
  /** Relasi Course sesuai contract baru. */
  course?: {
    id?: string;
    judul?: string;
  };
  /** Relasi legacy (transisional). */
  module?: {
    id?: string;
    judul?: string;
  };
}

/** Info sekolah/kota per user (dari GET /api/users) untuk filter. */
interface UserSchoolInfo {
  id?: string;
  sekolah?: string;
  kotaKab?: string;
  role?: string;
}

function getFeedbackMasukan(fb: FeedbackItem): string {
  return fb.masukan ?? fb.kritik ?? "";
}

function getFeedbackCourseLabel(fb: FeedbackItem): string {
  return fb.course?.judul || fb.module?.judul || fb.course?.id || fb.module?.id || "—";
}

function getFeedbackCreatedRaw(fb: FeedbackItem): string | undefined {
  return fb.createdAt || fb.created_at || fb.createdDate || fb.tanggal;
}

// --- Helper render defensif (sejajar dengan konvensi halaman daftar tiket) ---

function getTicketNumber(t: Ticket): string {
  const raw = t.ticketNumber ?? t.nomor ?? t.number ?? t.kode ?? t.id;
  if (raw === undefined || raw === null || raw === "") return "-";
  const str = String(raw);
  return str.length > 12 ? `#${str.slice(0, 8)}` : `#${str}`;
}

function getSubject(t: Ticket, tr: (id: string, en: string) => string): string {
  return t.subject || t.subjek || t.judul || tr("(Tanpa subjek)", "(No subject)");
}

function getCategory(t: Ticket): string {
  return t.category || t.kategori || "-";
}

// Tiket yang dibuat oleh Pengajar dikenali dari requester role pada respons API
// (untuk dirinya sendiri atau atas nama guru sekolahnya). Defensif: jika BE belum
// mengirim role, fungsi mengembalikan false dan tiket dirender seperti biasa.
function isPengajarTicket(t: Ticket): boolean {
  return String(t.user?.role || "").toLowerCase() === "pengajar";
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
function getStatusBadge(status?: string, tr: (id: string, en: string) => string = (id) => id): { label: string; className: string } {
  const s = String(status || "").toLowerCase();

  if (s === "open" || s === "terbuka" || s === "baru" || s === "new") {
    return { label: "Open", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" };
  }
  if (s === "in_progress" || s === "proses" || s === "diproses" || s === "pending") {
    return { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" };
  }
  if (s === "resolved" || s === "selesai") {
    return { label: "Resolved", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" };
  }
  if (s === "closed" || s === "tutup") {
    return { label: "Closed", className: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" };
  }
  return {
    label: status || tr("Tidak diketahui", "Unknown"),
    className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
}

function getSenderRoleLabel(role?: string, tr: (id: string, en: string) => string = (id) => id): string {
  const r = String(role || "").toLowerCase();
  if (r === "guru") return tr("Guru", "Teacher");
  if (r === "admin") return "Admin";
  if (r === "pengajar") return tr("Pengajar", "Instructor");
  return role || tr("Peserta", "Participant");
}

function getStatusOptions(tr: (id: string, en: string) => string) {
  return [
    { value: "open", label: tr("Open", "Open") },
    { value: "in_progress", label: tr("In Progress", "In Progress") },
    { value: "resolved", label: tr("Resolved", "Resolved") },
    { value: "closed", label: tr("Closed", "Closed") },
  ];
}

export default function AdminHelpdeskPage() {
  const { t } = useApp();
  return (
    <Suspense fallback={<div>{t("Memuat...", "Loading...")}</div>}>
      <AdminHelpdeskContent />
    </Suspense>
  );
}

function AdminHelpdeskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useApp();

  // State utama list tiket
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab aktif: Tiket Bantuan | Saran & Masukan
  const [activeTab, setActiveTab] = useState<"tickets" | "feedback">("tickets");

  // State Saran & Masukan
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  // Peta userId -> { sekolah, kotaKab } dari GET /api/users (admin: global).
  const [userSchoolMap, setUserSchoolMap] = useState<Record<string, UserSchoolInfo>>({});
  const [filterKota, setFilterKota] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");

  // State Filter (server-side)
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Master kategori tiket dari BE (single source of truth, tanpa hardcode).
  const [ticketCategories, setTicketCategories] = useState<{ value: string; label: string }[]>([]);
  const [categoriesError, setCategoriesError] = useState("");

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
        setError(err instanceof Error ? err.message : t("Gagal memuat tiket.", "Failed to load tickets."));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTickets();
    return () => {
      active = false;
    };
  }, [refreshKey, filterStatus, filterCategory, t]);

  // Fetch master kategori tiket (dipakai filter kategori).
  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      try {
        setCategoriesError("");
        const data = await getTicketCategories();
        if (!active) return;
        setTicketCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        setCategoriesError(
          err instanceof Error ? err.message : t("Gagal memuat kategori tiket.", "Failed to load ticket categories.")
        );
      }
    }

    fetchCategories();
    return () => {
      active = false;
    };
  }, [t]);

  // Fetch Saran & Masukan + data sekolah/kota pengirim saat tab dibuka.
  // Admin bersifat global: GET /api/feedbacks & GET /api/users mengembalikan
  // data lintas sekolah (scope ditegakkan BE, bukan FE).
  useEffect(() => {
    if (activeTab !== "feedback") return;

    let active = true;

    async function fetchFeedbackData() {
      try {
        setFeedbackLoading(true);
        setFeedbackError("");

        const [feedbackData, usersData] = await Promise.all([
          getAllFeedbacks(),
          getUsers(),
        ]);
        if (!active) return;

        setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);

        const map: Record<string, UserSchoolInfo> = {};
        if (Array.isArray(usersData)) {
          usersData.forEach((u: UserSchoolInfo) => {
            if (u && u.id) map[String(u.id)] = u;
          });
        }
        setUserSchoolMap(map);
      } catch (err) {
        if (!active) return;
        setFeedbackError(err instanceof Error ? err.message : t("Gagal memuat saran & masukan.", "Failed to load suggestions & feedback."));
      } finally {
        if (active) setFeedbackLoading(false);
      }
    }

    fetchFeedbackData();
    return () => {
      active = false;
    };
  }, [activeTab, t]);

  // Nilai unik Kota/Sekolah dari data pengirim feedback (tanpa menebak BE).
  // Hanya ditawarkan bila memang tersedia dari GET /api/users.
  const feedbackSekolahOptions = Array.from(
    new Set(
      feedbacks
        .map((fb) => {
          const id = fb.user?.id ? String(fb.user.id) : "";
          return (id && userSchoolMap[id]?.sekolah) || fb.user?.sekolah || "";
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  const feedbackKotaOptions = Array.from(
    new Set(
      feedbacks
        .map((fb) => {
          const id = fb.user?.id ? String(fb.user.id) : "";
          return (id && userSchoolMap[id]?.kotaKab) || fb.user?.kotaKab || "";
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const id = fb.user?.id ? String(fb.user.id) : "";
    const sekolah = (id && userSchoolMap[id]?.sekolah) || fb.user?.sekolah || "";
    const kota = (id && userSchoolMap[id]?.kotaKab) || fb.user?.kotaKab || "";
    if (filterSekolah && sekolah !== filterSekolah) return false;
    if (filterKota && kota !== filterKota) return false;
    return true;
  });

  // Fetch detail tiket
  async function fetchTicketDetail(ticketId: string) {
    try {
      setDetailLoading(true);
      setDetailError("");
      const data = await getTicketDetail(ticketId);
      setDetailTicket((data || null) as TicketDetail | null);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : t("Gagal memuat detail tiket.", "Failed to load ticket detail."));
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

  const handleOpenDetailModal = useCallback((ticketId: string) => {
    setDetailTicketId(ticketId);
    setDetailTicket(null);
    setDetailError("");
    setReplyMessage("");
    setReplyError("");
    setStatusUpdateError("");
    fetchTicketDetail(ticketId);
  }, []);

  // Buka detail tiket dari URL parameter
  useEffect(() => {
    const ticketId = searchParams.get("ticketId") || searchParams.get("ticket");
    if (!ticketId) return;

    const timeoutId = window.setTimeout(() => handleOpenDetailModal(ticketId), 0);
    return () => window.clearTimeout(timeoutId);
  }, [handleOpenDetailModal, searchParams]);

  function handleCloseDetailModal() {
    if (replySending || statusUpdating) return;
    setDetailTicketId(null);
    setDetailTicket(null);
  }

  // Kirim balasan
  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) {
      setReplyError(t("Pesan balasan tidak boleh kosong.", "Reply message cannot be empty."));
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
      setReplyError(err instanceof Error ? err.message : t("Gagal mengirim balasan.", "Failed to send reply."));
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
      setSuccessMsg(t(`Status tiket berhasil diubah menjadi ${newStatus}`, `Ticket status changed successfully to ${newStatus}`));

      // Refresh data
      await fetchTicketDetail(detailTicketId);
      setRefreshKey((k) => k + 1);

      // Auto dismiss message
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : t("Gagal memperbarui status tiket.", "Failed to update ticket status."));
    } finally {
      setStatusUpdating(false);
    }
  }

  const detailReplies = detailTicket?.replies || [];
  const detailCategory = detailTicket ? getCategory(detailTicket) : "";
  const detailBadge = detailTicket ? getStatusBadge(detailTicket.status, t) : null;
  const detailDescription = detailTicket ? getDescription(detailTicket) : "";
  const isClosedOrResolved =
    detailTicket?.status === "resolved" ||
    detailTicket?.status === "selesai" ||
    detailTicket?.status === "closed" ||
    detailTicket?.status === "tutup";

  // Resolusi info pengirim Saran & Masukan (sekolah/kota) secara defensif.
  function resolveFeedbackSender(fb: FeedbackItem) {
    const id = fb.user?.id ? String(fb.user.id) : "";
    const info = id ? userSchoolMap[id] : undefined;
    return {
      nama: fb.user?.nama || "-",
      email: fb.user?.email || "",
      role: fb.user?.role || info?.role || "",
      sekolah: info?.sekolah || fb.user?.sekolah || "",
      kota: info?.kotaKab || fb.user?.kotaKab || "",
    };
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
            {t("Manajemen Layanan", "Service Management")}
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mt-2">
            {t("Kelola Tiket Bantuan (Helpdesk)", "Manage Helpdesk Tickets")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("Pantau kendala teknis dari Guru, berikan jawaban/balasan, dan perbarui status tiket.", "Monitor technical issues from Teachers, provide answers/replies, and update ticket status.")}{" "}
            {t("Tinjau juga Saran & Masukan lintas sekolah.", "Also review cross-school Suggestions & Feedback.")}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 shrink-0"
        >
          ← {t("Kembali ke Dashboard", "Back to Dashboard")}
        </Link>
      </div>

      {/* TAB NAVIGASI */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("tickets")}
          aria-pressed={activeTab === "tickets"}
          className={`px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition-colors ${
            activeTab === "tickets"
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {t("Tiket Bantuan", "Helpdesk Tickets")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("feedback")}
          aria-pressed={activeTab === "feedback"}
          className={`px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition-colors ${
            activeTab === "feedback"
              ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {t("Saran & Masukan", "Suggestions & Feedback")}
        </button>
      </div>

      {activeTab === "tickets" && (
        <>
      {/* FILTER PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row gap-4 items-end dark:bg-slate-900 dark:border-slate-800">
        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="filter-status" className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {t("Filter Status", "Filter Status")}
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
          >
            <option value="">{t("Semua Status", "All Status")}</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <label htmlFor="filter-category" className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {t("Filter Kategori", "Filter Category")}
          </label>
          <select
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            disabled={!!categoriesError}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all disabled:opacity-60 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
          >
            <option value="">{t("Semua Kategori", "All Categories")}</option>
            {ticketCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {categoriesError && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400">{categoriesError}</p>
          )}
        </div>

        {(filterStatus || filterCategory) && (
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterCategory("");
            }}
            className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 shrink-0 w-full sm:w-auto dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {t("Bersihkan Filter", "Clear Filter")}
          </button>
        )}
      </div>

      {/* NOTIFIKASI SUKSES */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-2xl border border-emerald-200 animate-fade-in flex items-center justify-between dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* TABEL DATA TIKET */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-20 dark:text-slate-400">
            <svg className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("Memuat daftar tiket...", "Loading ticket list...")}
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-3">
            <p className="alert-error inline-block">{error}</p>
            <div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {t("Coba lagi", "Try again")}
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <svg className="w-12 h-12 text-slate-300 mx-auto dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4M4 13h4m1.5-4h.01M12 9h.01M15.5 9h.01" />
            </svg>
            <p className="text-slate-600 text-sm font-semibold dark:text-slate-300">{t("Tidak ada tiket ditemukan.", "No tickets found.")}</p>
            <p className="text-slate-400 text-xs dark:text-slate-500">{t("Coba sesuaikan status atau kategori filter Anda.", "Try adjusting your status or category filter.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <th className="py-4 px-6">{t("No. Tiket", "Ticket No.")}</th>
                  <th className="py-4 px-6">{t("Pengirim", "Sender")}</th>
                  <th className="py-4 px-6">{t("Subjek & Kategori", "Subject & Category")}</th>
                  <th className="py-4 px-6">{t("Status", "Status")}</th>
                  <th className="py-4 px-6">{t("Tanggal Dibuat", "Created Date")}</th>
                  <th className="py-4 px-6 text-center">{t("Aksi", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm dark:divide-slate-800 dark:text-slate-300">
                {[...tickets]
                  .sort((a, b) => Number(isPengajarTicket(b)) - Number(isPengajarTicket(a)))
                  .map((tk) => {
                  const badge = getStatusBadge(tk.status, t);
                  const fromPengajar = isPengajarTicket(tk);
                  return (
                    <tr key={tk.id} className={`transition-colors ${fromPengajar ? "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"}`}>
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {getTicketNumber(tk)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{tk.user?.nama || "-"}</span>
                          {fromPengajar && (
                            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                              {t("Pengajar", "Instructor")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{tk.user?.email || ""}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 leading-snug dark:text-slate-100">{getSubject(tk, t)}</div>
                        <div className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md mt-1 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                          {getCategory(tk)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs dark:text-slate-400">
                        {getCreatedDate(tk)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenDetailModal(tk.id!)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-2 rounded-xl transition-all dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800"
                        >
                          {t("Tinjau Tiket", "Review Ticket")}
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
        </>
      )}

      {/* ================= SARAN & MASUKAN ================= */}
      {activeTab === "feedback" && (
        <>
          {/* FILTER SARAN & MASUKAN (Kota / Sekolah) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row gap-4 items-end dark:bg-slate-900 dark:border-slate-800">
            <div className="flex-1 space-y-1.5 w-full">
              <label htmlFor="feedback-filter-kota" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {t("Filter Kota", "Filter City")}
              </label>
              <select
                id="feedback-filter-kota"
                value={filterKota}
                onChange={(e) => setFilterKota(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
              >
                <option value="">{t("Semua Kota", "All Cities")}</option>
                {feedbackKotaOptions.map((kota) => (
                  <option key={kota} value={kota}>
                    {kota}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              <label htmlFor="feedback-filter-sekolah" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {t("Filter Sekolah", "Filter School")}
              </label>
              <select
                id="feedback-filter-sekolah"
                value={filterSekolah}
                onChange={(e) => setFilterSekolah(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
              >
                <option value="">{t("Semua Sekolah", "All Schools")}</option>
                {feedbackSekolahOptions.map((sekolah) => (
                  <option key={sekolah} value={sekolah}>
                    {sekolah}
                  </option>
                ))}
              </select>
            </div>

            {(filterKota || filterSekolah) && (
              <button
                onClick={() => {
                  setFilterKota("");
                  setFilterSekolah("");
                }}
                className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors h-10 px-4 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 shrink-0 w-full sm:w-auto dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {t("Bersihkan Filter", "Clear Filter")}
              </button>
            )}
          </div>

          {/* DAFTAR SARAN & MASUKAN */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            {feedbackLoading ? (
              <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-20 dark:text-slate-400">
                <svg className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("Memuat saran & masukan...", "Loading suggestions & feedback...")}
              </div>
            ) : feedbackError ? (
              <div className="text-center py-16 space-y-3">
                <p className="alert-error inline-block">{feedbackError}</p>
                <div>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {t("Ke Tiket Bantuan", "To Helpdesk Tickets")}
                  </button>
                </div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-20 space-y-2">
                <svg className="w-12 h-12 text-slate-300 mx-auto dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 8h10M7 12h6m-1 9l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2h-6l-4 4z" />
                </svg>
                <p className="text-slate-600 text-sm font-semibold dark:text-slate-300">
                  {feedbacks.length === 0
                    ? t("Belum ada saran & masukan.", "No suggestions & feedback yet.")
                    : t("Tidak ada saran & masukan sesuai filter.", "No suggestions & feedback matching the filter.")}
                </p>
                {feedbacks.length > 0 && (
                  <p className="text-slate-400 text-xs dark:text-slate-500">
                    {t("Coba sesuaikan filter Kota atau Sekolah.", "Try adjusting the City or School filter.")}
                  </p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFeedbacks.map((fb, idx) => {
                  const sender = resolveFeedbackSender(fb);
                  const createdAt = getFeedbackCreatedRaw(fb);
                  return (
                    <li key={fb.id ?? idx} className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{sender.nama}</span>
                            {sender.role && (
                              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {getSenderRoleLabel(sender.role, t)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">{sender.email}</div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 dark:text-slate-400">
                            <span>{t("Sekolah:", "School:")} {sender.sekolah || "—"}</span>
                            <span>{t("Kota:", "City:")} {sender.kota || "—"}</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 shrink-0 sm:text-right dark:text-slate-500">
                          <div className="font-semibold text-slate-500 dark:text-slate-400">
                            {t("Course:", "Course:")} {getFeedbackCourseLabel(fb)}
                          </div>
                          {createdAt && <div className="mt-0.5">{formatDateTime(createdAt)}</div>}
                        </div>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            {t("Masukan", "Feedback")}
                          </p>
                          <p className="mt-1 text-xs text-slate-700 whitespace-pre-line dark:text-slate-300">
                            {getFeedbackMasukan(fb) || "—"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            {t("Saran", "Suggestion")}
                          </p>
                          <p className="mt-1 text-xs text-slate-700 whitespace-pre-line dark:text-slate-300">
                            {fb.saran || "—"}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* ================= MODAL DETAIL TIKET (ADMIN) ================= */}
      {detailTicketId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseDetailModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t("Peninjauan Detail Tiket", "Ticket Detail Review")}</h2>
                {detailTicket && (
                  <p className="text-xs text-slate-400 mt-0.5 dark:text-slate-500">
                    {t("ID Tiket:", "Ticket ID:")} {getTicketNumber(detailTicket)}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseDetailModal}
                disabled={replySending || statusUpdating}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 dark:hover:text-slate-200"
                aria-label={t("Tutup", "Close")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center gap-3 text-slate-500 font-medium text-sm justify-center py-20 dark:text-slate-400">
                  <svg className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("Memuat detail tiket...", "Loading ticket detail...")}
                </div>
              ) : detailError ? (
                <div className="text-center py-10 space-y-3">
                  <p className="alert-error inline-block">{detailError}</p>
                  <div>
                    <button
                      onClick={() => fetchTicketDetail(detailTicketId)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      {t("Coba lagi", "Try again")}
                    </button>
                  </div>
                </div>
              ) : !detailTicket ? (
                <div className="text-center py-10">
                  <p className="text-slate-600 text-sm font-semibold dark:text-slate-300">{t("Tiket tidak ditemukan.", "Ticket not found.")}</p>
                </div>
              ) : (
                <>
                  {/* Grid layout: Info Tiket vs Update Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Detail Informasi */}
                    <div className="md:col-span-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3 dark:bg-slate-800/50 dark:border-slate-700">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">
                          {t("KATEGORI:", "CATEGORY:")} {detailCategory}
                        </span>
                        {detailBadge && (
                          <span className={`inline-block whitespace-nowrap text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${detailBadge.className}`}>
                            {detailBadge.label}
                          </span>
                        )}
                        {detailTicket.createdAt && (
                          <span className="text-[10px] text-slate-400 font-medium dark:text-slate-500">
                            {t("Dibuat:", "Created:")} {formatDateTime(detailTicket.createdAt || detailTicket.created_at)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug dark:text-slate-100">
                        {getSubject(detailTicket, t)}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words border-t border-slate-200/40 pt-2.5 dark:text-slate-300 dark:border-slate-700">
                        {detailDescription}
                      </p>
                    </div>

                    {/* Requester Info & Status Controller */}
                    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-4 dark:bg-slate-800/50 dark:border-slate-700">
                      {/* Requester Info */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide dark:text-slate-500">{t("Pengirim", "Sender")}</h4>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{detailTicket.user?.nama || "-"}</p>
                          {isPengajarTicket(detailTicket) && (
                            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                              {t("Pengajar", "Instructor")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{detailTicket.user?.email || ""}</p>
                        {detailTicket.user?.sekolah && (
                          <p className="text-xs text-slate-500 mt-0.5 italic dark:text-slate-400">{t("Asal:", "From:")} {detailTicket.user.sekolah}</p>
                        )}
                      </div>

                      {/* Status Selector */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2 dark:border-slate-700">
                        <label htmlFor="update-status" className="text-xs font-bold text-slate-600 block dark:text-slate-300">
                          {t("Ubah Status Tiket", "Change Ticket Status")}
                        </label>
                        {statusUpdateError && <p className="text-xs text-red-500 leading-snug dark:text-red-400">{statusUpdateError}</p>}
                        <select
                          id="update-status"
                          disabled={statusUpdating}
                          value={detailTicket.status || "open"}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-semibold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                        >
                          {getStatusOptions(t).map((opt) => (
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
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{t("Percakapan / Balasan", "Conversation / Replies")}</h3>
                    {detailReplies.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/40 rounded-2xl border border-slate-100 dark:bg-slate-800/40 dark:border-slate-700">
                        <p className="text-slate-400 text-xs dark:text-slate-500">{t("Belum ada percakapan pada tiket ini.", "No conversation on this ticket yet.")}</p>
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
                                    ? "bg-white border-slate-200/85 dark:bg-slate-800 dark:border-slate-700"
                                    : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {r.sender?.nama || t("Pengguna", "User")}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                      isGuru
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                        : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                    }`}
                                  >
                                    {getSenderRoleLabel(r.sender?.role, t)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words dark:text-slate-300">
                                  {r.message || r.pesan || ""}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1.5 dark:text-slate-500">
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
                    <div className="text-center py-3 text-xs text-slate-400 font-semibold bg-slate-50/50 rounded-2xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500">
                      {t("Tiket telah ditutup/diselesaikan. Buka kembali tiket jika ingin mengirim balasan.", "The ticket has been closed/resolved. Reopen the ticket to send a reply.")}
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <label htmlFor="reply-message" className="text-xs font-bold text-slate-600 block dark:text-slate-300">
                        {t("Tulis Balasan Tanggapan", "Write a Response Reply")}
                      </label>
                      {replyError && <p className="alert-error">{replyError}</p>}
                      <textarea
                        id="reply-message"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        placeholder={t("Ketik pesan balasan penyelesaian kendala di sini...", "Type your issue-resolution reply message here...")}
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-800"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replySending}
                          className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {replySending ? t("Mengirim...", "Sending...") : t("Kirim Balasan", "Send Reply")}
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
