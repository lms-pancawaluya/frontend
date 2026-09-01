"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/services/auth.service";

interface User {
  id?: string;
  nama?: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  role?: string;
  foto?: string;
  fotoUrl?: string;
  fotoProfil?: string;
  avatar?: string;
  photo?: string;
}

type NavLink = {
  label: string;
  href: string;
  variant?: "primary";
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync state user dari localStorage
  useEffect(() => {
    function checkLoginStatus() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          setImgError(false);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setMenuOpen(false);
      setIsProfileOpen(false);
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
    setIsProfileOpen(false);
    localStorage.clear();
    router.push("/login");
  }

  // Format Nama Bergelar
  const namaBerGelar = user
    ? `${user.gelarDepan ? `${user.gelarDepan} ` : ""}${user.nama || "Pengguna"}${
        user.gelarBelakang ? `, ${user.gelarBelakang}` : ""
      }`
    : "Pengguna";

  // Memeriksa seluruh opsi field photo dari backend
  const fotoUrl =
    user?.foto ||
    user?.fotoUrl ||
    user?.fotoProfil ||
    user?.avatar ||
    user?.photo ||
    null;

  const isDashboardRoute =
    user &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/pengajar") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/guru") ||
      pathname.startsWith("/modules") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/settings"));

  // =========================================================================
  // TAMPILAN 1: FLOATING HEADER (KHUSUS DASHBOARD USER YANG SUDAH LOGIN)
  // =========================================================================
  if (user && isDashboardRoute) {
    // Guru baseline — used as the reference for all roles (TASK 4.3):
    // centered, max-w-6xl, px-4 (mobile) → px-6 sm:px-8 (desktop),
    // vertical spacing my-6 (mobile) → my-8 (desktop), rounded-2xl.
    const headerClass =
      "sticky top-4 z-30 mx-auto w-[calc(100%-2rem)] sm:w-full max-w-6xl rounded-2xl bg-white/85 px-4 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-md border border-slate-200/80 my-6 sm:px-6 sm:my-8";

    return (
      <header className={headerClass}>
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-2">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari siswa, kelas, tugas, sumber daya..."
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl py-2 pl-10 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] transition-all"
              />
              <span className="absolute right-3 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                ⌘ K
              </span>
            </div>
          </div>

          {/* ACTION ICONS & USER PROFILE */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* NOTIFIKASI */}
            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                4
              </span>
            </button>

            {/* TOMBOL PENGATURAN CEPAT */}
            <Link
              href="/settings"
              title="Pengaturan"
              className="p-2 text-slate-500 hover:text-[#0047A5] hover:bg-slate-100 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            {/* DROPDOWN USER PROFILE */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-all text-left"
              >
                {fotoUrl && !imgError ? (
                  <Image
                    src={fotoUrl}
                    alt={user.nama || "User Avatar"}
                    width={36}
                    height={36}
                    onError={() => setImgError(true)}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#0047A5] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {user.nama ? user.nama.charAt(0).toUpperCase() : "G"}
                  </div>
                )}

                <div className="hidden min-[801px]:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{namaBerGelar}</p>
                  <p className="text-[11px] text-slate-400 capitalize font-medium">{user.role || "Pengajar"}</p>
                </div>

                <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* DROPDOWN MENU */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 text-xs">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Lihat Profil
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between"
                  >
                    <span>Pengaturan</span>
                    <span className="w-2 h-2 rounded-full bg-[#0047A5]"></span>
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>
    );
  }

  // =========================================================================
  // TAMPILAN 2: NAVBAR KLASIK (LANDING PAGE / PUBLIC USER)
  // =========================================================================
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
          { label: "Dashboard", href: dashboardHref },
          { label: "Modul", href: isAdmin ? "/admin/modules" : "/modules" },
          { label: isAdmin ? "Helpdesk" : "Bantuan", href: isAdmin ? "/admin/helpdesk" : "/helpdesk" },
          { label: "Profil", href: "/profile" },
        ]
    : [
        { label: "Login", href: "/login" },
        { label: "Daftar", href: "/register", variant: "primary" },
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
