"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRtlSubmissions, getRtlDetail, reviewRtl } from "@/services/rtl.service";

interface RtlUser {
  id?: string;
  nama?: string;
  sekolah?: string;
  kota?: string;
  daerah?: string;
}

interface RtlModule {
  id?: string;
  judul?: string;
}

interface RtlSubmission {
  id: string;
  filePdfUrl?: string;
  catatanGuru?: string;
  catatanTrainer?: string;
  status?: string;
  createdAt?: string;
  user?: RtlUser;
  module?: RtlModule;
  reviewer?: { nama?: string };
}

const statusFilters = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

function statusBadge(status?: string): { label: string; className: string } {
  const s = String(status || "").toLowerCase();
  if (s === "disetujui") return { label: "Disetujui", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (s === "ditolak") return { label: "Ditolak", className: "bg-rose-100 text-rose-700 border-rose-200" };
  if (s === "pending" || s === "menunggu") return { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: status || "—", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

export default function PengajarRtlPage() {
  const router = useRouter();
  const [items, setItems] = useState<RtlSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RtlSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [reviewStatus, setReviewStatus] = useState<"disetujui" | "ditolak">("disetujui");
  const [catatanTrainer, setCatatanTrainer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const currentUser = JSON.parse(userData);
    if (currentUser.role !== "pengajar") {
      router.push(currentUser.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    async function fetchItems() {
      try {
        setLoading(true);
        setError("");
        const data = await getRtlSubmissions(filterStatus ? { status: filterStatus } : {});
        if (!active) return;
        setItems(data as RtlSubmission[]);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat daftar RTL.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchItems();
    return () => {
      active = false;
    };
  }, [filterStatus, refreshKey]);

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailError("");
    setReviewError("");
    setReviewStatus("disetujui");
    setCatatanTrainer("");
    setDetailLoading(true);
    try {
      const data = await getRtlDetail(id);
      setDetail(data as RtlSubmission);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Gagal memuat detail RTL.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function closeDetail() {
    if (submitting) return;
    setDetailId(null);
    setDetail(null);
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!detailId) return;
    if (!catatanTrainer.trim()) {
      setReviewError("Catatan penilaian wajib diisi.");
      return;
    }
    try {
      setSubmitting(true);
      setReviewError("");
      await reviewRtl(detailId, { status: reviewStatus, catatanTrainer: catatanTrainer.trim() });
      setRefreshKey((k) => k + 1);
      closeDetail();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Gagal menyimpan penilaian.");
    } finally {
      setSubmitting(false);
    }
  }

  const detailBadge = detail ? statusBadge(detail.status) : null;
  const alreadyReviewed = detail ? ["disetujui", "ditolak"].includes(String(detail.status || "").toLowerCase()) : false;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-navy)]">
          RTL — Rencana Tindak Lanjut
        </h1>
        <p className="mt-1 text-sm text-gray-500">Tinjau dan nilai pengajuan RTL dari guru binaan Anda.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilterStatus(f.value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              filterStatus === f.value
                ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                : "border-[var(--color-border-soft)] bg-white text-gray-600 hover:bg-[var(--color-pale)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Memuat daftar RTL...</div>
        ) : error ? (
          <div className="space-y-3 py-16 text-center">
            <p className="inline-block rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
            <div>
              <button onClick={() => setRefreshKey((k) => k + 1)} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
                Coba lagi
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">Belum ada pengajuan RTL{filterStatus ? " untuk status ini" : ""}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-pale)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Guru</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Modul</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Dokumen</th>
                  <th className="w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-soft)]">
                {items.map((r) => {
                  const badge = statusBadge(r.status);
                  return (
                    <tr key={r.id} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-navy)]">{r.user?.nama || "—"}</div>
                        <div className="text-xs text-gray-400">{r.user?.sekolah || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.module?.judul || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.filePdfUrl ? (
                          <a
                            href={r.filePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                          >
                            Preview PDF
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDetail(r.id)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-slate-50"
                        >
                          Detail
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

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={closeDetail}>
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-bold text-[var(--color-navy)]">Detail Pengajuan RTL</h2>
              <button onClick={closeDetail} disabled={submitting} className="text-slate-400 hover:text-slate-600 disabled:opacity-50" aria-label="Tutup">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Memuat detail...</div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{detailError}</div>
              ) : detail ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Guru</h4>
                      <p className="mt-1 text-sm font-bold text-slate-800">{detail.user?.nama || "—"}</p>
                      <p className="text-xs text-gray-500">{detail.user?.sekolah || ""}</p>
                      {(detail.user?.kota || detail.user?.daerah) && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {[detail.user?.daerah, detail.user?.kota].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Modul</h4>
                      <p className="mt-1 text-sm font-bold text-slate-800">{detail.module?.judul || "—"}</p>
                      {detailBadge && (
                        <span className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${detailBadge.className}`}>
                          {detailBadge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {detail.catatanGuru && (
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Catatan Guru</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{detail.catatanGuru}</p>
                    </div>
                  )}

                  {detail.filePdfUrl && (
                    <a
                      href={detail.filePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-[var(--color-pale)]"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Preview Dokumen PDF
                    </a>
                  )}

                  {alreadyReviewed ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">Catatan Penilaian</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{detail.catatanTrainer || "—"}</p>
                      {detail.reviewer?.nama && <p className="mt-2 text-xs text-gray-400">Dinilai oleh {detail.reviewer.nama}</p>}
                    </div>
                  ) : (
                    <form onSubmit={handleReview} className="space-y-3 border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-bold text-[var(--color-navy)]">Beri Penilaian</h4>
                      {reviewError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{reviewError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewStatus("disetujui")}
                          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                            reviewStatus === "disetujui"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-gray-600 hover:bg-slate-50"
                          }`}
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatus("ditolak")}
                          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                            reviewStatus === "ditolak"
                              ? "border-rose-300 bg-rose-50 text-rose-700"
                              : "border-slate-200 text-gray-600 hover:bg-slate-50"
                          }`}
                        >
                          Tolak
                        </button>
                      </div>
                      <textarea
                        value={catatanTrainer}
                        onChange={(e) => setCatatanTrainer(e.target.value)}
                        rows={3}
                        placeholder="Tulis catatan evaluasi untuk guru..."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-[var(--color-navy)]/15"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="rounded-xl bg-[var(--color-navy)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          {submitting ? "Menyimpan..." : "Simpan Penilaian"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
