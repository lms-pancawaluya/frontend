"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SessionUser {
  role?: string;
}

type AuthStatus = "loading" | "guest" | "authenticated";

export default function HeroCta() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    // Sumber kebenaran auth mengikuti pola yang sama dengan Header.tsx:
    // token + user di localStorage, disinkronkan lewat event "authChange".
    function checkAuth() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          const parsed = JSON.parse(userData) as SessionUser;
          setRole(parsed.role || "");
          setStatus("authenticated");
        } catch {
          setStatus("guest");
        }
      } else {
        setRole("");
        setStatus("guest");
      }
    }

    checkAuth();
    window.addEventListener("authChange", checkAuth);
    return () => window.removeEventListener("authChange", checkAuth);
  }, []);

  // Routing role mengikuti Header.tsx: admin → /admin, selain itu → /dashboard.
  const dashboardHref = role === "admin" ? "/admin" : "/dashboard";

  // Saat status auth masih dimuat, tampilkan placeholder bergaya tombol primer
  // agar tidak terjadi hydration mismatch maupun flash CTA yang salah.
  if (status === "loading") {
    return (
      <div className="flex flex-wrap gap-3">
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white px-6 py-3 rounded-full font-medium shadow-sm opacity-60 pointer-events-none select-none"
        >
          Memuat…
        </span>
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white px-6 py-3 rounded-full font-medium shadow-sm hover:opacity-90 transition"
        >
          Dashboard →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 bg-[var(--color-navy)] text-white px-6 py-3 rounded-full font-medium shadow-sm hover:opacity-90 transition"
      >
        Mulai Sekarang →
      </Link>
      <Link
        href="/login"
        className="bg-white text-[var(--color-navy)] border border-[var(--color-border-soft)] px-6 py-3 rounded-full font-medium hover:bg-[var(--color-pale)] transition"
      >
        Saya sudah punya akun
      </Link>
    </div>
  );
}
