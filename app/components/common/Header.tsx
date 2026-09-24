"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/services/auth.service";
import NotificationDropdown from "./NotificationDropdown";
import { getPagesForRole, searchPages, localizePage, type SearchablePage } from "@/lib/pageRegistry";
import { useApp } from "@/app/context/AppContext";

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
  const { t, language } = useApp();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ---- Page search state ----
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  // Tutup dropdown search kalau klik di luar area search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shortcut Cmd+K / Ctrl+K untuk fokus ke search, Escape untuk menutup
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (event.key === "Escape") {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Daftar halaman yang boleh dilihat role user saat ini, difilter oleh query
  const searchResults = useMemo<SearchablePage[]>(() => {
    const pagesForRole = getPagesForRole(user?.role);
    return searchPages(pagesForRole, searchQuery).slice(0, 8).map((p) => localizePage(p, t));
  }, [user?.role, searchQuery, t]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setHighlightedIndex(0);
  }

  function goToPage(page: SearchablePage) {
    router.push(page.href);
    setSearchQuery("");
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = searchResults[highlightedIndex];
      if (target) goToPage(target);
    }
  }

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
    ? `${user.gelarDepan ? `${user.gelarDepan} ` : ""}${user.nama || t("Pengguna", "User")}${
        user.gelarBelakang ? `, ${user.gelarBelakang}` : ""
      }`
    : t("Pengguna", "User");

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
      "sticky top-4 z-30 mx-auto w-[calc(100%-2rem)] sm:w-full max-w-6xl rounded-2xl bg-white/85 px-4 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-md border border-slate-200/80 my-6 sm:px-6 sm:my-8 dark:bg-slate-900/85 dark:shadow-slate-950/50 dark:border-slate-800";

    return (
      <header className={headerClass}>
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-1 sm:px-2">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md" ref={searchBoxRef}>
            <div className="relative flex items-center">
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("Cari halaman: modul, profil, pengaturan...", "Search pages: modules, profile, settings...")}
                className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl py-2 pl-10 pr-12 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047A5]/20 focus:border-[#0047A5] transition-all dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t("Hapus pencarian", "Clear search")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="absolute right-3 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded dark:bg-slate-800 dark:border-slate-700">
                
                </span>
              )}
            </div>

            {/* DROPDOWN HASIL PENCARIAN HALAMAN */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 max-h-80 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                {searchResults.length > 0 ? (
                  searchResults.map((page, index) => (
                    <button
                      key={page.href}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => goToPage(page)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-xs transition-colors ${
                        index === highlightedIndex
                          ? "bg-[#0047A5]/5 text-[#0047A5] dark:bg-blue-500/15 dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60"
                      }`}
                    >
                      <span>
                        <span className="font-semibold block">{page.label}</span>
                        {page.description && (
                          <span className="text-[10px] text-slate-400">{page.description}</span>
                        )}
                      </span>
                      <svg className="w-3.5 h-3.5 text-slate-300 shrink-0 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-xs text-slate-400">
                    {searchQuery
                      ? t(`Tidak ada halaman yang cocok dengan "${searchQuery}".`, `No pages match "${searchQuery}".`)
                      : t("Ketik untuk mencari halaman.", "Type to search pages.")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ACTION ICONS & USER PROFILE */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* NOTIFIKASI */}
            <NotificationDropdown />

            {/* TOMBOL PENGATURAN CEPAT */}
            <Link
              href="/settings"
              title={t("Pengaturan", "Settings")}
              className="p-2 text-slate-500 hover:text-[#0047A5] hover:bg-slate-100 rounded-xl transition-all dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
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
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-all text-left dark:hover:bg-slate-800"
              >
                {fotoUrl && !imgError ? (
                  <Image
                    src={fotoUrl}
                    alt={user.nama || t("Avatar Pengguna", "User Avatar")}
                    width={36}
                    height={36}
                    onError={() => setImgError(true)}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#0047A5] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {user.nama ? user.nama.charAt(0).toUpperCase() : t("G", "U")}
                  </div>
                )}

                <div className="hidden min-[801px]:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight dark:text-slate-100">{namaBerGelar}</p>
                  <p className="text-[11px] text-slate-400 capitalize font-medium dark:text-slate-500">{user.role || t("Pengajar", "Instructor")}</p>
                </div>

                <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* DROPDOWN MENU */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 text-xs dark:bg-slate-800 dark:border-slate-700">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium dark:text-slate-200 dark:hover:bg-slate-700/60"
                  >
                    {t("Lihat Profil", "View Profile")}
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-between dark:text-slate-200 dark:hover:bg-slate-700/60"
                  >
                    <span>{t("Pengaturan", "Settings")}</span>
                    <span className="w-2 h-2 rounded-full bg-[#0047A5] dark:bg-blue-400"></span>
                  </Link>
                  <div className="border-t border-slate-100 my-1 dark:border-slate-700"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-semibold dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {t("Keluar", "Log out")}
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
          { label: t("Dashboard", "Dashboard"), href: dashboardHref },
          { label: t("Profil", "Profile"), href: "/profile" },
        ]
      : [
          { label: t("Dashboard", "Dashboard"), href: dashboardHref },
          { label: t("Modul", "Modules"), href: isAdmin ? "/admin/modules" : "/modules" },
          { label: isAdmin ? t("Helpdesk", "Helpdesk") : t("Bantuan", "Help"), href: isAdmin ? "/admin/helpdesk" : "/helpdesk" },
          { label: t("Profil", "Profile"), href: "/profile" },
        ]
    : [
        { label: t("Masuk", "Login"), href: "/login" },
        { label: t("Daftar", "Register"), href: "/register", variant: "primary" },
      ];

  return (
    <header className="sticky top-0 z-30 overflow-x-hidden border-b border-[var(--color-border-soft)] bg-white/30 backdrop-blur-md dark:bg-slate-900/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 min-[801px]:px-6 min-[801px]:py-4">
        <button
          type="button"
          aria-label={menuOpen ? t("Tutup menu navigasi", "Close navigation menu") : t("Buka menu navigasi", "Open navigation menu")}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-soft)] text-[var(--color-navy)] transition hover:bg-[var(--color-pale)] min-[801px]:hidden dark:text-slate-200 dark:hover:bg-slate-800"
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
          className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--color-navy)] max-[800px]:ml-auto max-[800px]:text-right dark:text-slate-100"
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
                  : "text-sm font-medium text-gray-600 transition hover:text-[var(--color-navy)] dark:text-slate-300 dark:hover:text-white"
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
              {t("Keluar", "Log out")}
            </button>
          ) : null}
        </nav>
      </div>

      <div
        id="mobile-navigation"
        className={`${menuOpen ? "block" : "hidden"} min-[801px]:hidden`}
      >
        <div className="border-t border-[var(--color-border-soft)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md dark:bg-slate-900/95">
          <nav className="flex flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={
                  item.variant === "primary"
                    ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-navy)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    : "inline-flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-[var(--color-pale)] hover:text-[var(--color-navy)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
                {t("Keluar", "Log out")}
              </button>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
