"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/services/auth.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdminAuth() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/login");
        return;
      }

      const currentUser = JSON.parse(userData);
      if (currentUser?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Gagal memuat profil admin.");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-16 text-gray-500">Memuat Dashboard Admin...</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  const adminMenu = [
    {
      title: "Kelola Modul Pembelajaran",
      desc: "Buat, ubah, dan susun modul, materi teks, serta video pembelajaran.",
      href: "/admin/modules",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: "Konten Utama",
      color: "bg-blue-50 border-blue-100",
    },
    {
      title: "Kelola Akun Guru",
      desc: "Lihat daftar guru terdaftar dan pantau progres pengerjaan modul mereka.",
      href: "/admin/users",
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: "Manajemen Akun",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "Kelola Item Checklist",
      desc: "Atur template item daily checklist per 5 aspek Pancawaluya.",
      href: "/admin/checklist",
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: "Baru",
      color: "bg-purple-50 border-purple-100",
    },
    {
      title: "Kelola Tiket Bantuan (Helpdesk)",
      desc: "Tinjau kendala teknis dari Guru, kirim tanggapan balasan, dan kelola status tiket bantuan.",
      href: "/admin/helpdesk",
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: "Baru V1",
      color: "bg-red-50 border-red-100",
    },
    {
      title: "Monitoring Pengerjaan Modul Guru",
      desc: "Pantau progres pengerjaan modul dan hasil evaluasi tiap guru.",
      href: "/admin/checklist/report",
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: "Baru",
      color: "bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        {/* Akses Lipatan / Geometric Ornament khas logo */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-36 h-36 bg-[#F3BF10]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-[#F3BF10] animate-pulse" />
              Portal Administrasi LMS
            </div>

            <h1 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Selamat datang, Admin.
            </h1>

            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
              Kelola modul pembelajaran, akun guru, monitoring, dan layanan bantuan LMS Panca Waluya.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Link
              href="/admin/modules"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F3BF10] hover:bg-amber-400 text-[#0047A5] text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg hover:shadow-amber-400/20 transition-all duration-200"
            >
              <span>Kelola Sistem</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-navy)] mb-4">
        Menu Manajemen Sistem
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {adminMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block p-6 rounded-2xl border ${item.color} bg-white hover:shadow-md transition group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-gray-50 rounded-xl group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {item.badge}
              </span>
            </div>
            <h3 className="font-medium text-base text-[var(--color-navy)] group-hover:text-[var(--color-accent)] transition">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}