"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyTickets, createTicket } from "@/services/helpdesk.service";

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

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // State modal buat tiket
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  function handleOpenModal() {
    setSubject("");
    setCategory("");
    setDescription("");
    setFormError("");
    setShowModal(true);
  }

  function handleCloseModal() {
    if (submitting) return;
    setShowModal(false);
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
      setShowModal(false);
      setSuccessMsg("Tiket berhasil dibuat.");
      // Refresh daftar tanpa reload halaman.
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal membuat tiket.");
    } finally {
      setSubmitting(false);
    }
  }

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
              onClick={handleOpenModal}
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
              return (
                <div
                  key={t.id || idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all duration-200"
                >
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

                  <span
                    className={`shrink-0 self-start sm:self-center text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-500 hover:text-[#0047A5] transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>

      {/* ================= MODAL BUAT TIKET ================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Buat Tiket Baru</h2>
              <button
                onClick={handleCloseModal}
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
                <label htmlFor="subject" className="text-xs font-semibold text-slate-600">
                  Subjek <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ringkasan singkat kendala Anda"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-xs font-semibold text-slate-600">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="mis. Materi & Video, Akun, Evaluasi"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#419AD6]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-xs font-semibold text-slate-600">
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
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
                  onClick={handleCloseModal}
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
    </div>
  );
}
