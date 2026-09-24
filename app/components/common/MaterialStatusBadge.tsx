"use client";

import { isMaterialEntryCompleted, type MaterialProgressEntry } from "@/lib/contentProgress";
import { useApp } from "@/app/context/AppContext";

interface MaterialStatusBadgeProps {
  entry?: MaterialProgressEntry;
  /** Label opsional untuk konteks progress (default: dihitung dari entry). */
  className?: string;
}

/**
 * Menampilkan status per-material dari BE (single source of truth):
 * - Selesai bila BE menandai material selesai.
 * - Persentase progress bila BE menyediakan `progressPercent` (0–100).
 *
 * Tidak menghitung/menyimpan completion sendiri — hanya menampilkan data BE.
 */
export default function MaterialStatusBadge({ entry, className = "" }: MaterialStatusBadgeProps) {
  const { t } = useApp();
  const completed = isMaterialEntryCompleted(entry);
  const percent =
    entry?.progressPercent !== undefined ? Math.max(0, Math.min(100, Math.round(entry.progressPercent))) : undefined;

  if (!completed && (percent === undefined || percent <= 0)) {
    return null;
  }

  if (completed) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        {t("Selesai", "Completed")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 ${className}`}
    >
      {percent}%
    </span>
  );
}
