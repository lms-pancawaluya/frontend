"use client";

import { useState } from "react";
import { sendCourseFeedback } from "@/services/evaluation.service";

interface CourseFeedbackFormProps {
  /** Course context. Diambil dari route/context, bukan input manual. */
  courseId: string;
  /** Judul course opsional untuk ditampilkan sebagai konteks. */
  courseTitle?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Form Saran & Masukan level Course.
 * Body mengikuti contract BE: { masukan, saran } — `saran` required.
 */
export default function CourseFeedbackForm({
  courseId,
  courseTitle,
}: CourseFeedbackFormProps) {
  const [masukan, setMasukan] = useState("");
  const [saran, setSaran] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saran.trim()) return;

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await sendCourseFeedback(courseId, {
        masukan: masukan.trim() ? masukan : undefined,
        saran,
      });

      setSuccessMsg("Terima kasih! Saran dan masukan Anda berhasil dikirim.");
      setMasukan("");
      setSaran("");
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Gagal mengirimkan saran & masukan."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Saran & Masukan</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {courseTitle
            ? `Bantu kami meningkatkan kualitas course "${courseTitle}".`
            : "Bantu kami meningkatkan kualitas course ini."}
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmitFeedback} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Masukan <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <textarea
            rows={3}
            value={masukan}
            onChange={(e) => setMasukan(e.target.value)}
            placeholder="Tuliskan masukan terkait penyampaian course..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Saran <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            placeholder="Tuliskan saran perbaikan course atau penyampaian materi..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !saran.trim()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Mengirim..." : "Kirim Saran & Masukan"}
        </button>
      </form>
    </div>
  );
}
