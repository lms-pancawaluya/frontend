"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/auth.service";

interface User {
  nama: string;
  role: string;
}

type NavLink = {
  label: string;
  href: string;
  variant?: "primary";
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function checkLoginStatus() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setMenuOpen(false);
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
    setMenuOpen(false);
    router.push("/");
  }

  const isAdmin = user?.role === "admin";
  const isPengajar = user?.role === "pengajar";
  const dashboardHref = isAdmin ? "/admin" : isPengajar ? "/pengajar" : "/dashboard";
  const navLinks: NavLink[] = user
    ? isPengajar
      ? [
          { label: "Dashboard", href: dashboardHref },
          { label: "Profil", href: "/profile" },
        ]
      : [
        {
          label: "Dashboard",
          href: dashboardHref,
        },
        {
          label: "Modul",
          href: isAdmin ? "/admin/modules" : "/modules",
        },
        {
          label: isAdmin ? "Helpdesk" : "Bantuan",
          href: isAdmin ? "/admin/helpdesk" : "/helpdesk",
        },
        {
          label: "Profil",
          href: "/profile",
        },
      ]
    : [
        {
          label: "Login",
          href: "/login",
        },
        {
          label: "Daftar",
          href: "/register",
          variant: "primary",
        },
      ];

  return (
    <header className="sticky top-0 z-30 overflow-x-hidden border-b border-[var(--color-border-soft)] bg-white/30 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 min-[801px]:px-6 min-[801px]:py-4">
        <button
          type="button"
          aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-soft)] text-[var(--color-navy)] transition hover:bg-[var(--color-pale)] min-[801px]:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-current transition-transform duration-200 ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-current transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-current transition-transform duration-200 ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>

        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-navy)] max-[800px]:ml-auto max-[800px]:text-right"
        >
          LMS Pancawaluya
        </Link>

        <nav className="hidden items-center gap-6 min-[801px]:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.variant === "primary"
                  ? "rounded-full bg-[var(--color-navy)] px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                  : "text-sm font-medium text-gray-600 transition hover:text-[var(--color-navy)]"
              }
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-full bg-[var(--color-navy)] px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>

      <div
        id="mobile-navigation"
        className={`${menuOpen ? "block" : "hidden"} min-[801px]:hidden`}
      >
        <div className="border-t border-[var(--color-border-soft)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <nav className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={
                  item.variant === "primary"
                    ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-navy)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    : "inline-flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-[var(--color-pale)] hover:text-[var(--color-navy)]"
                }
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-navy)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
