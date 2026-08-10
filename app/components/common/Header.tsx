"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "@/services/auth.service";

interface User {
  nama: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    function checkLoginStatus() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    }

    checkLoginStatus();

    window.addEventListener("authChange", checkLoginStatus);

    return () => {
      window.removeEventListener("authChange", checkLoginStatus);
    };
  }, []);

  function handleLogout() {
    logoutUser();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="bg-white/30 backdrop-blur-md border-b border-[var(--color-border-soft)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-navy)]"
        >
          LMS Pancawaluya
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-[var(--color-navy)] transition">
                Dashboard
              </Link>
              <Link href="/modules" className="text-sm text-gray-600 hover:text-[var(--color-navy)] transition">
                Modul
              </Link>
              <Link href="/profile" className="text-sm text-gray-600 hover:text-[var(--color-navy)] transition">
                Profil
              </Link>
              {user.role === "admin" && (
                <Link href="/admin/modules" className="text-sm text-gray-600 hover:text-[var(--color-navy)] transition">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-[var(--color-navy)] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-[var(--color-navy)] transition">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[var(--color-navy)] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}