"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/services/auth.service";
import Header from "@/app/components/common/Header";
import { getUsers, getUsersProgressAll } from "@/services/user.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  sekolah?: string;
}

interface GuruUser {
  id: string;
  nama: string;
  role: string;
}

interface ProgressData {
  totalModul: number;
  modulSelesai: number;
  persentase: number;
}

interface Stats {
  guruCount: number;
  avgProgress: number | null;
  distribusi: { selesai: number; progres: number; belum: number; total: number };
  evaluasiSelesai: number;
}

const iconProps = {
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
} as const;

const ICONS = {
  users: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  monitoring: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  document: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chat: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4z" />
    </svg>
  ),
  check: (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function PengajarDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (!token || !userData) {
        router.push("/login");
        return;
      }
      const currentUser = JSON.parse(userData);
      if (currentUser?.role !== "pengajar") {
        router.push(currentUser?.role === "admin" ? "/admin" : "/dashboard");
        return;
      }
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat profil.");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const [users, progressAll] = await Promise.all([
          getUsers().catch(() => []),
          getUsersProgressAll().catch(() => [] as ProgressData[]),
        ]);

        const guru: GuruUser[] = (users as GuruUser[]).filter((u) => u.role === "guru");

        const rawProg = progressAll as unknown;
        const rawObj = rawProg as Record<string, unknown>;
        const withProg = (Array.isArray(rawProg) ? rawProg : (rawObj?.data || rawObj?.users || rawObj?.items || [])) as ProgressData[];
        
        let selesai = 0;
        let belum = 0;
        let sum = 0;
        let evaluasiSelesai = 0;
        withProg.forEach((p) => {
          // Fallbacks in case the API uses snake_case instead of camelCase
          const anyP = p as unknown as Record<string, unknown>;
          const totalModul = (p.totalModul ?? anyP.total_modul ?? 0) as number;
          const modulSelesai = (p.modulSelesai ?? anyP.modul_selesai ?? 0) as number;
          const persentase = (p.persentase ?? 0) as number;
          
          sum += persentase;
          if (totalModul > 0 && modulSelesai >= totalModul) {
            selesai += 1;
            evaluasiSelesai += 1;
          } else if (modulSelesai <= 0 || persentase <= 0) belum += 1;
        });
        const progres = withProg.length - selesai - belum;
        const avgProgress = withProg.length ? Math.round(sum / withProg.length) : null;

        if (!active) return;
        setStats({
          guruCount: guru.length,
          avgProgress,
          distribusi: { selesai, progres, belum, total: withProg.length },
          evaluasiSelesai,
        });
      } finally {
        if (active) setStatsLoading(false);
      }
    }
    if (user) loadStats();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <p className="text-center mt-16 text-gray-500 dark:text-slate-400">Memuat Dashboard Pengajar...</p>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 p-4">
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">{error}</div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Guru Dikelola",
      value: stats?.guruCount ?? 0,
      sub: "dalam sekolah Anda",
      subClass: "text-gray-400 dark:text-slate-500",
      icon: ICONS.users,
      iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      card: "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20",
    },
    {
      label: "Rata-rata Progress",
      value: stats?.avgProgress === null || stats?.avgProgress === undefined ? "—" : `${stats.avgProgress}%`,
      sub: "pengerjaan modul",
      subClass: "text-gray-400 dark:text-slate-500",
      icon: ICONS.monitoring,
      iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      card: "border-amber-100 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20",
    },
    {
      label: "Modul Tuntas",
      value: statsLoading ? "—" : `${stats?.evaluasiSelesai ?? 0}/${stats?.guruCount ?? 0}`,
      sub: "guru menuntaskan modul",
      subClass: "text-gray-400 dark:text-slate-500",
      icon: ICONS.check,
      iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
      card: "border-blue-100 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20",
    },
  ];

  const dist = stats?.distribusi ?? { selesai: 0, progres: 0, belum: 0, total: 0 };
  const share = (n: number) => (dist.total > 0 ? (n / dist.total) * 100 : 0);
  const pctSelesai = share(dist.selesai);
  const pctProgres = share(dist.progres);
  const donutStyle =
    dist.total > 0
      ? {
          background: `conic-gradient(#10b981 0 ${pctSelesai}%, #3b82f6 ${pctSelesai}% ${
            pctSelesai + pctProgres
          }%, #f59e0b ${pctSelesai + pctProgres}% 100%)`,
        }
      : { background: "#e5e7eb" };

  const legend = [
    { label: "Selesai", count: dist.selesai, dot: "bg-emerald-500" },
    { label: "Dalam Progres", count: dist.progres, dot: "bg-blue-500" },
    { label: "Belum Mulai", count: dist.belum, dot: "bg-amber-500" },
  ];

  const menu = [
    {
      title: "Kelola Guru",
      desc: "Lihat dan perbarui data guru di sekolah Anda.",
      href: "/pengajar/guru",
      icon: ICONS.users,
      iconWrap: "bg-emerald-100 text-emerald-600",
      arrow: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    },
    {
      title: "Monitoring Pembelajaran",
      desc: "Pantau progres pembelajaran (course) tiap guru binaan.",
      href: "/pengajar/monitoring",
      icon: ICONS.monitoring,
      iconWrap: "bg-amber-100 text-amber-600",
      arrow: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    },
    {
      title: "Diskusi/Komentar Modul",
      desc: "Ikuti diskusi modul dan berikan tanggapan untuk guru.",
      href: "/pengajar/diskusi",
      icon: ICONS.chat,
      iconWrap: "bg-blue-100 text-blue-600",
      arrow: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* FLOATING HEADER */}
      <Header />

      {/* Hero banner — shares LMS gradient identity, pengajar-specific content */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 right-32 h-36 w-36 rounded-full bg-[#F3BF10]/15 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#F3BF10]" />
              Portal Pembinaan Pengajar
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Selamat datang, {user?.nama ?? "Pengajar"}.</h1>
            <p className="text-xs leading-relaxed text-slate-100/90 sm:text-sm">
              Bina dan pantau perkembangan guru{user?.sekolah ? ` di ${user.sekolah}` : ""}: progres modul, hasil Pre-Test/Post-Test, dan diskusi.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start md:self-auto">
            <Link
              href="/pengajar/monitoring"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#F3BF10] px-6 py-3 text-xs font-extrabold text-[#0047A5] shadow-lg transition-all duration-200 hover:bg-amber-400 sm:text-sm"
            >
              <span>Mulai Monitoring</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-5 shadow-sm ${kpi.card}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.iconWrap}`}>{kpi.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500 dark:text-slate-400">{kpi.label}</p>
                {statsLoading ? (
                  <span className="mt-2 block h-7 w-14 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold text-[var(--color-navy)] dark:text-slate-100">{kpi.value}</p>
                )}
                <p className={`mt-0.5 truncate text-[11px] ${kpi.subClass}`}>{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monitoring donut + quick access */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)] dark:text-slate-100">
              <span className="text-[var(--color-accent)]">{ICONS.monitoring}</span>
              Monitoring Pembelajaran
            </h2>
            <Link
              href="/pengajar/monitoring"
              className="shrink-0 rounded-lg border border-[var(--color-border-soft)] px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-[var(--color-pale)] hover:text-[var(--color-navy)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Lihat Detail →
            </Link>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={donutStyle}>
              <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner dark:bg-slate-900">
                {statsLoading ? (
                  <span className="h-6 w-12 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
                ) : (
                  <span className="text-2xl font-bold text-[var(--color-navy)] dark:text-slate-100">
                    {stats?.avgProgress === null || stats?.avgProgress === undefined ? "—" : `${stats.avgProgress}%`}
                  </span>
                )}
                <span className="text-[11px] text-gray-400 dark:text-slate-500">Rata-rata</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-3">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-3 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.dot}`} />
                  <span className="flex-1 text-gray-600 dark:text-slate-300">{l.label}</span>
                  <span className="font-medium text-gray-500 dark:text-slate-400">{l.count} guru</span>
                  <span className="w-10 text-right font-bold text-[var(--color-navy)] dark:text-slate-100">{Math.round(share(l.count))}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 border-t border-[var(--color-border-soft)] pt-4 text-xs text-gray-500 dark:text-slate-400">
            Total Guru Binaan · <span className="font-bold text-[var(--color-navy)] dark:text-slate-100">{stats?.guruCount ?? 0} guru</span>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)] dark:text-slate-100">Akses Cepat</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.iconWrap}`}>{item.icon}</span>
                <h3 className="text-sm font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-accent)] dark:text-slate-100">{item.title}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">{item.desc}</p>
                <span className={`mt-3 flex h-8 w-8 items-center justify-center rounded-full transition group-hover:translate-x-0.5 ${item.arrow}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
