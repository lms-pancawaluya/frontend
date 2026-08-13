"use client";

import { useState } from "react";
import { sendModuleFeedback } from "@/services/evaluation.service";

interface ModuleFeedbackFormProps {
  moduleId: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ModuleFeedbackForm({ moduleId }: ModuleFeedbackFormProps) {
  const [saran, setSaran] = useState("");
  const [kritik, setKritik] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await sendModuleFeedback(moduleId, {
        saran,
        kritik: kritik.trim() ? kritik : undefined,
      });

      setSuccessMsg("Terima kasih! Saran dan kritik Anda berhasil dikirim.");
      setSaran("");
      setKritik("");
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Gagal mengirimkan feedback."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-navy)]">Feedback & Masukan Modul</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Bantu kami meningkatkan kualitas materi modul pembelajaran ini.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitFeedback} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Saran <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            placeholder="Tuliskan saran perbaikan materi atau penyampaian modul..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kritik <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <textarea
            rows={2}
            value={kritik}
            onChange={(e) => setKritik(e.target.value)}
            placeholder="Tuliskan kendala teknis atau kekurangan jika ada..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !saran.trim()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Mengirim..." : "Kirim Feedback"}
        </button>
      </form>
    </div>
  );
}
