"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/services/auth.service";
import Header from "@/app/components/common/Header";
import { getModules } from "@/services/module.service";
import { getUsers, getUsersProgressAll } from "@/services/user.service";
import { getAllTickets } from "@/services/helpdesk.service";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
}

interface GuruUser {
  id: string;
  nama: string;
  role: string;
  createdAt?: string;
}

interface ProgressData {
  totalModul: number;
  modulSelesai: number;
  persentase: number;
}

interface TicketLite {
  id?: string;
  subject?: string;
  subjek?: string;
  judul?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  user?: { nama?: string };
}

interface ActivityItem {
  id: string;
  kind: "user" | "ticket";
  title: string;
  desc: string;
  time: number;
}

interface DashboardStats {
  modulCount: number;
  guruCount: number;
  ticketTotal: number;
  ticketPerluTindak: number;
  avgProgress: number | null;
  distribusi: { selesai: number; progres: number; belum: number; total: number };
  activities: ActivityItem[];
}

const OPEN_TICKET = new Set(["open", "terbuka", "baru", "new", "in_progress", "proses", "diproses", "pending"]);

function ticketSubject(t: TicketLite): string {
  return t.subject || t.subjek || t.judul || "(Tanpa subjek)";
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const jam = Math.floor(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const ICONS = {
  modules: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  helpdesk: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  monitoring: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setStatsLoading(true);
      try {
        const [modules, users, tickets, progressAll] = await Promise.all([
          getModules(),
          getUsers().catch(() => []),
          getAllTickets().catch(() => []),
          getUsersProgressAll().catch(() => [] as ProgressData[]),
        ]);

        const guru: GuruUser[] = (users as GuruUser[]).filter((u) => u.role === "guru");

        const rawProg = progressAll as unknown;
        const rawObj = rawProg as Record<string, unknown>;
        const withProg = (Array.isArray(rawProg) ? rawProg : (rawObj?.data || rawObj?.users || rawObj?.items || [])) as ProgressData[];
        
        let selesai = 0;
        let belum = 0;
        let sum = 0;
        withProg.forEach((p) => {
          // Fallbacks in case the API uses snake_case instead of camelCase
          const anyP = p as unknown as Record<string, unknown>;
          const totalModul = (p.totalModul ?? anyP.total_modul ?? 0) as number;
          const modulSelesai = (p.modulSelesai ?? anyP.modul_selesai ?? 0) as number;
          const persentase = (p.persentase ?? 0) as number;
          
          sum += persentase;
          if (totalModul > 0 && modulSelesai >= totalModul) selesai += 1;
          else if (modulSelesai <= 0 || persentase <= 0) belum += 1;
        });
        const progres = withProg.length - selesai - belum;
        const avgProgress = withProg.length ? Math.round(sum / withProg.length) : null;

        const ticketList = tickets as TicketLite[];
        const ticketPerluTindak = ticketList.filter((t) =>
          OPEN_TICKET.has(String(t.status || "").toLowerCase())
        ).length;

        const activities: ActivityItem[] = [
          ...guru
            .filter((g) => g.createdAt)
            .map((g) => ({
              id: `user-${g.id}`,
              kind: "user" as const,
              title: "Guru baru terdaftar",
              desc: `${g.nama} mendaftar sebagai guru.`,
              time: new Date(g.createdAt as string).getTime(),
            })),
          ...ticketList
            .filter((t) => t.createdAt || t.created_at)
            .map((t, i) => ({
              id: `ticket-${t.id ?? i}`,
              kind: "ticket" as const,
              title: "Tiket bantuan baru",
              desc: t.user?.nama ? `${t.user.nama}: ${ticketSubject(t)}` : ticketSubject(t),
              time: new Date((t.createdAt || t.created_at) as string).getTime(),
            })),
        ]
          .filter((a) => !Number.isNaN(a.time))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5);

        if (!active) return;
        setStats({
          modulCount: modules.length,
          guruCount: guru.length,
          ticketTotal: ticketList.length,
          ticketPerluTindak,
          avgProgress,
          distribusi: { selesai, progres, belum, total: withProg.length },
          activities,
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

  const kpis = [
    {
      label: "Total Modul",
      value: stats?.modulCount ?? 0,
      sub: "modul pembelajaran",
      subClass: "text-gray-400",
      icon: ICONS.modules,
      iconWrap: "bg-blue-100 text-blue-600",
      card: "border-blue-100 bg-blue-50/40",
    },
    {
      label: "Total Guru",
      value: stats?.guruCount ?? 0,
      sub: "guru terdaftar",
      subClass: "text-gray-400",
      icon: ICONS.users,
      iconWrap: "bg-emerald-100 text-emerald-600",
      card: "border-emerald-100 bg-emerald-50/40",
    },
    {
      label: "Tiket Bantuan",
      value: stats?.ticketTotal ?? 0,
      sub:
        stats && stats.ticketPerluTindak > 0
          ? `${stats.ticketPerluTindak} perlu ditindaklanjuti`
          : "tidak ada antrean",
      subClass: stats && stats.ticketPerluTindak > 0 ? "text-red-500 font-medium" : "text-gray-400",
      icon: ICONS.helpdesk,
      iconWrap: "bg-red-100 text-red-600",
      card: "border-red-100 bg-red-50/40",
    },
    {
      label: "Rata-rata Progress",
      value: stats?.avgProgress === null || stats?.avgProgress === undefined ? "—" : `${stats.avgProgress}%`,
      sub: "seluruh guru",
      subClass: "text-gray-400",
      icon: ICONS.monitoring,
      iconWrap: "bg-amber-100 text-amber-600",
      card: "border-amber-100 bg-amber-50/40",
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

  const adminMenu = [
    {
      title: "Kelola Modul Pembelajaran",
      desc: "Buat, ubah, dan susun modul, materi teks, serta video pembelajaran.",
      href: "/admin/modules",
      icon: ICONS.modules,
      iconWrap: "bg-blue-100 text-blue-600",
      arrow: "bg-blue-50 text-blue-600",
    },
    {
      title: "Kelola Akun Guru",
      desc: "Lihat daftar guru terdaftar dan pantau progres pengerjaan modul mereka.",
      href: "/admin/users",
      icon: ICONS.users,
      iconWrap: "bg-emerald-100 text-emerald-600",
      arrow: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Kelola Tiket Bantuan (Helpdesk)",
      desc: "Tinjau kendala teknis dari Guru, kirim tanggapan balasan, dan kelola status tiket.",
      href: "/admin/helpdesk",
      icon: ICONS.helpdesk,
      iconWrap: "bg-red-100 text-red-600",
      arrow: "bg-red-50 text-red-600",
    },
    {
      title: "Monitoring Pengerjaan Modul Guru",
          desc: "Pantau progres pengerjaan modul dan hasil Pre-Test/Post-Test tiap guru.",
      href: "/admin/checklist/report",
      icon: ICONS.monitoring,
      iconWrap: "bg-amber-100 text-amber-600",
      arrow: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* FLOATING HEADER */}
      <Header />

      {/* Hero banner — retained existing blue → teal/green identity */}
      <div className="bg-gradient-to-r from-[#0047A5] via-[#0052C2] to-[#109B51] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-36 h-36 bg-[#F3BF10]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-[#F3BF10] animate-pulse" />
              Portal Administrasi LMS
            </div>

            <h1 className="font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Selamat datang, {user?.nama ?? "Admin"}.
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

      {/* KPI / summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-5 shadow-sm ${kpi.card}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.iconWrap}`}>
                {kpi.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500">{kpi.label}</p>
                {statsLoading ? (
                  <span className="mt-2 block h-7 w-14 animate-pulse rounded bg-gray-200" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold text-[var(--color-navy)]">{kpi.value}</p>
                )}
                <p className={`mt-0.5 truncate text-[11px] ${kpi.subClass}`}>{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monitoring + Aktivitas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monitoring Pengerjaan Modul Guru */}
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)]">
              <span className="text-[var(--color-accent)]">{ICONS.monitoring}</span>
              Monitoring Pengerjaan Modul Guru
            </h2>
            <Link
              href="/admin/checklist/report"
              className="shrink-0 rounded-lg border border-[var(--color-border-soft)] px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-[var(--color-pale)] hover:text-[var(--color-navy)]"
            >
              Lihat Detail →
            </Link>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={donutStyle}>
              <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                {statsLoading ? (
                  <span className="h-6 w-12 animate-pulse rounded bg-gray-200" />
                ) : (
                  <span className="text-2xl font-bold text-[var(--color-navy)]">
                    {stats?.avgProgress === null || stats?.avgProgress === undefined ? "—" : `${stats.avgProgress}%`}
                  </span>
                )}
                <span className="text-[11px] text-gray-400">Rata-rata Progress</span>
              </div>
            </div>

            <ul className="w-full flex-1 space-y-3">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-3 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.dot}`} />
                  <span className="flex-1 text-gray-600">{l.label}</span>
                  <span className="font-medium text-gray-500">{l.count} guru</span>
                  <span className="w-10 text-right font-bold text-[var(--color-navy)]">
                    {Math.round(share(l.count))}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-soft)] pt-4 text-xs text-gray-500">
            <span>
              Total Guru Aktif · <span className="font-bold text-[var(--color-navy)]">{stats?.guruCount ?? 0} guru</span>
            </span>
            <span>
              Modul Aktif · <span className="font-bold text-[var(--color-navy)]">{stats?.modulCount ?? 0} modul</span>
            </span>
          </div>
        </section>

        {/* Aktivitas Terbaru */}
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-navy)]">
            Aktivitas Terbaru
          </h2>

          {statsLoading ? (
            <ul className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                  <span className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                </li>
              ))}
            </ul>
          ) : stats && stats.activities.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border-soft)]">
              {stats.activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      a.kind === "user" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {a.kind === "user" ? ICONS.users : ICONS.helpdesk}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-navy)]">{a.title}</p>
                    <p className="truncate text-xs text-gray-500">{a.desc}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(new Date(a.time).toISOString())}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">Belum ada aktivitas terbaru.</p>
            </div>
          )}
        </section>
      </div>

      {/* Menu Cepat */}
      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-navy)]">
          Menu Cepat
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {adminMenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.iconWrap}`}>
                {item.icon}
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-navy)] group-hover:text-[var(--color-accent)]">
                {item.title}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
              <span
                className={`mt-4 flex h-8 w-8 items-center justify-center rounded-full transition group-hover:translate-x-0.5 ${item.arrow}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
