"use client";

import Link from "next/link";
import { useApp } from "@/app/context/AppContext";

export function RegisterHeaderText() {
  const { t } = useApp();

  return (
    <div className="text-center mb-6">
      <h1 className="font-[family-name:var(--font-heading,var(--font-display))] text-2xl font-bold text-[var(--color-navy)] tracking-tight dark:text-slate-100">
        {t("Daftar Akun Guru", "Register Teacher Account")}
      </h1>

      <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
        {t("Buat akun untuk mulai belajar Pancawaluya", "Create an account to start learning Pancawaluya")}
      </p>
    </div>
  );
}

export function RegisterFooterText() {
  const { t } = useApp();

  return (
    <p className="text-sm text-gray-500 text-center mt-6 dark:text-slate-400">
      {t("Sudah punya akun?", "Already have an account?")}{" "}
      <Link href="/login" className="text-[var(--color-accent)] font-medium hover:underline dark:text-blue-400">
        {t("Login di sini", "Login here")}
      </Link>
    </p>
  );
}
