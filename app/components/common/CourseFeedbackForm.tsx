"use client";

import { useState } from "react";
import {
  sendCourseFeedback,
  FeedbackCooldownError,
} from "@/services/evaluation.service";

interface CourseFeedbackFormProps {
  /** Course context. Diambil dari route/context, bukan input manual. */
  courseId: string;
  /** Judul course opsional untuk ditampilkan sebagai konteks. */
  courseTitle?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Format waktu cooldown dari ISO ke tanggal/waktu user-friendly (id-ID). */
function formatNextAllowedAt(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Form Saran & Masukan level Course.
 * Body mengikuti contract BE: { masukan, saran } — `saran` required.
 * Cooldown 1 feedback / 7×24 jam ditegakkan BE (HTTP 429).
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
  const [cooldownMsg, setCooldownMsg] = useState<string | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<string | null>(null);

  const cooldownActive = nextAllowedAt !== null || cooldownMsg !== null;
  const nextAllowedLabel = formatNextAllowedAt(nextAllowedAt);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saran.trim() || cooldownActive) return;

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setCooldownMsg(null);

    try {
      await sendCourseFeedback(courseId, {
        masukan: masukan.trim() ? masukan : undefined,
        saran,
      });

      setSuccessMsg("Terima kasih! Saran dan masukan Anda berhasil dikirim.");
      setMasukan("");
      setSaran("");
    } catch (err: unknown) {
      // 429 → cooldown state (BUKAN generic error). Cek via instanceof serta
      // fallback `name` agar tetap terdeteksi andai identity class berganti.
      const isCooldown =
        err instanceof FeedbackCooldownError ||
        (err instanceof Error && err.name === "FeedbackCooldownError");
      if (isCooldown) {
        const cooldownErr = err as FeedbackCooldownError;
        setCooldownMsg(
          getErrorMessage(
            err,
            "Anda hanya dapat mengirim saran dan masukan 1 kali dalam 7 hari."
          )
        );
        setNextAllowedAt(cooldownErr.nextAllowedAt || null);
      } else {
        setErrorMsg(getErrorMessage(err, "Gagal mengirimkan saran & masukan."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[var(--color-border-soft)] shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
      <div>
        <h3 className="text-sm font-bold text-[var(--color-navy)] dark:text-slate-100">Saran & Masukan</h3>
        <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
          {courseTitle
            ? `Bantu kami meningkatkan kualitas course "${courseTitle}".`
            : "Bantu kami meningkatkan kualitas course ini."}
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          {successMsg}
        </div>
      )}

      {cooldownActive && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-medium space-y-1 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
          <p>{cooldownMsg || "Anda sudah mengirim saran & masukan untuk course ini."}</p>
          {nextAllowedLabel && (
            <p className="font-normal">
              Anda dapat mengirim saran & masukan berikutnya pada{" "}
              <span className="font-semibold">{nextAllowedLabel}</span>.
            </p>
          )}
        </div>
      )}

      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <form onSubmit={handleSubmitFeedback} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
            Masukan <span className="text-slate-400 font-normal dark:text-slate-500">(Opsional)</span>
          </label>
          <textarea
            rows={3}
            value={masukan}
            onChange={(e) => setMasukan(e.target.value)}
            disabled={cooldownActive}
            placeholder="Tuliskan masukan terkait penyampaian course..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 dark:text-slate-300">
            Saran <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            disabled={cooldownActive}
            placeholder="Tuliskan saran perbaikan course atau penyampaian materi..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition resize-none disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading || cooldownActive || !saran.trim()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {loading ? "Mengirim..." : "Kirim Saran & Masukan"}
        </button>
      </form>
    </div>
  );
}
