"use client";

import { useApp } from "@/app/context/AppContext";

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-white border-t border-[var(--color-border-soft)] py-6 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500 dark:text-slate-400">
        <p>&copy; 2026 LMS Pancawaluya. {t("Dibuat untuk mendukung pembelajaran Guru SMA.", "Built to support high school teacher learning.")}</p>
      </div>
    </footer>
  );
}
