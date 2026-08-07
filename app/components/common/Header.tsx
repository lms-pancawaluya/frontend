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
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          LMS Pancawaluya
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm hover:underline">
                Dashboard
              </Link>
              <Link href="/modules" className="text-sm hover:underline">
                Modul
              </Link>
              <Link href="/profile" className="text-sm hover:underline">
                Profil
              </Link>
              {user.role === "admin" && (
                <Link href="/admin/modules" className="text-sm hover:underline">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-white text-blue-600 px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
              <Link href="/register" className="text-sm hover:underline">
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}