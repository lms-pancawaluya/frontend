"use client";

import Link from "next/link";
import { useApp } from "@/app/context/AppContext";

export function LoginHeaderText() {
  const { t } = useApp();

  return (
    <div className="text-center mb-6">
      <h1 className="font-[family-name:var(--font-heading,var(--font-display))] text-2xl font-bold text-[var(--color-navy)] tracking-tight dark:text-slate-100">
        {t("Selamat Datang", "Welcome")}
      </h1>

      <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
        {t("Masuk untuk melanjutkan pembelajaran Anda", "Sign in to continue your learning")}
      </p>
    </div>
  );
}

export function LoginFooterText() {
  const { t } = useApp();

  return (
    <p className="text-sm text-gray-500 text-center mt-6 dark:text-slate-400">
      {t("Belum punya akun?", "Don't have an account?")}{" "}
      <Link href="/register" className="text-[var(--color-accent)] font-medium hover:underline dark:text-blue-400">
        {t("Daftar di sini", "Register here")}
      </Link>
    </p>
  );
}
